'use client'

import type { FormEvent } from 'react'
import { Send } from 'lucide-react'

interface Props {
  input: string
  isLoading: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  placeholder?: string
}

export function ChatInput({ input, isLoading, onChange, onSubmit, placeholder }: Props) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 p-4 border-t border-base-border">
      <input
        type="text"
        value={input}
        onChange={onChange}
        placeholder={placeholder ?? 'Ask me anything…'}
        disabled={isLoading}
        className="flex-1 bg-base-surface border border-base-border rounded px-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-gold/50 disabled:opacity-50 transition-colors"
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="w-8 h-8 flex items-center justify-center rounded bg-gold text-base hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </form>
  )
}
