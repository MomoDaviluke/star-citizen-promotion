/**
 * @file 应用配置模块
 * @description 集中管理应用的全局配置，包括服务器、AI 服务、WebSocket 等各项参数
 * @module config
 */

/**
 * 应用全局配置对象
 * @description 包含服务器、AI 服务、后端服务、WebSocket 等配置项
 * @type {Object}
 * @property {Object} server - 服务器相关配置
 * @property {number} server.port - 服务器端口
 * @property {string} server.host - 服务器主机地址
 * @property {string} server.apiPrefix - API 路由前缀
 * @property {Object} ai - AI 服务配置
 * @property {number} ai.timeout - 请求超时时间（毫秒）
 * @property {number} ai.maxRetries - 最大重试次数
 * @property {number} ai.maxConcurrent - 最大并发数
 * @property {Object} services - 各服务端点配置
 * @property {Object} services.backend - 后端服务配置
 * @property {Object} services.ai - AI 服务配置
 * @property {Object} services.websocket - WebSocket 服务配置
 * @property {Object} app - 应用元信息
 */
const CONFIG = {
  server: {
    port: parseInt(import.meta.env.VITE_SERVER_PORT || '3000', 10),
    host: import.meta.env.VITE_SERVER_HOST || 'localhost',
    apiPrefix: import.meta.env.VITE_API_PREFIX || '/api'
  },

  ai: {
    timeout: parseInt(import.meta.env.VITE_AI_TIMEOUT || '30000', 10),
    maxRetries: parseInt(import.meta.env.VITE_AI_MAX_RETRIES || '3', 10),
    maxConcurrent: parseInt(import.meta.env.VITE_AI_MAX_CONCURRENT || '3', 10)
  },

  services: {
    backend: {
      port: parseInt(import.meta.env.VITE_BACKEND_PORT || '3001', 10),
      host: import.meta.env.VITE_BACKEND_HOST || 'localhost',
      baseUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    },
    ai: {
      port: parseInt(import.meta.env.VITE_AI_SERVICE_PORT || '3002', 10),
      host: import.meta.env.VITE_AI_SERVICE_HOST || 'localhost',
      baseUrl: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3002'
    },
    websocket: {
      port: parseInt(import.meta.env.VITE_WS_PORT || '3003', 10),
      host: import.meta.env.VITE_WS_HOST || 'localhost',
      url: import.meta.env.VITE_WS_URL || 'ws://localhost:3003'
    }
  },

  app: {
    name: 'Star Citizen Promotion',
    version: '1.0.0',
    environment: import.meta.env.VITE_APP_ENV || 'development'
  }
}

/**
 * 构建完整的 API 请求 URL
 * @description 根据后端服务配置和 API 前缀，生成完整的 API 端点地址
 * @param {string} endpoint - API 端点路径（如 '/users'）
 * @returns {string} 完整的 API URL
 * @example
 * const url = getApiUrl('/users')
 * // 返回: 'http://localhost:3001/api/users'
 */
export const getApiUrl = (endpoint) => {
  const baseUrl = CONFIG.services.backend.baseUrl
  const prefix = CONFIG.server.apiPrefix
  return `${baseUrl}${prefix}${endpoint}`
}

/**
 * 获取 WebSocket 连接地址
 * @description 返回配置的 WebSocket 服务 URL
 * @returns {string} WebSocket 连接地址
 * @example
 * const wsUrl = getWsUrl()
 * // 返回: 'ws://localhost:3003'
 */
export const getWsUrl = () => {
  return CONFIG.services.websocket.url
}

/**
 * 构建 AI 服务请求 URL
 * @description 根据 AI 服务配置生成完整的请求地址
 * @param {string} endpoint - AI 服务端点路径
 * @returns {string} 完整的 AI 服务 URL
 * @example
 * const url = getAiServiceUrl('/generate')
 * // 返回: 'http://localhost:3002/generate'
 */
export const getAiServiceUrl = (endpoint) => {
  const baseUrl = CONFIG.services.ai.baseUrl
  return `${baseUrl}${endpoint}`
}

export default CONFIG
