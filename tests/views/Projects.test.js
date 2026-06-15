/**
 * @file 活动项目视图测试
 * @description 覆盖组件渲染、项目卡片、状态标签
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

import Projects from '@/views/Projects.vue'

describe('Projects.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染页面容器', () => {
      const wrapper = mount(Projects)
      expect(wrapper.find('.projects-page').exists()).toBe(true)
    })

    it('应该渲染项目卡片', () => {
      const wrapper = mount(Projects)
      const cards = wrapper.findAll('.project-card')
      expect(cards.length).toBe(6)
    })

    it('应该渲染页面标题', () => {
      const wrapper = mount(Projects)
      expect(wrapper.html()).toContain('活动项目')
    })
  })

  describe('项目状态', () => {
    it('应该显示进行中状态', () => {
      const wrapper = mount(Projects)
      expect(wrapper.html()).toContain('进行中')
    })

    it('应该显示计划中状态', () => {
      const wrapper = mount(Projects)
      expect(wrapper.html()).toContain('计划中')
    })

    it('应该显示已完成状态', () => {
      const wrapper = mount(Projects)
      expect(wrapper.html()).toContain('已完成')
    })
  })

  describe('项目信息', () => {
    it('应该显示项目名称', () => {
      const wrapper = mount(Projects)
      expect(wrapper.html()).toContain('商船护航 Alpha')
      expect(wrapper.html()).toContain('Pyro 远征')
    })

    it('应该显示参与人数', () => {
      const wrapper = mount(Projects)
      expect(wrapper.html()).toContain('人参与')
    })
  })
})
