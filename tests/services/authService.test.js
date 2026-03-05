/**
 * @file 认证服务测试
 * @description 测试 authService 功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authService } from '@/services/authService.js'
import httpClient from '@/services/http.js'

vi.mock('@/services/http.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    setStoredToken: vi.fn(),
    setStoredUser: vi.fn(),
    getStoredToken: vi.fn(),
    getStoredUser: vi.fn(),
    clearStoredToken: vi.fn()
  }
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('register', () => {
    it('应成功注册并存储令牌', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'test-token',
          user: { id: 1, username: 'testuser', email: 'test@example.com' }
        }
      }
      httpClient.post.mockResolvedValue(mockResponse)

      const result = await authService.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })

      expect(httpClient.post).toHaveBeenCalledWith('/auth/register', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })
      expect(httpClient.setStoredToken).toHaveBeenCalledWith('test-token')
      expect(httpClient.setStoredUser).toHaveBeenCalledWith(mockResponse.data.user)
      expect(result).toEqual(mockResponse)
    })

    it('注册失败时不应存储令牌', async () => {
      const mockResponse = {
        success: false,
        error: '用户已存在'
      }
      httpClient.post.mockResolvedValue(mockResponse)

      const result = await authService.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })

      expect(httpClient.setStoredToken).not.toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })
  })

  describe('login', () => {
    it('应成功登录并存储令牌', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'login-token',
          user: { id: 1, username: 'testuser', email: 'test@example.com' }
        }
      }
      httpClient.post.mockResolvedValue(mockResponse)

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(httpClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      })
      expect(httpClient.setStoredToken).toHaveBeenCalledWith('login-token')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('logout', () => {
    it('应清除令牌并触发事件', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

      authService.logout()

      expect(httpClient.clearStoredToken).toHaveBeenCalled()
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent))
      expect(dispatchEventSpy.mock.calls[0][0].type).toBe('auth:logout')

      dispatchEventSpy.mockRestore()
    })
  })

  describe('getCurrentUser', () => {
    it('应获取当前用户信息', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      httpClient.get.mockResolvedValue({ success: true, data: mockUser })

      const result = await authService.getCurrentUser()

      expect(httpClient.get).toHaveBeenCalledWith('/auth/me')
      expect(httpClient.setStoredUser).toHaveBeenCalledWith(mockUser)
      expect(result.data).toEqual(mockUser)
    })
  })

  describe('updateProfile', () => {
    it('应更新用户资料', async () => {
      const mockResponse = {
        success: true,
        data: { id: 1, username: 'newusername' }
      }
      httpClient.put.mockResolvedValue(mockResponse)

      const result = await authService.updateProfile({ username: 'newusername' })

      expect(httpClient.put).toHaveBeenCalledWith('/auth/profile', { username: 'newusername' })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('changePassword', () => {
    it('应修改密码', async () => {
      const mockResponse = { success: true }
      httpClient.put.mockResolvedValue(mockResponse)

      const result = await authService.changePassword({
        currentPassword: 'oldpass',
        newPassword: 'newpass'
      })

      expect(httpClient.put).toHaveBeenCalledWith('/auth/password', {
        currentPassword: 'oldpass',
        newPassword: 'newpass'
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('isAuthenticated', () => {
    it('有令牌时应返回 true', () => {
      httpClient.getStoredToken.mockReturnValue('valid-token')
      expect(authService.isAuthenticated()).toBe(true)
    })

    it('无令牌时应返回 false', () => {
      httpClient.getStoredToken.mockReturnValue(null)
      expect(authService.isAuthenticated()).toBe(false)
    })
  })

  describe('getUser', () => {
    it('应返回存储的用户信息', () => {
      const mockUser = { id: 1, username: 'testuser' }
      httpClient.getStoredUser.mockReturnValue(mockUser)
      expect(authService.getUser()).toEqual(mockUser)
    })
  })
})
