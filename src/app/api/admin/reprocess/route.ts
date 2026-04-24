import { after } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { runDocumentPipeline } from '@/lib/pipeline'
import { getLogger } from '@/lib/logger'

const log = getLogger('api:admin:reprocess')

// Simple guard: requires the WEBHOOK_SECRET as a Bearer token.
// This route is intended for dev/ops use only — reprocesses stuck documents.
export async function POST(request: Request) {
  const auth = request.headers.get('authorization') ?? ''
  const secret = process.env.WEBHOOK_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()

  // Fetch documents that haven't completed processing
  const { data: docs, error } = await admin
    .from('documents')
    .select('id, persona_id, profile_id, file_url, name, status, pipeline_stage')
    .in('status', ['pending', 'error'])
    .order('created_at', { ascending: true })

  if (error) {
    log.error({ err: error }, 'Failed to query documents')
    return NextResponse.json({ error: 'DB query failed' }, { status: 500 })
  }

  if (!docs || docs.length === 0) {
    return NextResponse.json({ queued: 0, message: 'No pending documents found' })
  }

  // Reverse any accidental public-URL writes back to bare storage paths.
  // The extractor downloads via the admin client, so paths are preferred.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const fixedDocs: typeof docs = []
  for (const doc of docs) {
    const fileUrl = doc.file_url ?? ''
    const storageMatch = fileUrl.match(/\/storage\/v1\/object\/[^/]+\/documents\/(.+)/)
    if (supabaseUrl && fileUrl.startsWith(supabaseUrl) && storageMatch?.[1]) {
      const storagePath = decodeURIComponent(storageMatch[1])
      await admin.from('documents').update({ file_url: storagePath }).eq('id', doc.id)
      fixedDocs.push({ ...doc, file_url: storagePath })
      log.info({ docId: doc.id }, 'Reverted public URL → storage path')
    } else {
      fixedDocs.push(doc)
    }
  }

  // Schedule each pipeline run to execute after this response is sent
  for (const doc of fixedDocs) {
    after(async () => {
      log.info({ docId: doc.id, name: doc.name }, 'Reprocessing document')
      try {
        await runDocumentPipeline({
          documentId: doc.id,
          personaId: doc.persona_id,
          profileId: doc.profile_id,
        })
        log.info({ docId: doc.id }, 'Reprocessing complete')
      } catch (err) {
        log.error({ err, docId: doc.id }, 'Reprocessing failed')
      }
    })
  }

  log.info({ count: fixedDocs.length }, 'Reprocess jobs queued')
  return NextResponse.json({
    queued: fixedDocs.length,
    documents: fixedDocs.map(d => ({ id: d.id, name: d.name, status: d.status, pipeline_stage: d.pipeline_stage })),
  })
}
