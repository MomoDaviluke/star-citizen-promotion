import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home' },
    { path: '/login', name: 'login' },
    { path: '/register', name: 'register' }
  ]
})

vi.mock('@/services/authService.js', () => ({
  authService: {
    login: vi.fn(() => Promise.resolve({ success: true })),
    isAuthenticated: vi.fn(() => false)
  }
}))

describe('Login 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应能正确导入组件', async () => {
    const { default: Login } = await import('@/views/Login.vue')
    expect(Login).toBeDefined()
  })

  it('应包含登录表单', async () => {
    const { default: Login } = await import('@/views/Login.vue')
    const wrapper = mount(Login, {
      global: {
        plugins: [mockRouter],
        stubs: { RouterLink: true }
      }
    })
    expect(wrapper.find('form').exists()).toBe(true)
  })
})
