/**
 * @file sanitizeBody 工具测试
 * @description 覆盖敏感字段脱敏、大小写/符号变体、嵌套递归、isSensitiveField 判定
 */

import { describe, it, expect } from '@jest/globals'

import { sanitizeBody, isSensitiveField } from '../../src/utils/sanitizeBody.js'

describe('isSensitiveField', () => {
  it('命中敏感字段名', () => {
    expect(isSensitiveField('password')).toBe(true)
    expect(isSensitiveField('token')).toBe(true)
    expect(isSensitiveField('apiKey')).toBe(true)
  })

  it('符号变体同样命中', () => {
    expect(isSensitiveField('password_hash')).toBe(true)
    expect(isSensitiveField('auth_token')).toBe(true)
    expect(isSensitiveField('api-key')).toBe(true)
  })

  it('大小写不敏感', () => {
    expect(isSensitiveField('PassWord')).toBe(true)
    expect(isSensitiveField('RefreshToken')).toBe(true)
  })

  it('普通字段不命中', () => {
    expect(isSensitiveField('username')).toBe(false)
    expect(isSensitiveField('experience')).toBe(false)
    expect(isSensitiveField('ship')).toBe(false)
  })
})

describe('sanitizeBody', () => {
  it('基本类型原样返回', () => {
    expect(sanitizeBody(null)).toBeNull()
    expect(sanitizeBody('str')).toBe('str')
    expect(sanitizeBody(42)).toBe(42)
    expect(sanitizeBody(undefined)).toBeUndefined()
  })

  it('顶层敏感字段被脱敏', () => {
    const result = sanitizeBody({ username: 'test', password: 'secret123', token: 'bearer-xxx' })
    expect(result).toEqual({
      username: 'test',
      password: '[REDACTED]',
      token: '[REDACTED]'
    })
  })

  it('变体字段名同样脱敏（大小写/符号）', () => {
    const result = sanitizeBody({
      passwordHash: 'x',
      refreshToken: 'y',
      api_key: 'z',
      currentPassword: 'p'
    })
    expect(result).toEqual({
      passwordHash: '[REDACTED]',
      refreshToken: '[REDACTED]',
      api_key: '[REDACTED]',
      currentPassword: '[REDACTED]'
    })
  })

  it('联系方式与凭据字段脱敏', () => {
    const result = sanitizeBody({
      phone: '13800000000',
      authorization: 'Bearer xxx',
      cookie: 'sid=abc',
      ssn: '123-45-6789',
      creditCard: '4111111111111111'
    })
    Object.values(result).forEach((value) => expect(value).toBe('[REDACTED]'))
  })

  it('嵌套对象递归脱敏', () => {
    const result = sanitizeBody({
      user: { name: 'test', settings: { password: 'pwd', apiKey: 'key' } }
    })
    expect(result).toEqual({
      user: {
        name: 'test',
        settings: { password: '[REDACTED]', apiKey: '[REDACTED]' }
      }
    })
  })

  it('容器字段名含敏感词时整体脱敏（includes 匹配边界）', () => {
    const result = sanitizeBody({ credentials: { user: 'a', password: 'p' } })
    expect(result).toEqual({ credentials: '[REDACTED]' })
  })

  it('数组元素递归脱敏', () => {
    const result = sanitizeBody([
      { username: 'a', token: 't1' },
      { username: 'b', token: 't2' }
    ])
    expect(result).toEqual([
      { username: 'a', token: '[REDACTED]' },
      { username: 'b', token: '[REDACTED]' }
    ])
  })

  it('非敏感字段保持原值', () => {
    const result = sanitizeBody({ name: '星际公民', role: 'pilot', preferences: ['pvp'] })
    expect(result).toEqual({ name: '星际公民', role: 'pilot', preferences: ['pvp'] })
  })

  it('浅拷贝不修改入参', () => {
    const input = { name: 'v', nested: { password: 'p' } }
    const result = sanitizeBody(input)
    expect(result).not.toBe(input)
    expect(input.nested.password).toBe('p')
  })
})