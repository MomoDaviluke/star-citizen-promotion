/**
 * @file AI 集成配置
 * @description LLM Provider 路由、API keys、embedding 维度等配置
 * @module server/config/ai
 */

export type ProviderType = 'openai-compatible' | 'anthropic'

export interface ProviderConfig {
  type: ProviderType
  baseURL: string
  apiKey: string
  enabled: boolean
}

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

function buildProvider(
  _name: string,
  type: ProviderType,
  envKeyPrefix: string
): ProviderConfig {
  const apiKey = process.env[`${envKeyPrefix}_API_KEY`] || ''
  const baseURL = process.env[`${envKeyPrefix}_BASE_URL`] || ''
  return { type, baseURL, apiKey, enabled: Boolean(apiKey && baseURL) }
}

export const aiConfig: AiConfig = {
  providers: {
    doubao: buildProvider('doubao', 'openai-compatible', 'DOUBAO'),
    deepseek: buildProvider('deepseek', 'openai-compatible', 'DEEPSEEK'),
    claude: buildProvider('claude', 'anthropic', 'ANTHROPIC'),
  },
  routing: {
    chat: { primary: 'doubao', fallback: ['deepseek', 'claude'] },
    chatStream: { primary: 'deepseek', fallback: ['doubao'] },
    embed: { primary: 'doubao', fallback: ['deepseek'] },
  },
  models: {
    chat: process.env.LLM_CHAT_MODEL || 'doubao-pro-32k-241215',
    chatStream: process.env.LLM_CHAT_STREAM_MODEL || 'deepseek-chat',
    embedding: process.env.LLM_EMBEDDING_MODEL || 'doubao-embedding-text-240715',
  },
  embeddingDim: parseInt(process.env.EMBEDDING_DIM || '1024', 10),
  pgvectorUrl: process.env.PGVECTOR_URL || 'postgres://app_user:password@localhost:5432/star_citizen_ai',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cacheTtl: parseInt(process.env.LLM_CACHE_TTL || '86400', 10),
  requestTimeoutMs: parseInt(process.env.LLM_REQUEST_TIMEOUT_MS || '30000', 10),
}

export default aiConfig
