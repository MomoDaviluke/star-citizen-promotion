/**
 * @file useMcpAgent composable 测试
 * @description 覆盖 Agent SSE 事件解析（token/tool_call/metadata/error）、
 *              消息顺序（user → tool → assistant）、history 组装、错误分支、重置
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useMcpAgent } from '@/composables/useMcpAgent'

/** 宿主组件：让 composable 在真实 setup() 上下文运行（注册 onUnmounted） */
const Host = defineComponent({
  setup() {
    return { agent: useMcpAgent() }
  },
  template: '<div />',
})

/** 构造 SSE 流式响应体（与 useAiRecruiter.test 同款模式） */
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

const TOOL_CALL_EVENT =
  'event: tool_call\ndata: {"name":"query_fleet","arguments":{"category":"fighter"},"ok":true,"resultPreview":"{\\"total\\":3}"}\n\n'

describe('useMcpAgent', () => {
  let wrapper
  let api

  beforeEach(() => {
    wrapper = mount(Host)
    api = wrapper.vm.agent
  })

  afterEach(() => {
    wrapper.unmount()
    vi.unstubAllGlobals()
  })

  describe('sendMessage · 事件解析', () => {
    it('完整事件序列：tool_call 先于 token，消息顺序 user → tool → assistant', async () => {
      vi.stubGlobal('fetch', vi.fn(async () =>
        createSSEChunks([
          TOOL_CALL_EVENT,
          'event: token\ndata: {"content": "推荐"}\n\n',
          'event: token\ndata: {"content": " Gladius"}\n\n',
          'event: metadata\ndata: {"toolCalls":[{"name":"query_fleet"}]}\n\n',
          'event: done\ndata: {"ok":true}\n\n',
        ])
      ))

      await api.sendMessage('推荐一艘战斗机')

      expect(api.messages.value).toHaveLength(3)
      expect(api.messages.value[0]).toMatchObject({ role: 'user', content: '推荐一艘战斗机' })
      expect(api.messages.value[1]).toMatchObject({ role: 'tool' })
      expect(api.messages.value[1].toolCall).toMatchObject({
        name: 'query_fleet',
        ok: true,
        resultPreview: '{"total":3}',
      })
      expect(api.messages.value[2]).toMatchObject({ role: 'assistant', content: '推荐 Gladius' })
      expect(api.toolCallCount.value).toBe(1)
      expect(api.isStreaming.value).toBe(false)
      expect(api.error.value).toBeNull()
    })

    it('纯 token 流（无工具调用）：仅 user + assistant 两条消息', async () => {
      vi.stubGlobal('fetch', vi.fn(async () =>
        createSSEChunks([
          'event: token\ndata: {"content": "你们公会"}\n\n',
          'event: token\ndata: {"content": "很棒"}\n\n',
          'event: metadata\ndata: {"toolCalls":[]}\n\n',
          'event: done\ndata: {}\n\n',
        ])
      ))

      await api.sendMessage('公会怎么样')

      expect(api.messages.value).toHaveLength(2)
      expect(api.messages.value[1].content).toBe('你们公会很棒')
      expect(api.toolCallCount.value).toBe(0)
    })

    it('error 事件设置错误但不中断已接收内容', async () => {
      vi.stubGlobal('fetch', vi.fn(async () =>
        createSSEChunks([
          'event: token\ndata: {"content": "部分"}\n\n',
          'event: error\ndata: {"error": "AI 服务暂时不可用"}\n\n',
        ])
      ))

      await api.sendMessage('hi')

      expect(api.error.value).toBe('AI 服务暂时不可用')
      expect(api.messages.value[1].content).toBe('部分')
    })

    it('忽略非法 JSON 行与未知事件类型', async () => {
      vi.stubGlobal('fetch', vi.fn(async () =>
        createSSEChunks([
          'event: token\ndata: {broken json}\n\n',
          'event: unknown-event\ndata: {"content": "不应处理"}\n\n',
          'event: token\ndata: {"content": "ok"}\n\n',
        ])
      ))

      await api.sendMessage('hi')

      expect(api.messages.value[1].content).toBe('ok')
      expect(api.error.value).toBeNull()
    })

    it('tool_call 缺 name 字段时忽略，不插入轨迹消息', async () => {
      vi.stubGlobal('fetch', vi.fn(async () =>
        createSSEChunks([
          'event: tool_call\ndata: {"arguments":{}}\n\n',
          'event: token\ndata: {"content": "答案"}\n\n',
        ])
      ))

      await api.sendMessage('hi')

      expect(api.messages.value).toHaveLength(2)
      expect(api.messages.value.some((m) => m.role === 'tool')).toBe(false)
    })
  })

  describe('sendMessage · 请求与防护', () => {
    it('请求体携带 message 与最近 12 条 history', async () => {
      // 预置 15 轮历史（通过多次 sendMessage 太重，直接操作 messages）
      for (let i = 0; i < 15; i++) {
        api.messages.value.push(
          { role: 'user', content: `q-${i}` },
          { role: 'assistant', content: `a-${i}` }
        )
      }
      const fetchMock = vi.fn(async () => createSSEChunks(['event: done\ndata: {}\n\n']))
      vi.stubGlobal('fetch', fetchMock)

      await api.sendMessage('新问题')

      const body = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(body.message).toBe('新问题')
      expect(body.history).toHaveLength(12) // 30 条裁到 12
      expect(body.history[0]).toEqual({ role: 'user', content: 'q-9' }) // 保留最近（位置 18 = q-9）
    })

    it('history 过滤 tool 角色消息，不回传给后端', async () => {
      api.messages.value.push(
        { role: 'user', content: 'q1' },
        { role: 'tool', content: '', toolCall: { name: 'x' } },
        { role: 'assistant', content: 'a1' }
      )
      const fetchMock = vi.fn(async () => createSSEChunks(['event: done\ndata: {}\n\n']))
      vi.stubGlobal('fetch', fetchMock)

      await api.sendMessage('q2')

      const body = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(body.history).toEqual([
        { role: 'user', content: 'q1' },
        { role: 'assistant', content: 'a1' },
      ])
    })

    it('流式进行中再次发送被忽略', async () => {
      api.isStreaming.value = true
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)

      await api.sendMessage('hello')

      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('HTTP 非 2xx 时按通讯中断处理并移除空 assistant 消息', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, body: null })))

      await api.sendMessage('hello')

      expect(api.error.value).toBe('通讯中断,请重试')
      expect(api.messages.value).toHaveLength(1) // 仅 user 消息
      expect(api.isStreaming.value).toBe(false)
    })

    it('fetch 抛错时按通讯中断处理', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

      await api.sendMessage('hello')

      expect(api.error.value).toBe('通讯中断,请重试')
    })

    it('异常时已有工具轨迹则保留空 assistant 消息不误删', async () => {
      vi.stubGlobal('fetch', vi.fn(async () =>
        createSSEChunks([TOOL_CALL_EVENT, 'event: error\ndata: {"error":"x"}\n\n'])
      ))

      await api.sendMessage('hi')

      // user + tool + assistant(空) —— 有轨迹时不移除 assistant 占位
      expect(api.messages.value).toHaveLength(3)
      expect(api.messages.value[1].role).toBe('tool')
    })
  })

  describe('reset 与生命周期', () => {
    it('reset 清空全部状态', () => {
      api.messages.value = [{ role: 'user', content: 'hi' }]
      api.isStreaming.value = true
      api.error.value = 'x'
      api.toolCallCount.value = 2

      api.reset()

      expect(api.messages.value).toEqual([])
      expect(api.isStreaming.value).toBe(false)
      expect(api.error.value).toBeNull()
      expect(api.toolCallCount.value).toBe(0)
    })

    it('组件卸载时自动 reset', () => {
      api.messages.value = [{ role: 'user', content: 'hi' }]

      wrapper.unmount()

      expect(api.messages.value).toEqual([])
    })
  })
})
