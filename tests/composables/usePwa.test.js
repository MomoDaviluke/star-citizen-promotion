/**
 * @file usePwa composable 测试
 * @description 覆盖 PWA 状态管理、更新流程、降级逻辑
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('usePwa', () => {
  let usePwa

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../../src/composables/usePwa.js')
    usePwa = mod.usePwa
  })

  describe('初始状态', () => {
    it('应导出预期的方法和状态', () => {
      const pwa = usePwa()
      expect(pwa).toHaveProperty('needRefresh')
      expect(pwa).toHaveProperty('offlineReady')
      expect(pwa).toHaveProperty('swRegistered')
      expect(typeof pwa.applyUpdate).toBe('function')
      expect(typeof pwa.dismissUpdate).toBe('function')
      expect(typeof pwa.dismissOfflineReady).toBe('function')
      expect(typeof pwa.registerPWA).toBe('function')
    })

    it('needRefresh 默认应为 false', () => {
      const { needRefresh } = usePwa()
      expect(needRefresh.value).toBe(false)
    })

    it('offlineReady 默认应为 false', () => {
      const { offlineReady } = usePwa()
      expect(offlineReady.value).toBe(false)
    })

    it('swRegistered 默认应为 false', () => {
      const { swRegistered } = usePwa()
      expect(swRegistered.value).toBe(false)
    })
  })

  describe('dismissUpdate', () => {
    it('应将 needRefresh 设为 false', () => {
      const { needRefresh, dismissUpdate } = usePwa()
      needRefresh.value = true
      dismissUpdate()
      expect(needRefresh.value).toBe(false)
    })
  })

  describe('dismissOfflineReady', () => {
    it('应将 offlineReady 设为 false', () => {
      const { offlineReady, dismissOfflineReady } = usePwa()
      offlineReady.value = true
      dismissOfflineReady()
      expect(offlineReady.value).toBe(false)
    })
  })

  describe('applyUpdate', () => {
    it('无 handler 时应回退到 window.reload', async () => {
      const reloadSpy = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadSpy },
        writable: true
      })

      const { applyUpdate } = usePwa()
      await applyUpdate()

      expect(reloadSpy).toHaveBeenCalled()
    })
  })

  describe('registerPWA', () => {
    it('在没有 serviceWorker 时应静默退出', async () => {
      const originalSW = navigator.serviceWorker
      // @ts-expect-error - 删除测试用
      delete navigator.serviceWorker

      const { registerPWA } = usePwa()
      await expect(registerPWA()).resolves.toBeUndefined()

      // 恢复
      if (originalSW) {
        Object.defineProperty(navigator, 'serviceWorker', { value: originalSW, configurable: true })
      }
    })

    it('在 virtual:pwa-register/vue 不存在时（开发环境）应静默', async () => {
      // 该模块在 vitest 中本就不存在，registerPWA 应被 try/catch 兜住
      const { registerPWA } = usePwa()
      await expect(registerPWA()).resolves.toBeUndefined()
    })
  })

  describe('响应式状态共享', () => {
    it('多次调用 usePwa 应返回同一组 ref', () => {
      const a = usePwa()
      const b = usePwa()
      expect(a.needRefresh).toBe(b.needRefresh)
      expect(a.offlineReady).toBe(b.offlineReady)
    })
  })
})
