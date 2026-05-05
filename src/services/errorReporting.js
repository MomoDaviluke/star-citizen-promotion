/**
 * @file 错误报告服务
 * @description 集成 Sentry 进行前端错误监控，支持生产环境自动上报
 * @module services/errorReporting
 */

/**
 * 初始化错误监控
 * @description 在生产环境且配置了 Sentry DSN 时启用错误上报
 * @param {import('vue').App} app - Vue 应用实例
 * @param {import('vue-router').Router} router - Vue Router 实例
 */
export function initErrorReporting(app, router) {
  const dsn = import.meta.env.VITE_SENTRY_DSN

  if (!import.meta.env.PROD || !dsn) {
    return
  }

  import('@sentry/vue').then((Sentry) => {
    Sentry.init({
      app,
      dsn,
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
  })
}

/**
 * 手动捕获异常
 * @param {Error} error - 错误对象
 * @param {Object} [context={}] - 附加上下文信息
 */
export function captureException(error, context = {}) {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/vue').then((Sentry) => {
      Sentry.captureException(error, { extra: context })
    })
  }
}

/**
 * 手动发送消息
 * @param {string} message - 消息内容
 * @param {string} [level='info'] - 日志级别
 */
export function captureMessage(message, level = 'info') {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/vue').then((Sentry) => {
      Sentry.captureMessage(message, level)
    })
  }
}

/**
 * 设置用户上下文
 * @param {Object|null} user - 用户信息，传 null 清除
 */
export function setUser(user) {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/vue').then((Sentry) => {
      Sentry.setUser(user)
    })
  }
}
