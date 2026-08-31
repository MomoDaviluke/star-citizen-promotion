/**
 * @file MCP Agent 服务
 * @description ReAct 式 Agent 循环：LLM 决策是否调用工具 → 经 MCP Client 执行 →
 *              结果回填上下文 → 继续生成，直到产出最终回答。
 *              设计要点：
 *              1. 两阶段生成——决策轮用小 maxTokens 非流式快速判断，最终轮才流式输出，
 *                 兼顾成本与首 token 延迟
 *              2. 工具调用采用 <tool_call> 文本协议（Qwen/Hermes 风格），
 *                 不改动 Provider 层的纯文本 ChatMessage 接口，对既有测试零侵入
 *              3. MCP 不可用（client 为 null / 发现失败）时优雅降级为纯 LLM 链路
 *              4. 工具执行失败不中断对话，把 isError 结果回填给 LLM 自行解释
 * @module server/services/ai/mcpAgentService
 */

import type { ChatMessage } from './providers/types.js'
import type { LlmService } from './llmService.js'
import type { McpClient } from '../../mcp/mcpClient.js'
import type { McpToolDefinition } from '../../mcp/types.js'

/** 工具调用文本协议标记 */
export const TOOL_CALL_OPEN = '<tool_call>'
export const TOOL_CALL_CLOSE = '</tool_call>'
export const TOOL_RESULT_OPEN = '<tool_result>'
export const TOOL_RESULT_CLOSE = '</tool_result>'

/** 解析出的工具调用 */
export interface ParsedToolCall {
  name: string
  arguments: Record<string, unknown>
}

/** 工具调用轨迹（供前端展示与调试） */
export interface ToolCallTrace {
  name: string
  arguments: Record<string, unknown>
  /** 工具是否执行成功（isError=false 或协议成功） */
  ok: boolean
  /** 结果摘要（截断后） */
  resultPreview: string
}

export interface AgentChatResult {
  content: string
  toolCalls: ToolCallTrace[]
  /** 实际参与的轮次（决策+工具轮数） */
  rounds: number
  /** 本轮对话是否启用了 MCP 工具 */
  toolsEnabled: boolean
}

export interface AgentStreamEvent {
  type: 'token' | 'tool_call'
  /** type=token 时为文本片段；type=tool_call 时为工具轨迹 */
  content?: string
  toolCall?: ToolCallTrace
}

export interface McpAgentDeps {
  /** LLM 服务（仅用 chat 与 chatStream，接口收窄便于测试注入 stub） */
  llm: Pick<LlmService, 'chat' | 'chatStream'>
  /** MCP 客户端；null 表示本实例不启用工具（纯 LLM 链路） */
  mcpClient: McpClient | null
  /** 工具循环上限，默认 3，防止 LLM 无限连环调用 */
  maxToolRounds?: number
}

const DEFAULT_MAX_ROUNDS = 3
/** 决策轮小输出上限：只需容纳"调用哪个工具+参数"或"无需工具"的判断 */
const DECISION_MAX_TOKENS = 300
/** 回填给 LLM 的工具结果截断长度，防止上下文爆炸 */
const RESULT_PREVIEW_LIMIT = 2000

export class McpAgentService {
  private readonly maxToolRounds: number
  private toolsCache: McpToolDefinition[] | null = null
  /** MCP 发现失败后置 true，本轮进程生命周期内不再重试（fail-fast，避免每条消息都等超时） */
  private mcpDisabled = false

  constructor(private deps: McpAgentDeps) {
    this.maxToolRounds = deps.maxToolRounds ?? DEFAULT_MAX_ROUNDS
  }

  /**
   * 发现可用工具（带缓存）
   * MCP 不可用时返回 [] 并标记降级，不抛异常
   */
  async listAvailableTools(): Promise<McpToolDefinition[]> {
    if (!this.deps.mcpClient || this.mcpDisabled) return []
    if (this.toolsCache) return this.toolsCache

    try {
      this.toolsCache = await this.deps.mcpClient.listTools()
      return this.toolsCache
    } catch {
      // 发现失败 → 整体降级为纯 LLM，进程内不再重试
      this.mcpDisabled = true
      return []
    }
  }

  /** 构建 ReAct 系统提示词：注入工具清单与调用协议 */
  buildSystemPrompt(tools: McpToolDefinition[]): string {
    const base =
      '你是星际公民战队的 AI 招募官。用简洁、友好的中文回答玩家问题。' +
      '回答要基于事实，不确定的内容不要编造。'

    if (tools.length === 0) return base

    const toolDocs = tools
      .map((t) => `- ${t.name}: ${t.description} 参数: ${JSON.stringify(t.inputSchema)}`)
      .join('\n')

    return (
      `${base}\n\n` +
      `你可以使用以下工具获取战队实时数据:\n${toolDocs}\n\n` +
      `工具调用规则:\n` +
      `1. 需要查询实时数据时，输出 ${TOOL_CALL_OPEN}{"name":"工具名","arguments":{...}}${TOOL_CALL_CLOSE}，除此之外不要输出任何内容\n` +
      `2. 系统会以 ${TOOL_RESULT_OPEN}...${TOOL_RESULT_CLOSE} 格式回填工具结果，随后你基于结果回答\n` +
      `3. 不需要工具时直接回答，不要提及工具协议的存在\n` +
      `4. 每次最多发起一个工具调用`
    )
  }

