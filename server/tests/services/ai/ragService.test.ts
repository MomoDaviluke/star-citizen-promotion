import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { RagService } from '../../../src/services/ai/ragService.js'

describe('RagService', () => {
  let mockRetriever: any
  let mockLlmService: any
  let service: RagService

  beforeEach(() => {
    mockRetriever = {
      search: jest.fn().mockResolvedValue([
        { content: '公会信息', sourceType: 'guild_info', sourceId: '1', similarity: 0.9 },
      ]),
    }
    mockLlmService = {
      chat: jest.fn().mockResolvedValue({ content: '回答', usage: { totalTokens: 10 } }),
      chatStream: async function* () { yield '回'; yield '答' },
    }
    service = new RagService(mockRetriever, mockLlmService)
  })

  it('query 应检索 + 组装 + 调用 LLM', async () => {
    const result = await service.query({
      question: '如何加入?',
      history: [],
      guild: { guildName: '测试战队' },
    })
    expect(result.content).toBe('回答')
    expect(mockRetriever.search).toHaveBeenCalledWith('如何加入?', expect.any(Object))
    expect(mockLlmService.chat).toHaveBeenCalled()
    expect(result.sources).toHaveLength(1)
  })

  it('queryStream 应流式返回 token', async () => {
    const tokens: string[] = []
    for await (const t of service.queryStream({ question: 'hi', history: [], guild: { guildName: 'T' } })) {
      tokens.push(t)
    }
    expect(tokens).toEqual(['回', '答'])
  })

  it('检索为空时仍应调用 LLM(无上下文回答)', async () => {
    mockRetriever.search.mockResolvedValueOnce([])
    await service.query({ question: 'hi', history: [], guild: { guildName: 'T' } })
    expect(mockLlmService.chat).toHaveBeenCalled()
  })
})
