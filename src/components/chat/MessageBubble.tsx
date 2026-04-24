'use client'

interface Props {
  role: 'user' | 'assistant'
  content: string
}

export function MessageBubble({ role, content }: Props) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gold-subtle border border-gold/20 flex items-center justify-center text-xs text-gold mr-2 mt-1 shrink-0">
          A
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-base-raised text-ink ml-2'
            : 'bg-base-surface text-ink'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
