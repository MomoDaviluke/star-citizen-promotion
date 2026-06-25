/**
 * @file 联系我们视图测试
 * @description 覆盖组件渲染、通讯频道展示、合作信息
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

import Contact from '@/views/Contact.vue'

describe('Contact.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染页面容器', () => {
      const wrapper = mount(Contact)
      expect(wrapper.find('.contact-page').exists()).toBe(true)
    })

    it('应该渲染通讯频道卡片', () => {
      const wrapper = mount(Contact)
      const channels = wrapper.findAll('.channel-card')
      expect(channels.length).toBe(3)
    })

    it('应该渲染联系信息面板', () => {
      const wrapper = mount(Contact)
      expect(wrapper.find('.contact-info-area').exists()).toBe(true)
    })
  })

  describe('通讯频道', () => {
    it('应该显示 Discord 频道', () => {
      const wrapper = mount(Contact)
      expect(wrapper.html()).toContain('Discord')
    })

    it('应该显示频道描述', () => {
      const wrapper = mount(Contact)
      const descs = wrapper.findAll('.channel-card__desc')
      expect(descs.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('合作信息', () => {
    it('应该显示响应时间', () => {
      const wrapper = mount(Contact)
      expect(wrapper.html()).toContain('RESPONSE TIME')
    })

    it('应该显示活跃时间', () => {
      const wrapper = mount(Contact)
      expect(wrapper.html()).toContain('ACTIVE HOURS')
    })
  })
})
