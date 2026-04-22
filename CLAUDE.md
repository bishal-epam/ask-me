---
project: ask-me
version: 0.1.0
status: active
owner: bishal
stack:
  runtime: Node.js 24 + TypeScript 5 (strict)
  frontend: Next.js 15 App Router + Tailwind CSS 3 + Framer Motion
  backend: Next.js API Routes + Supabase Edge Functions
  database: Supabase PostgreSQL + pgVector
  auth: Supabase Auth (email + OAuth)
  ai:
    dev: Ollama (qwen2.5:7b chat, nomic-embed-text embeddings)
    prod: OpenAI gpt-4o-mini / Anthropic claude-sonnet-4-6
  email: Resend
  hosting: Vercel
agents:
  - document-processor
  - embedding-agent
  - chat-agent
  - fitment-agent
mcp_servers:
  - supabase
  - filesystem
  - playwright
---

# Ask Me — Claude Code Project Guide

Ask Me is a personalized AI interaction platform. Users (jobseekers, creators, freelancers) upload documents and links to create a personal AI chatbot that speaks on their behalf. Visitors (recruiters, marketers, corporates) interact with these bots to evaluate, connect, and collaborate.

## Architecture

```
src/
├── app/                     # Next.js App Router pages
│   ├── (auth)/              # Login + signup flows
│   ├── (dashboard)/         # Authenticated user area
│   ├── (public)/[username]/ # Public persona chatbot pages
│   └── api/                 # API routes (chat, upload, embed, webhooks)
├── components/
│   ├── landing/             # Landing page sections
│   ├── ui/                  # Primitive UI components
│   ├── chat/                # Chat interface components
│   ├── upload/              # Document upload components
│   └── profile/             # Profile management components
├── lib/
│   ├── supabase/            # Supabase client/server/middleware
│   ├── ai/                  # AI provider abstraction (Ollama/OpenAI/Anthropic)
│   ├── embeddings/          # Document chunking + vector storage
│   └── email/               # Resend email templates + sender
├── hooks/                   # React hooks
├── types/                   # TypeScript types (database.ts auto-generated)
└── utils/                   # Pure utility functions
supabase/
├── migrations/              # Ordered SQL migrations (001_, 002_, ...)
└── seed.ts                  # Dev seed data
.claude/
├── agents/                  # Sub-agent definitions
└── commands/                # Custom slash commands
tests/
├── unit/                    # Vitest unit tests
└── e2e/                     # Playwright end-to-end tests
```

## Key Conventions

- **Route groups**: `(auth)`, `(dashboard)`, `(public)` — parentheses prevent URL segment
- **Server vs client**: Default to Server Components. Add `'use client'` only when needed (interactivity, hooks, browser APIs)
- **Data fetching**: Use Server Components for initial data, SWR/React Query for client-side mutations
- **AI provider**: Controlled by `AI_PROVIDER` env var. Never hardcode a provider — always use `getLanguageModel()` from `@/lib/ai`
- **Embeddings**: `EMBEDDING_DIMENSIONS` must match the configured model (768 for nomic-embed-text, 1536 for OpenAI)
- **Error handling**: All API routes return `{ error: string }` on failure with appropriate HTTP status
- **Logging**: Use `@/lib/logger` (Pino). Never use `console.log` in production code
- **Validation**: All inputs validated with Zod schemas before processing
- **Auth**: Use `createServerClient()` from `@/lib/supabase/server` in Server Components/Actions. Use `createBrowserClient()` for client components

## Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run type-check   # TypeScript check without emit
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run test:e2e     # Playwright E2E
npm run db:migrate   # Push migrations to Supabase
npm run db:reset     # Reset local Supabase DB
npm run db:seed      # Run seed script
npm run db:types     # Regenerate TypeScript types from schema
```

## Sub-Agents

Claude Code sub-agents are defined in `.claude/agents/`. Each agent handles a specific domain:

| Agent | File | Responsibility |
|-------|------|----------------|
| Document Processor | `agents/document-processor.md` | Parse uploaded files (PDF, DOCX, links) into raw text |
| Embedding Agent | `agents/embedding-agent.md` | Chunk text + store vectors in pgVector |
| Chat Agent | `agents/chat-agent.md` | RAG-based conversational responses |
| Fitment Agent | `agents/fitment-agent.md` | Score candidate fit against job descriptions |

## Custom Commands

| Command | File | Use |
|---------|------|-----|
| `/gen-migration` | `commands/gen-migration.md` | Generate a new numbered SQL migration |
| `/seed-db` | `commands/seed-db.md` | Seed dev database with realistic test data |
| `/test-e2e` | `commands/test-e2e.md` | Run targeted E2E tests |
| `/deploy-check` | `commands/deploy-check.md` | Pre-deployment validation checklist |

## MCP Servers (`.claude/settings.json`)

- **supabase**: Direct DB introspection and query execution via MCP
- **filesystem**: Read/write project files during agentic workflows
- **playwright**: Browser automation for E2E test generation

## Database Schema Overview

See `supabase/migrations/` for full DDL. Key tables:

- `profiles` — extends `auth.users`, stores public profile data
- `personas` — a profile's public chatbot presence (slug, title, purpose)
- `documents` — uploaded files/links attached to a persona
- `document_chunks` — chunked text with pgVector embeddings
- `chat_sessions` — visitor conversation sessions
- `chat_messages` — individual turns (role: user | assistant)
- `interview_requests` — recruiter/marketer contact requests
- `notifications` — email notification queue

## Environment Variables

See `.env.example` for the full list. Required to run locally:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OLLAMA_BASE_URL` (default: `http://localhost:11434`)

## Testing Strategy

- **Unit tests** (Vitest): Pure functions in `lib/`, utility functions, Zod schema validation
- **Integration tests** (Vitest + Supabase local): API route handlers, database queries
- **E2E tests** (Playwright): Critical user journeys — signup, upload, chat, interview request

## Design System

Dark-first. Design tokens live in `tailwind.config.ts`:
- Background: `base.DEFAULT` (#0a0a0a) → `base.surface` → `base.raised`
- Text: `ink.DEFAULT` (warm white) → `ink.secondary` → `ink.muted`
- Accent: `gold.DEFAULT` (#c9a96e)
- Fonts: `font-serif` (Instrument Serif, display) + `font-sans` (Inter, UI)
