/**
 * @file HudPanel 测试
 * @description 验证 HudPanel 组件渲染、默认插槽与斜切样式
 * @module components/cosmic/__tests__/HudPanel
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HudPanel from '../../../src/components/cosmic/HudPanel.vue'

describe('HudPanel', () => {
  it('renders with default slot', () => {
    const wrapper = mount(HudPanel, { slots: { default: 'SYSTEM ONLINE' } })
    expect(wrapper.find('.hud-panel').exists()).toBe(true)
    expect(wrapper.text()).toContain('SYSTEM ONLINE')
  })

  it('applies skewed style by default', () => {
    const wrapper = mount(HudPanel)
    expect(wrapper.find('.hud-panel--skewed').exists()).toBe(true)
  })

  it('renders all four corner decorations', () => {
    const wrapper = mount(HudPanel)
    expect(wrapper.findAll('.hud-corner').length).toBe(4)
  })
})
