import { createOllama } from 'ollama-ai-provider'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import type { LanguageModel, EmbeddingModel } from 'ai'
import { getLogger } from '@/lib/logger'

const log = getLogger('ai')
const provider = (process.env.AI_PROVIDER ?? 'ollama') as 'ollama' | 'openai' | 'anthropic'

export function getLanguageModel(): LanguageModel {
  log.debug({ provider }, 'Creating language model')

  switch (provider) {
    case 'ollama': {
      const ollama = createOllama({
        baseURL: `${process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'}/api`,
      })
      return ollama(process.env.OLLAMA_MODEL ?? 'qwen2.5:7b')
    }
    case 'openai': {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
      return openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini')
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
      return anthropic(process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6')
    }
    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider as string}`)
  }
}

export function getEmbeddingModel(): EmbeddingModel<string> {
  switch (provider) {
    case 'ollama': {
      const ollama = createOllama({
        baseURL: `${process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'}/api`,
      })
      return ollama.embedding(process.env.OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text')
    }
    case 'openai': {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
      return openai.embedding(process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small')
    }
    default:
      throw new Error(`Embeddings not supported for AI_PROVIDER: ${provider}`)
  }
}

export const EMBEDDING_DIMENSIONS = parseInt(process.env.EMBEDDING_DIMENSIONS ?? '768', 10)

export { provider as AI_PROVIDER }
