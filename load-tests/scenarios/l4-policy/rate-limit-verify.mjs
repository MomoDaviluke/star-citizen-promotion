/**
 * @file L4 限流策略验证
 * @description 主动冲击 API/auth/refresh 限流阈值，断言 429 行为
 * @module load-tests/scenarios/l4-policy/rate-limit-verify
 */

import { parseArgs, probe, buildUrl } from '../../lib/client.mjs'
import { saveResult, appendSummary } from '../../lib/report.mjs'
import { TARGETS, TEST_ACCOUNTS } from '../../config/targets.mjs'

/**
 * 冲击单个端点并断言 429
 * @param {Object} opts - 场景选项
 * @returns {Promise<{pass: boolean, details: string[]}>}
 */
async function burstAndAssert(opts) {
  const { name, path, method, body, expectedErrorText, rateLimitMax, connections, duration } = opts

  console.log(`\n📍 场景: ${name}`)
  console.log(`  冲击 ${method} ${path} | 并发 ${connections} | 持续 ${duration}s`)

  // 手动发请求收集状态码分布（autocannon 的状态码统计够用，但我们要校验 body）
  const results = []
  const startTime = Date.now()
  const endTime = startTime + duration * 1000

  // 并发发送
  const sendOne = async () => {
    while (Date.now() < endTime) {
      try {
        const res = await fetch(`${TARGETS.backend}${path}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(10000)
        })
        const text = await res.text().catch(() => '')
        results.push({ status: res.status, body: text, headers: Object.fromEntries(res.headers) })
      } catch (err) {
        results.push({ status: 0, body: err.message, headers: {} })
      }
    }
  }

  const workers = Array(connections).fill(null).map(() => sendOne())
  await Promise.all(workers)

  // 统计
  const statusCounts = {}
  let errorTextMatched = 0
  let rateLimitHeaderPresent = 0

  for (const r of results) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
    if (r.status === 429 && r.body.includes(expectedErrorText)) {
      errorTextMatched++
    }
    if (r.status === 429 && (r.headers['ratelimit-remaining'] !== undefined || r.headers['ratelimit-reset'] !== undefined)) {
      rateLimitHeaderPresent++
    }
  }

  const total = results.length
  const count429 = statusCounts['429'] || 0
  const count2xx = Object.entries(statusCounts).filter(([code]) => code.startsWith('2')).reduce((s, [, c]) => s + c, 0)

  console.log(`  状态码分布: ${JSON.stringify(statusCounts)}`)
  console.log(`  429 总数: ${count429} | 2xx 总数: ${count2xx}`)

  const details = []
  let pass = true

  // 断言 1: 有 429 产生
  if (count429 === 0) {
    details.push('❌ 未产生 429（限流未生效）')
    pass = false
  } else {
    details.push(`✅ 产生 ${count429} 个 429`)
  }

  // 断言 2: 429 body 包含预期错误文本
  if (count429 > 0 && errorTextMatched === 0) {
    details.push(`❌ 429 body 未包含 "${expectedErrorText}"`)
    pass = false
  } else if (count429 > 0) {
    details.push(`✅ 429 body 文本匹配 (${errorTextMatched}/${count429})`)
  }

  // 断言 3: 429 响应含 RateLimit 头
  if (count429 > 0 && rateLimitHeaderPresent === 0) {
    details.push('❌ 429 响应缺少 RateLimit-Remaining/Reset 头')
    pass = false
  } else if (count429 > 0) {
    details.push(`✅ RateLimit 头存在 (${rateLimitHeaderPresent}/${count429})`)
  }

  // 断言 4: 2xx 数量不超过限流阈值（rateLimitMax 是窗口内最大允许）
  if (count2xx > rateLimitMax) {
    details.push(`❌ 2xx 数量 ${count2xx} 超过限流阈值 ${rateLimitMax}`)
    pass = false
  } else {
    details.push(`✅ 2xx 数量 ${count2xx} <= ${rateLimitMax}`)
  }

  const result = {
    title: name,
    path,
    method,
    connections,
    duration,
    total,
    statusCodes: statusCounts,
    count429,
    count2xx,
    errorTextMatched,
    rateLimitHeaderPresent,
    pass,
    details
  }

  saveResult('l4', name, result)
  appendSummary('L4', name, { latency: {}, requests: { qps: total / duration }, errorRate: 0, rateLimited: count429 }, { pass, details })

  return { pass, details }
}

async function main() {
  const args = parseArgs()
  const smoke = args.smoke

  console.log(`🚀 L4 限流策略验证 ${smoke ? '[SMOKE]' : '[FULL]'}`)

  if (!await probe(TARGETS.backend)) {
    console.error('❌ 后端不可达')
    process.exit(1)
  }

  // 场景 1: API 限流（100/15min）
  await burstAndAssert({
    name: 'api-rate-limit',
    path: '/api/stats',
    method: 'GET',
    expectedErrorText: '请求过于频繁',
    rateLimitMax: 100,
    connections: smoke ? 50 : 200,
    duration: smoke ? 3 : 15
  })

  // 场景 2: auth login 限流（10/15min）
  await burstAndAssert({
    name: 'auth-login-rate-limit',
    path: '/api/auth/login',
    method: 'POST',
    body: { email: TEST_ACCOUNTS.member.email, password: 'wrong' },
    expectedErrorText: '登录尝试过于频繁',
    rateLimitMax: 10,
    connections: smoke ? 10 : 20,
    duration: smoke ? 3 : 15
  })

  // 场景 3: refresh 限流（60/1h）— 烟雾模式跳过（耗时长）
  if (!smoke) {
    await burstAndAssert({
      name: 'refresh-rate-limit',
      path: '/api/auth/refresh',
      method: 'POST',
      expectedErrorText: '令牌刷新过于频繁',
      rateLimitMax: 60,
      connections: 70,
      duration: 60
    })
  }

  console.log('\n⚠️  限流窗口已耗尽，后续 auth 相关测试前请运行:')
  console.log('   docker compose -f load-tests/docker-compose.loadtest.yml restart backend')
  console.log('✅ L4 限流验证完成')
}

main().catch(err => {
  console.error('L4 失败:', err)
  process.exit(1)
})
