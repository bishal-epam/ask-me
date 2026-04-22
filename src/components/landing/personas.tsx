'use client'

import { motion } from 'framer-motion'
import { Briefcase, Palette, Code2, Users, Megaphone, Building2 } from 'lucide-react'
import Link from 'next/link'

const owners = [
  {
    icon: Briefcase,
    label: 'Jobseeker',
    description: 'Let recruiters discover your career story without a cold email.',
  },
  {
    icon: Palette,
    label: 'Creator',
    description: 'Turn your portfolio into a conversation. Let brands come to you.',
  },
  {
    icon: Code2,
    label: 'Freelancer',
    description: 'Answer client questions at 3am without being awake at 3am.',
  },
]

const visitors = [
  {
    icon: Users,
    label: 'Recruiter',
    description: 'Assess culture fit, skills, and availability — before the first call.',
  },
  {
    icon: Megaphone,
    label: 'Marketer',
    description: 'Find the right creator for the campaign. Fast. On your schedule.',
  },
  {
    icon: Building2,
    label: 'Corporate',
    description: 'Source freelance expertise without chasing proposals.',
  },
]

function PersonaCard({
  icon: Icon,
  label,
  description,
  delay,
}: {
  icon: React.ElementType
  label: string
  description: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-4 group"
    >
      <div className="w-9 h-9 rounded bg-base-raised border border-base-border flex items-center justify-center shrink-0 group-hover:border-gold/30 group-hover:bg-gold-subtle transition-all">
        <Icon className="w-4 h-4 text-ink-muted group-hover:text-gold transition-colors" />
      </div>
      <div>
        <p className="text-sm font-medium text-ink mb-0.5">{label}</p>
        <p className="text-sm text-ink-muted leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

export function Personas() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-28">
      {/* Section label */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-xs font-medium text-ink-muted tracking-widest uppercase mb-16"
      >
        Built for both sides
      </motion.p>

      <div className="grid md:grid-cols-2 gap-0 border border-base-border rounded-xl overflow-hidden">
        {/* Left: Profile owners */}
        <div className="p-10 border-b md:border-b-0 md:border-r border-base-border">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-serif text-display-md text-ink mb-3 leading-tight"
          >
            I have something
            <br />
            <em className="text-gold">to share.</em>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm text-ink-secondary mb-10 leading-relaxed"
          >
            Upload your work once. Your AI handles the first hundred conversations.
          </motion.p>

          <div className="space-y-7">
            {owners.map((item, i) => (
              <PersonaCard key={item.label} {...item} delay={0.1 + i * 0.07} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10"
          >
            <Link
              href="/signup"
              className="text-sm text-gold hover:text-gold-light transition-colors inline-flex items-center gap-1.5 group"
            >
              Build your profile
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </motion.div>
        </div>

        {/* Right: Visitors */}
        <div className="p-10">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-serif text-display-md text-ink mb-3 leading-tight"
          >
            I&apos;m looking for
            <br />
            <em className="text-gold">someone.</em>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm text-ink-secondary mb-10 leading-relaxed"
          >
            Ask real questions. Get real answers. Skip the back-and-forth.
          </motion.p>

          <div className="space-y-7">
            {visitors.map((item, i) => (
              <PersonaCard key={item.label} {...item} delay={0.1 + i * 0.07} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10"
          >
            <Link
              href="/explore"
              className="text-sm text-gold hover:text-gold-light transition-colors inline-flex items-center gap-1.5 group"
            >
              Explore profiles
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
