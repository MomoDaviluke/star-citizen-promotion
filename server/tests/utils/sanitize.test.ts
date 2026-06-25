/**
 * @file sanitize 工具单元测试
 * @description 覆盖敏感字段识别和请求体脱敏逻辑
 */

import { describe, it, expect } from '@jest/globals'
import { sanitizeBody, isSensitiveField } from '../../src/utils/sanitize.js'

describe('sanitize 工具', () => {
  describe('isSensitiveField', () => {
    it('应识别 password 字段（大小写不敏感）', () => {
      expect(isSensitiveField('password')).toBe(true)
      expect(isSensitiveField('Password')).toBe(true)
      expect(isSensitiveField('PASSWORD')).toBe(true)
    })

    it('应识别带下划线/连字符的字段（归一化后匹配）', () => {
      expect(isSensitiveField('password_hash')).toBe(true)
      expect(isSensitiveField('password-hash')).toBe(true)
      expect(isSensitiveField('api-key')).toBe(true)
      expect(isSensitiveField('api_key')).toBe(true)
    })

    it('应识别 token 相关字段', () => {
      expect(isSensitiveField('token')).toBe(true)
      expect(isSensitiveField('accessToken')).toBe(true)
      expect(isSensitiveField('access_token')).toBe(true)
      expect(isSensitiveField('refreshToken')).toBe(true)
      expect(isSensitiveField('refresh_token')).toBe(true)
      expect(isSensitiveField('authToken')).toBe(true)
      expect(isSensitiveField('auth_token')).toBe(true)
    })

    it('应识别其他敏感字段', () => {
      expect(isSensitiveField('secret')).toBe(true)
      expect(isSensitiveField('apiKey')).toBe(true)
      expect(isSensitiveField('credential')).toBe(true)
      expect(isSensitiveField('creditCard')).toBe(true)
      expect(isSensitiveField('credit_card')).toBe(true)
      expect(isSensitiveField('ssn')).toBe(true)
      expect(isSensitiveField('authorization')).toBe(true)
      expect(isSensitiveField('cookie')).toBe(true)
    })

    it('不应误判普通字段', () => {
      expect(isSensitiveField('username')).toBe(false)
      expect(isSensitiveField('email')).toBe(false)
      expect(isSensitiveField('name')).toBe(false)
      expect(isSensitiveField('userId')).toBe(false)
      expect(isSensitiveField('description')).toBe(false)
    })
  })

  describe('sanitizeBody', () => {
    it('应脱敏顶层敏感字段', () => {
      const input = { username: 'test', password: 'secret123' }
      const result = sanitizeBody(input) as Record<string, unknown>
      expect(result.username).toBe('test')
      expect(result.password).toBe('[REDACTED]')
    })

    it('应递归脱敏嵌套对象', () => {
      const input = {
        user: {
          name: 'Alice',
          password: 'hidden',
          profile: { apiKey: 'abc123' }
        }
      }
      const result = sanitizeBody(input) as Record<string, unknown>
      const user = result.user as Record<string, unknown>
      const profile = user.profile as Record<string, unknown>
      expect(user.name).toBe('Alice')
      expect(user.password).toBe('[REDACTED]')
      expect(profile.apiKey).toBe('[REDACTED]')
    })

    it('应处理数组', () => {
      const input = [
        { username: 'a', password: 'p1' },
        { username: 'b', password: 'p2' }
      ]
      const result = sanitizeBody(input) as Array<Record<string, unknown>>
      expect(result).toHaveLength(2)
      expect(result[0].username).toBe('a')
      expect(result[0].password).toBe('[REDACTED]')
      expect(result[1].password).toBe('[REDACTED]')
    })

    it('应处理 null 和非对象', () => {
      expect(sanitizeBody(null)).toBeNull()
      expect(sanitizeBody(undefined)).toBeUndefined()
      expect(sanitizeBody('string')).toBe('string')
      expect(sanitizeBody(42)).toBe(42)
      expect(sanitizeBody(true)).toBe(true)
    })

    it('脱敏值统一为 [REDACTED]', () => {
      const input = {
        password: 'secret',
        token: 'tok',
        apiKey: 'key',
        creditCard: '1234'
      }
      const result = sanitizeBody(input) as Record<string, unknown>
      for (const value of Object.values(result)) {
        expect(value).toBe('[REDACTED]')
      }
    })

    it('应保留非敏感字段原值', () => {
      const input = {
        name: 'Alice',
        email: 'alice@example.com',
        age: 30,
        active: true,
        roles: ['admin', 'user']
      }
      const result = sanitizeBody(input) as Record<string, unknown>
      expect(result).toEqual(input)
    })

    it('应处理带下划线/连字符的敏感字段', () => {
      const input = {
        password_hash: 'hash',
        'api-key': 'k',
        access_token: 't'
      }
      const result = sanitizeBody(input) as Record<string, unknown>
      expect(result.password_hash).toBe('[REDACTED]')
      expect(result['api-key']).toBe('[REDACTED]')
      expect(result.access_token).toBe('[REDACTED]')
    })
  })
})
