/**
 * @file 数据服务测试
 * @description 测试数据服务层功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dataService } from '@/services/dataService.js'

vi.mock('@/services/http.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    getStoredToken: vi.fn(() => null),
    setStoredToken: vi.fn(),
    clearStoredToken: vi.fn(),
    getStoredUser: vi.fn(() => null),
    setStoredUser: vi.fn()
  }
}))

describe('数据服务', () => {
  describe('getNavItems', () => {
    it('应返回导航菜单项', async () => {
      const result = await dataService.getNavItems()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('label')
      expect(result[0]).toHaveProperty('to')
    })
  })

  describe('getStats', () => {
    it('应返回统计数据', async () => {
      const result = await dataService.getStats()
      expect(result).toHaveProperty('stats')
      expect(Array.isArray(result.stats)).toBe(true)
    })
  })

  describe('getPilots', () => {
    it('应返回飞行员列表', async () => {
      const result = await dataService.getPilots()
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('getMembers', () => {
    it('应返回成员列表', async () => {
      const result = await dataService.getMembers()
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('getProjects', () => {
    it('应返回项目列表', async () => {
      const result = await dataService.getProjects()
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('submitApplication', () => {
    it('模拟模式应返回成功', async () => {
      const result = await dataService.submitApplication({
        name: '测试用户',
        email: 'test@example.com'
      })
      expect(result.success).toBe(true)
    })
  })
})
