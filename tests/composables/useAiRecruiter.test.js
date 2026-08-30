/**
 * @file useAiRecruiter composable 测试
 * @description 覆盖 SSE 会话初始化、流式消息解析、画像同步、错误处理、重置
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useAiRecruiter } from '@/composables/useAiRecruiter'

/** 宿主组件：让 composable 在真实 setup() 上下文运行（注册 onUnmounted 生命周期钩子） */
const Host = defineComponent({
  setup() {
    return { recruiter: useAiRecruiter() }
  },
  template: '<div />',
})

/**
 * 构造 SSE 流式响应体
 * @param {string[]} chunks - 原始 SSE 文本分块
 * @returns {{ok: true, status: 200, body: {getReader(): {read(): Promise<{done, value?}>}}}}
 */
function createSSEChunks(chunks) {
  const encoder = new TextEncoder()
  let i = 0
  return {
    ok: true,
    status: 200,
    body: {
      getReader() {
        return {
          read() {
            if (i >= chunks.length) {
              return Promise.resolve({ done: true, value: undefined })
            }
            return Promise.resolve({ done: false, value: encoder.encode(chunks[i++]) })
          },
        }
      },
    },
  }
}

describe('useAiRecruiter', () => {
  let wrapper
  let api

  beforeEach(() => {
    wrapper = mount(Host)
    api = wrapper.vm.recruiter
  })

  afterEach(() => {
    wrapper.unmount()
    vi.unstubAllGlobals()
  })

  describe('initSession', () => {
    it('成功后设置 sessionId、写入欢迎语并加载快捷建议', async () => {
      vi.stubGlobal('fetch', vi.fn(async (url) => {
        if (String(url).includes('/suggest')) {
          return { ok: true, json: async () => ({ suggestions: ['玩法偏好', '提交申请'] }) }
        }
        return { ok: true, json: async () => ({ sessionId: 'sess-1', welcome: '欢迎加入' }) }
      }))

      await api.initSession()

      expect(api.sessionId.value).toBe('sess-1')
      expect(api.messages.value).toHaveLength(1)
      expect(api.messages.value[0]).toMatchObject({ role: 'assistant', content: '欢迎加入' })
      expect(api.suggestions.value).toEqual(['玩法偏好', '提交申请'])
    })

    it('网络失败时设置连接错误', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

      await api.initSession()

      expect(api.sessionId.value).toBeNull()
      expect(api.error.value).toBe('连接失败,请稍后重试')
    })
  })

  describe('sendMessage', () => {
    beforeEach(async () => {
      vi.stubGlobal('fetch', vi.fn(async (url) => {
        if (String(url).includes('/session')) {
          return { ok: true, json: async () => ({ sessionId: 'sess-1', welcome: '欢迎加入' }) }
        }
        if (String(url).includes('/suggest')) {
          return { ok: true, json: async () => ({ suggestions: ['时机成熟'] }) }
        }
        if (String(url).includes('/chat')) {
          return createSSEChunks([
            'event: content\ndata: {"content": "你"}\n\n',
            'event: content\ndata: {"content": "好"}\n\n',
            'event: metadata\ndata: {"content": "这条不应拼接"}\n\n',
            'event: profile\ndata: {"profile": {"playStyle": ["pvp"], "timeCommit": "每晚"}, "turnCount": 2}\n\n',
            'event: done\ndata: {}\n\n',
          ])
        }
        throw new Error(`unexpected url: ${url}`)
      }))

      await api.initSession()
      vi.clearAllMocks()
    })

    it('正常流式：追加用户消息并累计 assistant 内容', async () => {
      await api.sendMessage('我偏好 PVP')

      // initSession 的欢迎语 + 用户消息 + assistant 流式消息
      expect(api.messages.value).toHaveLength(3)
      expect(api.messages.value[1]).toMatchObject({ role: 'user', content: '我偏好 PVP' })
      expect(api.messages.value[2].content).toBe('你好')
      expect(api.isStreaming.value).toBe(false)
    })

    it('收到 profile 事件时同步画像与轮次', async () => {
      await api.sendMessage('我偏好 PVP')

      expect(api.profile.playStyle).toEqual(['pvp'])
      expect(api.profile.timeCommit).toBe('每晚')
      expect(api.turnCount.value).toBe(2)
    })

    it('无 sessionId 时直接返回，不发请求', async () => {
      api.reset()

      await api.sendMessage('hello')

      expect(vi.mocked(fetch)).not.toHaveBeenCalled()
    })

    it('流式进行中再次发送被忽略', async () => {
      api.isStreaming.value = true

      await api.sendMessage('hello')

      expect(vi.mocked(fetch)).not.toHaveBeenCalled()
    })

    it('HTTP 非 2xx 时按通讯中断处理并移除空消息', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500, body: null })

      await api.sendMessage('hello')

      expect(api.error.value).toBe('通讯中断,请重试')
      // 初始欢迎语 + 用户消息（空 assistant 已移除）
      expect(api.messages.value).toHaveLength(2)
      expect(api.isStreaming.value).toBe(false)
    })

    it('流读取异常时按通讯中断处理', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('stream broken'))

      await api.sendMessage('hello')

      expect(api.error.value).toBe('通讯中断,请重试')
      expect(api.messages.value).toHaveLength(2)
    })

    it('忽略非法 JSON 行，不抛错', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(createSSEChunks([
        'event: content\ndata: {invalid json}\n\n',
        'event: content\ndata: {"content": "ok"}\n\n',
      ]))

      await api.sendMessage('hello')

      expect(api.messages.value[2].content).toBe('ok')
    })
  })

  describe('loadSuggestions（经 initSession 间接验证）', () => {
    it('建议加载失败时静默，不影响会话初始化', async () => {
      vi.stubGlobal('fetch', vi.fn(async (url) => {
        if (String(url).includes('/session')) {
          return { ok: true, json: async () => ({ sessionId: 'sess-1', welcome: 'w' }) }
        }
        throw new Error('suggest down')
      }))

      await api.initSession()

      expect(api.sessionId.value).toBe('sess-1')
      expect(api.suggestions.value).toEqual([])
      expect(api.error.value).toBeNull()
    })
  })

  describe('reset', () => {
    it('清空全部会话状态', () => {
      api.sessionId.value = 'sess-1'
      api.messages.value = [{ role: 'user', content: 'hi' }]
      api.profile.playStyle = ['pvp']
      api.profile.timeCommit = '每晚'
      api.turnCount.value = 3
      api.suggestions.value = ['a']
      api.isStreaming.value = true
      api.error.value = 'x'

      api.reset()

      expect(api.sessionId.value).toBeNull()
      expect(api.messages.value).toEqual([])
      expect(api.profile.playStyle).toEqual([])
      expect(api.profile.timeCommit).toBe('')
      expect(api.profile.shipPref).toEqual([])
      expect(api.profile.skillLevel).toBe('')
      expect(api.turnCount.value).toBe(0)
      expect(api.suggestions.value).toEqual([])
      expect(api.isStreaming.value).toBe(false)
      expect(api.error.value).toBeNull()
    })
  })

  describe('生命周期', () => {
    it('组件卸载时自动 reset 清理会话状态', () => {
      api.sessionId.value = 'sess-1'
      api.messages.value = [{ role: 'user', content: 'hi' }]

      wrapper.unmount()

      expect(api.sessionId.value).toBeNull()
      expect(api.messages.value).toEqual([])
    })
  })
})