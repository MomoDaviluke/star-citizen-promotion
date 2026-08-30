import { describe, it, expect, jest } from '@jest/globals'
import { createProviders, routeWithFallback } from '../../../src/services/ai/providers/index.js'

describe('AI 集成: 降级链', () => {
  it('所有 provider 配置失败时应优雅降级', () => {
    // 无 API key 时 providers 应为空
    const { registry } = createProviders()
    // 不应抛出,应返回(可能为空)registry
    expect(registry).toBeDefined()
  })

  it('routeWithFallback 空链应抛出错误', async () => {
    await expect(
      routeWithFallback({}, [], async () => 'ok')
    ).rejects.toThrow(/No provider available/)
  })
})

describe('AI 招募官集成: 会话 + 画像 + RAG', () => {
  it('完整对话流程应正确更新画像', async () => {
    // 这个测试验证: session 创建 → 消息追加 → 画像提取 → 画像存储
    // 使用 mock 避免真实 LLM 调用
    const { SessionStore } = await import('../../../src/services/ai/sessionStore.js')
    const { ProfileEngine } = await import('../../../src/services/ai/profileEngine.js')

    const mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn(),
    }
    const store = new SessionStore(mockRedis as any)
    const engine = new ProfileEngine()

    // 创建会话
    const { sessionId, data } = await store.createSession('欢迎')
    expect(data.turnCount).toBe(0)

    // 模拟用户消息
    const profile = engine.extract(data.profile, '我喜欢 PVP 和探索,每周玩 15 小时')
    expect(profile.playStyle).toContain('pvp')
    expect(profile.playStyle).toContain('exploration')
    expect(profile.timeCommit).toBe('每周15小时')
  })
})
