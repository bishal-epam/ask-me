import Link from 'next/link'

const links = {
  product: [
    { href: '/explore', label: 'Explore' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/changelog', label: 'Changelog' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-base-border">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-serif text-lg text-ink hover:text-gold transition-colors block mb-3"
            >
              ask me.
            </Link>
            <p className="text-xs text-ink-muted leading-relaxed max-w-[160px]">
              Your professional presence, made conversational.
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-medium text-ink-muted tracking-widest uppercase mb-4">
                {group}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-ink-secondary hover:text-ink transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-base-border">
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} Ask Me. All rights reserved.
          </p>
          <p className="text-xs text-ink-muted">
            Built with{' '}
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-secondary hover:text-ink transition-colors"
            >
              Next.js
            </a>
            {' · '}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-secondary hover:text-ink transition-colors"
            >
              Supabase
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
