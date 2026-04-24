import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Sign in' }

interface Props {
  searchParams: Promise<{ redirect?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { redirect, error } = await searchParams

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-serif text-xl text-ink hover:text-gold transition-colors block mb-10">
          ask me.
        </Link>

        <h1 className="text-xl font-medium text-ink mb-1">Welcome back</h1>
        <p className="text-sm text-ink-muted mb-8">Sign in to your account</p>

        <LoginForm redirectTo={redirect} error={error} />

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
