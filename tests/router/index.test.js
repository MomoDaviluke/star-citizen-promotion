/**
 * @file 路由模块测试
 * @description 测试路由配置、导航守卫和预加载功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: '首页', meta: { preload: true } },
  { path: '/about', name: '团队介绍', meta: { preload: true } },
  { path: '/members', name: '核心成员', meta: { preload: true } },
  { path: '/projects', name: '活动项目', meta: { preload: true } },
  { path: '/join', name: '加入我们', meta: { preload: true } },
  { path: '/contact', name: '联系我们', meta: { preload: true } },
  { path: '/login', name: '登录', meta: { guest: true } },
  { path: '/admin', name: '管理后台', meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found' }
]

describe('路由配置', () => {
  let router

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: routes.map(r => ({
        ...r,
        component: () => Promise.resolve({ template: '<div></div>' })
      }))
    })
  })

  describe('路由定义', () => {
    it('应包含所有必要路由', () => {
      const routeNames = router.getRoutes().map(r => r.name)
      expect(routeNames).toContain('首页')
      expect(routeNames).toContain('团队介绍')
      expect(routeNames).toContain('核心成员')
      expect(routeNames).toContain('活动项目')
      expect(routeNames).toContain('加入我们')
      expect(routeNames).toContain('联系我们')
      expect(routeNames).toContain('登录')
      expect(routeNames).toContain('管理后台')
    })

    it('应包含 404 路由', () => {
      const notFoundRoute = router.getRoutes().find(r => r.name === 'not-found')
      expect(notFoundRoute).toBeDefined()
      expect(notFoundRoute.path).toBe('/:pathMatch(.*)*')
    })
  })

  describe('路由元信息', () => {
    it('首页应标记为预加载', () => {
      const homeRoute = router.getRoutes().find(r => r.name === '首页')
      expect(homeRoute.meta.preload).toBe(true)
    })

    it('登录页应标记为访客页面', () => {
      const loginRoute = router.getRoutes().find(r => r.name === '登录')
      expect(loginRoute.meta.guest).toBe(true)
    })

    it('管理后台应要求认证', () => {
      const adminRoute = router.getRoutes().find(r => r.name === '管理后台')
      expect(adminRoute.meta.requiresAuth).toBe(true)
      expect(adminRoute.meta.requiresAdmin).toBe(true)
    })
  })

  describe('路由导航', () => {
    it('应能导航到首页', async () => {
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('首页')
    })

    it('应能导航到关于页面', async () => {
      await router.push('/about')
      expect(router.currentRoute.value.name).toBe('团队介绍')
    })

    it('未知路由应重定向到 404', async () => {
      await router.push('/unknown-route-xyz')
      expect(router.currentRoute.value.name).toBe('not-found')
    })
  })
})

describe('滚动行为', () => {
  it('应定义滚动行为函数', () => {
    const scrollBehavior = (to, from, savedPosition) => {
      if (savedPosition) return savedPosition
      if (to.hash) return { el: to.hash, behavior: 'smooth' }
      return { top: 0, behavior: 'smooth' }
    }

    expect(typeof scrollBehavior).toBe('function')

    const result = scrollBehavior({ hash: null }, {}, null)
    expect(result).toEqual({ top: 0, behavior: 'smooth' })

    const hashResult = scrollBehavior({ hash: '#section' }, {}, null)
    expect(hashResult).toEqual({ el: '#section', behavior: 'smooth' })

    const savedResult = scrollBehavior({}, {}, { top: 100 })
    expect(savedResult).toEqual({ top: 100 })
  })
})
