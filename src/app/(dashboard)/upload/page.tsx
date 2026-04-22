import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Documents' }

export default function UploadPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-medium text-ink mb-1">Documents</h1>
      <p className="text-sm text-ink-muted mb-8">
        Upload your CV, portfolio, bio, or any links to build your AI
      </p>

      {/* Upload dropzone — full implementation in next iteration */}
      <div className="rounded-lg border-2 border-dashed border-base-border hover:border-gold/30 transition-colors p-12 text-center cursor-pointer group">
        <div className="text-ink-muted group-hover:text-gold transition-colors mb-2 text-2xl">↑</div>
        <p className="text-sm font-medium text-ink-secondary group-hover:text-ink transition-colors mb-1">
          Drop files here or click to upload
        </p>
        <p className="text-xs text-ink-muted">PDF, DOCX, TXT · up to 10MB per file</p>
      </div>
    </div>
  )
}
