'use client'

import { useActionState } from 'react'
import { Briefcase, Laptop, Sparkles, Target } from 'lucide-react'
import { createPersona } from '@/lib/personas/actions'
import { cn } from '@/utils/cn'

const purposes = [
  {
    value: 'job_seeker',
    icon: Briefcase,
    label: 'Find a job or internship',
    description: 'Let recruiters discover your story, skills, and availability — without a cold email.',
  },
  {
    value: 'freelancer',
    icon: Laptop,
    label: 'Get freelance projects or assignments',
    description: 'Answer client briefs at any hour. Win work without chasing leads.',
  },
  {
    value: 'creator',
    icon: Sparkles,
    label: 'Grow my audience or land brand deals',
    description: 'Turn every visitor into a potential fan, sponsor, or collaborator.',
  },
  {
    value: 'consultant',
    icon: Target,
    label: 'Win consulting or advisory engagements',
    description: 'Be found by companies who need your expertise. Close faster.',
  },
]

export function PurposePicker() {
  const [error, action, pending] = useActionState(createPersona, null)

  return (
    <form action={action} className="space-y-3">
      {error && (
        <p className="text-xs text-red-400 text-center mb-2">{error}</p>
      )}

      {purposes.map(({ value, icon: Icon, label, description }) => (
        <button
          key={value}
          type="submit"
          name="purpose"
          value={value}
          disabled={pending}
          className={cn(
            'w-full text-left rounded-lg border border-base-border bg-base-surface',
            'px-5 py-4 flex items-start gap-4 transition-all duration-150',
            'hover:border-gold/40 hover:bg-base-raised focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-gold/40',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <Icon className="w-5 h-5 text-gold shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ink">{label}</p>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{description}</p>
          </div>
        </button>
      ))}

      {pending && (
        <p className="text-xs text-ink-muted text-center pt-2">Setting up your profile…</p>
      )}
    </form>
  )
}
