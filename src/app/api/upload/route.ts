import { after } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { validateDocument } from '@/lib/security/document-guard'
import { runDocumentPipeline } from '@/lib/pipeline'
import { getLogger } from '@/lib/logger'

const log = getLogger('api:upload')

const DOC_TYPE_MAP: Record<string, string> = {
  resume: 'cv',
  cv: 'cv',
  portfolio: 'portfolio',
  bio: 'bio',
  cover: 'bio',
  cert: 'certificate',
  certificate: 'certificate',
}

function inferDocType(filename: string): string {
  const lower = filename.toLowerCase()
  for (const [keyword, type] of Object.entries(DOC_TYPE_MAP)) {
    if (lower.includes(keyword)) return type
  }
  return 'other'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('profile_id', user.id)
    .limit(1)
    .single()

  if (!persona) {
    return NextResponse.json({ error: 'No persona found. Complete onboarding first.' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = new Uint8Array(bytes)

  const guard = validateDocument({
    filename: file.name,
    sizeBytes: file.size,
    declaredMime: file.type || 'application/octet-stream',
    firstBytes: buffer.slice(0, 8),
  })

  if (!guard.safe) {
    return NextResponse.json({ error: guard.reason ?? 'File rejected' }, { status: 422 })
  }

  const admin = await createAdminClient()
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${user.id}/${persona.id}/${timestamp}-${safeName}`

  const { error: storageError } = await admin.storage
    .from('documents')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (storageError) {
    log.error({ err: storageError }, 'Storage upload failed')
    return NextResponse.json({ error: 'File storage failed' }, { status: 500 })
  }

  const { data: doc, error: docError } = await admin
    .from('documents')
    .insert({
      persona_id: persona.id,
      profile_id: user.id,
      name: file.name,
      original_name: file.name,
      doc_type: inferDocType(file.name),
      file_url: storagePath,  // store path; extractor downloads via admin client
      status: 'pending',
      pipeline_stage: 'pending',
    })
    .select('id, name, status, created_at')
    .single()

  if (docError) {
    log.error({ err: docError }, 'Document record creation failed')
    await admin.storage.from('documents').remove([storagePath])
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }

  log.info({ docId: doc.id, name: file.name }, 'Document uploaded — queuing pipeline')

  after(async () => {
    try {
      await runDocumentPipeline({ documentId: doc.id, personaId: persona.id, profileId: user.id })
    } catch (err) {
      log.error({ err, docId: doc.id }, 'Pipeline failed')
    }
  })

  return NextResponse.json(doc, { status: 201 })
}
