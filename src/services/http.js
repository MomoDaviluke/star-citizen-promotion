/**
 * @file HTTP 客户端
 * @description 封装 fetch API，提供统一的请求处理、错误处理和认证支持
 *              实现请求拦截、响应拦截、令牌刷新和自动重试机制
 * @module services/http
 * @requires vue
 */

// 从 Vue 导入响应式引用，用于追踪令牌刷新状态
import { ref } from 'vue'

/**
 * API 基础 URL
 * @description 所有 API 请求的前缀路径
 *              在生产环境由反向代理转发到后端服务
 * @type {string}
 */
const API_BASE_URL = '/api'

/**
 * 本地存储键名常量
 * @description 统一管理的 localStorage 键名，避免硬编码和命名冲突
 * @type {Object}
 */
const STORAGE_KEYS = {
  TOKEN: 'auth_token',    // 访问令牌存储键
  USER: 'auth_user',      // 用户信息存储键
  REFRESH: 'refresh_token' // 刷新令牌存储键（预留）
}

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
 *              刷新完成后，使用新令牌重试所有暂存请求
 * @type {Array<Function>}
 */
let refreshSubscribers = []

/**
 * 订阅令牌刷新事件
 * @description 将回调函数添加到订阅队列，等待令牌刷新完成
 * @param {Function} callback - 刷新成功后的回调函数，接收新令牌作为参数
 */
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

/**
 * 通知所有订阅者令牌已刷新
 * @description 遍历订阅队列，调用每个回调函数并传入新令牌
 *              完成后清空队列，释放内存
 * @param {string} token - 新的访问令牌
 */
function onRefreshed(token) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

/**
 * HTTP 请求客户端
 * @description 封装 fetch API 的核心请求函数，处理请求配置、认证头和错误处理
 * @param {string} endpoint - API 端点路径（如 '/auth/login'）
 * @param {Object} options - 请求选项，与 fetch API 的 options 参数兼容
 * @returns {Promise<Object>} 解析后的 JSON 响应数据
 * @throws {Error} 请求失败时抛出包含状态码和错误信息的异常
 */
async function http(endpoint, options = {}) {
  // 构建完整请求 URL，将端点路径与基础 URL 拼接
  const url = `${API_BASE_URL}${endpoint}`

  // 构建请求头，默认设置 Content-Type 为 JSON
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // HTTPOnly cookies are sent automatically with credentials: 'include'

  // 合并默认配置和用户传入的配置
  const config = {
    credentials: 'include',
    ...options,
    headers
  }

  try {
    // 执行 fetch 请求，这是现代浏览器内置的 HTTP 客户端 API
    const response = await fetch(url, config)

    // 解析响应体为 JSON 格式
    // 注意：即使响应状态码表示错误，也会尝试解析错误信息
    const data = await response.json()

    // 检查响应状态码，非 2xx 状态码表示请求失败
    if (!response.ok) {
      // 处理 401 未授权错误，尝试自动刷新令牌
      if (response.status === 401 && getStoredToken()) {
        return handleTokenRefresh(endpoint, options)
      }

      // 构建错误对象，包含状态码和服务器返回的错误信息
      const error = new Error(data.error || '请求失败')
      error.status = response.status
      error.data = data
      throw error
    }

    // 返回解析后的响应数据
    return data
  } catch (error) {
    // 网络错误或其他异常情况
    // 如果是 TypeError，通常是网络连接问题
    if (error instanceof TypeError) {
      error.message = '网络连接失败，请检查网络设置'
    }
    throw error
  }
}

/**
 * 处理令牌刷新
 * @description 当收到 401 响应时，尝试使用刷新令牌获取新的访问令牌
 *              使用队列机制避免并发刷新请求
 * @param {string} endpoint - 原始请求的端点路径
 * @param {Object} options - 原始请求的选项
 * @returns {Promise<Object>} 使用新令牌重试后的响应数据
 * @throws {Error} 刷新失败时抛出异常，要求用户重新登录
 */
async function handleTokenRefresh(endpoint, options) {
  // 如果正在刷新中，将当前请求加入等待队列
  if (isRefreshing.value) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        // 使用新令牌更新请求头，然后重试
        const newOptions = {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`
          }
        }
        resolve(http(endpoint, newOptions))
      })
    })
  }

  // 开始刷新流程
  isRefreshing.value = true

  try {
    // 调用刷新令牌接口
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`
      }
    })

    if (!refreshResponse.ok) {
      // 刷新失败，清除本地存储的认证信息，要求用户重新登录
      clearStoredToken()
      throw new Error('登录已过期，请重新登录')
    }

    // 解析刷新响应，获取新令牌
    const refreshData = await refreshResponse.json()
    const newToken = refreshData.data.token

    // 存储新令牌
    setStoredToken(newToken)

    // 通知所有等待的请求使用新令牌
    onRefreshed(newToken)

    // 使用新令牌重试原始请求
    const newOptions = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newToken}`
      }
    }
    return http(endpoint, newOptions)
  } catch (error) {
    // 刷新过程中发生错误，清除认证状态
    clearStoredToken()
    throw error
  } finally {
    // 无论成功失败，重置刷新状态
    isRefreshing.value = false
  }
}

/**
 * 存储访问令牌到本地存储
 * @description 使用 localStorage 持久化存储 JWT 访问令牌
 *              令牌在页面刷新后仍然有效，直到过期或被清除
 * @param {string} token - JWT 访问令牌
 */
function setStoredToken(token) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token)
}

/**
 * 从本地存储获取访问令牌
 * @description 读取持久化存储的 JWT 访问令牌
 * @returns {string|null} 访问令牌，如果不存在则返回 null
 */
function getStoredToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN)
}

/**
 * 清除本地存储的访问令牌
 * @description 用户登出或令牌过期时调用，清除认证状态
 */
function clearStoredToken() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
}

/**
 * 存储用户信息到本地存储
 * @description 将用户基本信息（如用户名、角色）存储在本地
 *              用于前端界面展示和权限判断
 * @param {Object} user - 用户对象
 */
function setStoredUser(user) {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
}

/**
 * 从本地存储获取用户信息
 * @description 读取并解析存储的用户信息
 * @returns {Object|null} 用户对象，如果不存在则返回 null
 */
function getStoredUser() {
  const user = localStorage.getItem(STORAGE_KEYS.USER)
  return user ? JSON.parse(user) : null
}

/**
 * HTTP 客户端对象
 * @description 提供便捷的 HTTP 方法封装和认证状态管理
 *              这是前端与后端通信的唯一入口，集中管理所有 API 调用
 */
export const httpClient = {
  /**
   * 发送 GET 请求
   * @param {string} endpoint - API 端点
   * @param {Object} params - URL 查询参数
   * @returns {Promise<Object>} 响应数据
   */
  get(endpoint, params = {}) {
    // 将查询参数对象转换为 URL 查询字符串
    const queryString = new URLSearchParams(params).toString()
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
   * 发送 DELETE 请求
   * @param {string} endpoint - API 端点
   * @returns {Promise<Object>} 响应数据
   */
  delete(endpoint) {
    return http(endpoint, { method: 'DELETE' })
  },

  // 认证状态管理方法
  setStoredToken,
  getStoredToken,
  clearStoredToken,
  setStoredUser,
  getStoredUser
}

export default httpClient
