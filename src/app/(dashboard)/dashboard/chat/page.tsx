import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Conversations' }

export default function ChatPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-medium text-ink mb-1">Conversations</h1>
      <p className="text-sm text-ink-muted mb-8">
        Every conversation visitors have had with your AI
      </p>

      <div className="rounded-lg border border-base-border bg-base-surface p-8 text-center">
        <p className="text-sm text-ink-muted">
          No conversations yet. Share your profile link to get started.
        </p>
      </div>
    </div>
  )
}
