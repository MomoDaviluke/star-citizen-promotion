import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseTooltip from '@/components/common/BaseTooltip.vue'

describe('BaseTooltip 组件', () => {
  it('应能正确导入', () => {
    expect(BaseTooltip).toBeDefined()
  })

  it('应正确渲染', () => {
    const wrapper = mount(BaseTooltip, {
      props: { text: '提示' },
      slots: { default: '悬停我' }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
