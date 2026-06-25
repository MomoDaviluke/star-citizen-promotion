/**
 * @file 设置服务层单元测试
 * @description 测试 settingsService 的读取和更新功能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.unstable_mockModule('../../src/database/pool.ts', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  transaction: jest.fn((cb) => cb({ execute: jest.fn() }))
}))

const { query, transaction } = await import('../../src/database/pool.ts')
const {
  getAllSettings,
  updateSettings
} = await import('../../src/services/settingsService.ts')

describe('settingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllSettings', () => {
    it('应返回所有设置项', async () => {
      query.mockResolvedValueOnce([
        { key: 'site_name', value: 'Star Citizen Promotion' },
        { key: 'site_description', value: '战队宣传网站' }
      ])

      const settings = await getAllSettings()

      expect(settings.site_name).toBe('Star Citizen Promotion')
      expect(settings.site_description).toBe('战队宣传网站')
    })

    it('空设置应返回空对象', async () => {
      query.mockResolvedValueOnce([])

      const settings = await getAllSettings()

      expect(settings).toEqual({})
    })

    it('value 为 null 时应返回空字符串', async () => {
      query.mockResolvedValueOnce([
        { key: 'empty_key', value: null }
      ])

      const settings = await getAllSettings()

      expect(settings.empty_key).toBe('')
    })
  })

  describe('updateSettings', () => {
    it('应更新设置项', async () => {
      const conn = { execute: jest.fn() }
      conn.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ key: 'site_name', value: '新名称' }]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      const settings = await updateSettings({ site_name: '新名称' })

      expect(settings.site_name).toBe('新名称')
    })

    it('应批量更新多个设置项', async () => {
      const conn = { execute: jest.fn() }
      conn.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[
          { key: 'site_name', value: '新名称' },
          { key: 'site_description', value: '新描述' }
        ]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      const settings = await updateSettings({
        site_name: '新名称',
        site_description: '新描述'
      })

      expect(settings.site_name).toBe('新名称')
      expect(settings.site_description).toBe('新描述')
      expect(conn.execute).toHaveBeenCalledTimes(3)
    })
  })
})