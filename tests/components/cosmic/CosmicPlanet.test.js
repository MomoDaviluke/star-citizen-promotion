/**
 * @file CosmicPlanet 测试
 * @description 验证 CosmicPlanet 组件渲染、props 与尺寸类
 * @module components/cosmic/__tests__/CosmicPlanet
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CosmicPlanet from '../../../src/components/cosmic/CosmicPlanet.vue'

describe('CosmicPlanet', () => {
  it('renders with default props', () => {
    const wrapper = mount(CosmicPlanet)
    expect(wrapper.find('.cosmic-planet').exists()).toBe(true)
    expect(wrapper.find('.cosmic-planet__body').exists()).toBe(true)
  })

  it('applies size class based on prop', () => {
    const wrapper = mount(CosmicPlanet, { props: { size: 'large' } })
    expect(wrapper.find('.cosmic-planet--large').exists()).toBe(true)
  })

  it('applies color variant', () => {
    const wrapper = mount(CosmicPlanet, { props: { variant: 'purple' } })
    expect(wrapper.find('.cosmic-planet--purple').exists()).toBe(true)
  })

  it('sets custom rotation duration via CSS variable', () => {
    const wrapper = mount(CosmicPlanet, { props: { rotationDuration: 60 } })
    const element = wrapper.find('.cosmic-planet')
    expect(element.attributes('style')).toContain('--rotation-duration: 60s')
  })
})
