/**
 * @file 压测数据初始化
 * @description 在压测前创建测试用户和基础数据
 *              通过后端 /api/auth/register 创建用户，再通过 admin 端点提升角色
 * @module load-tests/lib/seeds
 */

import { TARGETS, TEST_ACCOUNTS } from '../config/targets.mjs'

/**
 * 注册测试用户（如不存在）
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @param {string} username - 用户名
 * @returns {Promise<string|null>} token（首次注册时），已存在返回 null
 */
async function registerUser(email, password, username) {
  try {
    const res = await fetch(`${TARGETS.backend}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
      signal: AbortSignal.timeout(15000)
    })

    if (res.status === 201) {
      const data = await res.json()
      return data.data?.token || null
    }

    // 409 或其他错误视为已存在
    return null
  } catch (err) {
    console.warn(`注册用户 ${email} 失败: ${err.message}`)
    return null
  }
}

/**
 * 初始化压测数据
 * @description 注册 admin 和 member 测试账号
 *              注意：第一个注册的用户通常自动成为 admin（取决于后端逻辑）
 *              若后端无此机制，需手动在 DB 中提升角色
 */
export async function seedTestData() {
  console.log('🌱 初始化压测数据...')

  // 注册 admin 账号（首个用户通常为 admin）
  await registerUser(
    TEST_ACCOUNTS.admin.email,
    TEST_ACCOUNTS.admin.password,
    'loadtest_admin'
  )

  // 注册 member 账号
  await registerUser(
    TEST_ACCOUNTS.member.email,
    TEST_ACCOUNTS.member.password,
    'loadtest_member'
  )

  console.log('✅ 压测数据初始化完成')
  console.log('⚠️  注意：若后端不自动赋予首个用户 admin 角色，需手动在 MySQL 中执行:')
  console.log(`   UPDATE users SET role='admin' WHERE email='${TEST_ACCOUNTS.admin.email}';`)
}

/**
 * 验证测试账号可登录
 * @returns {Promise<boolean>}
 */
export async function verifySeedData() {
  for (const role of ['admin', 'member']) {
    const account = TEST_ACCOUNTS[role]
    try {
      const res = await fetch(`${TARGETS.backend}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email, password: account.password }),
        signal: AbortSignal.timeout(10000)
      })
      if (!res.ok) {
        console.error(`❌ ${role} 账号登录失败: ${res.status}`)
        return false
      }
    } catch (err) {
      console.error(`❌ ${role} 账号登录异常: ${err.message}`)
      return false
    }
  }
  console.log('✅ 测试账号验证通过')
  return true
}
