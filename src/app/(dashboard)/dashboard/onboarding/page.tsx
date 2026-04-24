import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PurposePicker } from '@/components/onboarding/purpose-picker'

export const metadata: Metadata = { title: 'Get started' }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Already has a persona — skip onboarding
  const { data: existing } = await supabase
    .from('personas')
    .select('id')
    .eq('profile_id', user.id)
    .limit(1)
    .single()

  if (existing) redirect('/dashboard')

  return (
    <div className="min-h-full flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-medium text-ink mb-2 text-center">
          What are you here for?
        </h1>
        <p className="text-sm text-ink-muted text-center mb-10">
          Pick the goal that fits best — you can refine it later.
        </p>

        <PurposePicker />
      </div>
    </div>
  )
}
