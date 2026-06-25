/**
 * @file 路由配置测试
 * @description 覆盖路由定义、导航守卫、权限检查
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// 用 globalThis 存储共享状态，避免 vi.mock 提升时序问题
// 注意：ES module import 先于模块体执行，所以 router 模块的 createRouter 已经设置了这些值
// 这里只做 fallback 初始化，不覆盖已有的值
globalThis.__registeredRoutes = globalThis.__registeredRoutes || []
globalThis.__beforeEachGuards = globalThis.__beforeEachGuards || []

// Mock Pinia auth store
const mockAuthStore = {
  isAuthenticated: false,
  isAdmin: false,
  user: null
}

vi.mock('@/stores/auth.js', () => ({
  useAuthStore: () => mockAuthStore
}))

// Mock vue-router - 返回一个能跟踪路由的 router 实例
vi.mock('vue-router', () => {
  function flattenRoutes(routes, parentPath = '') {
    const result = []
    for (const route of routes) {
      const fullPath = parentPath
        ? `${parentPath}/${route.path}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
        : route.path
      result.push({ ...route, path: fullPath })
      if (route.children) {
        result.push(...flattenRoutes(route.children, fullPath + '/'))
      }
    }
    return result
  }

  const createRouter = (options) => {
    globalThis.__registeredRoutes = options.routes || []
    if (!globalThis.__beforeEachGuards) globalThis.__beforeEachGuards = []
    return {
      beforeEach: (guard) => { globalThis.__beforeEachGuards.push(guard) },
      push: vi.fn(),
      replace: vi.fn(),
      getRoutes: () => flattenRoutes(globalThis.__registeredRoutes),
      options,
      currentRoute: { value: { path: '/' } }
    }
  }

  return {
    createRouter,
    createWebHistory: vi.fn(() => 'html5'),
    RouterLink: { template: '<a><slot /></a>', props: ['to'] },
    RouterView: { template: '<div />' }
  }
})

// Mock 所有页面组件
vi.mock('@/views/Home.vue', () => ({ default: { name: 'Home' } }))
vi.mock('@/views/About.vue', () => ({ default: { name: 'About' } }))
vi.mock('@/views/Members.vue', () => ({ default: { name: 'Members' } }))
vi.mock('@/views/Projects.vue', () => ({ default: { name: 'Projects' } }))
vi.mock('@/views/Fleet.vue', () => ({ default: { name: 'Fleet' } }))
vi.mock('@/views/Calendar.vue', () => ({ default: { name: 'Calendar' } }))
vi.mock('@/views/Join.vue', () => ({ default: { name: 'Join' } }))
vi.mock('@/views/Contact.vue', () => ({ default: { name: 'Contact' } }))
vi.mock('@/views/Login.vue', () => ({ default: { name: 'Login' } }))
vi.mock('@/views/Register.vue', () => ({ default: { name: 'Register' } }))
vi.mock('@/views/Profile.vue', () => ({ default: { name: 'Profile' } }))
vi.mock('@/views/ApplicationStatus.vue', () => ({ default: { name: 'ApplicationStatus' } }))
vi.mock('@/views/NotFound.vue', () => ({ default: { name: 'NotFound' } }))
vi.mock('@/views/admin/AdminLayout.vue', () => ({ default: { name: 'AdminLayout' } }))
vi.mock('@/views/admin/Dashboard.vue', () => ({ default: { name: 'Dashboard' } }))
vi.mock('@/views/admin/MembersAdmin.vue', () => ({ default: { name: 'MembersAdmin' } }))
vi.mock('@/views/admin/ProjectsAdmin.vue', () => ({ default: { name: 'ProjectsAdmin' } }))
vi.mock('@/views/admin/PilotsAdmin.vue', () => ({ default: { name: 'PilotsAdmin' } }))
vi.mock('@/views/admin/ApplicationsAdmin.vue', () => ({ default: { name: 'ApplicationsAdmin' } }))
vi.mock('@/views/admin/Settings.vue', () => ({ default: { name: 'Settings' } }))

import router from '@/router/index.js'

describe('Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = false
    mockAuthStore.isAdmin = false
  })

  describe('路由定义', () => {
    it('应该定义所有公开路由', () => {
      const routeNames = router.getRoutes().map(r => r.name).filter(Boolean)

      expect(routeNames).toContain('首页')
      expect(routeNames).toContain('团队介绍')
      expect(routeNames).toContain('核心成员')
      expect(routeNames).toContain('活动项目')
      expect(routeNames).toContain('舰队展示')
      expect(routeNames).toContain('活动日历')
      expect(routeNames).toContain('加入我们')
      expect(routeNames).toContain('联系我们')
    })

    it('应该定义认证路由', () => {
      const routeNames = router.getRoutes().map(r => r.name).filter(Boolean)

      expect(routeNames).toContain('登录')
      expect(routeNames).toContain('注册')
      expect(routeNames).toContain('个人中心')
    })

    it('应该定义管理后台路由', () => {
      const routeNames = router.getRoutes().map(r => r.name).filter(Boolean)

      expect(routeNames).toContain('管理仪表盘')
      expect(routeNames).toContain('成员管理')
      expect(routeNames).toContain('项目管理')
      expect(routeNames).toContain('飞行员管理')
      expect(routeNames).toContain('申请管理')
      expect(routeNames).toContain('系统设置')
    })

    it('应该有 404 兜底路由', () => {
      const routes = router.getRoutes()
      const catchAll = routes.find(r => r.path === '/:pathMatch(.*)*')

      expect(catchAll).toBeDefined()
    })
  })

  describe('路由元信息', () => {
    it('首页应该标记 preload', () => {
      const route = router.getRoutes().find(r => r.name === '首页')

      expect(route?.meta?.preload).toBe(true)
    })

    it('登录页应该标记 guestOnly', () => {
      const route = router.getRoutes().find(r => r.name === '登录')

      expect(route?.meta?.guestOnly).toBe(true)
    })

    it('个人中心应该标记 requiresAuth', () => {
      const route = router.getRoutes().find(r => r.name === '个人中心')

      expect(route?.meta?.requiresAuth).toBe(true)
    })

    it('管理后台应该标记 requiresAuth 和 requiresAdmin', () => {
      const route = router.getRoutes().find(r => r.path === '/admin')

      expect(route?.meta?.requiresAuth).toBe(true)
      expect(route?.meta?.requiresAdmin).toBe(true)
    })
  })

  describe('导航守卫', () => {
    it('应该注册 beforeEach 守卫', () => {
      expect(globalThis.__beforeEachGuards.length).toBeGreaterThan(0)
    })

    it('未登录访问需要认证的路由应该重定向到登录页', () => {
      mockAuthStore.isAuthenticated = false
      const guard = globalThis.__beforeEachGuards[0]

      const result = guard({
        meta: { requiresAuth: true },
        fullPath: '/profile'
      })

      expect(result).toEqual({ path: '/login', query: { redirect: '/profile' } })
    })

    it('非管理员访问管理后台应该重定向到首页', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.isAdmin = false
      const guard = globalThis.__beforeEachGuards[0]

      const result = guard({
        meta: { requiresAuth: true, requiresAdmin: true },
        fullPath: '/admin'
      })

      expect(result).toEqual({ path: '/' })
    })

    it('已登录用户访问登录页应该重定向到个人中心', () => {
      mockAuthStore.isAuthenticated = true
      const guard = globalThis.__beforeEachGuards[0]

      const result = guard({
        meta: { guestOnly: true },
        fullPath: '/login'
      })

      expect(result).toEqual({ path: '/profile' })
    })

    it('未登录用户访问公开路由应该放行', () => {
      mockAuthStore.isAuthenticated = false
      const guard = globalThis.__beforeEachGuards[0]

      const result = guard({
        meta: { title: '首页' },
        fullPath: '/'
      })

      expect(result).toBeUndefined()
    })

    it('管理员访问管理后台应该放行', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.isAdmin = true
      const guard = globalThis.__beforeEachGuards[0]

      const result = guard({
        meta: { requiresAuth: true, requiresAdmin: true },
        fullPath: '/admin/dashboard'
      })

      expect(result).toBeUndefined()
    })

    it('应该设置页面标题', () => {
      const guard = globalThis.__beforeEachGuards[0]

      guard({
        meta: { title: '测试标题' },
        fullPath: '/test'
      })

      expect(document.title).toBe('测试标题')
    })
  })
})
