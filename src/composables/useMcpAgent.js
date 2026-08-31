/**
 * @file MCP Agent composable
 * @description 调用 /api/v1/ai/agent/chat SSE 端点（Agent 工具调用循环），
 *              解析 token / tool_call / metadata / done / error 五类事件，
 *              维护含工具轨迹（role:'tool'）的消息流。
 *              与 useAiRecruiter 的区别：
 *              - 无服务端会话（Agent 端点无状态，history 由前端组装回传）
 *              - 消息模型多出 tool 角色（渲染工具调用气泡）
 * @module composables/useMcpAgent
 */

import { ref, reactive, onUnmounted } from 'vue'

/** 与 useAiRecruiter 一致的 API 基址策略（同源相对路径 + Vite 代理） */
const API_BASE = import.meta.env.VITE_AI_API_BASE || ''

/** 回传后端的 history 上限（与后端路由白名单裁剪一致） */
const HISTORY_LIMIT = 12

/**
 * @returns {{
 *   messages: import('vue').Ref<Array<{role: string, content: string, toolCall?: object}>>,
 *   isStreaming: import('vue').Ref<boolean>,
 *   error: import('vue').Ref<string|null>,
 *   toolCallCount: import('vue').Ref<number>,
 *   sendMessage: (text: string) => Promise<void>,
 *   reset: () => void,
 * }}
 */
export function useMcpAgent() {
  /** @type {import('vue').Ref<Array<{role: string, content: string, toolCall?: object}>>} */
  const messages = ref([])
  /** @type {import('vue').Ref<boolean>} */
  const isStreaming = ref(false)
  /** @type {import('vue').Ref<string|null>} */
  const error = ref(null)
  /** 最近一轮对话的工具调用总数（metadata 事件刷新） */
  /** @type {import('vue').Ref<number>} */
  const toolCallCount = ref(0)

  function reset() {
    messages.value = []
    isStreaming.value = false
    error.value = null
    toolCallCount.value = 0
  }

  /**
   * 发送消息并流式接收 Agent 回复
   * @param {string} text - 用户输入
   */
  async function sendMessage(text) {
    if (isStreaming.value) return

    error.value = null
    isStreaming.value = true
    messages.value.push({ role: 'user', content: text })

    // 组装回传 history：除刚 push 的 user 消息外，取最近 12 条 user/assistant 对话
    const history = messages.value
      .slice(0, -1)
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: m.content }))

    // 追加空 assistant 消息用于流式填充（工具轨迹气泡插入其前）
    const assistantMsg = reactive({ role: 'assistant', content: '' })
    messages.value.push(assistantMsg)

    try {
      const response = await fetch(`${API_BASE}/api/v1/ai/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
        credentials: 'include',
      })

      if (!response.ok || !response.body) {
        throw new Error(`agent chat failed: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let eventType = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim()
            continue
          }
          if (!line.startsWith('data: ')) continue

          let data
          try {
            data = JSON.parse(line.slice(6))
          } catch {
            continue // 忽略解析错误
          }

          if (eventType === 'token' && typeof data.content === 'string') {
            assistantMsg.content += data.content
          } else if (eventType === 'tool_call' && data && typeof data.name === 'string') {
            // 工具轨迹气泡插到 assistant 流式占位之前：user → tool → assistant(流式)
            const idx = messages.value.indexOf(assistantMsg)
            if (idx !== -1) messages.value.splice(idx, 1)
            messages.value.push({ role: 'tool', content: '', toolCall: data })
            messages.value.push(assistantMsg)
          } else if (eventType === 'metadata' && Array.isArray(data.toolCalls)) {
            toolCallCount.value = data.toolCalls.length
          } else if (eventType === 'error' && data && typeof data.error === 'string') {
            error.value = data.error
          }
          // done 事件无需处理：流自然结束
        }
      }
    } catch {
      error.value = '通讯中断,请重试'
    } finally {
      // 异常路径下移除未产生内容的空 assistant 消息
      if (assistantMsg.content === '' && !messages.value.some((m) => m.role === 'tool')) {
        const idx = messages.value.indexOf(assistantMsg)
        if (idx !== -1) messages.value.splice(idx, 1)
      }
      isStreaming.value = false
    }
  }

  onUnmounted(() => {
    reset()
  })

  return {
    messages,
    isStreaming,
    error,
    toolCallCount,
    sendMessage,
    reset,
  }
}
