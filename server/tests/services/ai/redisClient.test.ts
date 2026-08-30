/**
 * @file Redis 客户端单元测试
 * @description 测试 cacheSet/cacheGet 的序列化、JSON 容错与 closeRedis 单例重置逻辑
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.unstable_mockModule('ioredis', () => {
  class MockRedis {
    on = jest.fn()
    set = jest.fn(async () => 'OK')
    get = jest.fn(async () => null)
    quit = jest.fn(async () => 'OK')
  }
  return { Redis: MockRedis }
})

const { getRedis, cacheSet, cacheGet, closeRedis } = await import('../../../src/services/ai/redisClient.ts')

describe('redisClient', () => {
  // 模块级 _client 单例跨用例共享，每个用例前重置连接
  beforeEach(async () => {
    await closeRedis()
    jest.clearAllMocks()
  })

  describe('cacheSet', () => {
    it('应序列化 value 并按 ttl 写入', async () => {
      const client = getRedis()

      await cacheSet('k:1', { name: '舰队' }, 300)

      expect(client.set).toHaveBeenCalledWith('k:1', '{"name":"舰队"}', 'EX', 300)
    })

    it('未显式传 ttl 时使用默认缓存时长', async () => {
      const client = getRedis()

      await cacheSet('k:2', 'v')

      expect(client.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'EX',
        expect.any(Number)
      )
    })
  })

  describe('cacheGet', () => {
    it('命中时返回解析后的对象', async () => {
      const client = getRedis()
      client.get.mockResolvedValue('{"ok":true}')

      const result = await cacheGet('k:1')

      expect(result).toEqual({ ok: true })
    })

    it('未命中（get 返回 null）时返回 null', async () => {
      const client = getRedis()
      client.get.mockResolvedValue(null)

      const result = await cacheGet('k:miss')

      expect(result).toBeNull()
    })

    it('缓存内容为非法 JSON 时容错返回 null', async () => {
      const client = getRedis()
      client.get.mockResolvedValue('not-json{{{')

      const result = await cacheGet('k:bad')

      expect(result).toBeNull()
    })
  })

  describe('closeRedis', () => {
    it('应调用 quit 关闭连接并重置单例为可重建', async () => {
      const first = getRedis()

      await closeRedis()

      expect(first.quit).toHaveBeenCalledTimes(1)

      const second = getRedis()
      expect(second).not.toBe(first)
    })
  })
})