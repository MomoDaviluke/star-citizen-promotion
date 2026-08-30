/**
 * @file 路由配置模块
 * @description Vue Router 路由配置，包含路由定义、导航守卫、组件预加载等功能。
 *              实现单页面应用（SPA）的客户端路由管理。
 *              认证检查通过 Pinia auth store 实现，Token 由 httpOnly cookie 管理。
 * @module router
 * @requires vue-router
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { trackEvent } from '../services/analyticsService.js'

/**
 * 应用路由配置数组
 * @description 定义所有页面路由及其元信息。
 *              每个路由对象包含路径、名称、组件和元数据。
 * @type {Array<Object>}
 */
const routes = [
  {
    path: '/',
    name: '首页',
    component: () => import('../views/Home.vue'),
    meta: {
      preload: true,
      title: '星际公民团队官网 - 首页'
    }
  },
  {
    path: '/about',
    name: '团队介绍',
    component: () => import('../views/About.vue'),
    meta: {
      preload: true,
      title: '团队介绍 - 星际公民团队官网'
    }
  },
  {
    path: '/members',
    name: '核心成员',
    component: () => import('../views/Members.vue'),
    meta: { title: '核心成员 - 星际公民团队官网' }
  },
  {
    path: '/projects',
    name: '活动项目',
    component: () => import('../views/Projects.vue'),
    meta: { title: '活动项目 - 星际公民团队官网' }
  },
  {
    path: '/fleet',
    name: '舰队展示',
    component: () => import('../views/Fleet.vue'),
    meta: { title: '舰队展示 - 星际公民团队官网', preload: true }
  },
  {
    path: '/fleet/:slug',
    name: '舰船详情',
    component: () => import('../views/ShipDetail.vue'),
    meta: { title: '舰船详情 - 星际公民团队官网', preload: false }
  },
  {
    path: '/calendar',
    name: '活动日历',
    component: () => import('../views/Calendar.vue'),
    meta: { title: '活动日历 - 星际公民团队官网', preload: false }
  },
  {
    path: '/join',
    name: '加入我们',
    component: () => import('../views/Join.vue'),
    meta: { title: '加入我们 - 星际公民团队官网', preload: true }
  },
  {
    path: '/contact',
    name: '联系我们',
    component: () => import('../views/Contact.vue'),
    meta: { title: '联系我们 - 星际公民团队官网', preload: true }
  },
  {
    path: '/login',
    name: '登录',
    component: () => import('../views/Login.vue'),
    meta: {
      guestOnly: true,
      title: '登录 - 星际公民团队官网'
    }
  },
  {
    path: '/register',
    name: '注册',
    component: () => import('../views/Register.vue'),
    meta: {
      guestOnly: true,
      title: '注册 - 星际公民团队官网'
    }
  },
  {
    path: '/profile',
    name: '个人中心',
    component: () => import('../views/Profile.vue'),
    meta: {
      requiresAuth: true,
      title: '个人中心 - 星际公民团队官网'
    }
  },
  {
    path: '/application-status',
    name: '申请状态',
    component: () => import('../views/ApplicationStatus.vue'),
    meta: { title: '申请状态 - 星际公民团队官网' }
  },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: '管理仪表盘',
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { title: '管理仪表盘' }
      },
      {
        path: 'members',
        name: '成员管理',
        component: () => import('../views/admin/MembersAdmin.vue'),
        meta: { title: '成员管理' }
      },
      {
        path: 'projects',
        name: '项目管理',
        component: () => import('../views/admin/ProjectsAdmin.vue'),
        meta: { title: '项目管理' }
      },
      {
        path: 'pilots',
        name: '飞行员管理',
        component: () => import('../views/admin/PilotsAdmin.vue'),
        meta: { title: '飞行员管理' }
      },
      {
        path: 'applications',
        name: '申请管理',
        component: () => import('../views/admin/ApplicationsAdmin.vue'),
        meta: { title: '申请管理' }
      },
      {
        path: 'settings',
        name: '系统设置',
        component: () => import('../views/admin/Settings.vue'),
        meta: { title: '系统设置' }
      },
      {
        path: 'monitor',
        name: '系统监控',
        component: () => import('../views/admin/Monitor.vue'),
        meta: { title: '系统监控' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('../views/NotFound.vue'),
    meta: { title: '页面未找到 - 星际公民团队官网' }
  }
]

/**
 * 创建路由实例
 * @description 使用 HTML5 History 模式创建路由实例。
 *              需要服务端配置支持，将所有路由指向 index.html。
 */
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0, behavior: 'smooth' }
  }
})

/**
 * 全局前置导航守卫
 * @description 在每次路由切换前执行，用于权限检查和页面准备。
 *              认证状态通过 Pinia auth store 获取，Token 由 httpOnly cookie 管理。
 */
router.beforeEach(async (to) => {
  const title = /** @type {string|undefined} */ (to.meta.title)
  if (title) {
    document.title = title
  }

  const authStore = useAuthStore()

  // 等待登录态恢复完成再判定权限：main.js 启动时调用的 initializeAuth 是异步的，
  // 若守卫不等待，用户刷新页面或直接访问 /admin/* 时 user 仍为 null，
  // 会被误判为未登录而踢到登录页（TD-25）。initializeAuth 内部有 initialized 幂等保护。
  if (!authStore.initialized) {
    await authStore.initializeAuth()
  }

  // 检查路由是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // 检查路由是否需要管理员权限
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { path: '/' }
  }

  // 检查路由是否仅允许未登录用户访问
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { path: '/profile' }
  }
})

/**
 * 全局后置导航守卫
 * @description 在每次路由切换完成后执行，用于页面访问埋点（page_view）
 */
router.afterEach((to) => {
  trackEvent('page_view', {
    path: to.fullPath,
    name: to.name || undefined,
  })
})

export default router

/**
 * 关键路由预加载
 * @description 首页加载完成后，利用浏览器空闲时间预加载标记了 preload: true 的路由 chunk，
 *              减少用户点击导航时的可感知延迟
 */
function preloadCriticalRoutes() {
  const preloadRoutes = routes.filter((r) => r.meta?.preload)
  const preload = (route) => {
    if (typeof route.component === 'function') {
      route.component().catch(() => {})
    }
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      preloadRoutes.forEach(preload)
    }, { timeout: 3000 })
  } else {
    setTimeout(() => {
      preloadRoutes.forEach(preload)
    }, 2000)
  }
}

// 首次导航完成后触发预加载
router.isReady().then(preloadCriticalRoutes)