  /**
   * 解析 LLM 输出中的工具调用
   * 匹配第一个 <tool_call>{...}</tool_call>；格式非法返回 null（按普通文本处理）
   */
  parseToolCall(text: string): ParsedToolCall | null {
    const match = text.match(new RegExp(`${TOOL_CALL_OPEN}\\s*([\\s\\S]*?)\\s*${TOOL_CALL_CLOSE}`))
    if (!match) return null

    try {
      const parsed = JSON.parse(match[1]) as { name?: unknown; arguments?: unknown }
      if (typeof parsed.name !== 'string' || parsed.name.trim() === '') return null

      let args: Record<string, unknown> = {}
      if (parsed.arguments !== undefined) {
        if (typeof parsed.arguments !== 'object' || parsed.arguments === null || Array.isArray(parsed.arguments)) {
          return null
        }
        args = parsed.arguments as Record<string, unknown>
      }
      return { name: parsed.name.trim(), arguments: args }
    } catch {
      return null
    }
  }

  /**
   * 非流式对话（完整 Agent 循环）
   * 适合无 SSE 场景与测试
   */
  async chat(userMessage: string, history: ChatMessage[] = []): Promise<AgentChatResult> {
    const tools = await this.listAvailableTools()
    const toolCalls: ToolCallTrace[] = []

    const messages: ChatMessage[] = [
      { role: 'system', content: this.buildSystemPrompt(tools) },
      ...history,
      { role: 'user', content: userMessage },
    ]

    // 无工具可用 → 跳过决策轮，直接走最终生成（省一次 LLM 调用）
    if (tools.length === 0) {
      const content = await this.streamCollect(messages)
      return { content, toolCalls, rounds: 1, toolsEnabled: false }
    }

    // 决策循环：小成本判断是否调用工具
    let rounds = 0
    for (let i = 0; i < this.maxToolRounds; i++) {
      rounds++
      const decision = await this.deps.llm.chat(messages, {
        maxTokens: DECISION_MAX_TOKENS,
        temperature: 0,
        routingHint: 'quality',
      })

      const parsed = this.parseToolCall(decision.content)

      // 无工具调用 → 决策轮给出的文本可能已是可用答案，但仍走最终流式生成保证完整性
      if (!parsed) {
        const content = await this.streamCollect(messages)
        return { content, toolCalls, rounds, toolsEnabled: true }
      }

      // 执行工具（协议失败也转成 isError 结果，不中断对话）
      const { trace, resultText } = await this.executeTool(parsed)
      toolCalls.push(trace)

      // 回填：assistant(工具调用) + user(工具结果)
      messages.push({ role: 'assistant', content: decision.content })
      messages.push({
        role: 'user',
        content: `${TOOL_RESULT_OPEN} name="${parsed.name}"\n${resultText}\n${TOOL_RESULT_CLOSE}`,
      })
    }

    // 轮次耗尽：不再允许工具调用，直接生成最终回答
    const content = await this.streamCollect(messages)
    return { content, toolCalls, rounds, toolsEnabled: true }
  }

  /**
   * 流式对话（SSE 场景）
   * 事件序列：若干 tool_call 事件（如发生）→ 若干 token 事件
   */
  async *chatStream(userMessage: string, history: ChatMessage[] = []): AsyncGenerator<AgentStreamEvent, void, unknown> {
    const tools = await this.listAvailableTools()
    const messages: ChatMessage[] = [
      { role: 'system', content: this.buildSystemPrompt(tools) },
      ...history,
      { role: 'user', content: userMessage },
    ]

    if (tools.length === 0) {
      yield* this.streamEmit(messages)
      return
    }

    for (let i = 0; i < this.maxToolRounds; i++) {
      const decision = await this.deps.llm.chat(messages, {
        maxTokens: DECISION_MAX_TOKENS,
        temperature: 0,
        routingHint: 'quality',
      })

      const parsed = this.parseToolCall(decision.content)
      if (!parsed) {
        yield* this.streamEmit(messages)
        return
      }

      const { trace, resultText } = await this.executeTool(parsed)
      yield { type: 'tool_call', toolCall: trace }

      messages.push({ role: 'assistant', content: decision.content })
      messages.push({
        role: 'user',
        content: `${TOOL_RESULT_OPEN} name="${parsed.name}"\n${resultText}\n${TOOL_RESULT_CLOSE}`,
      })
    }

    yield* this.streamEmit(messages)
  }

  /** 执行单个工具调用并构造轨迹（任何异常都收敛为 isError 文本） */
  private async executeTool(parsed: ParsedToolCall): Promise<{ trace: ToolCallTrace; resultText: string; ok: boolean }> {
    let ok = false
    let resultText: string

    try {
      const result = await this.deps.mcpClient!.callTool(parsed.name, parsed.arguments)
      resultText = result.content.map((c) => c.text).join('\n')
      ok = !result.isError
    } catch (err) {
      // 协议级错误（未知工具/传输失败）→ 转工具级错误文本回填
      resultText = `工具执行失败: ${err instanceof Error ? err.message : String(err)}`
    }

    const trace: ToolCallTrace = {
      name: parsed.name,
      arguments: parsed.arguments,
      ok,
      resultPreview: truncate(resultText, 500),
    }
    return { trace, resultText: truncate(resultText, RESULT_PREVIEW_LIMIT), ok }
  }

  /** 聚合完整流式输出为字符串（非流式路径复用最终生成的流式接口，保证两种模式输出一致） */
  private async streamCollect(messages: ChatMessage[]): Promise<string> {
    let full = ''
    for await (const token of this.deps.llm.chatStream(messages)) {
      full += token
    }
    return full
  }

  /** 把流式输出逐 token 转为 AgentStreamEvent */
  private async *streamEmit(messages: ChatMessage[]): AsyncGenerator<AgentStreamEvent, void, unknown> {
    for await (const token of this.deps.llm.chatStream(messages)) {
      yield { type: 'token', content: token }
    }
  }
}

/** 截断长文本，超限追加省略标记 */
function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}…(已截断,原长 ${text.length})`
}
