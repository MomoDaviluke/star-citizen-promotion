/**
 * @file 首页视图测试
 * @description 覆盖组件渲染、英雄区域、核心数据、舰队预览
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    template: '<a class="mock-router-link"><slot /></a>',
    props: ['to']
  },
  RouterView: {
    name: 'RouterView',
    template: '<div><slot /></div>'
  },
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    currentRoute: { value: { path: '/' } }
  })),
  useRoute: vi.fn(() => ({
    path: '/',
    params: {},
    query: {}
  }))
}))

import Home from '@/views/Home.vue'

describe('Home.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染页面容器', () => {
      const wrapper = mount(Home)
      expect(wrapper.find('.home').exists()).toBe(true)
    })

    it('应该渲染英雄区域', () => {
      const wrapper = mount(Home)
      expect(wrapper.find('.hero').exists()).toBe(true)
      expect(wrapper.find('.hero__title').exists()).toBe(true)
    })

    it('应该渲染标题包含 STELLAR NEXUS', () => {
      const wrapper = mount(Home)
      expect(wrapper.html()).toContain('STELLAR')
      expect(wrapper.html()).toContain('NEXUS')
    })

    it('应该渲染 tagline', () => {
      const wrapper = mount(Home)
      expect(wrapper.find('.hero__tagline').exists()).toBe(true)
      expect(wrapper.html()).toContain('EXPLORE')
    })
  })

  describe('核心数据', () => {
    it('应该渲染核心数据区域', () => {
      const wrapper = mount(Home)
      expect(wrapper.find('.key-numbers').exists()).toBe(true)
    })

    it('应该渲染 2 个数据项', () => {
      const wrapper = mount(Home)
      const numbers = wrapper.findAll('.key-number')
      expect(numbers.length).toBe(2)
    })

    it('应该显示活跃成员数', () => {
      const wrapper = mount(Home)
      expect(wrapper.html()).toContain('128')
      expect(wrapper.html()).toContain('ACTIVE PILOTS')
    })

    it('应该显示飞行小时数', () => {
      const wrapper = mount(Home)
      expect(wrapper.html()).toContain('2,400+')
      expect(wrapper.html()).toContain('FLIGHT HOURS')
    })
  })

  describe('舰队预览', () => {
    it('应该渲染舰队预览区域', () => {
      const wrapper = mount(Home)
      expect(wrapper.find('.fleet-preview').exists()).toBe(true)
    })

    it('应该渲染 3 张舰队卡片', () => {
      const wrapper = mount(Home)
      const cards = wrapper.findAll('.fleet-card')
      expect(cards.length).toBe(3)
    })

    it('应该渲染舰船名称', () => {
      const wrapper = mount(Home)
      expect(wrapper.html()).toContain('Aegis Hammerhead')
      expect(wrapper.html()).toContain('RSI Constellation')
      expect(wrapper.html()).toContain('Anvil Arrow')
    })

    it('应该包含查看全部舰队链接', () => {
      const wrapper = mount(Home)
      const link = wrapper.find('.link-arrow')
      expect(link.exists()).toBe(true)
      expect(link.html()).toContain('查看全部舰队')
    })
  })

  describe('CTA 区域', () => {
    it('应该渲染 CTA 区域', () => {
      const wrapper = mount(Home)
      expect(wrapper.find('.cta-section').exists()).toBe(true)
    })

    it('应该包含招募文案', () => {
      const wrapper = mount(Home)
      expect(wrapper.html()).toContain('READY TO JOIN')
    })

    it('应该包含申请按钮', () => {
      const wrapper = mount(Home)
      const actions = wrapper.find('.cta-actions')
      expect(actions.exists()).toBe(true)
      expect(actions.html()).toContain('START APPLICATION')
    })
  })
})
