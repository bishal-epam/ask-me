import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: persona } = await supabase
    .from('personas')
    .select('id, title, purpose')
    .eq('profile_id', user.id)
    .limit(1)
    .single()

  if (!persona) redirect('/dashboard/onboarding')

  const { count } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', user.id)

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-medium text-ink mb-1">Overview</h1>
      <p className="text-sm text-ink-muted mb-8">Your AI is {count ? 'live' : 'almost ready'}</p>

      <div className="rounded-lg border border-base-border bg-base-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-muted uppercase tracking-wider">Persona</span>
          <span className="text-sm text-ink">{persona.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-muted uppercase tracking-wider">Documents</span>
          <span className="text-sm text-ink">{count ?? 0}</span>
        </div>
      </div>

      {!count && (
        <div className="mt-6 rounded-lg border border-dashed border-gold/30 bg-gold/5 p-6 text-center">
          <p className="text-sm text-ink-secondary mb-3">
            Upload your first document to activate your AI
          </p>
          <a
            href="/dashboard/upload"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold/80 transition-colors"
          >
            Upload now →
          </a>
        </div>
      )}
    </div>
  )
}
