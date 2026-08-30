/**
 * 前端日志工具
 * @description 统一前端日志输出，开发环境输出到控制台，生产环境静默
 * @module utils/logger
 */

const isDev = import.meta.env.DEV

function formatMsg(module, ...args) {
  return [`[${module}]`, ...args]
}

export function createLogger(module = 'App') {
  return {
    info(...args) {
      if (isDev) console.info(...formatMsg(module, ...args))
    },
    warn(...args) {
      if (isDev) console.warn(...formatMsg(module, ...args))
    },
    error(...args) {
      // 生产环境保留 error 级别输出，确保异常可被 Sentry 等监控捕获
      // 同时避免 info/warn 级别日志泄露到浏览器控制台
      console.error(...formatMsg(module, ...args))
    },
    debug(...args) {
      if (isDev) console.debug(...formatMsg(module, ...args))
    }
  }
}