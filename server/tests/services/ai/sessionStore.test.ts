import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { SessionStore } from '../../../src/services/ai/sessionStore.js'

describe('SessionStore', () => {
  let mockRedis: { get: jest.Mock; set: jest.Mock; del: jest.Mock }
  let store: SessionStore

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    }
    store = new SessionStore(mockRedis as any)
  })

  it('createSession 应生成 sessionId 并存储空会话', async () => {
    mockRedis.set.mockResolvedValue('OK')
    const session = await store.createSession('欢迎来到测试战队')
    expect(session.sessionId).toMatch(/^recruiter:[a-f0-9-]+$/)
    expect(mockRedis.set).toHaveBeenCalledWith(
      expect.stringContaining('recruiter:'),
      expect.any(String),
      'EX',
      86400
    )
  })

  it('getSession 应返回消息历史数组', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({
      messages: [{ role: 'assistant', content: 'hi' }],
      profile: { playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' },
      turnCount: 0,
    }))
    const data = await store.getSession('recruiter:test-123')
    expect(data.messages).toHaveLength(1)
    expect(data.messages[0].content).toBe('hi')
  })

  it('getSession 会话不存在时应返回 null', async () => {
    mockRedis.get.mockResolvedValue(null)
    const data = await store.getSession('recruiter:nonexistent')
    expect(data).toBeNull()
  })

  it('appendMessage 应追加消息并更新 turnCount', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({
      messages: [],
      profile: { playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' },
      turnCount: 0,
    }))
    mockRedis.set.mockResolvedValue('OK')
    await store.appendMessage('recruiter:test', { role: 'user', content: 'hello' })
    const savedData = JSON.parse(mockRedis.set.mock.calls[0][1])
    expect(savedData.messages).toHaveLength(1)
    expect(savedData.turnCount).toBe(1)
  })

  it('updateProfile 应合并画像字段', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({
      messages: [],
      profile: { playStyle: ['pvp'], timeCommit: '', shipPref: [], skillLevel: '' },
      turnCount: 0,
    }))
    mockRedis.set.mockResolvedValue('OK')
    await store.updateProfile('recruiter:test', { timeCommit: '每周10小时', shipPref: ['fighter'] })
    const savedData = JSON.parse(mockRedis.set.mock.calls[0][1])
    expect(savedData.profile.playStyle).toEqual(['pvp'])
    expect(savedData.profile.timeCommit).toBe('每周10小时')
    expect(savedData.profile.shipPref).toEqual(['fighter'])
  })

  it('trimHistory 应保留最近 6 轮(12 条消息)', async () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg${i}`,
    }))
    mockRedis.get.mockResolvedValue(JSON.stringify({
      messages,
      profile: { playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' },
      turnCount: 10,
    }))
    mockRedis.set.mockResolvedValue('OK')
    await store.appendMessage('recruiter:test', { role: 'user', content: 'new' })
    const savedData = JSON.parse(mockRedis.set.mock.calls[0][1])
    expect(savedData.messages).toHaveLength(12)
    expect(savedData.messages[11].content).toBe('new')
    expect(savedData.turnCount).toBe(11)
  })

  it('appendMessage 会话不存在时应抛错', async () => {
    mockRedis.get.mockResolvedValue(null)
    await expect(store.appendMessage('recruiter:nonexistent', { role: 'user', content: 'hi' }))
      .rejects.toThrow('Session not found: recruiter:nonexistent')
  })

  it('appendMessage 追加 assistant 消息时 turnCount 不应递增', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({
      messages: [],
      profile: { playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' },
      turnCount: 5,
    }))
    mockRedis.set.mockResolvedValue('OK')
    await store.appendMessage('recruiter:test', { role: 'assistant', content: 'response' })
    const savedData = JSON.parse(mockRedis.set.mock.calls[0][1])
    expect(savedData.turnCount).toBe(5)
  })
})
