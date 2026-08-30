/**
 * @file 招募官服务
 * @description AI 招募官核心:会话管理 + RAG 检索 + 画像更新 + SSE 流式
 * @module server/services/ai/recruiterService
 */

import type { RagService } from './ragService.js'
import type { SessionStore, UserProfile } from './sessionStore.js'
import type { ProfileEngine } from './profileEngine.js'

const WELCOME_MESSAGE = '欢迎来到我们的公会。我是 AI 指挥官,你想了解什么?'

const SUGGESTION_BANK: Record<string, string[]> = {
  pvp: ['你们有 PVP 训练吗?', '战斗编队怎么安排?'],
  trade: ['贸易路线怎么规划?', '货运需要什么舰船?'],
  exploration: ['探索活动频率如何?', '需要什么探索装备?'],
  mining: ['矿业收益怎么样?', '矿船推荐哪艘?'],
  default: ['如何加入公会?', '活动时间安排?', '需要什么舰船?'],
}

export interface ChatResult {
  content: string
  sources: Array<{ content: string; sourceType: string; sourceId: string }>
  profile: UserProfile
  turnCount: number
}

export class RecruiterService {
  constructor(
    private ragService: RagService,
    private sessionStore: SessionStore,
    private profileEngine: ProfileEngine
  ) {}

  async initSession(): Promise<{ sessionId: string; welcome: string }> {
    const { sessionId } = await this.sessionStore.createSession(WELCOME_MESSAGE)
    return { sessionId, welcome: WELCOME_MESSAGE }
  }

  async chat(sessionId: string, userMessage: string): Promise<ChatResult> {
    const session = await this.sessionStore.getSession(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    // 追加用户消息
    const updatedSession = await this.sessionStore.appendMessage(sessionId, {
      role: 'user',
      content: userMessage,
    })

    // 提取画像
    const newProfile = this.profileEngine.extract(session.profile, userMessage)
    if (JSON.stringify(newProfile) !== JSON.stringify(session.profile)) {
      await this.sessionStore.updateProfile(sessionId, newProfile)
    }

    // RAG 检索 + LLM 回答
    const ragResult = await this.ragService.query({
      question: userMessage,
      history: updatedSession.messages.slice(-12),
      guild: { guildName: process.env.GUILD_NAME || 'Star Citizen 战队' },
    })

    // 追加 AI 回复
    await this.sessionStore.appendMessage(sessionId, {
      role: 'assistant',
      content: ragResult.content,
    })

    return {
      content: ragResult.content,
      sources: ragResult.sources,
      profile: newProfile,
      turnCount: updatedSession.turnCount,
    }
  }

  async *chatStream(sessionId: string, userMessage: string): AsyncGenerator<string, void, unknown> {
    const session = await this.sessionStore.getSession(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    // 追加用户消息
    const updatedSession = await this.sessionStore.appendMessage(sessionId, {
      role: 'user',
      content: userMessage,
    })

    // 提取画像
    const newProfile = this.profileEngine.extract(session.profile, userMessage)
    if (JSON.stringify(newProfile) !== JSON.stringify(session.profile)) {
      await this.sessionStore.updateProfile(sessionId, newProfile)
    }

    // 流式 RAG
    let fullContent = ''
    for await (const token of this.ragService.queryStream({
      question: userMessage,
      history: updatedSession.messages.slice(-12),
      guild: { guildName: process.env.GUILD_NAME || 'Star Citizen 战队' },
    })) {
      fullContent += token
      yield token
    }

    // 流结束后追加完整 AI 回复
    await this.sessionStore.appendMessage(sessionId, {
      role: 'assistant',
      content: fullContent,
    })
  }

  async getSuggestions(sessionId: string): Promise<{ suggestions: string[] }> {
    const session = await this.sessionStore.getSession(sessionId)
    if (!session) return { suggestions: SUGGESTION_BANK.default }

    const suggestions: string[] = []

    // 基于画像推荐
    for (const style of session.profile.playStyle) {
      const styleSuggestions = SUGGESTION_BANK[style]
      if (styleSuggestions) {
        suggestions.push(...styleSuggestions.slice(0, 1))
      }
    }

    // 不足 3 条时补充默认
    if (suggestions.length < 3) {
      for (const s of SUGGESTION_BANK.default) {
        if (!suggestions.includes(s)) {
          suggestions.push(s)
          if (suggestions.length >= 3) break
        }
      }
    }

    // 3 轮后引导申请
    if (session.turnCount >= 3) {
      suggestions.push('提交申请')
    }

    return { suggestions: suggestions.slice(0, 4) }
  }
}
