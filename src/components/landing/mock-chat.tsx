'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const MESSAGES = [
  { role: 'user', text: "What's your experience with TypeScript?" },
  {
    role: 'assistant',
    text: "I've been working with TypeScript for 5 years, primarily in large-scale React apps and Node.js APIs. At my last role I led the migration of a 200k-line JavaScript codebase — reduced runtime errors by ~60%.",
    delay: 1200,
  },
  { role: 'user', text: 'Are you open to remote roles?', delay: 2800 },
  {
    role: 'assistant',
    text: "Yes — fully remote or hybrid (London, UK). I'm available from March 2026 and prefer async-first teams.",
    delay: 4200,
  },
]

interface Message {
  role: string
  text: string
}

export function MockChat() {
  const [visible, setVisible] = useState<Message[]>([])

  useEffect(() => {
    let timeouts: ReturnType<typeof setTimeout>[] = []
    let cumDelay = 600

    MESSAGES.forEach((msg) => {
      const d = (msg.delay ?? 0) + cumDelay
      cumDelay = d + 300
      const t = setTimeout(() => {
        setVisible((prev) => [...prev, { role: msg.role, text: msg.text }])
      }, d)
      timeouts.push(t)
    })

    return () => timeouts.forEach(clearTimeout)
  }, [])

  return (
    <section className="max-w-6xl mx-auto px-6 py-24 border-t border-base-border">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-xs font-medium text-ink-muted tracking-widest uppercase mb-6"
      >
        See it in action
      </motion.p>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-serif text-display-md text-ink leading-tight mb-4"
          >
            Real answers.
            <br />
            <em className="text-gold">No rehearsal needed.</em>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-sm text-ink-muted leading-relaxed max-w-sm"
          >
            Every answer is grounded in your documents — not hallucinated. Your AI stays honest and
            on-brand.
          </motion.p>
        </div>

        {/* Chat window mockup */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border border-base-border bg-base-surface overflow-hidden shadow-card"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-base-border">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-base-border" />
              <span className="w-2.5 h-2.5 rounded-full bg-base-border" />
              <span className="w-2.5 h-2.5 rounded-full bg-base-border" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-ink-muted font-mono">ask.me / alex-chen</span>
            </div>
          </div>

          {/* Profile header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-base-border">
            <div className="w-8 h-8 rounded-full bg-gold-subtle border border-gold/20 flex items-center justify-center text-xs font-medium text-gold">
              AC
            </div>
            <div>
              <p className="text-xs font-medium text-ink">Alex Chen</p>
              <p className="text-xs text-ink-muted">Senior Engineer · Open to work</p>
            </div>
            <div className="ml-auto">
              <span className="text-xs bg-status-success/10 text-status-success border border-status-success/20 rounded-full px-2 py-0.5">
                Online
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 space-y-3 min-h-[240px]">
            {visible.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] text-xs leading-relaxed px-3 py-2 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-base-raised border border-base-border text-ink rounded-br-sm'
                      : 'bg-gold-subtle border border-gold/20 text-ink rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}

            {visible.length < MESSAGES.length && (
              <div className="flex justify-start">
                <div className="bg-gold-subtle border border-gold/20 rounded-xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1 h-1 rounded-full bg-gold/60"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 bg-base-raised border border-base-border rounded-lg px-3 h-9">
              <span className="text-xs text-ink-muted flex-1">Ask Alex anything...</span>
              <span className="text-xs text-ink-muted">↵</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
