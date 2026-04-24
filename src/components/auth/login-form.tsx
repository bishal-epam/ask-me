'use client'

import { useActionState } from 'react'
import { signIn, type AuthState } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'

const initialState: AuthState = {}

interface LoginFormProps {
  redirectTo?: string | undefined
  error?: string | undefined
}

export function LoginForm({ redirectTo, error: urlError }: LoginFormProps) {
  const [state, action, pending] = useActionState(signIn, initialState)
  const displayError = state.error ?? (urlError ? 'Email confirmation failed. Please try again.' : undefined)

  return (
    <form action={action} className="space-y-3">
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      {displayError && (
        <div className="rounded border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-400">
          {displayError}
        </div>
      )}

      <div>
        <label className="block text-xs text-ink-secondary mb-1.5" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="w-full h-10 bg-base-surface border border-base-border rounded px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink/40 focus:ring-1 focus:ring-ink/20 transition-all"
        />
        {state.fieldErrors?.email && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-xs text-ink-secondary mb-1.5" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          className="w-full h-10 bg-base-surface border border-base-border rounded px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink/40 focus:ring-1 focus:ring-ink/20 transition-all"
        />
        {state.fieldErrors?.password && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <Button type="submit" className="w-full mt-1" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
