/**
 * @file 错误报告服务
 * @description 集成 Sentry 进行前端错误监控，支持生产环境自动上报。
 *              动态 import + 单例懒加载：Sentry SDK 仅在启用时按需加载（首屏不增重），
 *              loadSentry() 缓存 promise，消除多处重复动态 import。
 * @module services/errorReporting
 */

/** 条件开关：仅生产环境且配置了 DSN 时启用上报 */
const SENTRY_ENABLED = import.meta.env.PROD && Boolean(import.meta.env.VITE_SENTRY_DSN)

/** 单例加载：缓存 @sentry/vue 动态导入的 promise，重复调用复用 */
let sentryPromise = null

/**
 * 按需加载 Sentry SDK
 * @returns {Promise<import('@sentry/vue')>} Sentry 命名空间
 */
function loadSentry() {
  if (!sentryPromise) {
    sentryPromise = import('@sentry/vue')
  }
  return sentryPromise
}

/**
 * 初始化错误监控
 * @description 在生产环境且配置了 Sentry DSN 时启用错误上报
 * @param {import('vue').App} app - Vue 应用实例
 * @param {import('vue-router').Router} router - Vue Router 实例
 */
export function initErrorReporting(app, router) {
  if (!SENTRY_ENABLED) {
    return
  }

  loadSentry().then((Sentry) => {
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
            if (ex.stacktrace?.frames) {
              ex.stacktrace.frames = ex.stacktrace.frames.filter(
                (frame) => !frame.filename?.includes('node_modules')
              )
            }
          }
        }
        return event
      }
    })
  })
}

/**
 * 手动捕获异常
 * @param {Error} error - 错误对象
 * @param {Object} [context={}] - 附加上下文信息
 */
export function captureException(error, context = {}) {
  if (!SENTRY_ENABLED) {
    return
  }
  loadSentry().then((Sentry) => {
    Sentry.captureException(error, { extra: context })
  })
}

/**
 * 手动发送消息
 * @param {string} message - 消息内容
 * @param {string} [level='info'] - 日志级别
 */
export function captureMessage(message, level = 'info') {
  if (!SENTRY_ENABLED) {
    return
  }
  loadSentry().then((Sentry) => {
    Sentry.captureMessage(message, /** @type {import('@sentry/vue').SeverityLevel} */ (level))
  })
}

/**
 * 设置用户上下文
 * @param {Object|null} user - 用户信息，传 null 清除
 */
export function setUser(user) {
  if (!SENTRY_ENABLED) {
    return
  }
  loadSentry().then((Sentry) => {
    Sentry.setUser(user)
  })
}