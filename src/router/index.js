import { createRouter, createWebHistory } from 'vue-router'

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

const router = createRouter({
  history: createWebHistory(),
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

const loadedComponents = new Set()
const pendingPreloads = new Map()

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

if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    preloadAllRoutes()
  } else {
    window.addEventListener('load', preloadAllRoutes, { once: true })
  }
}

export { preloadComponent, preloadAllRoutes, loadedComponents }
export default router
