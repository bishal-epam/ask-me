'use client'

import { useActionState } from 'react'
import { signUp, type AuthState } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'

const initialState: AuthState = {}

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, initialState)

  if (state.success) {
    return (
      <div className="rounded border border-gold/30 bg-gold/10 px-4 py-5 text-sm text-gold text-center">
        {state.success}
      </div>
    )
  }

  return (
    <form action={action} className="space-y-3">
      {state.error && (
        <div className="rounded border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-400">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-xs text-ink-secondary mb-1.5" htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Alex Chen"
          autoComplete="name"
          required
          className="w-full h-10 bg-base-surface border border-base-border rounded px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink/40 focus:ring-1 focus:ring-ink/20 transition-all"
        />
        {state.fieldErrors?.fullName && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.fullName[0]}</p>
        )}
      </div>

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
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full h-10 bg-base-surface border border-base-border rounded px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink/40 focus:ring-1 focus:ring-ink/20 transition-all"
        />
        {state.fieldErrors?.password && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <Button type="submit" className="w-full mt-1" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}
