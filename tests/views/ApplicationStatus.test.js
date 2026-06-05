import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/application-status', name: 'applicationStatus', component: { template: '<div>ApplicationStatus</div>' } }
  ]
})

vi.mock('@/services/dataService.js', () => ({
  dataService: {
    getApplications: vi.fn(() => Promise.resolve({ success: true, data: [] }))
  }
}))

vi.mock('@/services/authService.js', () => ({
  authService: {
    getUser: vi.fn(() => ({ id: '1', email: 'test@test.com' })),
    isAuthenticated: vi.fn(() => false)
  }
}))

describe('ApplicationStatus 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应能正确导入组件', async () => {
    const { default: ApplicationStatus } = await import('@/views/ApplicationStatus.vue')
    expect(ApplicationStatus).toBeDefined()
  })

  it('应正确渲染', async () => {
    const { default: ApplicationStatus } = await import('@/views/ApplicationStatus.vue')
    const wrapper = mount(ApplicationStatus, {
      global: { plugins: [mockRouter], stubs: { RouterLink: true } }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
