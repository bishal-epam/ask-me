'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { cn } from '@/utils/cn'

const ACCEPT = '.pdf,.docx,.doc,.txt,.md,.csv'
const MAX_MB = 10

interface UploadedFile {
  id: string
  name: string
  status: 'uploading' | 'done' | 'error'
  error?: string
}

export function Dropzone() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadedFile[]>([])

  const uploadFile = useCallback(async (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploads(prev => [
        { id: crypto.randomUUID(), name: file.name, status: 'error', error: `File exceeds ${MAX_MB} MB` },
        ...prev,
      ])
      return
    }

    const id = crypto.randomUUID()
    setUploads(prev => [{ id, name: file.name, status: 'uploading' }, ...prev])

    const body = new FormData()
    body.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body })
      const json = await res.json() as { error?: string }

      if (!res.ok) {
        setUploads(prev =>
          prev.map(u => u.id === id ? { ...u, status: 'error', error: json.error ?? 'Upload failed' } : u)
        )
        return
      }

      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'done' } : u))
      router.refresh()
    } catch {
      setUploads(prev =>
        prev.map(u => u.id === id ? { ...u, status: 'error', error: 'Network error' } : u)
      )
    }
  }, [router])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(uploadFile)
  }, [uploadFile])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const dismiss = (id: string) =>
    setUploads(prev => prev.filter(u => u.id !== id))

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'rounded-lg border-2 border-dashed transition-all duration-150 p-12 text-center cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
          isDragging
            ? 'border-gold/60 bg-gold/5'
            : 'border-base-border hover:border-gold/30 hover:bg-base-surface',
        )}
      >
        <Upload
          className={cn(
            'w-8 h-8 mx-auto mb-3 transition-colors',
            isDragging ? 'text-gold' : 'text-ink-muted',
          )}
        />
        <p className={cn(
          'text-sm font-medium mb-1 transition-colors',
          isDragging ? 'text-gold' : 'text-ink-secondary',
        )}>
          {isDragging ? 'Drop to upload' : 'Drop files here or click to browse'}
        </p>
        <p className="text-xs text-ink-muted">PDF, DOCX, DOC, TXT, Markdown · up to 10 MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {/* Per-file upload status rows */}
      {uploads.length > 0 && (
        <ul className="space-y-2">
          {uploads.map(u => (
            <li
              key={u.id}
              className="flex items-center gap-3 rounded border border-base-border bg-base-surface px-4 py-3 text-sm"
            >
              {u.status === 'uploading' && (
                <Loader className="w-4 h-4 text-ink-muted animate-spin shrink-0" />
              )}
              {u.status === 'done' && (
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              )}
              {u.status === 'error' && (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}

              <span className="flex-1 truncate text-ink">{u.name}</span>

              {u.status === 'uploading' && (
                <span className="text-xs text-ink-muted shrink-0">Uploading…</span>
              )}
              {u.status === 'error' && (
                <span className="text-xs text-red-400 shrink-0">{u.error}</span>
              )}

              {u.status !== 'uploading' && (
                <button
                  onClick={() => dismiss(u.id)}
                  className="shrink-0 text-ink-muted hover:text-ink transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
