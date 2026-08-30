/**
 * @file 认证服务测试
 * @description 测试 authService 功能，验证 httpOnly cookie 认证方式
 *              前端不存储 Token，认证由浏览器自动携带 cookie 完成
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authService } from '@/services/authService.js'
import httpClient from '@/services/http.js'

// Mock httpClient — 仅 mock 实际存在的 HTTP 方法
vi.mock('@/services/http.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('login', () => {
    it('应成功登录并返回用户数据', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
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
      // 后端通过 Set-Cookie 设置 httpOnly cookie，前端无需手动存储 Token
      expect(result).toEqual(mockResponse.data)
      expect(result.user).toEqual(mockResponse.data.user)
    })

    it('缺少邮箱时应抛出错误', async () => {
      await expect(authService.login({ email: '', password: '123' }))
        .rejects.toThrow('邮箱和密码不能为空')
    })

    it('缺少密码时应抛出错误', async () => {
      await expect(authService.login({ email: 'test@example.com', password: '' }))
        .rejects.toThrow('邮箱和密码不能为空')
    })

    it('参数为空时应抛出错误', async () => {
      await expect(authService.login())
        .rejects.toThrow('邮箱和密码不能为空')
    })

    it('登录失败时应抛出错误', async () => {
      httpClient.post.mockRejectedValue(new Error('Invalid credentials'))

      await expect(authService.login({
        email: 'test@example.com',
        password: 'wrong'
      })).rejects.toThrow('Invalid credentials')
    })
  })

  describe('register', () => {
    it('应成功注册并返回数据', async () => {
      const mockResponse = {
        data: { token: 'test-token', user: { id: 1, username: 'testuser' } }
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
      // 后端通过 Set-Cookie 设置 httpOnly cookie，前端无需手动存储 Token
      expect(result).toEqual(mockResponse.data)
    })

    it('缺少用户名时应抛出错误', async () => {
      await expect(authService.register({ email: 'test@example.com', password: '123' }))
        .rejects.toThrow('注册信息不完整')
    })

    it('缺少邮箱时应抛出错误', async () => {
      await expect(authService.register({ username: 'test', password: '123' }))
        .rejects.toThrow('注册信息不完整')
    })

    it('缺少密码时应抛出错误', async () => {
      await expect(authService.register({ username: 'test', email: 'test@example.com' }))
        .rejects.toThrow('注册信息不完整')
    })

    it('参数为空时应抛出错误', async () => {
      await expect(authService.register())
        .rejects.toThrow('注册信息不完整')
    })
  })

  describe('logout', () => {
    it('应调用登出 API', async () => {
      httpClient.post.mockResolvedValue({ success: true })

      await authService.logout()

      expect(httpClient.post).toHaveBeenCalledWith('/auth/logout')
    })

    it('应派发 auth:logout 事件', async () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent')
      httpClient.post.mockResolvedValue({ success: true })

      await authService.logout()

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth:logout' })
      )

      eventSpy.mockRestore()
    })

    it('登出 API 失败时仍应派发事件', async () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent')
      httpClient.post.mockRejectedValue(new Error('Network error'))

      await authService.logout()

      // 即使 API 调用失败，也应派发 auth:logout 事件清理前端状态
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth:logout' })
      )

      eventSpy.mockRestore()
    })
  })

  describe('getProfile', () => {
    it('应获取当前用户信息', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      httpClient.get.mockResolvedValue({ data: mockUser })

      const result = await authService.getProfile()

      expect(httpClient.get).toHaveBeenCalledWith('/auth/me')
      expect(result.data).toEqual(mockUser)
    })

    it('获取失败时应抛出错误', async () => {
      httpClient.get.mockRejectedValue(new Error('Unauthorized'))

      await expect(authService.getProfile()).rejects.toThrow('Unauthorized')
    })
  })

  describe('updateProfile', () => {
    it('应更新用户资料', async () => {
      const mockResponse = { user: { id: 1, username: 'newusername' } }
      httpClient.put.mockResolvedValue({ data: mockResponse })

      const result = await authService.updateProfile({ username: 'newusername' })

      expect(httpClient.put).toHaveBeenCalledWith('/auth/profile', { username: 'newusername' })
      expect(result).toEqual(mockResponse)
    })

    it('更新失败时应抛出错误', async () => {
      httpClient.put.mockRejectedValue(new Error('Update failed'))

      await expect(authService.updateProfile({ username: 'new' }))
        .rejects.toThrow('Update failed')
    })
  })

  describe('changePassword', () => {
    it('应修改密码', async () => {
      httpClient.put.mockResolvedValue({ success: true })

      await authService.changePassword({
        currentPassword: 'oldpass',
        newPassword: 'newpass'
      })

      expect(httpClient.put).toHaveBeenCalledWith('/auth/password', {
        currentPassword: 'oldpass',
        newPassword: 'newpass'
      })
    })

    it('修改失败时应抛出错误', async () => {
      httpClient.put.mockRejectedValue(new Error('Current password incorrect'))

      await expect(authService.changePassword({
        currentPassword: 'wrong',
        newPassword: 'new'
      })).rejects.toThrow('Current password incorrect')
    })
  })

  describe('refreshToken', () => {
    it('应刷新令牌', async () => {
      httpClient.post.mockResolvedValue({ data: { token: 'new-token' } })

      const result = await authService.refreshToken()

      expect(httpClient.post).toHaveBeenCalledWith('/auth/refresh')
      expect(result.token).toBe('new-token')
    })

    it('刷新失败时应抛出错误', async () => {
      httpClient.post.mockRejectedValue(new Error('Refresh token expired'))

      await expect(authService.refreshToken()).rejects.toThrow('Refresh token expired')
    })
  })

  describe('requestPasswordReset', () => {
    it('应请求密码重置', async () => {
      httpClient.post.mockResolvedValue({ data: { success: true } })

      await authService.requestPasswordReset('test@example.com')

      expect(httpClient.post).toHaveBeenCalledWith('/auth/password-reset', {
        email: 'test@example.com'
      })
    })

    it('缺少邮箱时应抛出错误', async () => {
      await expect(authService.requestPasswordReset(''))
        .rejects.toThrow('邮箱不能为空')
    })

    it('参数为空时应抛出错误', async () => {
      await expect(authService.requestPasswordReset())
        .rejects.toThrow('邮箱不能为空')
    })
  })

  describe('resetPassword', () => {
    it('应重置密码', async () => {
      httpClient.post.mockResolvedValue({ data: { success: true } })

      await authService.resetPassword('reset-token-123', 'newpassword')

      expect(httpClient.post).toHaveBeenCalledWith('/auth/password-reset/reset-token-123', {
        password: 'newpassword'
      })
    })

    it('缺少令牌时应抛出错误', async () => {
      await expect(authService.resetPassword('', 'newpass'))
        .rejects.toThrow('令牌和新密码不能为空')
    })

    it('缺少新密码时应抛出错误', async () => {
      await expect(authService.resetPassword('token', ''))
        .rejects.toThrow('令牌和新密码不能为空')
    })
  })
})
