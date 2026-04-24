import { generateObject } from 'ai'
import { z } from 'zod'
import { getLanguageModel } from '@/lib/ai'
import { createAdminClient } from '@/lib/supabase/server'
import { getLogger } from '@/lib/logger'
import type { PipelineContext, ProfileExtractionOutput } from '@/lib/pipeline/types'
import type { StructuredProfile } from '@/types'

const log = getLogger('profile-extraction')

// ─── Zod schema ───────────────────────────────────────────────────────────────
// Mirrors StructuredProfile from @/types but without the metadata fields.
// We work with this Zod-inferred type internally and only cast to StructuredProfile
// at the boundary via toProfile(), which also strips undefined optional keys.

const SenioritySchema = z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'director', 'vp', 'c-level'])

const SkillSchema = z.object({
  name: z.string(),
  category: z.enum(['technical', 'soft', 'domain']),
  years: z.number().optional(),
  confidence: z.number().min(0).max(1),
})

const ExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  seniority: SenioritySchema,
  start_date: z.string(),
  end_date: z.string(),
  tenure_months: z.number(),
  reportees: z.number().optional(),
  industries: z.array(z.string()).optional(),
  highlights: z.array(z.string()).max(3).optional(),
})

const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string().optional(),
  field: z.string().optional(),
  year: z.number().optional(),
})

const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  year: z.number().optional(),
})

const ExtractedDataSchema = z.object({
  skills: z.array(SkillSchema),
  experience: z.array(ExperienceSchema),
  total_years_experience: z.number(),
  current_seniority: SenioritySchema,
  career_trajectory: z.enum(['ascending', 'lateral', 'pivoting']),
  education: z.array(EducationSchema),
  certifications: z.array(CertificationSchema).optional(),
  availability: z.object({
    status: z.enum(['open', 'actively_looking', 'passive', 'not_looking']),
    available_from: z.string().optional(),
    preferred_work_type: z.array(z.enum(['remote', 'hybrid', 'onsite'])).optional(),
    preferred_locations: z.array(z.string()).optional(),
  }),
  industries: z.array(z.string()),
  languages: z.array(z.object({ language: z.string(), proficiency: z.string() })).optional(),
  confidence_score: z.number().min(0).max(1),
})

type ExtractedData = z.infer<typeof ExtractedDataSchema>
type Skill = z.infer<typeof SkillSchema>
type Experience = z.infer<typeof ExperienceSchema>
type Education = z.infer<typeof EducationSchema>
type Cert = z.infer<typeof CertificationSchema>
type Lang = { language: string; proficiency: string }

const LARGE_DOC_THRESHOLD = 40_000
const MAP_SECTION_SIZE = 8_000

// ─── Public entry point ───────────────────────────────────────────────────────

export async function extractStructuredProfile(ctx: PipelineContext): Promise<ProfileExtractionOutput> {
  const text = ctx.rawText ?? ''
  if (!text.trim()) throw new Error('No text content to extract profile from')

  log.info({ documentId: ctx.documentId, chars: text.length }, 'Starting profile extraction')

  const extracted =
    text.length > LARGE_DOC_THRESHOLD
      ? await extractLargeDoc(text, ctx.docType ?? 'other')
      : await extractSinglePass(text, ctx.docType ?? 'other')

  const merged = await mergeWithExistingProfile(ctx.personaId, ctx.documentId, extracted)
  await saveProfile(ctx.personaId, merged)

  log.info({ documentId: ctx.documentId, confidence: merged.confidence_score }, 'Profile extraction complete')

  return {
    structuredProfile: merged as unknown as Record<string, unknown>,
    confidenceScore: merged.confidence_score,
  }
}

// ─── LLM extraction ───────────────────────────────────────────────────────────

async function extractSinglePass(text: string, docType: string): Promise<ExtractedData> {
  try {
    const { object } = await generateObject({
      model: getLanguageModel(),
      schema: ExtractedDataSchema,
      prompt: buildPrompt(text, docType),
      maxTokens: 3000,
      maxRetries: 1,
    })
    return object
  } catch (err) {
    log.error({
      err,
      errName: err instanceof Error ? err.name : 'unknown',
      errMsg: err instanceof Error ? err.message : String(err),
      // Log the raw text if it's a schema validation error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawText: (err as any)?.text?.slice?.(0, 500),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cause: (err as any)?.cause?.issues?.slice?.(0, 3),
    }, 'generateObject failed')
    throw err
  }
}

