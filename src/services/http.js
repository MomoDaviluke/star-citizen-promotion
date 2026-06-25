/**
 * @file HTTP 客户端
 * @description 封装 fetch API，提供统一的请求处理、错误处理和认证支持
 *              认证采用 httpOnly cookie 机制，Token 由浏览器自动携带，前端无法读取
 *              实现请求拦截、响应拦截、令牌刷新和自动重试机制
 * @module services/http
 * @requires vue
 */

import { ref } from 'vue'

/**
 * API 基础 URL
 * @description 所有 API 请求的前缀路径
 *              在生产环境由反向代理转发到后端服务
 * @type {string}
 */
const API_BASE_URL = '/api'

/**
 * 令牌刷新状态标志
 * @description 使用 Vue ref 实现响应式，便于组件监听刷新状态
 *              防止并发请求时重复刷新令牌
 * @type {import('vue').Ref<boolean>}
 */
const isRefreshing = ref(false)

/**
 * 刷新令牌订阅者队列
 * @description 当令牌刷新进行时，后续请求会被暂存到此队列
 *              刷新完成后，重试所有暂存请求
 * @type {Array<Function>}
 */
let refreshSubscribers = []

/**
 * 订阅令牌刷新事件
 * @description 将回调函数添加到订阅队列，等待令牌刷新完成
 * @param {Function} callback - 刷新成功后的回调函数
 */
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

/**
 * 通知所有订阅者令牌已刷新
 * @description 遍历订阅队列，调用每个回调函数
 *              完成后清空队列，释放内存
 */
function onRefreshed() {
  refreshSubscribers.forEach((callback) => callback())
  refreshSubscribers = []
}

/**
 * HTTP 请求客户端
 * @description 封装 fetch API 的核心请求函数，处理请求配置和错误处理
 *              认证通过 httpOnly cookie 自动携带，无需手动设置 Authorization header
 * @param {string} endpoint - API 端点路径（如 '/auth/login'）
 * @param {Object} options - 请求选项，与 fetch API 的 options 参数兼容
 * @param {boolean} [options._isRetry] - 内部标记，标识是否为刷新后重试
 * @returns {Promise<Object>} 解析后的 JSON 响应数据
 * @throws {Error} 请求失败时抛出包含状态码和错误信息的异常
 */
async function http(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // credentials: 'include' 确保 httpOnly cookie 随请求自动发送
  const config = {
    credentials: 'include',
    ...options,
    headers
  }

  try {
    const response = await fetch(url, config)

    // 先读取响应文本，避免空响应体导致 JSON 解析崩溃
    const text = await response.text()

    // 解析 JSON：空响应体或解析失败均做友好降级
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        const error = new Error('服务响应格式异常，请确认后端服务是否正常运行')
        error.status = response.status || 502
        error.isApiError = true
        throw error
      }
    }

    // 空响应体且状态码非 2xx，说明后端服务不可达
    if (!text && !response.ok) {
      const error = new Error('后端服务暂不可用，请确认服务已启动')
      error.status = response.status || 503
      error.isApiError = true
      throw error
    }

    if (!response.ok) {
      // 处理 401 未授权错误，尝试自动刷新令牌（仅限首次，防止无限递归）
      if (response.status === 401 && !endpoint.includes('/auth/') && !options._isRetry) {
        return handleTokenRefresh(endpoint, { ...options, _isRetry: true })
      }

      const error = new Error(data?.error || data?.message || '请求失败')
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  } catch (err) {
    // 将 unknown 类型的 err 断言为 Error，确保可以安全访问 message 和 instanceof
    const error = err instanceof Error ? err : new Error(String(err))
    // 跳过已标记的 API 错误（避免重复包装）
    if (!error.isApiError && error instanceof TypeError) {
      error.message = '网络连接失败，请检查网络设置'
    }
    throw error
  }
}

/**
 * 处理令牌刷新
 * @description 当收到 401 响应时，尝试通过 cookie 刷新令牌
 *              使用队列机制避免并发刷新请求
 *              刷新请求本身通过 httpOnly cookie 自动携带旧 Token
 * @param {string} endpoint - 原始请求的端点路径
 * @param {Object} options - 原始请求的选项
 * @returns {Promise<Object>} 重试后的响应数据
 * @throws {Error} 刷新失败时抛出异常，要求用户重新登录
 */
async function handleTokenRefresh(endpoint, options) {
  // 如果正在刷新中，将当前请求加入等待队列
  if (isRefreshing.value) {
    return new Promise((resolve) => {
      subscribeTokenRefresh(() => {
        resolve(http(endpoint, options))
      })
    })
  }

  // 开始刷新流程
  isRefreshing.value = true

  try {
    // 刷新请求通过 httpOnly cookie 自动携带认证信息
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!refreshResponse.ok) {
      // 刷新失败，通知应用需要重新登录
      window.dispatchEvent(new CustomEvent('auth:session-expired'))
      throw new Error('登录已过期，请重新登录')
    }

    // 通知所有等待的请求重试
    onRefreshed()

    // 重试原始请求
    return http(endpoint, options)
  } catch (error) {
    // 刷新过程中发生错误，通知应用
    window.dispatchEvent(new CustomEvent('auth:session-expired'))
    throw error
  } finally {
    isRefreshing.value = false
  }
}

/**
 * HTTP 客户端对象
 * @description 提供便捷的 HTTP 方法封装
 *              这是前端与后端通信的唯一入口，集中管理所有 API 调用
 *              认证完全依赖 httpOnly cookie，前端不存储 Token
 */
export const httpClient = {
  /**
   * 发送 GET 请求
   * @param {string} endpoint - API 端点
   * @param {Object} params - URL 查询参数（自动过滤 undefined/null 值，支持嵌套对象序列化）
   * @returns {Promise<Object>} 响应数据
   */
  get(endpoint, params = {}) {
    const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        // 嵌套对象序列化为 JSON 字符串，后端需 JSON.parse 解析
        acc[key] = typeof value === 'object' ? JSON.stringify(value) : value
      }
      return acc
    }, {})

    const queryString = new URLSearchParams(filteredParams).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return http(url, { method: 'GET' })
  },

  /**
   * 发送 POST 请求
   * @param {string} endpoint - API 端点
   * @param {Object} data - 请求体数据
   * @returns {Promise<Object>} 响应数据
   */
  post(endpoint, data) {
    return http(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * 发送 PUT 请求
   * @param {string} endpoint - API 端点
   * @param {Object} data - 请求体数据
   * @returns {Promise<Object>} 响应数据
   */
  put(endpoint, data) {
    return http(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  /**
   * 发送 PATCH 请求
   * @param {string} endpoint - API 端点
   * @param {Object} data - 请求体数据
   * @returns {Promise<Object>} 响应数据
   */
  patch(endpoint, data) {
    return http(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  },

  /**
   * 发送 DELETE 请求
   * @param {string} endpoint - API 端点
   * @returns {Promise<Object>} 响应数据
   */
  delete(endpoint) {
    return http(endpoint, { method: 'DELETE' })
  }
}

export default httpClient
