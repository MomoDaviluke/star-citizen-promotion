/**
 * @file 错误报告服务
 * @description 集成 Sentry 进行前端错误监控，支持生产环境自动上报。
 *              通过 getSentry() 单例统一获取 Sentry 实例，避免重复动态 import。
 * @module services/errorReporting
 * @version 1.1
 */

/**
 * Sentry 实例缓存（null 表示已尝试加载但不可用）
 * @type {Promise<typeof import('@sentry/vue') | null> | null}
 */
let sentryLoadPromise = null

/**
 * 获取 Sentry 单例
 * @description 非生产环境或无 DSN 时返回 null；首次调用触发动态 import 并缓存 Promise，
 *              后续调用直接返回缓存的 Promise，避免重复加载。
 * @returns {Promise<typeof import('@sentry/vue') | null>} Sentry 模块或 null
 */
function getSentry() {
  // 非生产环境或未配置 DSN，直接返回 null
  if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) {
    return Promise.resolve(null)
  }

  // 首次调用：发起动态 import 并缓存 Promise
  if (sentryLoadPromise === null) {
    sentryLoadPromise = import('@sentry/vue').catch((err) => {
      // 加载失败时记录错误并缓存 null，避免重复尝试
      console.error('[errorReporting] Sentry 加载失败:', err)
      sentryLoadPromise = Promise.resolve(null)
      return null
    })
  }

  return sentryLoadPromise
}

/**
 * 初始化错误监控
 * @description 在生产环境且配置了 Sentry DSN 时启用错误上报
 * @param {import('vue').App} app - Vue 应用实例
 * @param {import('vue-router').Router} router - Vue Router 实例
 * @returns {Promise<void>}
 */
export async function initErrorReporting(app, router) {
  const Sentry = await getSentry()
  if (!Sentry) return

  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false
      })
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (event.exception) {
        const values = event.exception.values || []
        for (const ex of values) {
          if (ex.stacktrace) {
            ex.stacktrace.frames = ex.stacktrace.frames.filter(
              (frame) => !frame.filename?.includes('node_modules')
            )
          }
        }
      }
      return event
    }
  })
}

/**
 * 手动捕获异常
 * @param {Error} error - 错误对象
 * @param {Object} [context={}] - 附加上下文信息
 * @returns {Promise<void>}
 */
export async function captureException(error, context = {}) {
  const Sentry = await getSentry()
  if (!Sentry) return
  Sentry.captureException(error, { extra: context })
}

/**
 * 手动发送消息
 * @param {string} message - 消息内容
 * @param {string} [level='info'] - 日志级别
 * @returns {Promise<void>}
 */
export async function captureMessage(message, level = 'info') {
  const Sentry = await getSentry()
  if (!Sentry) return
  Sentry.captureMessage(message, level)
}

/**
 * 设置用户上下文
 * @param {Object|null} user - 用户信息，传 null 清除
 * @returns {Promise<void>}
 */
export async function setUser(user) {
  const Sentry = await getSentry()
  if (!Sentry) return
  Sentry.setUser(user)
}
