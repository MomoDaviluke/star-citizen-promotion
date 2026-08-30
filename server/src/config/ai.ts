/**
 * @file AI 集成配置
 * @description 通用槽位制 LLM 配置：chat / embed 两个功能槽位 + 可选 fallback 槽位，
 *              全部 OpenAI 兼容协议，指向哪家服务商由环境变量自由决定
 *              （DeepSeek / 豆包 / Ollama / vLLM / OpenRouter / 任意兼容网关）。
 *              嵌入维度必须与 pgvector 列定义一致（EMBEDDING_DIM，默认 1024）。
 * @module server/config/ai
 */

export type ProviderType = 'openai-compatible' | 'anthropic'

export interface ProviderConfig {
  type: ProviderType
  baseURL: string
  apiKey: string
  enabled: boolean
}

/** 功能槽位路由：每个槽位一条降级链（主槽位在前，可选 fallback 槽位在后） */
export interface RoutingConfig {
  chat: { primary: string; fallback: string[] }
  chatStream: { primary: string; fallback: string[] }
  embed: { primary: string; fallback: string[] }
}

export interface AiConfig {
  providers: Record<string, ProviderConfig>
  routing: RoutingConfig
  models: {
    chat: string
    chatStream: string
    embedding: string
  }
  embeddingDim: number
  pgvectorUrl: string
  redisUrl: string
  cacheTtl: number
  requestTimeoutMs: number
}

/**
 * 解析通用槽位配置
 * @param prefix 环境变量前缀（LLM_CHAT / LLM_EMBED / LLM_FALLBACK）
 */
function buildSlot(prefix: string): ProviderConfig {
  const apiKey = process.env[`${prefix}_API_KEY`] || ''
  const baseURL = process.env[`${prefix}_BASE_URL`] || ''
  return { type: 'openai-compatible', baseURL, apiKey, enabled: Boolean(apiKey && baseURL) }
}

/**
 * pgvector 连接串解析
 * @description pgPool 在模块加载时立即用 pgvectorUrl 建 Pool。旧实现缺失时
 *              静默回退到含凭据的硬编码默认值（SEC-01 违规 + DBG-25 连错库根因）。
 *              现规则：显式配置 > 本地开发安全默认（无凭据）> test 环境默认。
 */
function pgVectorUrl(): string {
  const url = process.env.PGVECTOR_URL
  if (url) return url
  if (process.env.NODE_ENV === 'test') {
    return 'postgres://app_user:app_password@localhost:5432/star_citizen_ai'
  }
  return 'postgres://127.0.0.1:5432/star_citizen_ai'
}

export const aiConfig: AiConfig = {
  providers: {
    // 功能槽位：指向哪家服务商完全由用户 env 决定
    chat: buildSlot('LLM_CHAT'),
    embed: buildSlot('LLM_EMBED'),
    // 可选降级槽位：不配置则 routeWithFallback 自动跳过
    fallback: buildSlot('LLM_FALLBACK'),
    // Anthropic 原生协议独立保留（非 OpenAI 兼容、无 embeddings，仅聊天降级用）
    claude: {
      type: 'anthropic',
      baseURL: process.env.ANTHROPIC_BASE_URL || '',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      enabled: Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_BASE_URL),
    },
  },
  routing: {
    chat: { primary: 'chat', fallback: ['fallback', 'claude'] },
    chatStream: { primary: 'chat', fallback: ['fallback', 'claude'] },
    embed: { primary: 'embed', fallback: ['fallback'] },
  },
  models: {
    chat: process.env.LLM_CHAT_MODEL || 'deepseek-chat',
    chatStream: process.env.LLM_CHAT_STREAM_MODEL || process.env.LLM_CHAT_MODEL || 'deepseek-chat',
    embedding: process.env.LLM_EMBEDDING_MODEL || 'bge-m3',
  },
  embeddingDim: parseInt(process.env.EMBEDDING_DIM || '1024', 10),
  pgvectorUrl: pgVectorUrl(),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cacheTtl: parseInt(process.env.LLM_CACHE_TTL || '86400', 10),
  requestTimeoutMs: parseInt(process.env.LLM_REQUEST_TIMEOUT_MS || '30000', 10),
}

export default aiConfig
