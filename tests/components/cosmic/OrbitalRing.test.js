import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OrbitalRing from '../../../src/components/cosmic/OrbitalRing.vue'

describe('OrbitalRing', () => {
  it('renders an svg', () => {
    const wrapper = mount(OrbitalRing)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders rings based on count prop', () => {
    const wrapper = mount(OrbitalRing, { props: { count: 2 } })
    expect(wrapper.findAll('.orbital-ring__ring').length).toBe(2)
  })
})
