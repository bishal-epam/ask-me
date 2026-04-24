import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getLanguageModel } from '@/lib/ai'

// Temporary debug endpoint — remove before shipping
export async function POST(request: Request) {
  const auth = request.headers.get('authorization') ?? ''
  const secret = process.env.WEBHOOK_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const text: string = body.text ?? 'Bishal Pujari, Senior Program Manager, 25 years experience in BFSI and EdTech at EPAM Systems.'

  const SenioritySchema = z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'director', 'vp', 'c-level'])

  const schema = z.object({
    skills: z.array(z.object({
      name: z.string(),
      category: z.enum(['technical', 'soft', 'domain']),
      confidence: z.number().min(0).max(1),
    })),
    experience: z.array(z.object({
      company: z.string(),
      role: z.string(),
      seniority: SenioritySchema,
      start_date: z.string(),
      end_date: z.string(),
      tenure_months: z.number(),
    })),
    total_years_experience: z.number(),
    current_seniority: SenioritySchema,
    career_trajectory: z.enum(['ascending', 'lateral', 'pivoting']),
    education: z.array(z.object({ institution: z.string() })),
    availability: z.object({
      status: z.enum(['open', 'actively_looking', 'passive', 'not_looking']),
    }),
    industries: z.array(z.string()),
    confidence_score: z.number().min(0).max(1),
  })

  try {
    const { object } = await generateObject({
      model: getLanguageModel(),
      schema,
      prompt: `Extract structured career data from: ${text}`,
      maxTokens: 2000,
      maxRetries: 0,
    })
    return NextResponse.json({ ok: true, result: object })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      errName: err instanceof Error ? err.name : 'unknown',
      errMsg: err instanceof Error ? err.message : String(err),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawText: (err as any)?.text?.slice?.(0, 1000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cause: JSON.stringify((err as any)?.cause?.issues?.slice?.(0, 5)),
    })
  }
}
