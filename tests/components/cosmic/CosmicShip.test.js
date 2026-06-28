/**
 * @file CosmicShip 测试
 * @description 验证 CosmicShip 组件在 SVG 模式与图片素材模式下的渲染
 * @module components/cosmic/CosmicShip
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CosmicShip from '../../../src/components/cosmic/CosmicShip.vue'

describe('CosmicShip', () => {
  it('renders svg by default', () => {
    const wrapper = mount(CosmicShip)
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('.cosmic-ship__image').exists()).toBe(false)
  })

  it('renders registry text in svg mode', () => {
    const wrapper = mount(CosmicShip, { props: { registry: 'SNT-007' } })
    expect(wrapper.text()).toContain('SNT-007')
  })

  it('renders image when image prop is provided', () => {
    const wrapper = mount(CosmicShip, {
      props: {
        image: '/assets/cosmic/ships/gladius.jpg',
        alt: 'Aegis Gladius',
        registry: 'SNT-002'
      }
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/assets/cosmic/ships/gladius.jpg')
    expect(img.attributes('alt')).toBe('Aegis Gladius')
    expect(wrapper.find('.cosmic-ship--image').exists()).toBe(true)
  })

  it('renders engine glow in image mode', () => {
    const wrapper = mount(CosmicShip, {
      props: { image: '/assets/cosmic/ships/gladius.jpg' }
    })
    expect(wrapper.find('.cosmic-ship__engine-glow').exists()).toBe(true)
  })

  it('applies engine-position class', () => {
    const wrapper = mount(CosmicShip, {
      props: {
        image: '/assets/cosmic/ships/gladius.jpg',
        enginePosition: 'right'
      }
    })
    expect(wrapper.find('.cosmic-ship__engine-glow--right').exists()).toBe(true)
  })
})
