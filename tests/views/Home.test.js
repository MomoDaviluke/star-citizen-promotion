/**
 * @file 首页视图测试
 * @description 覆盖组件渲染、英雄区域、舰队概览、王牌飞行员
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

    it('应该渲染 CTA 按钮', () => {
      const wrapper = mount(Home)
      const actions = wrapper.find('.hero__actions')
      expect(actions.exists()).toBe(true)
      expect(actions.html()).toContain('加入战队')
      expect(actions.html()).toContain('浏览舰队')
    })
  })

  describe('统计卡片', () => {
    it('应该渲染统计网格', () => {
      const wrapper = mount(Home)
      expect(wrapper.find('.stats-strip__grid').exists()).toBe(true)
    })

    it('应该渲染 4 个统计卡片', () => {
      const wrapper = mount(Home)
      const stats = wrapper.findAll('.stats-strip__item')
      expect(stats.length).toBe(4)
    })
  })

  describe('舰队概览', () => {
    it('应该渲染舰队区域', () => {
      const wrapper = mount(Home)
      expect(wrapper.find('.fleet-showcase').exists()).toBe(true)
    })

    it('应该渲染舰队卡片', () => {
      const wrapper = mount(Home)
      const cards = wrapper.findAll('.bento-card')
      expect(cards.length).toBe(2)
    })
  })

  describe('王牌飞行员', () => {
    it('应该渲染飞行员区域', () => {
      const wrapper = mount(Home)
      expect(wrapper.find('.pilot-section').exists()).toBe(true)
    })

    it('应该渲染飞行员肖像', () => {
      const wrapper = mount(Home)
      const portrait = wrapper.find('.pilot-portrait')
      expect(portrait.exists()).toBe(true)
    })

    it('应该显示飞行员详情', () => {
      const wrapper = mount(Home)
      expect(wrapper.find('.pilot-detail').exists()).toBe(true)
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
  })
})
