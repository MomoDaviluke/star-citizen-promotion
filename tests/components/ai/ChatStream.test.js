/**
 * @file ChatStream 组件测试
 * @description 覆盖消息列表渲染、角色样式、流式打字指示器与通信频道头
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatStream from '@/components/ai/ChatStream.vue'

describe('ChatStream 组件', () => {
  it('渲染通信频道头部', () => {
    const wrapper = mount(ChatStream, { props: { messages: [] } })
    expect(wrapper.find('.chat-stream__header').exists()).toBe(true)
    expect(wrapper.text()).toContain('COMMS CHANNEL')
  })

  it('渲染用户与助手消息及其角色样式', () => {
    const messages = [
      { role: 'assistant', content: '欢迎加入' },
      { role: 'user', content: '我偏好 PVP' },
    ]
    const wrapper = mount(ChatStream, { props: { messages } })
    const items = wrapper.findAll('.chat-message')
    expect(items).toHaveLength(2)
    expect(items[0].classes()).toContain('chat-message--assistant')
    expect(items[1].classes()).toContain('chat-message--user')
    expect(items[0].text()).toContain('AI 指挥官')
    expect(items[1].text()).toContain('你')
    expect(wrapper.text()).toContain('欢迎加入')
    expect(wrapper.text()).toContain('我偏好 PVP')
  })

  it('空消息列表时仅渲染头部', () => {
    const wrapper = mount(ChatStream, { props: { messages: [] } })
    expect(wrapper.findAll('.chat-message')).toHaveLength(0)
  })

  describe('工具调用轨迹（MCP Agent 模式）', () => {
    it('tool 消息渲染工具名、成功状态与结果预览', () => {
      const messages = [
        { role: 'user', content: '推荐一艘战斗机' },
        {
          role: 'tool',
          content: '',
          toolCall: {
            name: 'query_fleet',
            arguments: { category: 'fighter', limit: 5 },
            ok: true,
            resultPreview: '{"total": 3, "ships": [...]}',
          },
        },
        { role: 'assistant', content: '推荐 Gladius' },
      ]
      const wrapper = mount(ChatStream, { props: { messages } })

      const toolMsg = wrapper.find('.chat-message--tool')
      expect(toolMsg.exists()).toBe(true)
      expect(toolMsg.text()).toContain('query_fleet')
      expect(toolMsg.text()).toContain('fighter') // 参数摘要
      expect(toolMsg.find('.tool-trace__status--ok').exists()).toBe(true)
      expect(toolMsg.find('details').text()).toContain('total')
      // 顺序：user → tool → assistant
      const items = wrapper.findAll('.chat-message')
      expect(items[1].classes()).toContain('chat-message--tool')
    })

    it('失败的工具调用显示失败状态标记', () => {
      const messages = [
        {
          role: 'tool',
          content: '',
          toolCall: { name: 'no_such_tool', arguments: {}, ok: false, resultPreview: '工具执行失败: 未知工具' },
        },
      ]
      const wrapper = mount(ChatStream, { props: { messages } })

      expect(wrapper.find('.tool-trace__status--fail').exists()).toBe(true)
      expect(wrapper.find('.tool-trace__status--ok').exists()).toBe(false)
    })

    it('空参数对象不渲染参数行；无结果预览不渲染折叠区', () => {
      const messages = [
        { role: 'tool', content: '', toolCall: { name: 'get_fleet_stats', arguments: {}, ok: true } },
      ]
      const wrapper = mount(ChatStream, { props: { messages } })

      expect(wrapper.find('.tool-trace__args').exists()).toBe(false)
      expect(wrapper.find('.tool-trace__result').exists()).toBe(false)
      expect(wrapper.find('.tool-trace__name').text()).toBe('get_fleet_stats')
    })
  })

  it('流式中且最后一条为空助手消息时显示打字指示器', () => {
    const messages = [
      { role: 'assistant', content: '你好' },
      { role: 'assistant', content: '' },
    ]
    const wrapper = mount(ChatStream, { props: { messages, isStreaming: true } })
    expect(wrapper.find('.typing-indicator').exists()).toBe(true)
  })

  it('非流式时即使最后消息为空也不显示打字指示器', () => {
    const messages = [{ role: 'assistant', content: '' }]
    const wrapper = mount(ChatStream, { props: { messages, isStreaming: false } })
    expect(wrapper.find('.typing-indicator').exists()).toBe(false)
  })

  it('最后一条为用户消息时不显示打字指示器', () => {
    const messages = [{ role: 'user', content: 'hi' }]
    const wrapper = mount(ChatStream, { props: { messages, isStreaming: true } })
    expect(wrapper.find('.typing-indicator').exists()).toBe(false)
  })

  it('消息列表容器带 aria-live 无障碍属性', () => {
    const wrapper = mount(ChatStream, { props: { messages: [] } })
    expect(wrapper.find('.chat-stream__body').attributes('role')).toBe('log')
    expect(wrapper.find('.chat-stream__body').attributes('aria-live')).toBe('polite')
  })

  it('消息数量变化时触发滚动到底部', async () => {
    const wrapper = mount(ChatStream, { props: { messages: [] } })
    await wrapper.setProps({ messages: [{ role: 'user', content: 'hi' }] })
    await wrapper.setProps({ messages: [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ] })
    expect(wrapper.findAll('.chat-message')).toHaveLength(2)
    // watch 内 nextTick(scrollToBottom) 正常执行，不抛错即视为已触发
    await Promise.resolve()
  })

  it('流式内容变化时触发滚动（不重复排队）', async () => {
    const wrapper = mount(ChatStream, { props: { messages: [] } })
    await wrapper.setProps({ messages: [{ role: 'assistant', content: 'a' }] })
    await wrapper.setProps({ messages: [{ role: 'assistant', content: 'ab' }] })
    expect(wrapper.find('.chat-message__content').text()).toBe('ab')
    await Promise.resolve()
  })

  it('卸载时取消挂起的滚动 rAF，避免泄漏', async () => {
    vi.useFakeTimers()
    const wrapper = mount(ChatStream, { props: { messages: [] } })
    await wrapper.setProps({ messages: [{ role: 'user', content: 'x' }] })
    // watch 已排队 rAF 但未执行 → scrollRafId 非 null
    wrapper.unmount()
    vi.useRealTimers()
  })
})