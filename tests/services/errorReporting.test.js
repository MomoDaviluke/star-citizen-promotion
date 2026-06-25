/**
 * @file 错误报告服务测试
 * @description 覆盖 getSentry 单例、captureException、captureMessage、setUser 行为
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock @sentry/vue 模块（动态 import 时返回此 mock）
const mockSentry = {
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
  replayIntegration: vi.fn(() => ({}))
}

vi.mock('@sentry/vue', () => ({
  init: mockSentry.init,
  captureException: mockSentry.captureException,
  captureMessage: mockSentry.captureMessage,
  setUser: mockSentry.setUser,
  browserTracingIntegration: mockSentry.browserTracingIntegration,
  replayIntegration: mockSentry.replayIntegration
}))

describe('errorReporting', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // 每个测试前重置环境变量
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_SENTRY_DSN', '')
    // 重置模块缓存以确保 getSentry 单例测试独立
    vi.resetModules()
  })

  afterEach(() => {
    // 恢复非生产环境
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_SENTRY_DSN', '')
  })

  describe('非生产环境行为', () => {
    it('captureException 应静默返回（不调用 Sentry）', async () => {
      vi.stubEnv('PROD', false)
      const { captureException } = await import('@/services/errorReporting.js')
      await captureException(new Error('test'))
      expect(mockSentry.captureException).not.toHaveBeenCalled()
    })

    it('captureMessage 应静默返回（不调用 Sentry）', async () => {
      vi.stubEnv('PROD', false)
      const { captureMessage } = await import('@/services/errorReporting.js')
      await captureMessage('test')
      expect(mockSentry.captureMessage).not.toHaveBeenCalled()
    })

    it('setUser 应静默返回（不调用 Sentry）', async () => {
      vi.stubEnv('PROD', false)
      const { setUser } = await import('@/services/errorReporting.js')
      await setUser({ id: '1' })
      expect(mockSentry.setUser).not.toHaveBeenCalled()
    })

    it('initErrorReporting 应不初始化', async () => {
      vi.stubEnv('PROD', false)
      const { initErrorReporting } = await import('@/services/errorReporting.js')
      await initErrorReporting({}, {})
      expect(mockSentry.init).not.toHaveBeenCalled()
    })
  })

  describe('生产环境但无 DSN', () => {
    it('initErrorReporting 应不初始化', async () => {
      vi.stubEnv('PROD', true)
      vi.stubEnv('VITE_SENTRY_DSN', '')
      const { initErrorReporting } = await import('@/services/errorReporting.js')
      await initErrorReporting({}, {})
      expect(mockSentry.init).not.toHaveBeenCalled()
    })
  })

  describe('生产环境且有 DSN', () => {
    beforeEach(() => {
      vi.stubEnv('PROD', true)
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.example/1')
    })

    it('initErrorReporting 应调用 Sentry.init', async () => {
      const { initErrorReporting } = await import('@/services/errorReporting.js')
      await initErrorReporting({}, {})
      expect(mockSentry.init).toHaveBeenCalledTimes(1)
      expect(mockSentry.browserTracingIntegration).toHaveBeenCalled()
      expect(mockSentry.replayIntegration).toHaveBeenCalled()
    })

    it('captureException 应调用 Sentry.captureException', async () => {
      const { captureException } = await import('@/services/errorReporting.js')
      const err = new Error('test')
      const ctx = { foo: 'bar' }
      await captureException(err, ctx)
      expect(mockSentry.captureException).toHaveBeenCalledWith(err, { extra: ctx })
    })

    it('captureMessage 应调用 Sentry.captureMessage', async () => {
      const { captureMessage } = await import('@/services/errorReporting.js')
      await captureMessage('hello', 'warning')
      expect(mockSentry.captureMessage).toHaveBeenCalledWith('hello', 'warning')
    })

    it('setUser 应调用 Sentry.setUser', async () => {
      const { setUser } = await import('@/services/errorReporting.js')
      const user = { id: 'u1', username: 'alice' }
      await setUser(user)
      expect(mockSentry.setUser).toHaveBeenCalledWith(user)
    })
  })
})
