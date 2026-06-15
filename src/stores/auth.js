/**
 * 认证状态管理 Store
 * @description 管理用户认证状态、用户信息、权限等
 *              认证采用 httpOnly cookie 机制，Token 由浏览器自动管理
 *              用户信息仅保存在 Pinia store 内存中，页面刷新时通过 /auth/me 重新获取
 * @module stores/auth
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  // ========== 状态定义 ==========
  // 用户信息仅保存在内存中，不使用 localStorage
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)

  // ========== 计算属性 ==========
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userName = computed(() => user.value?.username || '')
  const userRole = computed(() => user.value?.role || 'user')
  const userAvatar = computed(() => user.value?.avatar || '')

  // ========== 方法定义 ==========

  /**
   * 初始化认证状态
   * @description 应用启动时调用，通过 /auth/me 接口恢复用户信息
   *              httpOnly cookie 由浏览器自动携带，无需前端管理 Token
   * @returns {Promise<void>}
   */
  async function initializeAuth() {
    if (initialized.value) return

    loading.value = true
    try {
      const response = await authService.getProfile()
      user.value = response.data
    } catch {
      // 未登录或 Token 过期，静默处理
      user.value = null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证
   * @param {string} credentials.email - 邮箱
   * @param {string} credentials.password - 密码
   * @returns {Promise<Object>} 登录结果
   */
  async function login(credentials) {
    loading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      // 后端通过 Set-Cookie 设置 httpOnly cookie，前端无需手动存储 Token
      user.value = response.data.user
      return response
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err))
      error.value = errObj.message || '登录失败'
      throw errObj
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Promise<Object>} 注册结果
   */
  async function register(userData) {
    loading.value = true
    error.value = null

    try {
      const response = await authService.register(userData)
      return response
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err))
      error.value = errObj.message || '注册失败'
      throw errObj
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户登出
   * @description 调用后端 /auth/logout 清除 httpOnly cookie
   */
  async function logout() {
    try {
      await authService.logout()
    } catch {
      // Ignored
    } finally {
      user.value = null
      // httpOnly cookie 由后端清除，前端无需操作 localStorage
    }
  }

  /**
   * 获取当前用户信息
   * @description 通过 /auth/me 接口获取最新用户信息
   *              httpOnly cookie 由浏览器自动携带
   * @returns {Promise<Object>} 用户信息
   */
  async function fetchUser() {
    if (!isAuthenticated.value && !initialized.value) return null

    loading.value = true
    try {
      const response = await authService.getProfile()
      user.value = response.data
      return response
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err))
      error.value = errObj.message || '获取用户信息失败'
      if (errObj.status === 401) {
        user.value = null
      }
      throw errObj
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新用户信息
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async function updateProfile(updates) {
    loading.value = true
    error.value = null

    try {
      const response = await authService.updateProfile(updates)
      user.value = { ...user.value, ...response.user }
      return response
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err))
      error.value = errObj.message || '更新失败'
      throw errObj
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除错误状态
   */
  function clearError() {
    error.value = null
  }

  /**
   * 检查权限
   * @param {string} requiredRole - 所需权限
   * @returns {boolean} 是否有权限
   */
  function hasPermission(requiredRole) {
    if (!requiredRole || requiredRole === 'user') return true
    if (requiredRole === 'admin') return isAdmin.value
    return false
  }

  // 返回所有状态和方法
  return {
    // 状态
    user,
    loading,
    error,
    initialized,

    // 计算属性
    isAuthenticated,
    isAdmin,
    userName,
    userRole,
    userAvatar,

    // 方法
    initializeAuth,
    login,
    register,
    logout,
    fetchUser,
    updateProfile,
    clearError,
    hasPermission
  }
})
