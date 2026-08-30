/**
 * @file HoloAvatar 组件测试
 * @description 覆盖全息头像待机/激活两种视觉状态与无障碍标签
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HoloAvatar from '@/components/ai/HoloAvatar.vue'

describe('HoloAvatar 组件', () => {
  it('默认渲染待机状态（空心图标 + 休眠标签）', () => {
    const wrapper = mount(HoloAvatar)
    const avatar = wrapper.find('.holo-avatar')
    expect(avatar.exists()).toBe(true)
    expect(avatar.classes()).not.toContain('active')
    expect(avatar.attributes('aria-label')).toContain('待机')
    expect(wrapper.text()).toContain('◇')
  })

  it('isActive 时渲染激活状态（实心图标 + 在线标签）', () => {
    const wrapper = mount(HoloAvatar, {
      props: { isActive: true },
    })
    const avatar = wrapper.find('.holo-avatar')
    expect(avatar.classes()).toContain('active')
    expect(avatar.attributes('aria-label')).toContain('在线')
    expect(wrapper.text()).toContain('◆')
  })

  it('渲染头像核心结构（环形 + 核心球体）', () => {
    const wrapper = mount(HoloAvatar)
    expect(wrapper.find('.avatar-ring').exists()).toBe(true)
    expect(wrapper.find('.avatar-core').exists()).toBe(true)
    expect(wrapper.find('.avatar-scanline').exists()).toBe(true)
    expect(wrapper.find('.avatar-grid').exists()).toBe(true)
  })

  it('isActive 为 false 时保持待机', () => {
    const wrapper = mount(HoloAvatar, { props: { isActive: false } })
    expect(wrapper.find('.holo-avatar').classes()).not.toContain('active')
  })
})