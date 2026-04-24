'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const purposeSchema = z.enum(['job_seeker', 'creator', 'freelancer', 'consultant'])

const purposeMeta = {
  job_seeker: { title: 'Job Seeker', slug: 'job-seeker' },
  creator:    { title: 'Creator',    slug: 'creator'    },
  freelancer: { title: 'Freelancer', slug: 'freelancer' },
  consultant: { title: 'Consultant', slug: 'consultant' },
} satisfies Record<'job_seeker' | 'creator' | 'freelancer' | 'consultant', { title: string; slug: string }>

export async function createPersona(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const parsed = purposeSchema.safeParse(formData.get('purpose'))
  if (!parsed.success) return 'Please select an option.'

  const purpose = parsed.data
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (!profile) return 'Profile not found. Please sign out and sign in again.'

  const { title, slug: suffix } = purposeMeta[purpose]
  const baseSlug = `${profile.username}-${suffix}`

  const { error } = await supabase
    .from('personas')
    .insert({
      profile_id: user.id,
      slug: baseSlug,
      title,
      purpose,
      is_active: true,
      chat_enabled: true,
    })

  if (error) {
    if (error.code === '23505') {
      // Slug collision — append a short random suffix
      const { error: e2 } = await supabase
        .from('personas')
        .insert({
          profile_id: user.id,
          slug: `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`,
          title,
          purpose,
          is_active: true,
          chat_enabled: true,
        })
      if (e2) return 'Something went wrong. Please try again.'
    } else {
      return 'Something went wrong. Please try again.'
    }
  }

  redirect('/dashboard/upload')
}
