import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <Link href="/" className="font-serif text-xl text-ink hover:text-gold transition-colors block mb-10">
          ask me.
        </Link>

        <h1 className="text-xl font-medium text-ink mb-1">Welcome back</h1>
        <p className="text-sm text-ink-muted mb-8">Sign in to your account</p>

        {/* Form placeholder — wired in next iteration */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full h-10 bg-base-surface border border-base-border rounded px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink/40 focus:ring-1 focus:ring-ink/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full h-10 bg-base-surface border border-base-border rounded px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink/40 focus:ring-1 focus:ring-ink/20 transition-all"
            />
          </div>
          <button className="w-full h-10 bg-ink text-ink-inverse text-sm font-medium rounded hover:bg-ink/90 transition-all mt-1">
            Sign in
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-base-border text-center">
          <p className="text-xs text-ink-muted">
            No account?{' '}
            <Link href="/signup" className="text-ink-secondary hover:text-ink transition-colors">
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
