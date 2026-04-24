import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FileText, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Dropzone } from '@/components/upload/dropzone'

export const metadata: Metadata = { title: 'Documents' }

const statusIcon = {
  pending:    <Clock className="w-3.5 h-3.5 text-ink-muted" />,
  processing: <Loader className="w-3.5 h-3.5 text-gold animate-spin" />,
  ready:      <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
  error:      <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
}

const statusLabel = {
  pending:    'Queued',
  processing: 'Processing',
  ready:      'Ready',
  error:      'Error',
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: documents } = await supabase
    .from('documents')
    .select('id, name, doc_type, status, created_at')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-medium text-ink mb-1">Documents</h1>
      <p className="text-sm text-ink-muted mb-8">
        Upload your CV, portfolio, bio, or any links to build your AI
      </p>

      <Dropzone />

      {documents && documents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-3">
            Uploaded ({documents.length})
          </h2>
          <ul className="space-y-2">
            {documents.map(doc => (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded border border-base-border bg-base-surface px-4 py-3"
              >
                <FileText className="w-4 h-4 text-ink-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{doc.name}</p>
                  <p className="text-xs text-ink-muted capitalize">{doc.doc_type}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {statusIcon[doc.status as keyof typeof statusIcon] ?? statusIcon.pending}
                  <span className="text-xs text-ink-muted">
                    {statusLabel[doc.status as keyof typeof statusLabel] ?? 'Queued'}
                  </span>
                </div>
                <span className="text-xs text-ink-muted shrink-0 pl-2">
                  {relativeTime(doc.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
