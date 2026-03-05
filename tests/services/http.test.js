/**
 * @file HTTP 客户端测试
 * @description 测试 HTTP 服务层功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { httpClient } from '@/services/http.js'

describe('HTTP 客户端', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('令牌管理', () => {
    it('getStoredToken 应返回 null（无令牌时）', () => {
      expect(httpClient.getStoredToken()).toBeNull()
    })

    it('setStoredToken 应正确存储令牌', () => {
      const token = 'test-token-123'
      httpClient.setStoredToken(token)
      expect(httpClient.getStoredToken()).toBe(token)
    })

    it('clearStoredToken 应清除令牌', () => {
      httpClient.setStoredToken('test-token')
      httpClient.clearStoredToken()
      expect(httpClient.getStoredToken()).toBeNull()
    })
  })

  describe('用户信息管理', () => {
    it('getStoredUser 应返回 null（无用户信息时）', () => {
      expect(httpClient.getStoredUser()).toBeNull()
    })

    it('setStoredUser 应正确存储用户信息', () => {
      const user = { id: '1', username: 'test', email: 'test@example.com' }
      httpClient.setStoredUser(user)
      expect(httpClient.getStoredUser()).toEqual(user)
    })
  })
})
