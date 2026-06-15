import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    { path: '/register', name: 'register', component: { template: '<div>Register</div>' } }
  ]
})

vi.mock('@/services/authService.js', () => ({
  authService: {
    login: vi.fn(() => Promise.resolve({ success: true })),
    getProfile: vi.fn(() => Promise.resolve({ data: null })),
    isAuthenticated: vi.fn(() => false)
  }
}))

describe('Login 视图', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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
