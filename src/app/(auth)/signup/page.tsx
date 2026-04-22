import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Create account' }

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-serif text-xl text-ink hover:text-gold transition-colors block mb-10">
          ask me.
        </Link>

        <h1 className="text-xl font-medium text-ink mb-1">Create your account</h1>
        <p className="text-sm text-ink-muted mb-8">Free to start. No credit card required.</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">Full name</label>
            <input
              type="text"
              placeholder="Alex Chen"
              className="w-full h-10 bg-base-surface border border-base-border rounded px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink/40 focus:ring-1 focus:ring-ink/20 transition-all"
            />
          </div>
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
              placeholder="Minimum 8 characters"
              className="w-full h-10 bg-base-surface border border-base-border rounded px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink/40 focus:ring-1 focus:ring-ink/20 transition-all"
            />
          </div>
          <button className="w-full h-10 bg-ink text-ink-inverse text-sm font-medium rounded hover:bg-ink/90 transition-all mt-1">
            Create account
          </button>
        </div>

        <p className="mt-4 text-xs text-ink-muted text-center">
          By signing up you agree to our{' '}
          <Link href="/terms" className="text-ink-secondary hover:text-ink transition-colors">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-ink-secondary hover:text-ink transition-colors">Privacy Policy</Link>.
        </p>

        <div className="mt-6 pt-6 border-t border-base-border text-center">
          <p className="text-xs text-ink-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-ink-secondary hover:text-ink transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
