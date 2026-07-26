/**
 * @file 核心成员视图测试
 * @description 覆盖组件渲染、数据加载
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    template: '<a class="mock-router-link"><slot /></a>',
    props: ['to']
  }
}))

// Mock dataService：Members.vue 在 onMounted 异步调用 getMembers 加载成员
// 不 mock 会走真实 HTTP（VITE_USE_API=true）在 jsdom 中失败，members 保持空数组
const mockGetMembers = vi.fn()
vi.mock('@/services/dataService', () => ({
  dataService: {
    getMembers: mockGetMembers
  }
}))

import Members from '@/views/Members.vue'

describe('Members.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // clearAllMocks 会清除返回值，每个测试前重设
    mockGetMembers.mockResolvedValue({
      success: true,
      data: [
        { name: 'Echo', role: '指挥官', callsign: 'PILOT-001' },
        { name: 'Nova', role: '后勤', callsign: 'PILOT-002' },
        { name: 'Raven', role: '训练官', callsign: 'PILOT-003' }
      ],
      pagination: { total: 3, limit: 50, offset: 0, hasMore: false }
    })
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

    it('应该渲染成员网格（onMounted 异步加载完成后）', async () => {
      const wrapper = mount(Members)
      // 等待 onMounted 中的 dataService.getMembers() 解析并更新 members ref
      await flushPromises()
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
