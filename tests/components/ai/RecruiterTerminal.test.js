/**
 * @file RecruiterTerminal 组件测试
 * @description 覆盖终端容器：开合、全屏、消息发送、快捷建议跳转、错误展示、会话初始化
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import RecruiterTerminal from '@/components/ai/RecruiterTerminal.vue'
import { useAiRecruiter } from '@/composables/useAiRecruiter'
import { trackEvent } from '@/services/analyticsService'
import { useRouter } from 'vue-router'

vi.mock('@/composables/useAiRecruiter', () => ({
  useAiRecruiter: vi.fn(),
}))

vi.mock('@/services/analyticsService', () => ({
  trackEvent: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

describe('RecruiterTerminal 组件', () => {
  let mockApi
  let pushMock

  beforeEach(() => {
    mockApi = {
      messages: ref([]),
      profile: reactive({ playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' }),
      suggestions: ref([]),
      isStreaming: ref(false),
      error: ref(null),
      initSession: vi.fn().mockResolvedValue(undefined),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn(),
    }
    vi.mocked(useAiRecruiter).mockReturnValue(mockApi)
    pushMock = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: pushMock })
    vi.clearAllMocks()
  })

  it('isOpen=false 时终端主体不渲染，但挂载仍初始化会话', async () => {
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: false } })
    await flushPromises()
    expect(wrapper.find('.recruiter-terminal').exists()).toBe(false)
    expect(mockApi.initSession).toHaveBeenCalledTimes(1)
  })

  it('isOpen=true 时渲染终端与状态文案', () => {
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: true } })
    expect(wrapper.find('.recruiter-terminal').exists()).toBe(true)
    expect(wrapper.text()).toContain('// AI 指挥官')
    expect(wrapper.text()).toContain('在线')
  })

  it('流式期间显示通讯中状态文案', () => {
    mockApi.isStreaming.value = true
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: true } })
    expect(wrapper.text()).toContain('通讯中...')
    expect(wrapper.find('.chat-input').attributes('disabled')).toBeDefined()
  })

  it('点击全屏按钮切换 fullscreen 状态', async () => {
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: true } })
    expect(wrapper.find('.recruiter-terminal').classes()).not.toContain('fullscreen')
    await wrapper.find('button[aria-label="全屏"]').trigger('click')
    expect(wrapper.find('.recruiter-terminal').classes()).toContain('fullscreen')
    await wrapper.find('button[aria-label="退出全屏"]').trigger('click')
    expect(wrapper.find('.recruiter-terminal').classes()).not.toContain('fullscreen')
  })

  it('点击关闭按钮触发 close 事件', async () => {
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: true } })
    await wrapper.find('button[aria-label="关闭终端"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('按下 Escape 键触发 close', () => {
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: true } })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  it('输入消息按回车发送并清空输入框、埋点轮次', async () => {
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: true } })
    const input = wrapper.find('.chat-input')
    await input.setValue('我想加入舰队')
    await input.trigger('keyup.enter')
    expect(mockApi.sendMessage).toHaveBeenCalledWith('我想加入舰队')
    expect(input.element.value).toBe('')
    expect(trackEvent).toHaveBeenCalledWith('recruiter_chat_turn', {
      messageLength: 6,
      totalMessages: 0,
    })
  })

  it('点击发送按钮发送消息', async () => {
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: true } })
    const input = wrapper.find('.chat-input')
    await input.setValue('你好')
    await wrapper.find('.send-btn').trigger('click')
    expect(mockApi.sendMessage).toHaveBeenCalledWith('你好')
  })

  it('空输入时不发送', async () => {
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: true } })
    await wrapper.find('.chat-input').trigger('keyup.enter')
    expect(mockApi.sendMessage).not.toHaveBeenCalled()
  })

  it('展示错误信息到错误条', async () => {
    mockApi.error.value = '通讯中断,请重试'
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: true } })
    expect(wrapper.find('.error-bar').exists()).toBe(true)
    expect(wrapper.find('.error-bar__text').text()).toBe('通讯中断,请重试')
  })

  it('点击「提交申请」建议：跳转申请页携带画像并埋点', async () => {
    mockApi.suggestions.value = ['提交申请', '介绍一下舰队']
    mockApi.profile.playStyle = ['pvp']
    mockApi.profile.timeCommit = '每晚'
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: true } })
    await flushPromises()

    await wrapper.findAll('.suggestion-bubble')[0].trigger('click')
    await flushPromises()

    expect(pushMock).toHaveBeenCalledTimes(1)
    const url = pushMock.mock.calls[0][0]
    expect(url.startsWith('/join?ai_profile=')).toBe(true)
    const decoded = JSON.parse(decodeURIComponent(url.replace('/join?ai_profile=', '')))
    expect(decoded.playStyle).toEqual(['pvp'])
    expect(decoded.timeCommit).toBe('每晚')
    expect(trackEvent).toHaveBeenCalledWith('recruiter_profile_prefill', { via: 'suggestion' })
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('点击普通建议发送为消息', async () => {
    mockApi.suggestions.value = ['介绍一下舰队']
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: true } })
    await flushPromises()
    await wrapper.find('.suggestion-bubble').trigger('click')
    expect(mockApi.sendMessage).toHaveBeenCalledWith('介绍一下舰队')
  })

  it('卸载时移除键盘监听', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: true } })
    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeSpy.mockRestore()
  })
})