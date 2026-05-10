import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home' },
    { path: '/calendar', name: 'calendar' }
  ]
})

vi.mock('@/services/calendarService.js', () => ({
  calendarService: {
    getEvents: vi.fn(() => Promise.resolve({ success: true, data: [] }))
  }
}))

vi.mock('@/services/authService.js', () => ({
  authService: {
    isAuthenticated: vi.fn(() => false),
    getUser: vi.fn(() => null)
  }
}))

describe('Calendar 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('应能正确导入组件', async () => {
    const { default: Calendar } = await import('@/views/Calendar.vue')
    expect(Calendar).toBeDefined()
  })

  it('应正确渲染', async () => {
    const { default: Calendar } = await import('@/views/Calendar.vue')
    const wrapper = mount(Calendar, {
      global: { plugins: [mockRouter, createPinia()], stubs: { RouterLink: true } }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
