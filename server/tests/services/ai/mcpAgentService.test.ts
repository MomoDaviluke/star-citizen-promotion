import { describe, it, expect, jest } from '@jest/globals'
import { McpAgentService, TOOL_CALL_OPEN, TOOL_CALL_CLOSE, TOOL_RESULT_OPEN, TOOL_RESULT_CLOSE } from '../../../src/services/ai/mcpAgentService.js'
import { McpClientError } from '../../../src/mcp/mcpClient.js'
import type { McpToolDefinition } from '../../../src/mcp/types.js'
import type { McpClient } from '../../../src/mcp/mcpClient.js'
import type { ChatMessage } from '../../../src/services/ai/providers/types.js'

const TOOL_DEF: McpToolDefinition = {
  name: 'query_fleet',
  description: '查询舰队舰船列表',
  inputSchema: { type: 'object', properties: { category: { type: 'string' } } },
}

interface LlmStub {
  chat: ReturnType<typeof jest.fn>
  chatStream: (messages: ChatMessage[]) => AsyncGenerator<string, void, unknown>
  calls: ChatMessage[][]
}

/** 构造 LLM stub:决策轮按顺序返回 responses,chatStream 固定吐"最终/回答"并记录入参 */
function makeLlm(decisionResponses: string[]): LlmStub {
  const calls: ChatMessage[][] = []
  const chat = jest.fn()
  for (const r of decisionResponses) {
    chat.mockResolvedValueOnce({
      content: r,
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      provider: 'stub',
      model: 'stub-model',
    })
  }

  async function* chatStream(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    calls.push(messages)
    yield '最终'
    yield '回答'
  }

  return { chat, chatStream, calls }
}

function makeMcpClient(overrides: Record<string, unknown> = {}): McpClient {
  return {
    listTools: jest.fn().mockResolvedValue([TOOL_DEF]),
    callTool: jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: '{"total": 1, "ships": [{"ship": "Gladius"}]}' }],
    }),
    ...overrides,
  } as unknown as McpClient
}

describe('McpAgentService · 工具发现与降级', () => {
  it('mcpClient 为 null → 无工具,纯 LLM 链路', async () => {
    const llm = makeLlm([])
    const agent = new McpAgentService({ llm, mcpClient: null })

    const tools = await agent.listAvailableTools()
    expect(tools).toEqual([])

    const result = await agent.chat('你好')
    expect(result.toolsEnabled).toBe(false)
    expect(result.toolCalls).toEqual([])
    expect(result.content).toBe('最终回答')
    expect(llm.chat).not.toHaveBeenCalled() // 跳过决策轮
  })

  it('MCP 发现失败 → 返回 [] 且进程内不再重试', async () => {
    const client = makeMcpClient({ listTools: jest.fn().mockRejectedValue(new Error('transport down')) })
    const agent = new McpAgentService({ llm: makeLlm([]), mcpClient: client })

    expect(await agent.listAvailableTools()).toEqual([])
    expect(await agent.listAvailableTools()).toEqual([]) // 第二次走降级标记,不再触发 listTools
    expect(client.listTools).toHaveBeenCalledTimes(1)
  })

  it('发现成功后走缓存', async () => {
    const client = makeMcpClient()
    const agent = new McpAgentService({ llm: makeLlm([]), mcpClient: client })

    const first = await agent.listAvailableTools()
    const second = await agent.listAvailableTools()
    expect(second).toBe(first)
    expect(client.listTools).toHaveBeenCalledTimes(1)
  })
})

describe('McpAgentService · 系统提示词', () => {
  it('无工具时输出基础提示词', () => {
    const agent = new McpAgentService({ llm: makeLlm([]), mcpClient: null })
    const prompt = agent.buildSystemPrompt([])
    expect(prompt).toContain('AI 招募官')
    expect(prompt).not.toContain(TOOL_CALL_OPEN)
  })

  it('有工具时注入工具清单与调用协议', () => {
    const agent = new McpAgentService({ llm: makeLlm([]), mcpClient: null })
    const prompt = agent.buildSystemPrompt([TOOL_DEF])
    expect(prompt).toContain('query_fleet')
    expect(prompt).toContain(TOOL_CALL_OPEN)
    expect(prompt).toContain(TOOL_RESULT_OPEN)
  })
})

