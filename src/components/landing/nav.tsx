'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from '@/utils/cn'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-base/90 backdrop-blur-md border-b border-base-border'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl text-ink tracking-tight hover:text-gold transition-colors"
        >
          ask me.
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/login"
            className="h-9 px-4 text-sm text-ink-secondary hover:text-ink transition-colors rounded"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={cn(
              'h-9 px-4 text-sm font-medium rounded transition-all duration-150',
              'inline-flex items-center',
              'bg-ink text-ink-inverse hover:bg-ink/90'
            )}
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  )
}
