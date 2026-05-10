import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '@/components/common/BaseButton.vue'

describe('BaseButton 组件', () => {
  it('应能正确导入', () => {
    expect(BaseButton).toBeDefined()
  })

  it('应正确渲染按钮文本', () => {
    const wrapper = mount(BaseButton, {
      slots: { default: '点击' }
    })
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toBe('点击')
  })
})
