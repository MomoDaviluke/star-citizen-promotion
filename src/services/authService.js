/**
 * 认证服务模块
 * @description 封装所有认证相关的 API 调用（登录、注册、令牌管理等）
 * @module services/authService
 * @author Full-stack Team
 */

import httpClient from './http.js'

const BASE_URL = '/api/auth'

/**
 * 用户登录
 * @param {Object} credentials - 登录凭证
 * @param {string} credentials.username - 用户名
 * @param {string} credentials.password - 密码
 * @returns {Promise<Object>} 包含 token 和 user 的响应
 */
async function login(credentials) {
  if (!credentials?.username || !credentials?.password) {
    throw new Error('用户名和密码不能为空')
  }

  try {
    const response = await httpClient.post(`${BASE_URL}/login`, credentials)
    return response.data
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 用户注册
 * @param {Object} userData - 用户注册数据
 * @param {string} userData.username - 用户名
 * @param {string} userData.email - 邮箱
 * @param {string} userData.password - 密码
 * @returns {Promise<Object>} 注册结果
 */
async function register(userData) {
  if (!userData?.username || !userData?.email || !userData?.password) {
    throw new Error('注册信息不完整')
  }

  try {
    const response = await httpClient.post(`${BASE_URL}/register`, userData)
    return response.data
  } catch (error) {
    console.error('注册失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 获取当前用户信息
 * @returns {Promise<Object>} 用户信息
 */
async function getProfile() {
  try {
    const response = await httpClient.get(`${BASE_URL}/profile`)
    return response.data
  } catch (error) {
    console.error('获取用户信息失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 更新用户信息
 * @param {Object} updates - 要更新的用户数据
 * @returns {Promise<Object>} 更新后的用户信息
 */
async function updateProfile(updates) {
  try {
    const response = await httpClient.patch(`${BASE_URL}/profile`, updates)
    return response.data
  } catch (error) {
    console.error('更新用户信息失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 用户登出（服务端使令牌失效）
 * @returns {Promise<void>}
 */
async function logout() {
  try {
    await httpClient.post(`${BASE_URL}/logout`)
  } catch (error) {
    console.error('登出请求失败:', error.response?.data || error.message)
    // 即使服务端失败，客户端仍应清除本地状态
  }
}

/**
 * 刷新访问令牌
 * @param {string} refreshToken - 刷新令牌
 * @returns {Promise<Object>} 新的访问令牌
 */
async function refreshToken(refreshToken) {
  if (!refreshToken) {
    throw new Error('刷新令牌不能为空')
  }

  try {
    const response = await httpClient.post(`${BASE_URL}/refresh`, { refreshToken })
    return response.data
  } catch (error) {
    console.error('刷新令牌失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 请求密码重置
 * @param {string} email - 用户邮箱
 * @returns {Promise<Object>} 请求结果
 */
async function requestPasswordReset(email) {
  if (!email) {
    throw new Error('邮箱不能为空')
  }

  try {
    const response = await httpClient.post(`${BASE_URL}/password-reset`, { email })
    return response.data
  } catch (error) {
    console.error('密码重置请求失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 重置密码
 * @param {string} token - 重置令牌
 * @param {string} newPassword - 新密码
 * @returns {Promise<Object>} 重置结果
 */
async function resetPassword(token, newPassword) {
  if (!token || !newPassword) {
    throw new Error('令牌和新密码不能为空')
  }

  try {
    const response = await httpClient.post(`${BASE_URL}/password-reset/${token}`, { password: newPassword })
    return response.data
  } catch (error) {
    console.error('密码重置失败:', error.response?.data || error.message)
    throw error
  }
}

const authService = {
  login,
  register,
  getProfile,
  updateProfile,
  logout,
  refreshToken,
  requestPasswordReset,
  resetPassword
}

export {
  login,
  register,
  getProfile,
  updateProfile,
  logout,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  authService
}
