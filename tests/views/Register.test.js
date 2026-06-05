import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/register', name: 'register', component: { template: '<div>Register</div>' } }
  ]
})

vi.mock('@/services/authService.js', () => ({
  authService: {
    register: vi.fn(() => Promise.resolve({ success: true })),
    isAuthenticated: vi.fn(() => false)
  }
}))

describe('Register 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应能正确导入组件', async () => {
    const { default: Register } = await import('@/views/Register.vue')
    expect(Register).toBeDefined()
  })

  it('应包含注册表单', async () => {
    const { default: Register } = await import('@/views/Register.vue')
    const wrapper = mount(Register, {
      global: {
        plugins: [mockRouter],
        stubs: { RouterLink: true }
      }
    })
    expect(wrapper.find('form').exists()).toBe(true)
  })
})
