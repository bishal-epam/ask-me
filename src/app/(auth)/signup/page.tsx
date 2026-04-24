import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'

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

        <SignupForm />

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
