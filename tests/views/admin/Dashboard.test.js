import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'home' }]
})

vi.mock('@/services/dataService.js', () => ({
  dataService: {
    getStats: vi.fn(() => Promise.resolve({ success: true, data: { stats: [] }, summary: {} })),
    getApplications: vi.fn(() => Promise.resolve({ success: true, data: [] })),
    getActivityLogs: vi.fn(() => Promise.resolve({ success: true, data: [] }))
  }
}))

vi.mock('@/services/authService.js', () => ({
  authService: {
    getUser: vi.fn(() => ({ id: '1', role: 'admin' })),
    isAuthenticated: vi.fn(() => true)
  }
}))

describe('Dashboard 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应能正确导入组件', async () => {
    const { default: Dashboard } = await import('@/views/admin/Dashboard.vue')
    expect(Dashboard).toBeDefined()
  })

  it('应正确渲染', async () => {
    const { default: Dashboard } = await import('@/views/admin/Dashboard.vue')
    const wrapper = mount(Dashboard, {
      global: { plugins: [mockRouter], stubs: { RouterLink: true, AdminLayout: true } }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
