import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profile' }

export default function ProfilePage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-medium text-ink mb-1">Your profile</h1>
      <p className="text-sm text-ink-muted mb-8">Manage your public identity and personas</p>

      {/* Placeholder — full implementation in next iteration */}
      <div className="rounded-lg border border-base-border bg-base-surface p-6 text-center text-sm text-ink-muted">
        Profile editor coming in the next build iteration.
      </div>
    </div>
  )
}
