import type { Metadata } from 'next'
import Link from 'next/link'
import { LayoutDashboard, User, Upload, MessageSquare, Settings } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/upload', icon: Upload, label: 'Documents' },
  { href: '/dashboard/chat', icon: MessageSquare, label: 'Conversations' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-base-border flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-base-border">
          <Link href="/" className="font-serif text-base text-ink hover:text-gold transition-colors">
            ask me.
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 h-8 px-2.5 rounded text-sm text-ink-secondary hover:text-ink hover:bg-base-surface transition-all"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-base-border">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2.5 h-8 px-2.5 rounded text-sm text-ink-secondary hover:text-ink hover:bg-base-surface transition-all w-full"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
