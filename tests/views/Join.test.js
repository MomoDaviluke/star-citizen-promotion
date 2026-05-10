import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home' },
    { path: '/join', name: 'join' }
  ]
})

vi.mock('@/services/dataService.js', () => ({
  dataService: {
    submitApplication: vi.fn(() => Promise.resolve({ success: true }))
  }
}))

describe('Join 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应能正确导入组件', async () => {
    const { default: Join } = await import('@/views/Join.vue')
    expect(Join).toBeDefined()
  })

  it('应包含申请表单', async () => {
    const { default: Join } = await import('@/views/Join.vue')
    const wrapper = mount(Join, {
      global: { plugins: [mockRouter], stubs: { RouterLink: true } }
    })
    expect(wrapper.find('form').exists()).toBe(true)
  })
})
