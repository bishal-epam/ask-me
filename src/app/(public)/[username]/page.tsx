import type { Metadata } from 'next'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return {
    title: `Ask ${username}`,
    description: `Chat with ${username}'s personal AI profile on Ask Me.`,
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params

  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* Profile header */}
      <header className="border-b border-base-border px-6 py-4 flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-gold-subtle border border-gold/20 flex items-center justify-center text-sm font-medium text-gold">
          {username[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{username}</p>
          <p className="text-xs text-ink-muted">Ask me anything</p>
        </div>
      </header>

      {/* Chat area — full implementation in next iteration */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <p className="font-serif text-2xl text-ink mb-2">
            ask <em className="text-gold">{username}.</em>
          </p>
          <p className="text-sm text-ink-muted">
            Chat interface coming in the next build iteration.
          </p>
        </div>
      </div>
    </div>
  )
}
