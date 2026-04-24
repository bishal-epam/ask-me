'use client'

interface Props {
  questions: string[]
  onSelect: (q: string) => void
}

export function SuggestedQuestions({ questions, onSelect }: Props) {
  if (!questions.length) return null

  return (
    <div className="px-4 pb-3">
      <p className="text-xs text-ink-muted mb-2">Suggested questions</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="text-xs px-3 py-1.5 rounded-full border border-base-border text-ink-secondary hover:text-ink hover:border-gold/40 hover:bg-gold-subtle transition-all"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
