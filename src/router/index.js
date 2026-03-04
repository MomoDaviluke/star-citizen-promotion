/**
 * @file 路由配置模块
 * @description Vue Router 路由配置，包含路由定义、导航守卫、组件预加载等功能
 * @module router
 */

import { createRouter, createWebHistory } from 'vue-router'

/**
 * 应用路由配置数组
 * @description 定义所有页面路由及其元信息
 * @type {Array<Object>}
 */
const routes = [
  {
    path: '/',
    name: '首页',
    component: () => import('../views/Home.vue'),
    meta: { preload: true }
  },
  {
    path: '/about',
    name: '团队介绍',
    component: () => import('../views/About.vue'),
    meta: { preload: true }
  },
  {
    path: '/members',
    name: '核心成员',
    component: () => import('../views/Members.vue'),
    meta: { preload: true }
  },
  {
    path: '/projects',
    name: '活动项目',
    component: () => import('../views/Projects.vue'),
    meta: { preload: true }
  },
  {
    path: '/join',
    name: '加入我们',
    component: () => import('../views/Join.vue'),
    meta: { preload: true }
  },
  {
    path: '/contact',
    name: '联系我们',
    component: () => import('../views/Contact.vue'),
    meta: { preload: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFound.vue')
  }
]

/**
 * Vue Router 实例
 * @description 创建并配置路由实例，使用 HTML5 History 模式
 */
const router = createRouter({
  history: createWebHistory(),
  /**
   * 滚动行为配置
   * @description 控制页面导航时的滚动位置
   * @param {Object} to - 目标路由对象
   * @param {Object} from - 来源路由对象
   * @param {Object|null} savedPosition - 浏览器保存的滚动位置
   * @returns {Promise<Object>|Object} 滚动位置配置
   */
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(savedPosition)
        }, 350)
      })
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    return { top: 0, behavior: 'smooth' }
  },
  routes
})

/**
 * 已加载组件缓存集合
 * @description 记录已完成加载的路由组件，避免重复加载
 * @type {Set<string>}
 */
const loadedComponents = new Set()

/**
 * 待处理预加载任务映射表
 * @description 存储正在进行的预加载 Promise，防止重复预加载
 * @type {Map<string, Promise>}
 */
const pendingPreloads = new Map()

/**
 * 预加载单个路由组件
 * @description 异步加载指定路由的组件，支持去重和错误处理
 * @param {Object} route - 路由配置对象
 * @returns {Promise} 组件加载 Promise
 */
function preloadComponent(route) {
  if (!route.component || loadedComponents.has(route.name)) {
    return Promise.resolve()
  }

  if (pendingPreloads.has(route.name)) {
    return pendingPreloads.get(route.name)
  }

  const preloadPromise = route.component().then((module) => {
    loadedComponents.add(route.name)
    pendingPreloads.delete(route.name)
    return module
  }).catch((error) => {
    pendingPreloads.delete(route.name)
    console.warn(`[Router] Failed to preload ${route.name}:`, error)
  })

  pendingPreloads.set(route.name, preloadPromise)
  return preloadPromise
}

/**
 * 预加载所有标记为预加载的路由组件
 * @description 在浏览器空闲时批量预加载组件，优化后续导航性能
 * @returns {void}
 */
function preloadAllRoutes() {
  const routesToPreload = routes.filter(
    route => route.meta?.preload && route.component
  )

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      routesToPreload.forEach((route, index) => {
        setTimeout(() => {
          preloadComponent(route)
        }, index * 100)
      })
    })
  } else {
    setTimeout(() => {
      routesToPreload.forEach((route, index) => {
        setTimeout(() => {
          preloadComponent(route)
        }, index * 100)
      })
    }, 1000)
  }
}

/**
 * 全局前置导航守卫
 * @description 在导航前预加载目标路由组件
 */
router.beforeEach((to, from, next) => {
  const targetRoute = routes.find(r => r.path === to.path)

  if (targetRoute && !loadedComponents.has(targetRoute.name)) {
    preloadComponent(targetRoute).then(() => {
      next()
    })
    return
  }

  next()
})

/**
 * 全局后置导航守卫
 * @description 导航完成后预加载相邻路由组件，提升用户体验
 */
router.afterEach((to) => {
  const currentIndex = routes.findIndex(r => r.path === to.path)

  if (currentIndex !== -1) {
    const nextRoute = routes[currentIndex + 1]
    const prevRoute = routes[currentIndex - 1]

    if (nextRoute?.meta?.preload) {
      setTimeout(() => preloadComponent(nextRoute), 500)
    }
    if (prevRoute?.meta?.preload) {
      setTimeout(() => preloadComponent(prevRoute), 500)
    }
  }
})

/**
 * 初始化路由预加载
 * @description 在页面加载完成后启动路由组件预加载
 */
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    preloadAllRoutes()
  } else {
    window.addEventListener('load', preloadAllRoutes, { once: true })
  }
}

export { preloadComponent, preloadAllRoutes, loadedComponents }
export default router