async function extractLargeDoc(text: string, docType: string): Promise<ExtractedData> {
  const sections = splitIntoSections(text, MAP_SECTION_SIZE)
  log.debug({ sections: sections.length }, 'Map-reduce extraction')

  const results = await Promise.allSettled(sections.map(s => extractSinglePass(s, docType)))
  const successful = results
    .filter((r): r is PromiseFulfilledResult<ExtractedData> => r.status === 'fulfilled')
    .map(r => r.value)

  if (successful.length === 0) throw new Error('All section extractions failed in map-reduce')
  return mergeExtractions(successful) as ExtractedData
}

// ─── Merge helpers ────────────────────────────────────────────────────────────

// Return type intentionally omitted — exactOptionalPropertyTypes + z.infer causes
// TS2719 when explicitly annotating; callers cast to ExtractedData as needed.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function mergeExtractions(parts: ExtractedData[]) {
  if (parts.length === 1) return parts[0]

  const experience = mergeExperience(parts.flatMap(p => p.experience))
  const avgConfidence = parts.reduce((s, p) => s + p.confidence_score, 0) / parts.length
  const certs = deduplicateCerts(parts.flatMap(p => p.certifications ?? []))
  const langs = deduplicateLanguages(parts.flatMap(p => p.languages ?? []))
  // parts.length >= 2 here — parts.at(-1) is always defined
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const last = parts.at(-1)!

  // Use any to avoid exactOptionalPropertyTypes friction with conditional fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {
    skills: mergeSkills(parts.flatMap(p => p.skills)),
    experience,
    total_years_experience: calcTotalYears(experience),
    current_seniority: experience.length > 0 ? mostRecent(experience).seniority : 'mid',
    career_trajectory: detectTrajectory(experience),
    education: deduplicateEducation(parts.flatMap(p => p.education)),
    availability: last.availability,
    industries: [...new Set(parts.flatMap(p => p.industries))],
    confidence_score: avgConfidence,
  }
  if (certs.length > 0) result.certifications = certs
  if (langs.length > 0) result.languages = langs
  return result as ExtractedData
}

async function mergeWithExistingProfile(
  personaId: string,
  documentId: string,
  fresh: ExtractedData
): Promise<StructuredProfile> {
  const supabase = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('personas') as any)
    .select('structured_profile')
    .eq('id', personaId)
    .single()

  const existing = (data?.structured_profile ?? null) as StructuredProfile | null
  const stamp = { extraction_version: '1.0', extracted_at: new Date().toISOString() }

  if (!existing || !existing.extraction_version) {
    // First document for this persona — stamp metadata and store
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const first: any = { ...fresh, ...stamp, document_ids: [documentId] }
    return toProfile(first)
  }

  const existingExp = existing.experience as unknown as Experience[]
  const existingSkills = existing.skills as unknown as Skill[]
  const existingEdu = existing.education as unknown as Education[]
  const existingCerts = (existing.certifications ?? []) as unknown as Cert[]
  const existingLangs = (existing.languages ?? []) as unknown as Lang[]

  const experience = mergeExperience([...existingExp, ...fresh.experience])
  const skills = mergeSkills([...existingSkills, ...fresh.skills])
  const education = deduplicateEducation([...existingEdu, ...fresh.education])
  const certs = deduplicateCerts([...existingCerts, ...(fresh.certifications ?? [])])
  const langs = deduplicateLanguages([...existingLangs, ...(fresh.languages ?? [])])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merged: any = {
    skills,
    experience,
    total_years_experience: calcTotalYears(experience),
    current_seniority: experience.length > 0 ? mostRecent(experience).seniority : existing.current_seniority,
    career_trajectory: detectTrajectory(experience),
    education,
    availability: fresh.availability,
    industries: [...new Set([...existing.industries, ...fresh.industries])],
    confidence_score: Math.max(existing.confidence_score, fresh.confidence_score),
    ...stamp,
    document_ids: [...new Set([...existing.document_ids, documentId])],
  }
  if (certs.length > 0) merged.certifications = certs
  if (langs.length > 0) merged.languages = langs
  return toProfile(merged)
}

async function saveProfile(personaId: string, profile: StructuredProfile): Promise<void> {
  const supabase = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('personas') as any)
    .update({ structured_profile: profile, updated_at: new Date().toISOString() })
    .eq('id', personaId)
}

// Strips undefined fields so exactOptionalPropertyTypes is satisfied when casting.
// The profile is stored as JSONB so JSON round-trip is harmless.
function toProfile(obj: Record<string, unknown>): StructuredProfile {
  return JSON.parse(JSON.stringify(obj)) as StructuredProfile
}

