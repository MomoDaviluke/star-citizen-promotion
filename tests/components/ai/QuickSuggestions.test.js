/**
 * @file QuickSuggestions 组件测试
 * @description 覆盖建议气泡渲染、点击事件、禁用态与空列表隐藏
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuickSuggestions from '@/components/ai/QuickSuggestions.vue'

describe('QuickSuggestions 组件', () => {
  it('空列表时不渲染容器', () => {
    const wrapper = mount(QuickSuggestions, { props: { suggestions: [] } })
    expect(wrapper.find('.quick-suggestions').exists()).toBe(false)
  })

  it('渲染每个建议气泡', () => {
    const wrapper = mount(QuickSuggestions, {
      props: { suggestions: ['玩法偏好', '提交申请'] },
    })
    const bubbles = wrapper.findAll('.suggestion-bubble')
    expect(bubbles).toHaveLength(2)
    expect(bubbles[0].text()).toContain('玩法偏好')
    expect(bubbles[1].text()).toContain('提交申请')
  })

  it('点击气泡触发 select 事件并携带建议文本', async () => {
    const wrapper = mount(QuickSuggestions, {
      props: { suggestions: ['提交申请'] },
    })
    await wrapper.find('.suggestion-bubble').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual(['提交申请'])
  })

  it('提供发送建议的无障碍标签', () => {
    const wrapper = mount(QuickSuggestions, {
      props: { suggestions: ['提交申请'] },
    })
    expect(wrapper.find('.suggestion-bubble').attributes('aria-label')).toBe('发送建议问题：提交申请')
  })

  it('disabled 时气泡按钮禁用', () => {
    const wrapper = mount(QuickSuggestions, {
      props: { suggestions: ['a'], disabled: true },
    })
    expect(wrapper.find('.suggestion-bubble').attributes('disabled')).toBeDefined()
  })

  it('disabled 时点击不触发 select', async () => {
    const wrapper = mount(QuickSuggestions, {
      props: { suggestions: ['a'], disabled: true },
    })
    await wrapper.find('.suggestion-bubble').trigger('click')
    expect(wrapper.emitted('select')).toBeFalsy()
  })
})