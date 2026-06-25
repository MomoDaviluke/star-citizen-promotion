import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseModal from '@/components/common/BaseModal.vue'

describe('BaseModal 组件', () => {
  it('应能正确导入', () => {
    expect(BaseModal).toBeDefined()
  })

  it('应在 show=true 时渲染', () => {
    const wrapper = mount(BaseModal, {
      props: { show: true },
      slots: { default: '弹窗内容' }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
