'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function Cta() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24 border-t border-base-border">
      <div className="relative rounded-xl border border-base-border bg-base-surface overflow-hidden px-10 py-16 text-center">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(201,169,110,0.06) 0%, transparent 70%)',
          }}
        />

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative font-serif text-display-lg text-ink leading-tight mb-4"
        >
          Ready to let your work speak?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="relative text-sm text-ink-secondary max-w-md mx-auto mb-10 leading-relaxed"
        >
          Your AI profile is free to create. No subscription. No engineering required.
          Just your documents and a few minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="relative inline-flex"
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-12 px-8 bg-ink text-ink-inverse text-sm font-medium rounded hover:bg-ink/90 transition-all"
          >
            Create your profile
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
