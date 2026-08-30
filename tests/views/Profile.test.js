import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/profile', name: 'profile', component: { template: '<div>Profile</div>' } }
  ]
})

vi.mock('@/services/authService.js', () => ({
  authService: {
    updateProfile: vi.fn(() => Promise.resolve({ success: true }))
  }
}))

describe('Profile 视图', () => {
  beforeEach(() => {
    // Profile.vue 通过 Pinia auth store 读取用户信息，测试必须提供激活的 store
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应能正确导入组件', async () => {
    const { default: Profile } = await import('@/views/Profile.vue')
    expect(Profile).toBeDefined()
  })

  it('应正确渲染', async () => {
    const { default: Profile } = await import('@/views/Profile.vue')
    const wrapper = mount(Profile, {
      global: { plugins: [createPinia(), mockRouter], stubs: { RouterLink: true } }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