// ─── Skill merging ────────────────────────────────────────────────────────────

function mergeSkills(skills: Skill[]): Skill[] {
  const map = new Map<string, Skill>()
  for (const skill of skills) {
    const key = skill.name.toLowerCase()
    const prev = map.get(key)
    if (!prev) {
      map.set(key, skill)
    } else {
      const years =
        prev.years !== undefined && skill.years !== undefined
          ? Math.max(prev.years, skill.years)
          : prev.years ?? skill.years
      const merged: Skill = { name: prev.name, category: prev.category, confidence: Math.max(prev.confidence, skill.confidence) }
      if (years !== undefined) merged.years = years
      map.set(key, merged)
    }
  }
  return Array.from(map.values())
}

// ─── Experience merging ───────────────────────────────────────────────────────

function mergeExperience(entries: Experience[]): Experience[] {
  const seen = new Set<string>()
  const result: Experience[] = []
  for (const entry of entries) {
    const key = `${entry.company.toLowerCase()}|${entry.role.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push(entry)
    }
  }
  return result.sort((a, b) => b.start_date.localeCompare(a.start_date))
}

function mostRecent(experience: Experience[]): Experience {
  return experience.reduce((latest, e) => (e.start_date > latest.start_date ? e : latest))
}

// ─── Education / cert / language dedup ───────────────────────────────────────

function deduplicateEducation(entries: Education[]): Education[] {
  const seen = new Set<string>()
  return entries.filter(e => {
    const key = `${e.institution.toLowerCase()}|${(e.degree ?? '').toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function deduplicateCerts(entries: Cert[]): Cert[] {
  const seen = new Set<string>()
  return entries.filter(c => {
    const key = c.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function deduplicateLanguages(entries: Lang[]): Lang[] {
  return entries.filter((l, i, arr) => arr.findIndex(x => x.language === l.language) === i)
}

// ─── Timeline calculation ─────────────────────────────────────────────────────

function calcTotalYears(experience: Experience[]): number {
  const months = experience.reduce((sum, e) => sum + e.tenure_months, 0)
  return Math.round((months / 12) * 10) / 10
}

const SENIORITY_RANK: Record<string, number> = {
  intern: 0, junior: 1, mid: 2, senior: 3, lead: 4,
  principal: 5, director: 6, vp: 7, 'c-level': 8,
}

function detectTrajectory(experience: Experience[]): 'ascending' | 'lateral' | 'pivoting' {
  if (experience.length < 2) return 'ascending'
  const sorted = [...experience].sort((a, b) => a.start_date.localeCompare(b.start_date))
  const uniqueIndustries = new Set(sorted.flatMap(e => e.industries ?? []))
  if (uniqueIndustries.size > 3) return 'pivoting'
  const first = SENIORITY_RANK[sorted[0]?.seniority ?? 'mid'] ?? 2
  const last = SENIORITY_RANK[sorted[sorted.length - 1]?.seniority ?? 'mid'] ?? 2
  return last > first ? 'ascending' : 'lateral'
}

// ─── Text utilities ───────────────────────────────────────────────────────────

function splitIntoSections(text: string, maxChars: number): string[] {
  const sections: string[] = []
  let start = 0
  while (start < text.length) {
    let end = start + maxChars
    if (end >= text.length) {
      sections.push(text.slice(start))
      break
    }
    const paraBreak = text.lastIndexOf('\n\n', end)
    if (paraBreak > start) {
      end = paraBreak
    } else {
      const sentBreak = text.lastIndexOf('. ', end)
      if (sentBreak > start) end = sentBreak + 1
    }
    sections.push(text.slice(start, end))
    start = end
  }
  return sections.filter(s => s.trim().length > 0)
}

// ~12k chars ≈ 3k tokens; leaves ~13k tokens for schema + output in a 16k context
const MAX_PROMPT_CHARS = 12_000

function buildPrompt(text: string, docType: string): string {
  const truncated = text.length > MAX_PROMPT_CHARS ? text.slice(0, MAX_PROMPT_CHARS) + '\n[truncated]' : text
  return `Extract structured career data from this ${docType} document. Omit any field you are not confident about rather than guessing. Confidence: 0.9–1.0 = explicitly stated, 0.7–0.89 = strongly implied, 0.5–0.69 = reasonably inferred, below 0.5 = omit the field.

Document:
${truncated}`
}
