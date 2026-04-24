import { NextResponse } from 'next/server'
import { streamText, embed, tool, type CoreMessage } from 'ai'
import { z } from 'zod'
import { getStreamingModel, getEmbeddingModel, AI_PROVIDER } from '@/lib/ai'
import { createAdminClient } from '@/lib/supabase/server'
import { runContentGuard } from '@/lib/chat/guard'
import { runFitmentAnalysis } from '@/lib/chat/fitment'
import { getLogger } from '@/lib/logger'
import type { StructuredProfile } from '@/types'

export const maxDuration = 60

const log = getLogger('api:chat')

type Msg = { role: string; content: string }

function trimToWindow(messages: Msg[], maxTurns = 10): CoreMessage[] {
  const valid = messages.filter(
    (m): m is { role: 'user' | 'assistant'; content: string } =>
      m.role === 'user' || m.role === 'assistant'
  )
  return (valid.length > maxTurns * 2 ? valid.slice(-(maxTurns * 2)) : valid) as CoreMessage[]
}

function classifyTopic(message: string, toolsUsed: string[]): string {
  if (toolsUsed.includes('run_fitment_analysis')) return 'fitment'
  const lower = message.toLowerCase()
  if (/skill|technolog|languag|framework|tool|expert|proficien/.test(lower)) return 'skills'
  if (/available|looking|open|remote|hybrid|onsite|start|freelanc|hire/.test(lower)) return 'availability'
  if (/education|degree|university|college|school|certif|qualif/.test(lower)) return 'education'
  if (/project|built|created|portfolio|product|launch/.test(lower)) return 'projects'
  if (/fit|match|suitable|good for|right for|hire|role|position|job desc/.test(lower)) return 'fitment'
  if (/personality|style|approach|value|prefer|work like|culture|team/.test(lower)) return 'personality'
  return 'experience'
}

function blockedResponse(text: string): Response {
  const encoder = new TextEncoder()
  const body = [
    `0:${JSON.stringify(text)}\n`,
    `d:${JSON.stringify({ finishReason: 'stop', usage: { promptTokens: 0, completionTokens: 0 } })}\n`,
  ].join('')
  return new Response(encoder.encode(body), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
    },
  })
}

// Build a context block from structured profile + vector search for Ollama's no-tools path
async function buildRagContext(
  personaId: string,
  query: string,
  profile: StructuredProfile | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any
): Promise<string> {
  const parts: string[] = []

  if (profile) {
    parts.push('## Profile Facts')
    parts.push(
      `Seniority: ${profile.current_seniority} | Experience: ${profile.total_years_experience} yrs | Trajectory: ${profile.career_trajectory}`
    )
    if (profile.availability?.status) {
      const from = profile.availability.available_from ? ` (from ${profile.availability.available_from})` : ''
      parts.push(`Availability: ${profile.availability.status}${from}`)
    }
    if (profile.skills?.length) {
      const byCategory = profile.skills.reduce<Record<string, string[]>>((acc, s) => {
        const existing = acc[s.category]
        if (existing) existing.push(s.name)
        else acc[s.category] = [s.name]
        return acc
      }, {})
      for (const [cat, skills] of Object.entries(byCategory)) {
        parts.push(`${cat}: ${skills.join(', ')}`)
      }
    }
    if (profile.experience?.length) {
      parts.push('Work history:')
      for (const exp of profile.experience.slice(0, 5)) {
        const highlights = exp.highlights?.length ? ` — ${exp.highlights.slice(0, 2).join('; ')}` : ''
        parts.push(`  ${exp.role} @ ${exp.company} (${exp.start_date}–${exp.end_date})${highlights}`)
      }
    }
    if (profile.education?.length) {
      const edu = profile.education
        .slice(0, 3)
        .map((e) => `${e.degree ?? ''} ${e.field ?? ''} @ ${e.institution}`.trim())
      parts.push(`Education: ${edu.join('; ')}`)
    }
    if (profile.industries?.length) {
      parts.push(`Industries: ${profile.industries.join(', ')}`)
    }
  }

  // Semantic search for relevant document passages
  try {
    const { embedding } = await embed({ model: getEmbeddingModel(), value: query })
    const { data: rows } = await (admin).rpc('search_chunks', {
      query_embedding: `[${embedding.join(',')}]`,
      target_persona: personaId,
      match_threshold: 0.3,
      match_count: 4,
    })
    const chunks = (rows ?? []) as Array<{ content: string; similarity: number }>
    const filtered = chunks.filter((c) => c.similarity >= 0.3).slice(0, 4)
    if (filtered.length > 0) {
      parts.push('\n## Relevant Document Excerpts')
      for (const c of filtered) {
        parts.push(c.content.slice(0, 500))
      }
    }
  } catch (err) {
    log.warn({ err }, 'RAG vector search failed, continuing without document context')
  }

  return parts.length > 0 ? parts.join('\n') : 'No profile data available yet.'
}

