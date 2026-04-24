import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { getSuggestions } from '@/lib/suggestions'
import type { StructuredProfile, PersonaPurpose } from '@/types'

interface Props {
  params: Promise<{ username: string }>
}

async function getPersonaByUsername(username: string) {
  const admin = await createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from('profiles') as any)
    .select('id, full_name, username, avatar_url, personas(id, title, purpose, chat_enabled, chat_greeting, structured_profile)')
    .eq('username', username)
    .single()

  if (!data) return null

  const persona = data.personas?.[0]
  if (!persona) return null

  return {
    personaId: persona.id as string,
    personaName: (data.full_name as string | null) ?? username,
    personaTitle: persona.title as string,
    purpose: persona.purpose as PersonaPurpose,
    chatEnabled: persona.chat_enabled as boolean,
    greeting: persona.chat_greeting as string | null,
    structuredProfile: persona.structured_profile as StructuredProfile | null,
    username: data.username as string,
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const persona = await getPersonaByUsername(username)
  if (!persona) return { title: 'Not Found' }
  return {
    title: `Ask ${persona.personaName}`,
    description: `Chat with ${persona.personaName}'s personal AI profile on Ask Me.`,
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const persona = await getPersonaByUsername(username)

  if (!persona) notFound()

  const suggestions = getSuggestions({
    purpose: persona.purpose,
    structuredProfile: persona.structuredProfile,
    maxSuggestions: 4,
  })

  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* Header */}
      <header className="border-b border-base-border px-6 py-3 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full bg-gold-subtle border border-gold/20 flex items-center justify-center text-sm font-medium text-gold">
          {persona.personaName[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-ink leading-none">{persona.personaName}</p>
          <p className="text-xs text-ink-muted mt-0.5">{persona.personaTitle}</p>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 min-h-0 flex flex-col">
        {persona.chatEnabled ? (
          <ChatInterface
            personaId={persona.personaId}
            personaName={persona.personaName}
            personaTitle={persona.personaTitle}
            greeting={persona.greeting}
            suggestions={suggestions}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <p className="font-serif text-xl text-ink mb-2">Chat unavailable</p>
              <p className="text-sm text-ink-muted">
                {persona.personaName} hasn't enabled chat on their profile yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
