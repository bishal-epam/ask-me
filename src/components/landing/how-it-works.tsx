'use client'

import { motion } from 'framer-motion'
import { Upload, Sparkles, Share2 } from 'lucide-react'

const steps = [
  {
    num: '01',
    icon: Upload,
    title: 'Upload',
    description:
      'Drop your CV, portfolio, links, or bio. We handle PDF, DOCX, plain text, and external URLs.',
  },
  {
    num: '02',
    icon: Sparkles,
    title: 'Personalize',
    description:
      'Your AI learns your story from your documents. Review and refine what it knows before going live.',
  },
  {
    num: '03',
    icon: Share2,
    title: 'Share',
    description:
      'Get a clean link. Send it anywhere. Anyone who visits can ask your AI anything — any time.',
  },
]

export function HowItWorks() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24 border-t border-base-border">
      <div className="grid md:grid-cols-2 gap-16 items-start">
        {/* Left: label + header */}
        <div className="md:sticky md:top-24">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-medium text-ink-muted tracking-widest uppercase mb-6"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-display-lg text-ink leading-tight mb-6"
          >
            Three steps.
            <br />
            <em>Then it works for you.</em>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-sm text-ink-muted leading-relaxed max-w-xs"
          >
            No technical setup. No ongoing maintenance. Upload once, share forever.
          </motion.p>
        </div>

        {/* Right: Steps */}
        <div className="space-y-1">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex gap-6 p-6 rounded-lg hover:bg-base-surface transition-colors"
            >
              {/* Step number */}
              <div className="shrink-0 w-10">
                <span className="text-xs font-mono text-ink-muted group-hover:text-gold transition-colors">
                  {step.num}
                </span>
              </div>

              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded bg-base-raised border border-base-border flex items-center justify-center group-hover:border-gold/30 transition-all">
                  <step.icon className="w-3.5 h-3.5 text-ink-muted group-hover:text-gold transition-colors" />
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="text-sm font-medium text-ink mb-1.5">{step.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
