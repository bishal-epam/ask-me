import type { Metadata, Viewport } from 'next'
import { Instrument_Serif, Inter } from 'next/font/google'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Ask Me — Your presence, personified.',
    template: '%s · Ask Me',
  },
  description:
    'Build a personal AI that speaks for you. For jobseekers, creators, and freelancers who want to be found — and for recruiters, marketers, and teams who need to find them.',
  keywords: ['personal AI', 'chatbot', 'portfolio', 'jobseeker', 'recruiter', 'creator'],
  authors: [{ name: 'Ask Me' }],
  openGraph: {
    type: 'website',
    siteName: 'Ask Me',
    title: 'Ask Me — Your presence, personified.',
    description: 'Build a personal AI that speaks for you.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ask Me — Your presence, personified.',
    description: 'Build a personal AI that speaks for you.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${inter.variable} dark`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  )
}
