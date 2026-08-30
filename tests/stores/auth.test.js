/**
 * @file 认证状态 Store 测试
 * @description 覆盖 login / logout / register / initializeAuth / hasPermission 状态流转
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock authService
vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn()
  }
}))

import { useAuthStore } from '@/stores/auth.js'
import { authService } from '@/services/authService'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const store = useAuthStore()

      expect(store.user).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.initialized).toBe(false)
      expect(store.isAuthenticated).toBe(false)
      expect(store.isAdmin).toBe(false)
    })
  })

  describe('login', () => {
    it('登录成功应该设置用户信息', async () => {
      const store = useAuthStore()
      const mockUser = { id: '1', username: 'test', role: 'member' }
      // authService.login 已解包 response.data，返回 { token, user }
      authService.login.mockResolvedValue({ user: mockUser, token: 'jwt-token' })

      await store.login({ email: 'test@test.com', password: '123' })

      expect(store.user).toEqual(mockUser)
      expect(store.isAuthenticated).toBe(true)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('登录失败应该设置错误信息', async () => {
      const store = useAuthStore()
      authService.login.mockRejectedValue(new Error('密码错误'))

      await expect(store.login({ email: 'test@test.com', password: 'wrong' }))
        .rejects.toThrow()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.loading).toBe(false)
    })

    it('登录过程中应该设置 loading 状态', async () => {
      const store = useAuthStore()
      let resolveLogin
      authService.login.mockReturnValue(new Promise(r => { resolveLogin = r }))

      const loginPromise = store.login({ email: 'test@test.com', password: '123' })
      expect(store.loading).toBe(true)

      resolveLogin({ user: { id: '1' } })
      await loginPromise
      expect(store.loading).toBe(false)
    })
  })

  describe('register', () => {
    it('注册成功应该返回结果', async () => {
      const store = useAuthStore()
      const mockResponse = { data: { user: { id: '1', username: 'newuser' } } }
      authService.register.mockResolvedValue(mockResponse)

      const result = await store.register({
        username: 'newuser',
        email: 'new@test.com',
        password: '123'
      })

      expect(result).toEqual(mockResponse)
      expect(store.loading).toBe(false)
    })

    it('注册失败应该设置错误信息', async () => {
      const store = useAuthStore()
      authService.register.mockRejectedValue(new Error('邮箱已存在'))

      await expect(store.register({
        username: 'user',
        email: 'existing@test.com',
        password: '123'
      })).rejects.toThrow()

      expect(store.loading).toBe(false)
    })
  })

  describe('logout', () => {
    it('登出应该清除用户信息', async () => {
      const store = useAuthStore()
      // 先登录
      store.user = { id: '1', username: 'test' }
      authService.logout.mockResolvedValue({})

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('登出接口失败时仍应清除本地状态', async () => {
      const store = useAuthStore()
      store.user = { id: '1', username: 'test' }
      authService.logout.mockRejectedValue(new Error('网络错误'))

      await store.logout()

      expect(store.user).toBeNull()
    })
  })

  describe('initializeAuth', () => {
    it('未登录时应该静默处理', async () => {
      const store = useAuthStore()
      authService.getProfile.mockRejectedValue(new Error('401'))

      await store.initializeAuth()

      expect(store.user).toBeNull()
      expect(store.initialized).toBe(true)
      expect(store.loading).toBe(false)
    })

    it('已登录时应该恢复用户信息', async () => {
      const store = useAuthStore()
      const mockUser = { id: '1', username: 'test', role: 'admin' }
      authService.getProfile.mockResolvedValue({ data: mockUser })

      await store.initializeAuth()

      expect(store.user).toEqual(mockUser)
      expect(store.initialized).toBe(true)
      expect(store.isAuthenticated).toBe(true)
    })

    it('重复调用应该跳过', async () => {
      const store = useAuthStore()
      store.initialized = true

      await store.initializeAuth()

      expect(authService.getProfile).not.toHaveBeenCalled()
    })
  })

  describe('hasPermission', () => {
    it('无 requiredRole 应该返回 true', () => {
      const store = useAuthStore()

      expect(store.hasPermission('')).toBe(true)
      expect(store.hasPermission('user')).toBe(true)
    })

    it('admin 权限检查应该正确', () => {
      const store = useAuthStore()

      // 普通用户
      store.user = { id: '1', role: 'member' }
      expect(store.hasPermission('admin')).toBe(false)

      // 管理员
      store.user = { id: '1', role: 'admin' }
      expect(store.hasPermission('admin')).toBe(true)
    })
  })

  describe('计算属性', () => {
    it('isAdmin 应该在 role=admin 时返回 true', () => {
      const store = useAuthStore()

      store.user = { id: '1', role: 'admin' }
      expect(store.isAdmin).toBe(true)

      store.user = { id: '1', role: 'member' }
      expect(store.isAdmin).toBe(false)
    })

    it('userName 应该返回用户名', () => {
      const store = useAuthStore()

      store.user = { id: '1', username: 'ace_pilot' }
      expect(store.userName).toBe('ace_pilot')

      store.user = null
      expect(store.userName).toBe('')
    })

    it('userRole 应该返回角色', () => {
      const store = useAuthStore()

      store.user = { id: '1', role: 'officer' }
      expect(store.userRole).toBe('officer')

      store.user = null
      expect(store.userRole).toBe('user')
    })
  })
})
