/**
 * @file RAG Service
 * @description RAG 全链路:retrieve → buildPrompt → chat
 * @module server/services/ai/ragService
 */

import type { Retriever, RetrievedChunk } from './rag/retriever.js'
import { buildSystemPrompt, buildPrompt, type GuildInfo } from './rag/promptBuilder.js'
import type { LlmService } from './llmService.js'
import type { ChatMessage } from './providers/types.js'

export interface RagQueryOpts {
  question: string
  history: ChatMessage[]
  guild: GuildInfo
  sourceType?: string
  topK?: number
}

export interface RagResult {
  content: string
  sources: RetrievedChunk[]
  usage?: { totalTokens: number }
}

export class RagService {
  constructor(
    private retriever: Retriever,
    private llmService: LlmService
  ) {}

  async query(opts: RagQueryOpts): Promise<RagResult> {
    // 1. 检索
    const sources = await this.retriever.search(opts.question, {
      topK: opts.topK ?? 5,
      sourceType: opts.sourceType,
    })

    // 2. 组装 prompt
    const systemPrompt = buildSystemPrompt(opts.guild)
    const messages = buildPrompt({
      systemPrompt,
      context: sources,
      history: opts.history,
      question: opts.question,
    })

    // 3. 调用 LLM
    const response = await this.llmService.chat(messages)

    return {
      content: response.content,
      sources,
      usage: response.usage,
    }
  }

  async *queryStream(opts: RagQueryOpts): AsyncGenerator<string, void, unknown> {
    // 1. 检索
    const sources = await this.retriever.search(opts.question, {
      topK: opts.topK ?? 5,
      sourceType: opts.sourceType,
    })

    // 2. 组装 prompt
    const systemPrompt = buildSystemPrompt(opts.guild)
    const messages = buildPrompt({
      systemPrompt,
      context: sources,
      history: opts.history,
      question: opts.question,
    })

    // 3. 流式调用
    yield* this.llmService.chatStream(messages)
  }
}
