/**
 * @file 认证工具
 * @description 登录获取 token，按 role 缓存，避免重复登录触发限流
 * @module load-tests/lib/auth
 */

import { TARGETS, TEST_ACCOUNTS } from '../config/targets.mjs'

/** token 缓存（按 role）*/
const tokenCache = new Map()

/**
 * 登录并缓存 token
 * @param {('admin'|'member')} role - 角色
 * @returns {Promise<string>} JWT token
 */
export async function getToken(role = 'member') {
  if (tokenCache.has(role)) {
    return tokenCache.get(role)
  }

  const account = TEST_ACCOUNTS[role]
  const res = await fetch(`${TARGETS.backend}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: account.email, password: account.password }),
    signal: AbortSignal.timeout(10000)
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`登录失败 (${role}): ${res.status} ${text}`)
  }

  const data = await res.json()
  const token = data.data?.token
  if (!token) {
    throw new Error(`登录响应无 token (${role}): ${JSON.stringify(data)}`)
  }

  tokenCache.set(role, token)
  return token
}

/**
 * 构建认证请求头
 * @param {string} role - 角色
 * @returns {Promise<Object>} 含 Authorization 的 headers 对象
 */
export async function authHeaders(role = 'member') {
  const token = await getToken(role)
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

/**
 * 清除 token 缓存（场景间重置）
 */
export function clearTokenCache() {
  tokenCache.clear()
}
