import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

import { authService } from '@/services'
import { useAuthStore } from '@/stores/auth'

// C2：模块替身一律用 vi.mock（hoisted）
vi.mock('@/services', () => ({
  authService: {
    logout: vi.fn()
  }
}))

const Blank = { template: '<div class="blank">blank</div>' }

const createTestRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: Blank },
      {
        path: '/admin',
        name: 'Admin',
        component: Blank,
        children: [
          { path: '', name: 'AdminDashboard', component: Blank },
          { path: 'members', name: 'AdminMembers', component: Blank },
          { path: 'monitor', name: 'AdminMonitor', component: Blank }
        ]
      },
      { path: '/:pathMatch(.*)*', name: 'NotFound', component: Blank }
    ]
  })

/**
 * 挂载 AdminLayout
 * @param {string} path - 初始路由路径
 * @param {object|null} user - 注入认证仓库的用户信息
 */
async function mountLayout(path = '/admin/members', user = { id: '1', username: 'nimi', role: 'admin' }) {
  const router = createTestRouter()
  const pinia = createPinia()
  setActivePinia(pinia)

  const authStore = useAuthStore()
  authStore.user = user

  await router.push(path)
  await router.isReady()

  const { default: AdminLayout } = await import('@/views/admin/AdminLayout.vue')
  const wrapper = mount(AdminLayout, {
    global: { plugins: [router, pinia] },
    attachTo: document.body
  })
  await nextTick()

  return { wrapper, router, authStore }
}

describe('AdminLayout 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    // 组件未在卸载时摘除 window 监听会污染后续用例，这里强制清理挂载点
    document.body.innerHTML = ''
  })

  it('应渲染全部 7 个导航菜单项', async () => {
    const { wrapper } = await mountLayout()

    const items = wrapper.findAll('.nav-item')
    expect(items).toHaveLength(7)
    expect(items[0].text()).toContain('数据概览')
    expect(items[6].text()).toContain('系统监控')
  })

  it('pageTitle 应根据当前路由命中菜单项标题', async () => {
    const { wrapper } = await mountLayout('/admin/members')

    expect(wrapper.find('.page-title').text()).toBe('成员管理')
  })

  it('pageTitle 在未命中菜单时回落到「管理后台」', async () => {
    // /admin/audit 不在 menuItems 内，命中兜底分支
    const { wrapper } = await mountLayout('/admin/audit')

    expect(wrapper.find('.page-title').text()).toBe('管理后台')
  })

  it('应展示当前用户名与角色标签', async () => {
    const { wrapper } = await mountLayout('/admin/members', { id: '1', username: 'nimi', role: 'admin' })

    expect(wrapper.find('.user-name').text()).toBe('nimi')
    expect(wrapper.find('.user-role').text()).toBeTruthy()
  })

  it('toggleSidebar 应切换侧边栏展开状态', async () => {
    const { wrapper } = await mountLayout()
    const sidebar = wrapper.find('.admin-sidebar')

    expect(sidebar.classes()).not.toContain('is-open')

    await wrapper.find('.sidebar-toggle').trigger('click')
    expect(sidebar.classes()).toContain('is-open')

    await wrapper.find('.sidebar-toggle').trigger('click')
    expect(sidebar.classes()).not.toContain('is-open')
  })

  it('侧边栏展开时应渲染移动端遮罩层，点击遮罩关闭侧边栏', async () => {
    const { wrapper } = await mountLayout()
    await wrapper.find('.sidebar-toggle').trigger('click')

    expect(wrapper.find('.sidebar-overlay').exists()).toBe(true)

    await wrapper.find('.sidebar-overlay').trigger('click')
    expect(wrapper.find('.admin-sidebar').classes()).not.toContain('is-open')
  })

  it('handleNavClick 命中导航项时关闭侧边栏', async () => {
    const { wrapper } = await mountLayout()
    await wrapper.find('.sidebar-toggle').trigger('click')
    expect(wrapper.find('.admin-sidebar').classes()).toContain('is-open')

    await wrapper.findAll('.nav-item')[1].trigger('click')

    expect(wrapper.find('.admin-sidebar').classes()).not.toContain('is-open')
  })

  it('handleNavClick 点击导航空白区不应关闭侧边栏', async () => {
    const { wrapper } = await mountLayout()
    await wrapper.find('.sidebar-toggle').trigger('click')

    await wrapper.find('.sidebar-nav').trigger('click')

    expect(wrapper.find('.admin-sidebar').classes()).toContain('is-open')
  })

  it('handleLogout 应清除登录态并跳转首页', async () => {
    const { wrapper, router } = await mountLayout()
    const pushSpy = vi.spyOn(router, 'push')

    await wrapper.find('.btn-outline').trigger('click')

    expect(authService.logout).toHaveBeenCalledTimes(1)
    expect(pushSpy).toHaveBeenCalledWith('/')
    pushSpy.mockRestore()
  })

  it('ESC 键应关闭已展开的侧边栏', async () => {
    const { wrapper } = await mountLayout()
    await wrapper.find('.sidebar-toggle').trigger('click')
    expect(wrapper.find('.admin-sidebar').classes()).toContain('is-open')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(wrapper.find('.admin-sidebar').classes()).not.toContain('is-open')
  })

  it('卸载时应摘除 window keydown 监听（防止监听器泄漏）', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { wrapper } = await mountLayout()
    await wrapper.find('.sidebar-toggle').trigger('click')

    wrapper.unmount()

    // 未摘除时旧闭包会持有已销毁组件的 sidebarOpen ref，面板反复进出会持续累积监听
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('路由切换时应关闭侧边栏（watch 保险机制）', async () => {
    const { wrapper, router } = await mountLayout('/admin/members')
    await wrapper.find('.sidebar-toggle').trigger('click')
    expect(wrapper.find('.admin-sidebar').classes()).toContain('is-open')

    await router.push('/admin/monitor')
    await nextTick()

    expect(wrapper.find('.admin-sidebar').classes()).not.toContain('is-open')
    expect(wrapper.find('.page-title').text()).toBe('系统监控')
  })
})
