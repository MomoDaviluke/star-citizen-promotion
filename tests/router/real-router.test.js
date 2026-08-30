/**
 * @file 真实路由器测试（M4-2 补测）
 * @description 既有 tests/router/index.test.js 用自建玩具路由表做结构断言，
 *              真实 src/router/index.js 的守卫/scrollBehavior/预加载从未被执行（ENG-07 盲区）。
 *              本文件 import 真路由器（mock 视图组件与 auth store），实测导航守卫全部分支：
 *              requiresAuth / requiresAdmin / guestOnly / initialized 幂等 / 标题设置 / 埋点 / 滚动行为。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ---- 视图组件 mock：真实路由表是懒加载 import，mock 掉避免拉整棵组件树 ----
vi.mock('../views/Home.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/About.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/Members.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/Projects.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/Fleet.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/ShipDetail.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/Calendar.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/Join.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/Contact.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/Login.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/Register.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/Profile.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/ApplicationStatus.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/NotFound.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/admin/AdminLayout.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/admin/Dashboard.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/admin/MembersAdmin.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/admin/ProjectsAdmin.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/admin/PilotsAdmin.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/admin/ApplicationsAdmin.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/admin/Settings.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../views/admin/Monitor.vue', () => ({ default: { template: '<div />' } }))

// ---- 埋点 mock（afterEach 消费）----
vi.mock('@/services/analyticsService.js', () => ({
  trackEvent: vi.fn()
}))

// ---- auth store mock：可编程的用户态，供守卫各分支切换 ----
let authState = { initialized: false, user: null }
const initializeAuth = vi.fn(async () => {
  authState.initialized = true
})
vi.mock('@/stores/auth.js', () => ({
  useAuthStore: () => ({
    get user() { return authState.user },
    get initialized() { return authState.initialized },
    get isAuthenticated() { return !!authState.user },
    get isAdmin() { return authState.user?.role === 'admin' },
    initializeAuth
  })
}))

import { trackEvent } from '@/services/analyticsService.js'
const router = (await import('@/router/index.js')).default

function login(user) {
  authState = { initialized: true, user }
}
function logout() {
  authState = { initialized: false, user: null }
}

describe('真实路由器守卫', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    logout()
    initializeAuth.mockClear()
    trackEvent.mockClear()
    document.title = ''
  })

  describe('路由表结构', () => {
    it('注册全部页面路由', () => {
      const names = router.getRoutes().map(r => r.name)
      for (const name of ['首页', '团队介绍', '核心成员', '活动项目', '舰队展示', '舰船详情', '活动日历', '加入我们', '联系我们', '登录', '注册', '个人中心', '申请状态', '404']) {
        expect(names).toContain(name)
      }
    })

    it('admin 子路由经 router.resolve 继承 requiresAuth/requiresAdmin（运行时合并 meta）', async () => {
      const resolved = router.resolve('/admin/members')
      expect(resolved.name).toBe('成员管理')
      expect(resolved.meta.requiresAuth).toBe(true)
      expect(resolved.meta.requiresAdmin).toBe(true)
      expect(resolved.meta.title).toBe('成员管理')
    })

    it('动态路由 /fleet/:slug 可解析', async () => {
      await router.push('/fleet/gladius')
      expect(router.currentRoute.value.name).toBe('舰船详情')
      expect(router.currentRoute.value.params.slug).toBe('gladius')
    })
  })

  describe('requiresAuth 守卫', () => {
    it('未登录访问 /profile 重定向登录页并携带 redirect 参数', async () => {
      await router.push('/profile')
      expect(router.currentRoute.value.path).toBe('/login')
      expect(router.currentRoute.value.query.redirect).toBe('/profile')
    })

    it('未登录访问 /admin 重定向登录页', async () => {
      await router.push('/admin')
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('已登录普通用户访问 /profile 放行', async () => {
      login({ id: 'u1', username: 'pilot', role: 'user' })
      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('个人中心')
    })
  })

  describe('requiresAdmin 守卫', () => {
    it('已登录普通用户访问 /admin 被打回首页', async () => {
      login({ id: 'u1', username: 'pilot', role: 'user' })
      await router.push('/admin/members')
      expect(router.currentRoute.value.path).toBe('/')
    })

    it('管理员访问 /admin/members 放行', async () => {
      login({ id: 'u1', username: 'boss', role: 'admin' })
      await router.push('/admin/members')
      expect(router.currentRoute.value.name).toBe('成员管理')
    })
  })

  describe('guestOnly 守卫', () => {
    it('已登录用户访问 /login 被送去 /profile', async () => {
      login({ id: 'u1', username: 'pilot', role: 'user' })
      await router.push('/login')
      expect(router.currentRoute.value.path).toBe('/profile')
    })

    it('已登录用户访问 /register 同样被送去 /profile', async () => {
      login({ id: 'u1', username: 'pilot', role: 'user' })
      await router.push('/register')
      expect(router.currentRoute.value.path).toBe('/profile')
    })

    it('未登录用户访问 /login 放行', async () => {
      await router.push('/login')
      expect(router.currentRoute.value.name).toBe('登录')
    })
  })

  describe('登录态初始化（TD-25）', () => {
    it('initialized=false 时守卫等待 initializeAuth 完成后再判定', async () => {
      // 模拟刷新后直访受保护页：store 未初始化但初始化后恢复登录态
      authState = { initialized: false, user: null }
      initializeAuth.mockImplementation(async () => {
        authState = { initialized: true, user: { id: 'u1', username: 'boss', role: 'admin' } }
      })

      await router.push('/admin')

      expect(initializeAuth).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.name).toBe('管理仪表盘')
    })

    it('initialized=true 时不重复调用 initializeAuth', async () => {
      login({ id: 'u1', username: 'pilot', role: 'user' })
      await router.push('/profile')
      await router.push('/about')
      expect(initializeAuth).not.toHaveBeenCalled()
    })
  })

  describe('页面标题与埋点', () => {
    it('导航后 document.title 更新为 meta.title', async () => {
      await router.push('/members') // 先去别处，避免重复导航 no-op
      await router.push('/about')
      expect(document.title).toBe('团队介绍 - 星际公民团队官网')
    })

    it('afterEach 记录 page_view 埋点（含路径与路由名）', async () => {
      await router.push('/members')
      await router.push('/about')
      const calls = trackEvent.mock.calls.filter(([event]) => event === 'page_view')
      expect(calls.length).toBeGreaterThanOrEqual(2)
      const last = calls[calls.length - 1]
      expect(last[1]).toMatchObject({ path: '/about', name: '团队介绍' })
    })

    it('404 路由也带标题', async () => {
      await router.push('/nowhere-xyz')
      expect(document.title).toBe('页面未找到 - 星际公民团队官网')
    })
  })

  describe('scrollBehavior', () => {
    it('无 hash 无 savedPosition 时回顶部（平滑）', async () => {
      await router.push('/about')
      // 通过真实导航验证 scrollBehavior 不抛错且路由生效；精确定位逻辑单测如下
    })

    it('scrollBehavior 直接调用三分支', async () => {
      // 从路由实例取出 scrollBehavior 函数直接断言（导航级断言在 jsdom 无真实布局）
      const behavior = router.options.scrollBehavior
      expect(behavior({ hash: '' }, {}, null)).toEqual({ top: 0, behavior: 'smooth' })
      expect(behavior({ hash: '#crew' }, {}, null)).toEqual({ el: '#crew', behavior: 'smooth' })
      expect(behavior({ hash: '' }, {}, { top: 120 })).toEqual({ top: 120 })
    })
  })

  describe('admin 空路径重定向', () => {
    it('/admin 空子路径重定向到 /admin/dashboard', async () => {
      login({ id: 'u1', username: 'boss', role: 'admin' })
      await router.push('/admin')
      expect(router.currentRoute.value.path).toBe('/admin/dashboard')
    })
  })
})
