/**
 * @file 申请审核管理视图测试（M4-II 补测重写）
 * @description 覆盖状态筛选、关键词搜索、审核操作（通过/拒绝后本地列表与弹窗同步）、
 *              分页翻页、详情弹窗开关、TD-27 pagination 兜底、加载失败静默。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

const dataServiceMock = vi.hoisted(() => ({
  getApplications: vi.fn(),
  updateApplicationStatus: vi.fn()
}))

vi.mock('@/services', () => ({
  dataService: dataServiceMock
}))

vi.mock('@/utils/logger.js', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })
}))

import ApplicationsAdmin from '@/views/admin/ApplicationsAdmin.vue'

const appRow = (id, overrides = {}) => ({
  id,
  name: `申请人${id}`,
  email: `${id}@example.com`,
  status: 'pending',
  createdAt: '2026-08-30T10:00:00Z',
  ...overrides
})

const mockApplications = [
  appRow('a1', { name: 'Alice', email: 'alice@example.com', status: 'pending' }),
  appRow('a2', { name: 'Bob', email: 'bob@test.com', status: 'approved' }),
  appRow('a3', { name: 'Carol', email: 'carol@example.com', status: 'rejected' })
]

async function mountAdmin(loadResponse) {
  dataServiceMock.getApplications.mockResolvedValueOnce(
    loadResponse ?? { success: true, data: mockApplications, pagination: { total: 3, limit: 20, offset: 0, hasMore: false } }
  )
  const wrapper = mount(ApplicationsAdmin, {
    global: {
      stubs: {
        RouterLink: true,
        Teleport: { template: '<div><slot /></div>' }
      }
    }
  })
  await wrapper.vm.$nextTick()
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('ApplicationsAdmin 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('挂载时加载申请列表', async () => {
    await mountAdmin()
    expect(dataServiceMock.getApplications).toHaveBeenCalledWith({ limit: 20, offset: 0 })
  })

  it('渲染申请表格行', async () => {
    const wrapper = await mountAdmin()
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
    expect(wrapper.text()).toContain('Carol')
  })

  it('TD-27：响应缺 pagination 时不崩溃且保留本地默认值', async () => {
    const wrapper = await mountAdmin({ success: true, data: mockApplications }) // 无 pagination 字段
    expect(wrapper.vm.pagination).toEqual({ total: 0, limit: 20, offset: 0, hasMore: false })
  })

  it('加载失败静默处理不崩溃', async () => {
    dataServiceMock.getApplications.mockRejectedValueOnce(new Error('network'))
    const wrapper = await mountAdmin()
    expect(wrapper.vm.applications).toEqual([]) // 失败时列表保持空，不抛错
  })

  it('状态筛选：只显示匹配状态的申请', async () => {
    const wrapper = await mountAdmin()
    wrapper.vm.statusFilter = 'approved'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredApplications.map(a => a.id)).toEqual(['a2'])
  })

  it('搜索：按姓名或邮箱模糊匹配（大小写不敏感）', async () => {
    const wrapper = await mountAdmin()
    wrapper.vm.searchQuery = 'ALICE'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredApplications.map(a => a.id)).toEqual(['a1'])

    wrapper.vm.searchQuery = 'test.com'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredApplications.map(a => a.id)).toEqual(['a2'])
  })

  it('筛选与搜索叠加生效', async () => {
    const wrapper = await mountAdmin()
    wrapper.vm.statusFilter = 'pending'
    wrapper.vm.searchQuery = 'carol'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredApplications).toEqual([])
  })

  it('审核通过：调 API、更新本地行、同步打开中的弹窗', async () => {
    const wrapper = await mountAdmin()
    const updated = appRow('a1', { status: 'approved' })
    dataServiceMock.updateApplicationStatus.mockResolvedValueOnce({ success: true, data: updated })

    wrapper.vm.viewApplication(wrapper.vm.applications[0])
    expect(wrapper.vm.selectedApplication).toBeTruthy()

    await wrapper.vm.updateStatus('a1', 'approved')

    expect(dataServiceMock.updateApplicationStatus).toHaveBeenCalledWith('a1', 'approved')
    expect(wrapper.vm.applications.find(a => a.id === 'a1').status).toBe('approved')
    expect(wrapper.vm.selectedApplication.status).toBe('approved') // 弹窗同步
  })

  it('API 返回 success=false 时不更新本地状态', async () => {
    // 用独立的 a3 行，避免与前一用例已把 a1 改成 approved 的状态串扰
    const wrapper = await mountAdmin()
    dataServiceMock.updateApplicationStatus.mockResolvedValueOnce({ success: false })

    await wrapper.vm.updateStatus('a3', 'approved')
    expect(wrapper.vm.applications.find(a => a.id === 'a3').status).toBe('rejected') // 保持原状态
  })

  it('审核失败静默处理不崩溃', async () => {
    const wrapper = await mountAdmin()
    dataServiceMock.updateApplicationStatus.mockRejectedValueOnce(new Error('x'))
    await expect(wrapper.vm.updateStatus('a1', 'approved')).resolves.toBeUndefined()
  })

  it('详情弹窗开关', async () => {
    const wrapper = await mountAdmin()
    wrapper.vm.viewApplication(mockApplications[0])
    expect(wrapper.vm.selectedApplication).toEqual(mockApplications[0])
    wrapper.vm.closeModal()
    expect(wrapper.vm.selectedApplication).toBeNull()
  })

  it('分页：loadPage 以新 offset 重新加载', async () => {
    const wrapper = await mountAdmin()
    dataServiceMock.getApplications.mockClear()
    dataServiceMock.getApplications.mockResolvedValueOnce({ success: true, data: [], pagination: { total: 40, limit: 20, offset: 20, hasMore: false } })

    wrapper.vm.loadPage(20)
    await wrapper.vm.$nextTick()

    expect(dataServiceMock.getApplications).toHaveBeenCalledWith({ limit: 20, offset: 20 })
  })

  it('formatDate 空值返回空串', async () => {
    const wrapper = await mountAdmin()
    expect(wrapper.vm.formatDate('')).toBe('')
    expect(wrapper.vm.formatDate('2026-08-30T10:00:00Z')).toContain('2026')
  })

  it('truncate 截断长文本并加省略号', async () => {
    const wrapper = await mountAdmin()
    expect(wrapper.vm.truncate('', 5)).toBe('')
    expect(wrapper.vm.truncate('short', 10)).toBe('short')
    expect(wrapper.vm.truncate('a'.repeat(20), 10)).toBe('aaaaaaaaaa...')
  })
})
