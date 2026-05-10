/**
 * @file 路由配置模块
 * @description Vue Router 路由配置，包含路由定义、导航守卫、组件预加载等功能
 *              实现单页面应用（SPA）的客户端路由管理
 * @module router
 * @requires vue-router
 */

// 从 vue-router 导入创建路由所需的函数
// createRouter: 创建路由实例
// createWebHistory: 使用 HTML5 History API 模式（无 # 号）
import { createRouter, createWebHistory } from 'vue-router'
// 导入 HTTP 客户端，用于检查用户认证状态
import httpClient from '../services/http.js'

/**
 * 检查用户是否已认证
 * @description 通过检查本地存储中是否存在有效的访问令牌来判断用户登录状态
 *              这是客户端认证状态的第一道检查，服务端会进行二次验证
 * @returns {boolean} 是否已登录
 */
function isAuthenticated() {
  return !!httpClient.getStoredToken()
}

/**
 * 检查用户是否为管理员
 * @description 从本地存储获取用户信息，检查角色是否为 admin
 *              注意：这只是前端界面控制，实际权限校验在服务端完成
 * @returns {boolean} 是否为管理员
 */
function isAdmin() {
  const user = httpClient.getStoredUser()
  return user?.role === 'admin'
}

/**
 * 应用路由配置数组
 * @description 定义所有页面路由及其元信息
 *              每个路由对象包含路径、名称、组件和元数据
 * @type {Array<Object>}
 */
const routes = [
  {
    path: '/',
    name: '首页',
    // 使用动态导入（懒加载）减少首屏加载时间
    // 用户访问首页时才加载该组件
    component: () => import('../views/Home.vue'),
    meta: { 
      preload: true,  // 标记为预加载路由，提升首屏体验
      title: '星际公民团队站 - 首页'
    }
  },
  {
    path: '/about',
    name: '团队介绍',
    component: () => import('../views/About.vue'),
    meta: { 
      preload: true,
      title: '团队介绍 - 星际公民团队站'
    }
  },
  {
    path: '/members',
    name: '核心成员',
    component: () => import('../views/Members.vue'),
    meta: { title: '核心成员 - 星际公民团队站' }
  },
  {
    path: '/projects',
    name: '活动项目',
        component: () => import('../views/Projects.vue'),
        meta: { title: '活动项目 - 星际公民团队站' }
      },
      {
        path: '/fleet',
        name: '舰队展示',
        component: () => import('../views/Fleet.vue'),
        meta: { title: '舰队展示 - 星际公民团队站', preload: false }
      },
      {
        path: '/calendar',
        name: '活动日历',
        component: () => import('../views/Calendar.vue'),
        meta: { title: '活动日历 - 星际公民团队站', preload: false }
      },
      {
        path: '/join',
        name: '加入我们',
        component: () => import('../views/Join.vue'),
    meta: { title: '加入我们 - 星际公民团队站' }
  },
  {
    path: '/contact',
    name: '联系我们',
    component: () => import('../views/Contact.vue'),
    meta: { title: '联系我们 - 星际公民团队站' }
  },
  {
    path: '/login',
    name: '登录',
    component: () => import('../views/Login.vue'),
    meta: { 
      guestOnly: true,  // 仅未登录用户可访问
      title: '登录 - 星际公民团队站'
    }
  },
  {
    path: '/register',
    name: '注册',
    component: () => import('../views/Register.vue'),
    meta: { 
      guestOnly: true,
      title: '注册 - 星际公民团队站'
    }
  },
  {
    path: '/profile',
    name: '个人中心',
    component: () => import('../views/Profile.vue'),
    meta: { 
      requiresAuth: true,  // 需要登录才能访问
      title: '个人中心 - 星际公民团队站'
    }
  },
  {
    path: '/application-status',
    name: '申请状态',
    component: () => import('../views/ApplicationStatus.vue'),
    meta: { title: '申请状态 - 星际公民团队站' }
  },
  // 管理后台路由组
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { 
      requiresAuth: true,
      requiresAdmin: true  // 需要管理员权限
    },
    // 嵌套路由，共享 AdminLayout 布局
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'  // 重定向到仪表盘
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
      }
    ]
  },
  // 404 页面 - 捕获所有未匹配的路由
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('../views/NotFound.vue'),
    meta: { title: '页面未找到 - 星际公民团队站' }
  }
]

/**
 * 创建路由实例
 * @description 使用 HTML5 History 模式创建路由实例
 *              需要服务端配置支持，将所有路由指向 index.html
 */
const router = createRouter({
  history: createWebHistory(),
  routes,
  // 滚动行为配置
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置（如浏览器后退），恢复到之前的位置
    if (savedPosition) {
      return savedPosition
    }
    // 如果有 hash 锚点，滚动到锚点位置
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    // 默认滚动到页面顶部
    return { top: 0, behavior: 'smooth' }
  }
})

/**
 * 全局前置导航守卫
 * @description 在每次路由切换前执行，用于权限检查和页面准备
 *              这是路由级别的安全控制，配合服务端鉴权形成双重保护
 */
router.beforeEach((to, from, next) => {
  // 更新页面标题，提升 SEO 和用户体验
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // 检查路由是否需要认证
  if (to.meta.requiresAuth && !isAuthenticated()) {
    // 未登录用户访问需要认证的页面，重定向到登录页
    // 保存目标路径，登录后可自动跳转回来
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 检查路由是否需要管理员权限
  if (to.meta.requiresAdmin && !isAdmin()) {
    // 非管理员访问管理后台，重定向到首页
    next({ path: '/' })
    return
  }

  // 检查路由是否仅允许未登录用户访问（如登录页、注册页）
  if (to.meta.guestOnly && isAuthenticated()) {
    // 已登录用户访问登录页，重定向到个人中心
    next({ path: '/profile' })
    return
  }

  // 通过所有检查，允许导航
  next()
})

/**
 * 全局后置钩子
 * @description 在路由切换完成后执行，可用于页面统计、埋点等
 */
router.afterEach((to) => {
  // 可在此处添加页面访问统计代码
  // 例如：analytics.trackPageView(to.path)
})

export default router
