'use client'

import { useChat } from '@ai-sdk/react'
import { useEffect, useRef, useMemo, useState, type FormEvent } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { SuggestedQuestions } from './SuggestedQuestions'
import type { QuestionSuggestion } from '@/types'

// Parse the ai@4.x data stream format (0:"text"\n, d:{...}\n) into
// UIMessageChunk objects that @ai-sdk/react@3.x (ai@6.x) expects.
// Required sequence: start → text-start → text-delta(s) → text-end → finish
async function* parseDataStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<{ type: string; id?: string; delta?: string; finishReason?: string }> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let textStarted = false
  const TEXT_ID = 'text-0'
  yield { type: 'start' }
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('0:')) {
          try {
            const delta = JSON.parse(line.slice(2)) as string
            if (!textStarted) {
              yield { type: 'text-start', id: TEXT_ID }
              textStarted = true
            }
            yield { type: 'text-delta', id: TEXT_ID, delta }
          } catch {
            // skip malformed line
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
  if (textStarted) yield { type: 'text-end', id: TEXT_ID }
  yield { type: 'finish' }
}

interface Props {
  personaId: string
  personaName: string
  personaTitle: string
  greeting?: string | null
  suggestions?: QuestionSuggestion[]
  isPreview?: boolean
}

export function ChatInterface({
  personaId,
  personaName,
  personaTitle,
  greeting,
  suggestions = [],
  isPreview = false,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  // Ref for session ID so transport closure always sees the latest value without re-renders
  const sessionIdRef = useRef<string | undefined>(undefined)
  const [input, setInput] = useState('')

  // Custom transport that bridges ai@4.x data stream → @ai-sdk/react@3.x UIMessageChunk stream.
  // Transport is memoized — re-created only if personaId changes.
  const transport = useMemo(
    () => ({
      sendMessages: async (options: {
        abortSignal?: AbortSignal
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }>; [k: string]: any }>
        body?: Record<string, unknown>
      }) => {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...options.body,
            personaId,
            sessionId: sessionIdRef.current,
            // Convert parts-based UIMessage → {role, content} for the server route
            messages: options.messages.map((m) => ({
              role: m.role,
              content: (m.parts ?? [])
                .filter((p) => p.type === 'text')
                .map((p) => p.text ?? '')
                .join(''),
            })),
          }),
          // exactOptionalPropertyTypes: signal must be null or absent, not undefined
          ...(options.abortSignal != null && { signal: options.abortSignal }),
        })

        if (!response.ok) throw new Error(await response.text())

        const sid = response.headers.get('X-Session-Id')
        if (sid && !sessionIdRef.current) sessionIdRef.current = sid

        // Wrap the async generator into a ReadableStream of UIMessageChunk objects
        const gen = parseDataStream(response.body!)
        return new ReadableStream({
          async pull(controller) {
            const { value, done } = await gen.next()
            if (done) {
              controller.close()
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              controller.enqueue(value as any)
            }
          },
        })
      },
      // Required by the ChatTransport interface; null = nothing to resume
      reconnectToStream: async (_options: unknown) => null,
    }),
    [personaId]
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { messages, sendMessage, status } = useChat({ transport: transport as any })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Extract plain text from UIMessage.parts (text-type parts only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getMessageText = (msg: any): string =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (msg.parts ?? []).filter((p: any) => p?.type === 'text').map((p: any) => p.text ?? '').join('')

  const handleSuggestion = (q: string) => {
    void sendMessage({ text: q })
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    void sendMessage({ text: input })
    setInput('')
  }

  const showSuggestions = messages.length === 0 && suggestions.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Preview banner */}
      {isPreview && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gold-subtle border-b border-gold/20 text-xs text-gold">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-gold" />
          Preview Mode — this is how visitors will see your chatbot
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pt-8 pb-4">
            <p className="font-serif text-xl text-ink mb-1">
              ask <em className="text-gold">{personaName.split(' ')[0]?.toLowerCase()}.</em>
            </p>
            <p className="text-xs text-ink-muted">
              {greeting ?? `Ask me anything about ${personaTitle} ${personaName}.`}
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const content = getMessageText(msg)
          // Skip assistant turns with no text (e.g. intermediate tool-call steps)
          if (!content && msg.role !== 'user') return null
          return (
            <MessageBubble
              key={msg.id}
              role={msg.role as 'user' | 'assistant'}
              content={content}
            />
          )
        })}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="w-6 h-6 rounded-full bg-gold-subtle border border-gold/20 flex items-center justify-center text-xs text-gold mr-2 mt-1 shrink-0">
              A
            </div>
            <div className="bg-base-surface rounded-lg px-4 py-2.5">
              <span className="inline-flex gap-1">
                <span className="w-1 h-1 rounded-full bg-ink-muted animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 rounded-full bg-ink-muted animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-ink-muted animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions (shown only before first message) */}
      {showSuggestions && (
        <SuggestedQuestions
          questions={suggestions.slice(0, 4).map((s) => s.text)}
          onSelect={handleSuggestion}
        />
      )}

      {/* Input */}
      <ChatInput
        input={input}
        isLoading={isLoading}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
        placeholder={`Ask about ${personaName.split(' ')[0]}…`}
      />
    </div>
  )
}
