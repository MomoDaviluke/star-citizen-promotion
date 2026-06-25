/**
 * @file 认证状态管理 Store
 * @description 管理用户认证状态、用户信息、权限等
 *              认证采用 httpOnly cookie 机制，Token 由浏览器自动管理
 *              用户信息仅保存在 Pinia store 内存中，页面刷新时通过 /auth/me 重新获取
 * @module stores/auth
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'
import { createStoreHelpers } from '@/utils/storeHelpers'

export const useAuthStore = defineStore('auth', () => {
  // ========== 状态定义 ==========
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)

  const { withLoading } = createStoreHelpers(loading, error)

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
   */
  async function initializeAuth() {
    if (initialized.value) return

    loading.value = true
    try {
      const response = await authService.getProfile()
      user.value = response.data
    } catch {
      user.value = null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  /** 用户登录 */
  async function login(credentials) {
    return withLoading(async () => {
      const response = await authService.login(credentials)
      user.value = response.data.user
      return response
    }, '登录失败')
  }

  /** 用户注册 */
  async function register(userData) {
    return withLoading(() => authService.register(userData), '注册失败')
  }

  /** 用户登出 — 调用后端清除 httpOnly cookie */
  async function logout() {
    try { await authService.logout() } catch { /* ignored */ }
    finally { user.value = null }
  }

  /** 获取当前用户信息 */
  async function fetchUser() {
    if (!isAuthenticated.value && !initialized.value) return null

    return withLoading(async () => {
      const response = await authService.getProfile()
      user.value = response.data
      return response
    }, '获取用户信息失败')
  }

  /** 更新用户信息 */
  async function updateProfile(updates) {
    return withLoading(async () => {
      const response = await authService.updateProfile(updates)
      user.value = { ...user.value, ...response.user }
      return response
    }, '更新失败')
  }

  /** 清除错误状态 */
  function clearError() { error.value = null }

  /** 检查权限 */
  function hasPermission(requiredRole) {
    if (!requiredRole || requiredRole === 'user') return true
    if (requiredRole === 'admin') return isAdmin.value
    return false
  }

  return {
    user, loading, error, initialized,
    isAuthenticated, isAdmin, userName, userRole, userAvatar,
    initializeAuth, login, register, logout, fetchUser, updateProfile, clearError, hasPermission
  }
})
