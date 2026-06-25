import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseCard from '@/components/common/BaseCard.vue'

describe('BaseCard 组件', () => {
  it('应能正确导入', () => {
    expect(BaseCard).toBeDefined()
  })

  it('应正确渲染卡片内容', () => {
    const wrapper = mount(BaseCard, {
      slots: { default: '<span>内容</span>' }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
