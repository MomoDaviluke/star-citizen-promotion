import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TacticalGrid from '../../../src/components/cosmic/TacticalGrid.vue'

describe('TacticalGrid', () => {
  it('renders tactical grid container', () => {
    const wrapper = mount(TacticalGrid)
    expect(wrapper.find('.tactical-grid').exists()).toBe(true)
  })

  it('renders scan line', () => {
    const wrapper = mount(TacticalGrid)
    expect(wrapper.find('.tactical-grid__scan').exists()).toBe(true)
  })
})
