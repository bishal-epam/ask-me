import type { PersonaPurpose, StructuredProfile, QuestionSuggestion } from '@/types'

// ─── Static defaults by persona purpose ──────────────────────────────────────
// These are the fallback when no structured profile exists yet.

const DEFAULTS: Record<PersonaPurpose, QuestionSuggestion[]> = {
  job_seeker: [
    { id: 'js-1', text: 'How many years of experience do they have?', category: 'experience', source: 'static' },
    { id: 'js-2', text: 'What are their strongest technical skills?', category: 'skills', source: 'static' },
    { id: 'js-3', text: 'Are they open to remote work?', category: 'availability', source: 'static' },
    { id: 'js-4', text: 'What is their current seniority level?', category: 'experience', source: 'static' },
    { id: 'js-5', text: 'What kind of role are they looking for?', category: 'availability', source: 'static' },
    { id: 'js-6', text: 'Have they led or managed teams?', category: 'experience', source: 'static' },
  ],
  creator: [
    { id: 'cr-1', text: 'What type of content do they create?', category: 'projects', source: 'static' },
    { id: 'cr-2', text: 'What platforms are they active on?', category: 'skills', source: 'static' },
    { id: 'cr-3', text: 'What industries or niches do they specialise in?', category: 'experience', source: 'static' },
    { id: 'cr-4', text: 'Are they open to brand collaborations?', category: 'availability', source: 'static' },
    { id: 'cr-5', text: 'What is their typical content turnaround time?', category: 'availability', source: 'static' },
  ],
  freelancer: [
    { id: 'fl-1', text: 'What services do they offer?', category: 'skills', source: 'static' },
    { id: 'fl-2', text: 'Are they available for new projects?', category: 'availability', source: 'static' },
    { id: 'fl-3', text: 'What is their typical project timeline?', category: 'availability', source: 'static' },
    { id: 'fl-4', text: 'What industries have they worked in?', category: 'experience', source: 'static' },
    { id: 'fl-5', text: 'Do they work remotely or on-site?', category: 'availability', source: 'static' },
  ],
  consultant: [
    { id: 'co-1', text: 'What is their area of expertise?', category: 'experience', source: 'static' },
    { id: 'co-2', text: 'What engagement models do they work with?', category: 'availability', source: 'static' },
    { id: 'co-3', text: 'What size of organisations have they worked with?', category: 'experience', source: 'static' },
    { id: 'co-4', text: 'Are they available for short-term or long-term engagements?', category: 'availability', source: 'static' },
  ],
}

// ─── Profile-aware suggestions ────────────────────────────────────────────────
// When structured_profile is available, replace generic questions with specific ones.

function profileAwareSuggestions(profile: StructuredProfile): QuestionSuggestion[] {
  const suggestions: QuestionSuggestion[] = []

  // Years of experience — specific number
  if (profile.total_years_experience > 0) {
    suggestions.push({
      id: 'pa-exp',
      text: `They have ${profile.total_years_experience} years of experience — what are the highlights?`,
      category: 'experience',
      source: 'profile',
    })
  }

  // Top skills — name the top 3 technical skills by confidence
  const topSkills = (profile.skills ?? [])
    .filter((s) => s.category === 'technical')
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .map((s) => s.name)

  if (topSkills.length > 0) {
    suggestions.push({
      id: 'pa-skills',
      text: `Tell me about their experience with ${topSkills.join(', ')}`,
      category: 'skills',
      source: 'profile',
    })
  }

  // Team leadership — only ask if there's evidence
  const hasManaged = (profile.experience ?? []).some((e) => (e.reportees ?? 0) > 0)
  if (hasManaged) {
    const maxReportees = Math.max(...(profile.experience ?? []).map((e) => e.reportees ?? 0))
    suggestions.push({
      id: 'pa-mgmt',
      text: `They've managed teams of up to ${maxReportees} — what does their leadership style look like?`,
      category: 'experience',
      source: 'profile',
    })
  }

  // Availability — if explicitly known
  const availStatus = profile.availability?.status
  if (availStatus === 'actively_looking' || availStatus === 'open') {
    const from = profile.availability?.available_from
    suggestions.push({
      id: 'pa-avail',
      text: from
        ? `They're available from ${from} — what are their preferences?`
        : 'They are open to opportunities — what are their preferences?',
      category: 'availability',
      source: 'profile',
    })
  }

  // Seniority
  if (profile.current_seniority) {
    suggestions.push({
      id: 'pa-seniority',
      text: `As a ${profile.current_seniority}-level professional, what kind of role are they targeting?`,
      category: 'experience',
      source: 'profile',
    })
  }

  return suggestions
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface GetSuggestionsOptions {
  purpose: PersonaPurpose
  structuredProfile?: StructuredProfile | null
  popularQuestions?: PopularQuestion[]
  maxSuggestions?: number
}

export interface PopularQuestion {
  topic: string
  sampleQuestion: string
  count: number
}

export function getSuggestions(opts: GetSuggestionsOptions): QuestionSuggestion[] {
  const max = opts.maxSuggestions ?? 6
  const suggestions: QuestionSuggestion[] = []

  // 1. Profile-aware suggestions first (most specific, most useful)
  if (opts.structuredProfile) {
    suggestions.push(...profileAwareSuggestions(opts.structuredProfile))
  }

  // 2. Popular questions from analytics (social proof — "others have asked this")
  if (opts.popularQuestions) {
    for (const pq of opts.popularQuestions.slice(0, 3)) {
      suggestions.push({
        id: `pop-${pq.topic}`,
        text: pq.sampleQuestion,
        category: 'experience',
        source: 'popular',
        count: pq.count,
      })
    }
  }

  // 3. Fill remaining slots with static defaults for this purpose
  const defaults = DEFAULTS[opts.purpose] ?? []
  const existingTexts = new Set(suggestions.map((s) => s.text.toLowerCase()))

  for (const d of defaults) {
    if (suggestions.length >= max) break
    if (!existingTexts.has(d.text.toLowerCase())) {
      suggestions.push(d)
    }
  }

  return suggestions.slice(0, max)
}