describe('McpAgentService · parseToolCall', () => {
  const agent = new McpAgentService({ llm: makeLlm([]), mcpClient: null })

  it('解析标准调用(含空白)', () => {
    const parsed = agent.parseToolCall(`前缀 ${TOOL_CALL_OPEN} {"name":"query_fleet","arguments":{"category":"fighter"}} ${TOOL_CALL_CLOSE} 后缀`)
    expect(parsed).toEqual({ name: 'query_fleet', arguments: { category: 'fighter' } })
  })

  it('arguments 缺省按空对象', () => {
    const parsed = agent.parseToolCall(`${TOOL_CALL_OPEN}{"name":"get_fleet_stats"}${TOOL_CALL_CLOSE}`)
    expect(parsed).toEqual({ name: 'get_fleet_stats', arguments: {} })
  })

  it('无标记 → null', () => {
    expect(agent.parseToolCall('普通回答文本')).toBeNull()
  })

  it('非法 JSON → null', () => {
    expect(agent.parseToolCall(`${TOOL_CALL_OPEN}{name: broken}${TOOL_CALL_CLOSE}`)).toBeNull()
  })

  it('name 缺失/空 → null', () => {
    expect(agent.parseToolCall(`${TOOL_CALL_OPEN}{"arguments":{}}${TOOL_CALL_CLOSE}`)).toBeNull()
    expect(agent.parseToolCall(`${TOOL_CALL_OPEN}{"name":"  "}${TOOL_CALL_CLOSE}`)).toBeNull()
  })

  it('arguments 非对象(数组/字符串) → null', () => {
    expect(agent.parseToolCall(`${TOOL_CALL_OPEN}{"name":"x","arguments":[1]}${TOOL_CALL_CLOSE}`)).toBeNull()
    expect(agent.parseToolCall(`${TOOL_CALL_OPEN}{"name":"x","arguments":"str"}${TOOL_CALL_CLOSE}`)).toBeNull()
  })
})

