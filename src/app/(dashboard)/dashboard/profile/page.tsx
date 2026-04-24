import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profile' }

export default function ProfilePage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-medium text-ink mb-1">Your profile</h1>
      <p className="text-sm text-ink-muted mb-8">Manage your public identity and personas</p>

      <div className="rounded-lg border border-base-border bg-base-surface p-8 text-center">
        <p className="text-sm text-ink-muted">Profile editor coming soon</p>
      </div>
    </div>
  )
}
