/**
 * @file 招募官会话存储
 * @description 基于 Redis 的会话管理,存储消息历史 + 画像,24h TTL,6 轮历史窗口
 * @module server/services/ai/sessionStore
 */

import { randomUUID } from 'node:crypto'
import type { ChatMessage } from './providers/types.js'

export interface UserProfile {
  playStyle: string[]
  timeCommit: string
  shipPref: string[]
  skillLevel: string
}

export interface SessionData {
  messages: ChatMessage[]
  profile: UserProfile
  turnCount: number
}

const DEFAULT_PROFILE: UserProfile = {
  playStyle: [],
  timeCommit: '',
  shipPref: [],
  skillLevel: '',
}

const SESSION_TTL = 86400 // 24 小时
const MAX_HISTORY_MESSAGES = 12 // 最近 6 轮(每轮 user+assistant)

export interface RedisLike {
  get(key: string): Promise<string | null>
  set(key: string, value: string, mode?: string, ttl?: number): Promise<string>
  del(key: string): Promise<number>
}

/**
 * 会话存储(非线程安全)。
 * appendMessage/updateProfile 为 read-modify-write 操作,调用方需保证同一 session 串行调用,
 * 避免并发覆盖。RecruiterService 应在流式响应结束后再追加 assistant 消息。
 */
export class SessionStore {
  constructor(private redis: RedisLike) {}

  async createSession(welcomeMessage: string): Promise<{ sessionId: string; data: SessionData }> {
    const sessionId = `recruiter:${randomUUID()}`
    const data: SessionData = {
      messages: [{ role: 'assistant', content: welcomeMessage }],
      profile: { ...DEFAULT_PROFILE },
      turnCount: 0,
    }
    await this.redis.set(sessionId, JSON.stringify(data), 'EX', SESSION_TTL)
    return { sessionId, data }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const raw = await this.redis.get(sessionId)
    if (!raw) return null
    try {
      return JSON.parse(raw) as SessionData
    } catch {
      return null
    }
  }

  async appendMessage(sessionId: string, message: ChatMessage): Promise<SessionData> {
    const data = await this.getSession(sessionId)
    if (!data) throw new Error(`Session not found: ${sessionId}`)

    data.messages.push(message)
    if (message.role === 'user') {
      data.turnCount += 1
    }

    // 保留最近 6 轮(12 条消息)
    if (data.messages.length > MAX_HISTORY_MESSAGES) {
      data.messages = data.messages.slice(-MAX_HISTORY_MESSAGES)
    }

    await this.redis.set(sessionId, JSON.stringify(data), 'EX', SESSION_TTL)
    return data
  }

  async updateProfile(sessionId: string, updates: Partial<UserProfile>): Promise<SessionData> {
    const data = await this.getSession(sessionId)
    if (!data) throw new Error(`Session not found: ${sessionId}`)

    // 浅合并: 数组字段(playStyle/shipPref)为整体替换,非数组合并
    data.profile = { ...data.profile, ...updates }
    await this.redis.set(sessionId, JSON.stringify(data), 'EX', SESSION_TTL)
    return data
  }
}
