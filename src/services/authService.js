/**
 * @file 认证服务
 * @description 用户认证相关 API 调用
 * @module services/authService
 */

import httpClient from './http.js'

/**
 * 认证服务 API
 */
export const authService = {
  /**
   * 用户注册
   * @param {Object} data - 注册数据
   * @param {string} data.username - 用户名
   * @param {string} data.email - 邮箱
   * @param {string} data.password - 密码
   * @returns {Promise<Object>} 注册结果
   */
  async register(data) {
    const response = await httpClient.post('/auth/register', data)
    if (response.success && response.data.token) {
      httpClient.setStoredToken(response.data.token)
      httpClient.setStoredUser(response.data.user)
    }
    return response
  },

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证
   * @param {string} credentials.email - 邮箱
   * @param {string} credentials.password - 密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(credentials) {
    const response = await httpClient.post('/auth/login', credentials)
    if (response.success && response.data.token) {
      httpClient.setStoredToken(response.data.token)
      httpClient.setStoredUser(response.data.user)
    }
    return response
  },

  /**
   * 用户登出
   */
  logout() {
    httpClient.clearStoredToken()
    window.dispatchEvent(new CustomEvent('auth:logout'))
  },

  /**
   * 获取当前用户信息
   * @returns {Promise<Object>} 用户信息
   */
  async getCurrentUser() {
    const response = await httpClient.get('/auth/me')
    if (response.success) {
      httpClient.setStoredUser(response.data)
    }
    return response
  },

  /**
   * 更新用户资料
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateProfile(data) {
    const response = await httpClient.put('/auth/profile', data)
    if (response.success) {
      httpClient.setStoredUser(response.data)
    }
    return response
  },

  /**
   * 修改密码
   * @param {Object} data - 密码数据
   * @param {string} data.currentPassword - 当前密码
   * @param {string} data.newPassword - 新密码
   * @returns {Promise<Object>} 修改结果
   */
  async changePassword(data) {
    return httpClient.put('/auth/password', data)
  },

  /**
   * 检查是否已登录
   * @returns {boolean} 是否已登录
   */
  isAuthenticated() {
    return !!httpClient.getStoredToken()
  },

  /**
   * 获取当前用户（从本地存储）
   * @returns {Object|null} 用户信息
   */
  getUser() {
    return httpClient.getStoredUser()
  }
}

export default authService
