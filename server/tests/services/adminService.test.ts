/**
 * @file 管理员服务层单元测试
 * @description 测试 verifyAdminPassword 的用户存在性判断与 bcrypt 密码比对分支
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.unstable_mockModule('../../src/database/pool.ts', () => ({
  queryOne: jest.fn()
}))

jest.unstable_mockModule('bcryptjs', () => ({
  __esModule: true,
  default: { compare: jest.fn() },
  compare: jest.fn()
}))

const { queryOne } = await import('../../src/database/pool.ts')
const bcrypt = await import('bcryptjs')
const { verifyAdminPassword } = await import('../../src/services/adminService.ts')

describe('adminService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('verifyAdminPassword', () => {
    it('用户存在且密码匹配时返回 true', async () => {
      queryOne.mockResolvedValue({ password_hash: '$2b$12$hashed' })
      bcrypt.default.compare.mockResolvedValue(true)

      const ok = await verifyAdminPassword('admin-1', 'correct-password')

      expect(ok).toBe(true)
      expect(queryOne).toHaveBeenCalledWith(
        'SELECT password_hash FROM users WHERE id = ?',
        ['admin-1']
      )
      expect(bcrypt.default.compare).toHaveBeenCalledWith('correct-password', '$2b$12$hashed')
    })

    it('用户存在但密码不匹配时返回 false', async () => {
      queryOne.mockResolvedValue({ password_hash: '$2b$12$hashed' })
      bcrypt.default.compare.mockResolvedValue(false)

      const ok = await verifyAdminPassword('admin-1', 'wrong-password')

      expect(ok).toBe(false)
      expect(bcrypt.default.compare).toHaveBeenCalledTimes(1)
    })

    it('用户不存在（queryOne 返回 undefined）时返回 false 且不比对密码', async () => {
      queryOne.mockResolvedValue(undefined)

      const ok = await verifyAdminPassword('ghost', 'any')

      expect(ok).toBe(false)
      expect(bcrypt.default.compare).not.toHaveBeenCalled()
    })

    it('password_hash 为空时返回 false', async () => {
      queryOne.mockResolvedValue({ password_hash: '' })

      const ok = await verifyAdminPassword('admin-1', 'any')

      expect(ok).toBe(false)
      expect(bcrypt.default.compare).not.toHaveBeenCalled()
    })
  })
})