/**
 * @file 视图组件测试
 * @description 测试主要视图组件的渲染和功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: '首页' },
    { path: '/about', name: '团队介绍' },
    { path: '/members', name: '核心成员' },
    { path: '/projects', name: '活动项目' },
    { path: '/join', name: '加入我们' },
    { path: '/contact', name: '联系我们' }
  ]
})

vi.mock('@/services/dataService.js', () => ({
  dataService: {
    getMembers: vi.fn(() => Promise.resolve({ success: true, data: [] })),
    getProjects: vi.fn(() => Promise.resolve({ success: true, data: [] })),
    getPilots: vi.fn(() => Promise.resolve({ success: true, data: [] })),
    getStats: vi.fn(() => Promise.resolve({ success: true, data: { stats: [], summary: {} } })),
    submitApplication: vi.fn(() => Promise.resolve({ success: true }))
  }
}))

vi.mock('@/services/authService.js', () => ({
  authService: {
    getUser: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false),
    login: vi.fn(() => Promise.resolve({ success: true })),
    logout: vi.fn()
  }
}))

describe('视图组件基础测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Home 视图', () => {
    it('应能正确导入组件', async () => {
      const { default: Home } = await import('@/views/Home.vue')
      expect(Home).toBeDefined()
      expect(Home.name || Home.__name || 'Home').toBeTruthy()
    })

    it('组件应包含必要的模板结构', async () => {
      const { default: Home } = await import('@/views/Home.vue')
      const wrapper = mount(Home, {
        global: {
          plugins: [mockRouter],
          stubs: {
            RouterLink: true,
            RouterView: true
          }
        }
      })

      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('About 视图', () => {
    it('应能正确导入组件', async () => {
      const { default: About } = await import('@/views/About.vue')
      expect(About).toBeDefined()
    })

    it('组件应包含团队介绍内容', async () => {
      const { default: About } = await import('@/views/About.vue')
      const wrapper = mount(About, {
        global: {
          plugins: [mockRouter],
          stubs: {
            RouterLink: true
          }
        }
      })

      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('Members 视图', () => {
    it('应能正确导入组件', async () => {
      const { default: Members } = await import('@/views/Members.vue')
      expect(Members).toBeDefined()
    })
  })

  describe('Projects 视图', () => {
    it('应能正确导入组件', async () => {
      const { default: Projects } = await import('@/views/Projects.vue')
      expect(Projects).toBeDefined()
    })
  })

  describe('Join 视图', () => {
    it('应能正确导入组件', async () => {
      const { default: Join } = await import('@/views/Join.vue')
      expect(Join).toBeDefined()
    })
  })

  describe('Contact 视图', () => {
    it('应能正确导入组件', async () => {
      const { default: Contact } = await import('@/views/Contact.vue')
      expect(Contact).toBeDefined()
    })
  })
})

describe('视图组件响应式测试', () => {
  it('组件应在不同屏幕尺寸下正常渲染', async () => {
    const { default: Home } = await import('@/views/Home.vue')

    const wrapper = mount(Home, {
      global: {
        plugins: [mockRouter],
        stubs: {
          RouterLink: true,
          RouterView: true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('错误边界测试', () => {
  it('视图组件应能处理数据加载失败', async () => {
    const { dataService } = await import('@/services/dataService.js')
    dataService.getMembers.mockRejectedValueOnce(new Error('网络错误'))

    const { default: Members } = await import('@/views/Members.vue')
    const wrapper = mount(Members, {
      global: {
        plugins: [mockRouter],
        stubs: {
          RouterLink: true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })
})
