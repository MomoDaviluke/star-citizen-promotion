/**
 * @file 核心成员视图测试
 * @description 覆盖组件渲染、数据加载
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    template: '<a class="mock-router-link"><slot /></a>',
    props: ['to']
  }
}))

import Members from '@/views/Members.vue'

describe('Members.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染页面容器', () => {
      const wrapper = mount(Members)
      expect(wrapper.find('.members-page').exists()).toBe(true)
    })

    it('应该渲染统计栏', () => {
      const wrapper = mount(Members)
      expect(wrapper.find('.stats-bar').exists()).toBe(true)
    })

    it('应该渲染成员网格', () => {
      const wrapper = mount(Members)
      expect(wrapper.find('.members-grid').exists()).toBe(true)
    })

    it('应该渲染页面标题', () => {
      const wrapper = mount(Members)
      expect(wrapper.html()).toContain('飞行员档案')
    })

    it('应该渲染统计信息', () => {
      const wrapper = mount(Members)
      expect(wrapper.html()).toContain('活跃成员')
      expect(wrapper.html()).toContain('核心成员')
    })
  })
})
