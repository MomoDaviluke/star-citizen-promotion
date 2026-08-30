import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'home', component: { template: '<div>Home</div>' } }]
})

const { mockMembers } = vi.hoisted(() => ({
  mockMembers: [
    { id: 'm1', name: '张三', role: '舰长', intro: '指挥官', avatar: '', status: 'active', created_at: '2026-01-01T00:00:00Z' },
    { id: 'm2', name: '李四', role: '领航员', intro: '', avatar: '', status: 'inactive', created_at: '2026-02-01T00:00:00Z' }
  ]
}))

vi.mock('@/services/dataService.js', () => ({
  dataService: {
    getMembers: vi.fn(() => Promise.resolve({ success: true, data: mockMembers })),
    createMember: vi.fn(() => Promise.resolve({ success: true, data: { id: 'm-new', name: '新建' } })),
    updateMember: vi.fn(() => Promise.resolve({ success: true, data: { id: 'm1', name: '张三改' } })),
    deleteMember: vi.fn(() => Promise.resolve({ success: true }))
  }
}))

const stubs = { RouterLink: true, AdminLayout: { template: '<div><slot /></div>' } }

async function mountMembersAdmin() {
  const { default: MembersAdmin } = await import('@/views/admin/MembersAdmin.vue')
  return mount(MembersAdmin, { global: { plugins: [mockRouter], stubs } })
}

describe('MembersAdmin 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应能正确导入组件', async () => {
    const { default: MembersAdmin } = await import('@/views/admin/MembersAdmin.vue')
    expect(MembersAdmin).toBeDefined()
  })

  it('应正确渲染', async () => {
    const wrapper = await mountMembersAdmin()
    expect(wrapper.exists()).toBe(true)
  })

  it('应加载并渲染成员列表', async () => {
    const wrapper = await mountMembersAdmin()
    await vi.waitFor(() => expect(wrapper.text()).toContain('张三'))
    expect(wrapper.text()).toContain('舰长')
  })

  it('点击「编辑」应打开弹窗并回填成员字段', async () => {
    const wrapper = await mountMembersAdmin()
    await vi.waitFor(() => expect(wrapper.text()).toContain('张三'))

    const editButtons = wrapper.findAll('button').filter(b => b.text() === '编辑')
    expect(editButtons.length).toBeGreaterThan(0)
    await editButtons[0].trigger('click')

    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-header h3').text()).toContain('编辑成员')
    const nameInput = wrapper.find('input[name="name"]')
    expect(nameInput.element.value).toBe('张三')
    expect(wrapper.find('input[name="role"]').element.value).toBe('舰长')
  })

  it('提交编辑表单应调用 updateMember 并携带正确参数', async () => {
    const wrapper = await mountMembersAdmin()
    await vi.waitFor(() => expect(wrapper.text()).toContain('张三'))

    await wrapper.findAll('button').filter(b => b.text() === '编辑')[0].trigger('click')
    const nameInput = wrapper.find('input[name="name"]')
    await nameInput.setValue('张三改')
    await wrapper.find('form').trigger('submit')

    const { dataService } = await import('@/services/dataService.js')
    expect(dataService.updateMember).toHaveBeenCalledWith('m1', expect.objectContaining({ name: '张三改', role: '舰长' }))
  })

  it('点击「添加成员」应打开空表单弹窗', async () => {
    const wrapper = await mountMembersAdmin()
    await vi.waitFor(() => expect(wrapper.text()).toContain('张三'))

    await wrapper.find('.toolbar .btn-primary').trigger('click')

    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-header h3').text()).toContain('添加成员')
    expect(wrapper.find('input[name="name"]').element.value).toBe('')
    expect(wrapper.find('select[name="status"]').element.value).toBe('active')
  })

  it('提交新建表单应调用 createMember', async () => {
    const wrapper = await mountMembersAdmin()
    await vi.waitFor(() => expect(wrapper.text()).toContain('张三'))

    await wrapper.find('.toolbar .btn-primary').trigger('click')
    await wrapper.find('input[name="name"]').setValue('王五')
    await wrapper.find('input[name="role"]').setValue('工程师')
    await wrapper.find('form').trigger('submit')

    const { dataService } = await import('@/services/dataService.js')
    expect(dataService.createMember).toHaveBeenCalledWith(expect.objectContaining({ name: '王五', role: '工程师', status: 'active' }))
  })

  it('保存成功后应关闭弹窗并重新加载列表', async () => {
    const wrapper = await mountMembersAdmin()
    await vi.waitFor(() => expect(wrapper.text()).toContain('张三'))

    await wrapper.find('.toolbar .btn-primary').trigger('click')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => expect(wrapper.find('.modal-overlay').exists()).toBe(false))
    const { dataService } = await import('@/services/dataService.js')
    expect(dataService.getMembers).toHaveBeenCalledTimes(2)
  })

  it('保存失败应显示错误信息且弹窗不关闭', async () => {
    const { dataService } = await import('@/services/dataService.js')
    dataService.createMember.mockRejectedValueOnce(new Error('创建失败'))

    const wrapper = await mountMembersAdmin()
    await vi.waitFor(() => expect(wrapper.text()).toContain('张三'))

    await wrapper.find('.toolbar .btn-primary').trigger('click')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => expect(wrapper.find('.form-error').exists()).toBe(true))
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
  })
})
