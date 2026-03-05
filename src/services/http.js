/**
 * @file HTTP 客户端
 * @description 封装 fetch API，提供统一的请求处理、错误处理和认证支持
 * @module services/http
 */

import { ref } from 'vue'

const API_BASE_URL = '/api'

const isRefreshing = ref(false)
let refreshSubscribers = []

/**
 * 订阅令牌刷新
 * @param {Function} callback - 刷新成功后的回调函数
 */
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

/**
 * 通知所有订阅者令牌已刷新
 * @param {string} token - 新的访问令牌
 */
function onRefreshed(token) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

/**
 * 获取存储的认证令牌
 * @returns {string|null} 存储的令牌或 null
 */
function getStoredToken() {
  return localStorage.getItem('auth_token')
}

/**
 * 存储认证令牌
 * @param {string} token - 要存储的令牌
 */
function setStoredToken(token) {
  localStorage.setItem('auth_token', token)
}

/**
 * 清除存储的认证令牌
 */
function clearStoredToken() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_info')
}

/**
 * 获取存储的用户信息
 * @returns {Object|null} 用户信息对象或 null
 */
function getStoredUser() {
  const user = localStorage.getItem('user_info')
  return user ? JSON.parse(user) : null
}

/**
 * 存储用户信息
 * @param {Object} user - 用户信息对象
 */
function setStoredUser(user) {
  localStorage.setItem('user_info', JSON.stringify(user))
}

/**
 * 刷新访问令牌
 * @returns {Promise<string>} 新的访问令牌
 */
async function refreshToken() {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    clearStoredToken()
    throw new Error('令牌刷新失败')
  }

  const data = await response.json()
  if (data.success && data.data.token) {
    setStoredToken(data.data.token)
    return data.data.token
  }

  throw new Error('令牌刷新失败')
}

/**
 * HTTP 请求客户端
 * @param {string} endpoint - API 端点路径
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} 响应数据
 */
async function http(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  const token = getStoredToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers
  }

  try {
    const response = await fetch(url, config)

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401 && token) {
        if (!isRefreshing.value) {
          isRefreshing.value = true
          try {
            const newToken = await refreshToken()
            onRefreshed(newToken)
            headers['Authorization'] = `Bearer ${newToken}`
            const retryResponse = await fetch(url, { ...config, headers })
            return retryResponse.json()
          } catch {
            clearStoredToken()
            window.dispatchEvent(new CustomEvent('auth:logout'))
            throw new Error('认证已过期，请重新登录')
          } finally {
            isRefreshing.value = false
          }
        } else {
          return new Promise((resolve) => {
            subscribeTokenRefresh(async (newToken) => {
              headers['Authorization'] = `Bearer ${newToken}`
              const retryResponse = await fetch(url, { ...config, headers })
              resolve(retryResponse.json())
            })
          })
        }
      }

      const error = new Error(data.error || '请求失败')
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('网络连接失败，请检查网络设置')
    }
    throw error
  }
}

/**
 * GET 请求
 * @param {string} endpoint - API 端点路径
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 响应数据
 */
function get(endpoint, params = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value)
    }
  })

  const queryString = searchParams.toString()
  const url = queryString ? `${endpoint}?${queryString}` : endpoint

  return http(url, { method: 'GET' })
}

/**
 * POST 请求
 * @param {string} endpoint - API 端点路径
 * @param {Object} body - 请求体数据
 * @returns {Promise<Object>} 响应数据
 */
function post(endpoint, body = {}) {
  return http(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

/**
 * PUT 请求
 * @param {string} endpoint - API 端点路径
 * @param {Object} body - 请求体数据
 * @returns {Promise<Object>} 响应数据
 */
function put(endpoint, body = {}) {
  return http(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

/**
 * PATCH 请求
 * @param {string} endpoint - API 端点路径
 * @param {Object} body - 请求体数据
 * @returns {Promise<Object>} 响应数据
 */
function patch(endpoint, body = {}) {
  return http(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

/**
 * DELETE 请求
 * @param {string} endpoint - API 端点路径
 * @returns {Promise<Object>} 响应数据
 */
function del(endpoint) {
  return http(endpoint, { method: 'DELETE' })
}

export const httpClient = {
  get,
  post,
  put,
  patch,
  delete: del,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getStoredUser,
  setStoredUser
}

export default httpClient
