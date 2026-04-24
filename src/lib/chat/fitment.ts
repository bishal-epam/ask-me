import { generateObject } from 'ai'
import { z } from 'zod'
import { getLanguageModel } from '@/lib/ai'
import { getLogger } from '@/lib/logger'
import type { StructuredProfile, FitmentReport } from '@/types'

const log = getLogger('fitment')

const FitmentSchema = z.object({
  job_title: z.string(),
  overall_score: z.number().min(0).max(100),
  recommendation: z.enum(['strong_fit', 'possible_fit', 'poor_fit']),
  matched_skills: z.array(z.string()),
  missing_skills: z.array(z.string()),
  experience_match: z.boolean(),
  summary: z.string(),
  talking_points: z.array(z.string()).max(5),
})

export interface FitmentInput {
  personaId: string
  jobDescription: string
  jobTitle?: string
  profile: StructuredProfile | null
}

function buildCandidateContext(profile: StructuredProfile): string {
  let ctx = `Experience: ${profile.total_years_experience} years | Seniority: ${profile.current_seniority} | Trajectory: ${profile.career_trajectory}\n`
  if (profile.availability?.status) ctx += `Availability: ${profile.availability.status}\n`

  if (profile.skills?.length) {
    // Group skills by category (noUncheckedIndexedAccess-safe reduce)
    const byCategory = profile.skills.reduce<Record<string, string[]>>((acc, s) => {
      const existing = acc[s.category]
      if (existing) {
        existing.push(s.name)
      } else {
        acc[s.category] = [s.name]
      }
      return acc
    }, {})
    for (const [cat, skills] of Object.entries(byCategory)) {
      ctx += `${cat} skills: ${skills.join(', ')}\n`
    }
  }

  if (profile.experience?.length) {
    ctx += '\nWork History:\n'
    for (const exp of profile.experience.slice(0, 5)) {
      ctx += `- ${exp.role} @ ${exp.company} (${exp.start_date}–${exp.end_date})`
      if (exp.highlights?.length) ctx += `: ${exp.highlights.join('; ')}`
      ctx += '\n'
    }
  }

  if (profile.education?.length) {
    const edu = profile.education
      .slice(0, 3)
      .map((e) => `${e.degree ?? ''} ${e.field ?? ''} — ${e.institution}`.trim())
    ctx += `Education: ${edu.join('; ')}\n`
  }

  if (profile.industries?.length) {
    ctx += `Industries: ${profile.industries.join(', ')}\n`
  }

  return ctx
}

export async function runFitmentAnalysis(input: FitmentInput): Promise<FitmentReport> {
  const { personaId, jobDescription, jobTitle, profile } = input

  const candidateCtx = profile
    ? buildCandidateContext(profile)
    : 'No structured profile available. Limited information for fitment analysis.'

  const prompt = `Evaluate the fitment between this candidate and the job description below.

## Job Description
${jobDescription.slice(0, 2500)}

## Candidate Profile
${candidateCtx}

Scoring weights: required skills coverage 50%, experience years 20%, responsibilities alignment 30%.
Thresholds: strong_fit ≥ 75, possible_fit 50–74, poor_fit < 50.

Provide specific matched/missing skills, whether documented experience meets the years requirement, a 2–3 sentence summary, and 2–3 interview talking points.`

  log.info({ personaId, jobTitle }, 'Running fitment analysis')

  const { object } = await generateObject({
    model: getLanguageModel(),
    schema: FitmentSchema,
    prompt,
    maxTokens: 800,
    maxRetries: 1,
  })

  return {
    ...object,
    persona_id: personaId,
    // Only override job_title if a title was explicitly provided
    ...(jobTitle !== undefined && { job_title: jobTitle }),
    generated_at: new Date().toISOString(),
  }
}
