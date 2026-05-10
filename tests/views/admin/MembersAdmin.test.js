import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'home' }]
})

vi.mock('@/services/dataService.js', () => ({
  dataService: {
    getMembers: vi.fn(() => Promise.resolve({ success: true, data: [] })),
    updateMember: vi.fn(() => Promise.resolve({ success: true, data: {} })),
    deleteMember: vi.fn(() => Promise.resolve({ success: true }))
  }
}))

describe('MembersAdmin 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应能正确导入组件', async () => {
    const { default: MembersAdmin } = await import('@/views/admin/MembersAdmin.vue')
    expect(MembersAdmin).toBeDefined()
  })

  it('应正确渲染', async () => {
    const { default: MembersAdmin } = await import('@/views/admin/MembersAdmin.vue')
    const wrapper = mount(MembersAdmin, {
      global: { plugins: [mockRouter], stubs: { RouterLink: true, AdminLayout: true } }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
