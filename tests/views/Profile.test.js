import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home' },
    { path: '/profile', name: 'profile' }
  ]
})

vi.mock('@/services/authService.js', () => ({
  authService: {
    getUser: vi.fn(() => ({ id: '1', username: 'test', email: 'test@test.com', role: 'member' })),
    isAuthenticated: vi.fn(() => true),
    updateProfile: vi.fn(() => Promise.resolve({ success: true }))
  }
}))

describe('Profile 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应能正确导入组件', async () => {
    const { default: Profile } = await import('@/views/Profile.vue')
    expect(Profile).toBeDefined()
  })

  it('应正确渲染', async () => {
    const { default: Profile } = await import('@/views/Profile.vue')
    const wrapper = mount(Profile, {
      global: { plugins: [mockRouter], stubs: { RouterLink: true } }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
