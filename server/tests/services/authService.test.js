/**
 * @file 认证服务层单元测试
 * @description 测试 authService.js 的业务逻辑（mock 数据库层）
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock 数据库层
jest.unstable_mockModule('../../src/database/pool.js', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  transaction: jest.fn((cb) => cb({
    execute: jest.fn()
  }))
}))

// Mock config
jest.unstable_mockModule('../../src/config/index.js', () => ({
  config: {
    bcrypt: { saltRounds: 10 },
    jwt: { secret: 'test-secret', expiresIn: '7d' }
  }
}))

const { queryOne, transaction } = await import('../../src/database/pool.js')
const { config } = await import('../../src/config/index.js')
const {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  changePassword,
  refreshUserToken
} = await import('../../src/services/authService.js')

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('registerUser', () => {
    it('应成功注册新用户', async () => {
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([[]]) // 无重复用户
      conn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]) // INSERT 成功
      conn.execute.mockResolvedValueOnce([[{ id: 'u1', username: 'test', email: 't@e.com', role: 'member' }]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      const result = await registerUser({
        username: 'test',
        email: 't@e.com',
        password: 'TestPass123'
      })

      expect(result.user).toBeDefined()
      expect(result.token).toBeDefined()
      expect(conn.execute).toHaveBeenCalledTimes(2)
    })

    it('重复用户应抛出冲突错误', async () => {
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([[{ id: 'u1' }]]) // 已有用户

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(registerUser({
        username: 'test',
        email: 't@e.com',
        password: 'TestPass123'
      })).rejects.toMatchObject({ statusCode: 409 })
    })
  })

  describe('loginUser', () => {
    it('有效凭证应返回用户和令牌', async () => {
      const passwordHash = await bcrypt.hash('TestPass123', 10)
      queryOne.mockResolvedValueOnce({
        id: 'u1',
        username: 'test',
        email: 't@e.com',
        role: 'member',
        avatar: null,
        password_hash: passwordHash
      })

      const result = await loginUser('t@e.com', 'TestPass123')

      expect(result.user).toBeDefined()
      expect(result.token).toBeDefined()
    })

    it('无效邮箱应返回 401', async () => {
      queryOne.mockResolvedValueOnce(null)

      await expect(loginUser('unknown@e.com', 'pass')).rejects.toMatchObject({ statusCode: 401 })
    })

    it('错误密码应返回 401', async () => {
      const passwordHash = await bcrypt.hash('CorrectPass123', 10)
      queryOne.mockResolvedValueOnce({
        id: 'u1',
        password_hash: passwordHash
      })

      await expect(loginUser('t@e.com', 'WrongPass123')).rejects.toMatchObject({ statusCode: 401 })
    })
  })

  describe('getUserById', () => {
    it('应返回用户信息', async () => {
      queryOne.mockResolvedValueOnce({ id: 'u1', username: 'test' })

      const result = await getUserById('u1')

      expect(result).toMatchObject({ id: 'u1', username: 'test' })
    })
  })

  describe('updateUserProfile', () => {
    it('应更新用户资料', async () => {
      const conn = { execute: jest.fn() }
      conn.execute
        .mockResolvedValueOnce([[]]) // 用户名不重复
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ id: 'u1', username: 'newname', email: 't@e.com' }]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      const result = await updateUserProfile('u1', { username: 'newname' })

      expect(result.username).toBe('newname')
    })

    it('无更新内容应返回 400', async () => {
      const conn = { execute: jest.fn() }
      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(updateUserProfile('u1', {})).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('changePassword', () => {
    it('正确当前密码应修改成功', async () => {
      const passwordHash = await bcrypt.hash('OldPass123', 10)
      const conn = { execute: jest.fn() }
      conn.execute
        .mockResolvedValueOnce([[{ password_hash: passwordHash }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(changePassword('u1', 'OldPass123', 'NewPass123')).resolves.toBeUndefined()
    })

    it('错误当前密码应返回 401', async () => {
      const passwordHash = await bcrypt.hash('OldPass123', 10)
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([[{ password_hash: passwordHash }]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(changePassword('u1', 'WrongPass123', 'NewPass123')).rejects.toMatchObject({ statusCode: 401 })
    })
  })

  describe('refreshUserToken', () => {
    it('有效令牌应返回新令牌', async () => {
      const token = jwt.sign({ userId: 'u1' }, config.jwt.secret, { expiresIn: '1h' })
      queryOne.mockResolvedValueOnce({ id: 'u1', role: 'member' })

      const result = await refreshUserToken(token)

      expect(result.token).toBeDefined()
    })

    it('无效令牌应返回 401', async () => {
      await expect(refreshUserToken('invalid-token')).rejects.toMatchObject({ statusCode: 401 })
    })

    it('过期令牌应返回 401', async () => {
      const token = jwt.sign({ userId: 'u1' }, config.jwt.secret, { expiresIn: '-1s' })

      await expect(refreshUserToken(token)).rejects.toMatchObject({ statusCode: 401 })
    })
  })
})
