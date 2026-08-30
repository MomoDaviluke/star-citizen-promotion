/**
 * @file AI 招募官 composable
 * @description SSE 连接 + 状态管理 + 画像同步
 */

import { ref, reactive, onUnmounted } from 'vue'

/**
 * AI 招募接口基础地址
 * @description 默认留空，使用同源相对路径 `/api/v1/...`，由 Vite 代理（开发）
 *              或 nginx 反代（生产）转发到后端。避免直连后端端口造成跨域，
 *              同时保证请求能携带 httpOnly 认证 Cookie。
 *              若 AI 服务独立部署，可通过 VITE_AI_API_BASE 指定完整地址。
 */
const API_BASE = import.meta.env.VITE_AI_API_BASE || ''

export function useAiRecruiter() {
  /** @type {import('vue').Ref<string|null>} */
  const sessionId = ref(null)
  /** @type {import('vue').Ref<Array<{role: string, content: string}>>} */
  const messages = ref([])
  const profile = reactive({
    playStyle: [],
    timeCommit: '',
    shipPref: [],
    skillLevel: '',
  })
  const turnCount = ref(0)
  /** @type {import('vue').Ref<string[]>} */
  const suggestions = ref([])
  const isStreaming = ref(false)
  /** @type {import('vue').Ref<string|null>} */
  const error = ref(null)

  let eventSource = null

  async function initSession() {
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai/recruiter/session`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      sessionId.value = data.sessionId
      messages.value.push({ role: 'assistant', content: data.welcome })
      await loadSuggestions()
    } catch (err) {
      error.value = '连接失败,请稍后重试'
    }
  }

  async function sendMessage(text) {
    if (!sessionId.value || isStreaming.value) return

    error.value = null
    isStreaming.value = true
    messages.value.push({ role: 'user', content: text })

    // 追加空的 assistant 消息用于流式填充
    const assistantMsg = reactive({ role: 'assistant', content: '' })
    messages.value.push(assistantMsg)

    try {
      const response = await fetch(`${API_BASE}/api/v1/ai/recruiter/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.value, message: text }),
        credentials: 'include',
      })

      // 非 2xx 或无流式响应体时按通讯中断处理
      if (!response.ok || !response.body) {
        throw new Error(`chat failed: ${response.status}`)
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
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            try {
              const data = JSON.parse(dataStr)
              if (data.content !== undefined && eventType !== 'metadata' && eventType !== 'done') {
                assistantMsg.content += data.content
              } else if (data.profile) {
                Object.assign(profile, data.profile)
                turnCount.value = data.turnCount || 0
                await loadSuggestions()
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (err) {
      error.value = '通讯中断,请重试'
      // 移除空的 assistant 消息
      if (assistantMsg.content === '') {
        messages.value = messages.value.slice(0, -1)
      }
    } finally {
      isStreaming.value = false
    }
  }

  async function loadSuggestions() {
    if (!sessionId.value) return
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai/recruiter/suggest?sessionId=${sessionId.value}`, {
        credentials: 'include',
      })
      const data = await res.json()
      suggestions.value = data.suggestions || []
    } catch {
      // 静默失败
    }
  }

  function reset() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    sessionId.value = null
    messages.value = []
    profile.playStyle = []
    profile.timeCommit = ''
    profile.shipPref = []
    profile.skillLevel = ''
    turnCount.value = 0
    suggestions.value = []
    isStreaming.value = false
    error.value = null
  }

  onUnmounted(() => {
    reset()
  })

  return {
    sessionId,
    messages,
    profile,
    turnCount,
    suggestions,
    isStreaming,
    error,
    initSession,
    sendMessage,
    reset,
  }
}
