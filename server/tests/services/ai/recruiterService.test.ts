import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { RecruiterService } from '../../../src/services/ai/recruiterService.js'

describe('RecruiterService', () => {
  let mockRagService: any
  let mockSessionStore: any
  let mockProfileEngine: any
  let service: RecruiterService

  beforeEach(() => {
    mockRagService = {
      query: jest.fn().mockResolvedValue({
        content: '欢迎加入!',
        sources: [{ content: '公会信息', sourceType: 'guild_info', sourceId: '1' }],
      }),
      queryStream: async function* () { yield '欢'; yield '迎' },
    }
    mockSessionStore = {
      createSession: jest.fn().mockResolvedValue({
        sessionId: 'recruiter:test-uuid',
        data: { messages: [], profile: { playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' }, turnCount: 0 },
      }),
      getSession: jest.fn().mockResolvedValue({
        messages: [{ role: 'assistant', content: '欢迎' }],
        profile: { playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' },
        turnCount: 0,
      }),
      appendMessage: jest.fn().mockResolvedValue({
        messages: [{ role: 'assistant', content: '欢迎' }, { role: 'user', content: 'hi' }],
        profile: { playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' },
        turnCount: 1,
      }),
      updateProfile: jest.fn(),
    }
    mockProfileEngine = {
      extract: jest.fn().mockReturnValue({ playStyle: ['pvp'], timeCommit: '', shipPref: [], skillLevel: '' }),
    }
    service = new RecruiterService(mockRagService, mockSessionStore, mockProfileEngine)
  })

  it('initSession 应创建会话并返回欢迎消息', async () => {
    const result = await service.initSession()
    expect(result.sessionId).toBe('recruiter:test-uuid')
    expect(result.welcome).toBeDefined()
    expect(mockSessionStore.createSession).toHaveBeenCalled()
  })

  it('chat 应追加用户消息 + 调用 RAG + 更新画像', async () => {
    const result = await service.chat('recruiter:test-uuid', '我喜欢 PVP')
    expect(result.content).toBe('欢迎加入!')
    expect(mockSessionStore.appendMessage).toHaveBeenCalledWith(
      'recruiter:test-uuid',
      { role: 'user', content: '我喜欢 PVP' }
    )
    expect(mockRagService.query).toHaveBeenCalled()
    expect(mockProfileEngine.extract).toHaveBeenCalled()
    expect(mockSessionStore.updateProfile).toHaveBeenCalled()
  })

  it('chat 会话不存在时应抛出错误', async () => {
    mockSessionStore.getSession.mockResolvedValue(null)
    await expect(service.chat('recruiter:bad', 'hi')).rejects.toThrow(/Session not found/)
  })

  it('chatStream 应流式返回 token', async () => {
    const tokens: string[] = []
    for await (const token of service.chatStream('recruiter:test-uuid', 'hi')) {
      tokens.push(token)
    }
    expect(tokens).toEqual(['欢', '迎'])
    expect(mockSessionStore.appendMessage).toHaveBeenCalled()
  })

  it('getSuggestions 应基于画像返回推荐问题', async () => {
    mockSessionStore.getSession.mockResolvedValue({
      messages: [],
      profile: { playStyle: ['pvp'], timeCommit: '', shipPref: [], skillLevel: '' },
      turnCount: 0,
    })
    const result = await service.getSuggestions('recruiter:test-uuid')
    expect(result.suggestions).toBeInstanceOf(Array)
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('getSuggestions 3 轮后应包含申请引导', async () => {
    mockSessionStore.getSession.mockResolvedValue({
      messages: [],
      profile: { playStyle: ['pvp'], timeCommit: '每周10小时', shipPref: [], skillLevel: '' },
      turnCount: 3,
    })
    const result = await service.getSuggestions('recruiter:test-uuid')
    expect(result.suggestions).toContain('提交申请')
  })
})