describe('McpAgentService · chat 循环', () => {
  it('首轮直接回答 → 决策 1 次 + 最终流式生成,无工具轨迹', async () => {
    const llm = makeLlm(['不需要工具,直接回答的判断'])
    const agent = new McpAgentService({ llm, mcpClient: makeMcpClient() })

    const result = await agent.chat('你们公会怎么样?')
    expect(llm.chat).toHaveBeenCalledTimes(1)
    expect(result.content).toBe('最终回答')
    expect(result.toolCalls).toEqual([])
    expect(result.toolsEnabled).toBe(true)
    expect(result.rounds).toBe(1)
  })

  it('首轮发起工具调用 → 执行并回填 → 二轮给出答案', async () => {
    const llm = makeLlm([
      `${TOOL_CALL_OPEN}{"name":"query_fleet","arguments":{"category":"fighter"}}${TOOL_CALL_CLOSE}`,
      '基于检索结果,推荐你试试 Gladius',
    ])
    const client = makeMcpClient()
    const agent = new McpAgentService({ llm, mcpClient: client })

    const result = await agent.chat('推荐一艘战斗机')

    expect(client.callTool).toHaveBeenCalledWith('query_fleet', { category: 'fighter' })
    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls[0]).toMatchObject({ name: 'query_fleet', ok: true })
    expect(result.toolCalls[0].resultPreview).toContain('Gladius')
    expect(result.rounds).toBe(2) // 决策轮(工具调用) + 决策轮(最终回答)

    // 最终流式生成的上下文应包含工具结果回填
    const finalMessages = llm.calls[0]
    const toolResultMsg = finalMessages.find(
      (m) => m.role === 'user' && m.content.includes(TOOL_RESULT_OPEN)
    )
    expect(toolResultMsg).toBeTruthy()
    expect(toolResultMsg!.content).toContain('name="query_fleet"')
    expect(toolResultMsg!.content).toContain('Gladius')
    expect(finalMessages.some((m) => m.role === 'assistant' && m.content.includes(TOOL_CALL_OPEN))).toBe(true)
  })

  it('工具协议失败(未知工具) → 错误文本回填,对话继续', async () => {
    const llm = makeLlm([
      `${TOOL_CALL_OPEN}{"name":"no_such_tool"}${TOOL_CALL_CLOSE}`,
      '抱歉,数据暂时查不到',
    ])
    const client = makeMcpClient({
      callTool: jest.fn().mockRejectedValue(new McpClientError('未知工具', -32602)),
    })
    const agent = new McpAgentService({ llm, mcpClient: client })

    const result = await agent.chat('查一下舰队')
    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls[0].ok).toBe(false)
    expect(result.toolCalls[0].resultPreview).toContain('未知工具')

    // 回填的错误文本交给 LLM 自行解释
    const toolResultMsg = llm.calls[0].find(
      (m) => m.role === 'user' && m.content.includes(TOOL_RESULT_OPEN)
    )
    expect(toolResultMsg!.content).toContain('工具执行失败')
  })

  it('工具结果超长时截断,防止上下文爆炸', async () => {
    const llm = makeLlm([`${TOOL_CALL_OPEN}{"name":"query_fleet"}${TOOL_CALL_CLOSE}`, '结果太长,已概括'])
    const huge = 'x'.repeat(5000)
    const client = makeMcpClient({
      callTool: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: huge }] }),
    })
    const agent = new McpAgentService({ llm, mcpClient: client })

    const result = await agent.chat('查舰队')
    const toolResultMsg = llm.calls[0].find(
      (m) => m.role === 'user' && m.content.includes(TOOL_RESULT_OPEN)
    )
    expect(toolResultMsg!.content.length).toBeLessThan(5000)
    expect(toolResultMsg!.content).toContain('已截断')
    expect(result.toolCalls[0].resultPreview).toContain('已截断')
  })

  it('连续工具调用达上限后强制生成最终回答', async () => {
    const alwaysTool = `${TOOL_CALL_OPEN}{"name":"get_fleet_stats"}${TOOL_CALL_CLOSE}`
    const llm = makeLlm([alwaysTool, alwaysTool])
    const agent = new McpAgentService({ llm, mcpClient: makeMcpClient(), maxToolRounds: 2 })

    const result = await agent.chat('查舰队')
    expect(llm.chat).toHaveBeenCalledTimes(2) // 决策轮 2 次后耗尽
    expect(result.toolCalls).toHaveLength(2)
    expect(result.content).toBe('最终回答')
  })
})

describe('McpAgentService · chatStream 事件序列', () => {
  it('工具调用事件先于 token 事件', async () => {
    const llm = makeLlm([
      `${TOOL_CALL_OPEN}{"name":"query_fleet"}${TOOL_CALL_CLOSE}`,
      '根据查询,推荐 Gladius',
    ])
    const agent = new McpAgentService({ llm, mcpClient: makeMcpClient() })

    const events: Array<{ type: string; content?: string; toolCall?: unknown }> = []
    for await (const ev of agent.chatStream('推荐舰船')) {
      events.push(ev as { type: string; content?: string; toolCall?: unknown })
    }

    expect(events[0].type).toBe('tool_call')
    expect(events[0].toolCall).toMatchObject({ name: 'query_fleet', ok: true })
    const tokens = events.filter((e) => e.type === 'token')
    expect(tokens.map((t) => t.content).join('')).toBe('最终回答')
  })

  it('无工具时只有 token 事件', async () => {
    const agent = new McpAgentService({ llm: makeLlm([]), mcpClient: null })
    const events: Array<{ type: string; content?: string }> = []
    for await (const ev of agent.chatStream('你好')) {
      events.push(ev as { type: string; content?: string })
    }
    expect(events.every((e) => e.type === 'token')).toBe(true)
    expect(events.map((e) => e.content).join('')).toBe('最终回答')
  })
})
