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
      // 生产环境错误日志静默输出，避免泄露敏感信息到浏览器控制台
      // 建议生产环境接入 Sentry 等错误监控服务进行上报
      if (isDev) {
        console.error(...formatMsg(module, ...args))
      }
    },
    debug(...args) {
      if (isDev) console.debug(...formatMsg(module, ...args))
    }
  }
}