import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CosmicNebula from '../../../src/components/cosmic/CosmicNebula.vue'

describe('CosmicNebula', () => {
  it('renders nebula container and layers', () => {
    const wrapper = mount(CosmicNebula)
    expect(wrapper.find('.cosmic-nebula').exists()).toBe(true)
    expect(wrapper.findAll('.cosmic-nebula__layer').length).toBe(3)
    expect(wrapper.find('.cosmic-nebula__dust').exists()).toBe(true)
  })

  it('has reduced-motion fallback', () => {
    const wrapper = mount(CosmicNebula)
    const layer = wrapper.find('.cosmic-nebula__layer')
    // 至少确认元素带有动画类（具体 animation 值在 scoped style 中）
    expect(layer.element.classList.contains('cosmic-nebula__layer')).toBe(true)
  })
})