export async function POST(request: Request) {
  let body: { messages: Msg[]; personaId: string; sessionId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { messages, personaId, sessionId } = body

  if (!personaId || !messages?.length) {
    return NextResponse.json({ error: 'Missing personaId or messages' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: persona, error: personaError } = await (admin.from('personas') as any)
    .select('id, title, purpose, chat_enabled, chat_greeting, structured_profile, profiles(full_name, username)')
    .eq('id', personaId)
    .single()

  if (personaError || !persona) {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
  }
  if (!persona.chat_enabled) {
    return NextResponse.json({ error: 'Chat is disabled for this persona' }, { status: 403 })
  }

  const userMessages = messages.filter((m) => m.role === 'user')
  const lastUserMsg = userMessages.at(-1)
  if (!lastUserMsg) {
    return NextResponse.json({ error: 'No user message found' }, { status: 400 })
  }

  // ── Layer 1: Content guard ──────────────────────────────────────────────────
  const guard = await runContentGuard(lastUserMsg.content)
  if (guard.decision === 'BLOCK') {
    log.info({ personaId, flags: guard.flags, confidence: guard.confidence }, 'Content guard BLOCK')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('guard_logs') as any)
      .insert({
        persona_id: personaId,
        session_id: sessionId ?? null,
        flags: guard.flags,
        confidence: guard.confidence,
        message_snippet: lastUserMsg.content.slice(0, 200),
      })
      .catch((err: unknown) => log.error({ err }, 'Failed to write guard log'))

    const canned =
      guard.canned_response ??
      "I can only help with professional questions about this person's background and experience."
    return blockedResponse(canned)
  }

  // ── Session management ──────────────────────────────────────────────────────
  let activeSessionId = sessionId
  if (!activeSessionId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session } = await (admin.from('chat_sessions') as any)
      .insert({ persona_id: personaId })
      .select('id')
      .single()
    activeSessionId = session?.id as string | undefined
  }

  const profile = persona.structured_profile as StructuredProfile | null
  const personaName =
    (persona.profiles as { full_name: string | null } | null)?.full_name ?? 'this person'
  const today = new Date().toISOString().slice(0, 10)
  const toolsUsed: string[] = []
  const sourcesFound: string[] = []

  // ── Path A: Ollama — single-step RAG (no tool chaining) ────────────────────
  // Ollama at 7-8B needs ~20s per LLM call. Multi-step tool use would chain
  // 2-3 calls and exceed the 60s timeout. Pre-fetch context instead.
  if (AI_PROVIDER === 'ollama') {
    const context = await buildRagContext(personaId, lastUserMsg.content, profile, admin)
    const system = `You are a conversational AI representing ${personaName}, a ${persona.title}.
Answer ONLY from the information provided below. Be concise and direct.
If the answer is not in the data, say so — do not guess.
If asked for contact details, say to use the "Request Contact" option.

${context}

Today: ${today}`

    const result = streamText({
      model: getStreamingModel(),
      system,
      messages: trimToWindow(messages),
      maxTokens: 400,

      onFinish: async ({ text }) => {
        if (!activeSessionId) return
        const topic = classifyTopic(lastUserMsg.content, [])
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin.from('chat_messages') as any).insert([
            { session_id: activeSessionId, role: 'user', content: lastUserMsg.content, metadata: {} },
            { session_id: activeSessionId, role: 'assistant', content: text, metadata: { topic } },
          ])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin.from('question_analytics') as any).upsert(
            { persona_id: personaId, topic, sample_question: lastUserMsg.content.slice(0, 200), count: 1, last_asked_at: new Date().toISOString() },
            { onConflict: 'persona_id,topic' }
          )
        } catch (err) {
          log.error({ err }, 'Failed to persist chat turn (ollama path)')
        }
      },
    })

    return result.toDataStreamResponse({
      headers: { 'X-Session-Id': activeSessionId ?? '' },
    })
  }

  // ── Path B: OpenAI / Anthropic — tool-use with multi-step reasoning ─────────
  const systemPrompt = `You are speaking on behalf of ${personaName}, a ${persona.title}.

Answer questions based only on what they have shared. Be conversational, accurate, and professional.
If asked something not covered in available data, say so directly — do not speculate.
If asked for contact details, direct the visitor to use the "Request Contact" option.

## Tool routing
- Specific facts, numbers, skills, availability, seniority → get_structured_profile
- Narratives, stories, project details, open-ended questions → search_chunks
- Job matching, role suitability, "would they be a good fit" → run_fitment_analysis
- Ambiguous questions → search_chunks first; fall back to get_structured_profile if similarity is low

Person: ${personaName} | Title: ${persona.title} | Date: ${today}`

  const result = streamText({
    model: getStreamingModel(),
    system: systemPrompt,
    messages: trimToWindow(messages),
    maxTokens: 1200,
    maxSteps: 5,

    tools: {
      search_chunks: tool({
        description:
          "Search the persona's documents for relevant context. Use for narrative, qualitative, or open-ended questions.",
        parameters: z.object({
          query: z.string().describe('Natural-language search query'),
        }),
        execute: async ({ query }) => {
          toolsUsed.push('search_chunks')
          try {
            const { embedding } = await embed({ model: getEmbeddingModel(), value: query })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: rows } = await (admin as any).rpc('search_chunks', {
              query_embedding: `[${embedding.join(',')}]`,
              target_persona: personaId,
              match_threshold: 0.3,
              match_count: 6,
            })
            const chunks = (rows ?? []) as Array<{
              content: string
              metadata: Record<string, unknown>
              similarity: number
            }>
            const filtered = chunks.filter((c) => c.similarity >= 0.3).slice(0, 6)
            for (const c of filtered) {
              const section = (c.metadata?.section as string) ?? 'document'
              if (section && !sourcesFound.includes(section)) sourcesFound.push(section)
            }
            return filtered.map((c) => ({
              content: c.content.slice(0, 600),
              section: (c.metadata?.section as string) ?? 'document',
              similarity: Math.round(c.similarity * 100) / 100,
            }))
          } catch (err) {
            log.warn({ err }, 'search_chunks tool failed')
            return []
          }
        },
      }),

      get_structured_profile: tool({
        description:
          'Get structured profile data: skills, experience, seniority, availability, education.',
        parameters: z.object({}),
        execute: async () => {
          toolsUsed.push('get_structured_profile')
          if (!profile) return { error: 'No structured profile available yet' }
          return profile
        },
      }),

      run_fitment_analysis: tool({
        description:
          'Analyze how well this person fits a job description. Use for job matching or hiring recommendations.',
        parameters: z.object({
          job_description: z.string().describe('Full text of the job description'),
          job_title: z.string().optional().describe('Job title from the description'),
        }),
        execute: async ({ job_description, job_title }) => {
          toolsUsed.push('run_fitment_analysis')
          try {
            return await runFitmentAnalysis({
              personaId,
              jobDescription: job_description,
              ...(job_title !== undefined && { jobTitle: job_title }),
              profile,
            })
          } catch (err) {
            log.error({ err }, 'Fitment analysis failed')
            return { error: 'Fitment analysis could not be completed' }
          }
        },
      }),
    },

    onFinish: async ({ text }) => {
      if (!activeSessionId) return
      try {
        const topic = classifyTopic(lastUserMsg.content, toolsUsed)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin.from('chat_messages') as any).insert([
          { session_id: activeSessionId, role: 'user', content: lastUserMsg.content, metadata: {} },
          {
            session_id: activeSessionId,
            role: 'assistant',
            content: text,
            metadata: { sources: sourcesFound, tools_called: toolsUsed, topic },
          },
        ])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin.from('question_analytics') as any).upsert(
          {
            persona_id: personaId,
            topic,
            sample_question: lastUserMsg.content.slice(0, 200),
            count: 1,
            last_asked_at: new Date().toISOString(),
          },
          { onConflict: 'persona_id,topic' }
        )
      } catch (err) {
        log.error({ err }, 'Failed to persist chat turn')
      }
    },
  })

  return result.toDataStreamResponse({
    headers: { 'X-Session-Id': activeSessionId ?? '' },
  })
}
