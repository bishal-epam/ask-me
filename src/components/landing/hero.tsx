'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center bg-grid overflow-hidden">
      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(201,169,110,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-24">
        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-serif text-display-2xl text-ink leading-none tracking-tight mb-8">
            ask me.
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl md:text-2xl text-ink-secondary max-w-xl leading-relaxed mb-3"
        >
          Your expertise, on demand.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-base text-ink-muted max-w-lg leading-relaxed mb-12"
        >
          Upload your CV, portfolio, or work. We build an AI that speaks for
          you — so recruiters, clients, and collaborators can simply ask.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center gap-3"
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-11 px-6 bg-ink text-ink-inverse text-sm font-medium rounded hover:bg-ink/90 transition-all"
          >
            Create your profile
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 h-11 px-6 border border-base-border text-ink-secondary text-sm rounded hover:border-ink/40 hover:text-ink transition-all"
          >
            Explore profiles
          </Link>
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-20 flex items-center gap-6 text-xs text-ink-muted"
        >
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-status-success inline-block" />
            No credit card required
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-status-success inline-block" />
            Up and running in minutes
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-status-success inline-block" />
            Works with any document format
          </span>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-base to-transparent pointer-events-none" />
    </section>
  )
}
