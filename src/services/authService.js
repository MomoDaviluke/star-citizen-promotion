/**
 * 认证服务模块
 * @description 封装所有认证相关的 API 调用（登录、注册、令牌管理等）
 *              认证采用 httpOnly cookie 机制，Token 由浏览器自动携带
 *              前端不存储 Token，用户信息由 Pinia store 管理
 * @module services/authService
 */

import httpClient from './http.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('AuthService')

const BASE_URL = '/api/auth'

/**
 * 用户登录
 * @param {Object} credentials - 登录凭证
 * @param {string} credentials.email - 邮箱
 * @param {string} credentials.password - 密码
 * @returns {Promise<Object>} 包含 token 和 user 的响应
 */
async function login(credentials) {
  if (!credentials?.email || !credentials?.password) {
    throw new Error('邮箱和密码不能为空')
  }

  try {
    const response = await httpClient.post(`${BASE_URL}/login`, credentials)
    // 后端通过 Set-Cookie 设置 httpOnly cookie，前端无需手动存储 Token
    return response.data
  } catch (err) {
    // 将 unknown 类型的 err 断言为 Error，确保可以安全访问 message 和 response
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('登录失败:', error.message)
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
    // 后端通过 Set-Cookie 设置 httpOnly cookie，前端无需手动存储 Token
    return response.data
  } catch (err) {
    // 将 unknown 类型的 err 断言为 Error，确保可以安全访问 message 和 response
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('注册失败:', error.message)
    throw error
  }
}

/**
 * 获取当前用户信息
 * @description 通过 httpOnly cookie 自动携带认证信息
 * @returns {Promise<Object>} 用户信息
 */
async function getProfile() {
  try {
    const response = await httpClient.get(`${BASE_URL}/me`)
    return response
  } catch (err) {
    // 将 unknown 类型的 err 断言为 Error，确保可以安全访问 message 和 response
    const error = err instanceof Error ? err : new Error(String(err))
    logger.warn('获取用户信息失败:', error.message)
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
    const response = await httpClient.put(`${BASE_URL}/profile`, updates)
    return response.data
  } catch (err) {
    // 将 unknown 类型的 err 断言为 Error，确保可以安全访问 message 和 response
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('更新用户信息失败:', error.message)
    throw error
  }
}

/**
 * 用户登出
 * @description 调用后端 /auth/logout 清除 httpOnly cookie
 * @returns {Promise<void>}
 */
async function logout() {
  try {
    await httpClient.post(`${BASE_URL}/logout`)
  } catch (err) {
    // 将 unknown 类型的 err 断言为 Error，确保可以安全访问 message 和 response
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('登出请求失败:', error.message)
  } finally {
    window.dispatchEvent(new CustomEvent('auth:logout'))
  }
}

/**
 * 刷新访问令牌
 * @description 通过 httpOnly cookie 自动携带旧 Token 进行刷新
 * @returns {Promise<Object>} 新的访问令牌
 */
async function refreshToken() {
  try {
    const response = await httpClient.post(`${BASE_URL}/refresh`)
    return response.data
  } catch (err) {
    // 将 unknown 类型的 err 断言为 Error，确保可以安全访问 message 和 response
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('刷新令牌失败:', error.message)
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
  } catch (err) {
    // 将 unknown 类型的 err 断言为 Error，确保可以安全访问 message 和 response
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('密码重置请求失败:', error.message)
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
  } catch (err) {
    // 将 unknown 类型的 err 断言为 Error，确保可以安全访问 message 和 response
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('密码重置失败:', error.message)
    throw error
  }
}

/**
 * 修改密码
 * @param {Object} passwords - 密码数据
 * @param {string} passwords.currentPassword - 当前密码
 * @param {string} passwords.newPassword - 新密码
 * @returns {Promise<Object>} 修改结果
 */
async function changePassword(passwords) {
  try {
    const response = await httpClient.put(`${BASE_URL}/password`, passwords)
    return response
  } catch (err) {
    // 将 unknown 类型的 err 断言为 Error，确保可以安全访问 message 和 response
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('修改密码失败:', error.message)
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
  resetPassword,
  changePassword
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
  changePassword,
  authService
}

export default authService
