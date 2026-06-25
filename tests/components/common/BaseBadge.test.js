import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseBadge from '@/components/common/BaseBadge.vue'

describe('BaseBadge 组件', () => {
  it('应能正确导入', () => {
    expect(BaseBadge).toBeDefined()
  })

  it('应正确渲染徽章文本', () => {
    const wrapper = mount(BaseBadge, {
      props: { variant: 'success' },
      slots: { default: '活跃' }
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toBe('活跃')
  })
})
