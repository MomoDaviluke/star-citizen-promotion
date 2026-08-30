/**
 * @file Redis 客户端
 * @description 用于 LLM 响应缓存,单例模式
 * @module server/services/ai/redisClient
 */

import { Redis } from 'ioredis'
import { aiConfig } from '../../config/ai.js'
import type { RedisLike } from './sessionStore.js'

let _client: Redis | null = null

export function getRedis(): Redis {
  if (!_client) {
    _client = new Redis(aiConfig.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    })
    _client.on('error', (err) => {
      console.error('[redisClient] Error:', err.message)
    })
  }
  return _client
}

/**
 * 缓存 JSON 数据
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number = aiConfig.cacheTtl): Promise<void> {
  const client = getRedis()
  await client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

/**
 * 读取缓存 JSON 数据,未命中返回 null
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis()
  const raw = await client.get(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function closeRedis(): Promise<void> {
  if (_client) {
    await _client.quit()
    _client = null
  }
}

/**
 * 获取 Redis 客户端(兼容 SessionStore 的 RedisLike 接口)
 * @description 复用 getRedis() 单例,返回的 Redis 实例兼容 RedisLike 接口
 *              注:ioredis 的 set 方法有重载,运行时兼容 RedisLike 的简化签名,
 *              但静态类型需通过 unknown 中转断言
 */
export function getRedisClient(): RedisLike {
  return getRedis() as unknown as RedisLike
}
