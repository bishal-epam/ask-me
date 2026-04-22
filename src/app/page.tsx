import { Nav } from '@/components/landing/nav'
import { Hero } from '@/components/landing/hero'
import { Personas } from '@/components/landing/personas'
import { HowItWorks } from '@/components/landing/how-it-works'
import { MockChat } from '@/components/landing/mock-chat'
import { Cta } from '@/components/landing/cta'
import { Footer } from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <div className="bg-base text-ink">
      <Nav />
      <main>
        <Hero />
        <Personas />
        <HowItWorks />
        <MockChat />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
