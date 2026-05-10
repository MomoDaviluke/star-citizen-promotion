import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'home' }]
})

vi.mock('@/services/dataService.js', () => ({
  dataService: {
    getApplications: vi.fn(() => Promise.resolve({ success: true, data: [] })),
    updateApplicationStatus: vi.fn(() => Promise.resolve({ success: true }))
  }
}))

vi.mock('@/services/authService.js', () => ({
  authService: {
    getUser: vi.fn(() => ({ id: '1', role: 'admin' })),
    isAuthenticated: vi.fn(() => true)
  }
}))

describe('ApplicationsAdmin 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应能正确导入组件', async () => {
    const { default: ApplicationsAdmin } = await import('@/views/admin/ApplicationsAdmin.vue')
    expect(ApplicationsAdmin).toBeDefined()
  })

  it('应正确渲染', async () => {
    const { default: ApplicationsAdmin } = await import('@/views/admin/ApplicationsAdmin.vue')
    const wrapper = mount(ApplicationsAdmin, {
      global: { plugins: [mockRouter], stubs: { RouterLink: true, AdminLayout: true } }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
