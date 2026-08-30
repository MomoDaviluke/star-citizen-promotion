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
  const { name, path, method, body, expectedErrorText, rateLimitMax, connections, duration, skip2xxCheck = false, expect429 = true, configProbeResult = null } = opts

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

  // 断言 1: 有 429 产生（expect429=false 时不检查，用于缓存端点配置验证）
  if (expect429) {
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
  } else {
    // 配置验证模式：验证 apiLimiter 已配置
    if (configProbeResult) {
      // 使用外部探测结果（用 /api/nonexistent 避免缓存命中干扰）
      details.push(`${configProbeResult.pass ? '✅' : '❌'} ${configProbeResult.message}`)
      if (!configProbeResult.pass) pass = false
    } else {
      // 回退逻辑：检查 burst 中 2xx 响应是否带 RateLimit-Limit 头
      // 注意：缓存命中（HIT）的请求绕过 apiLimiter，不带此头；只有缓存 MISS 的请求会走 apiLimiter
      const configHeaderPresent = results.filter(r => r.status >= 200 && r.status < 300 && r.headers['ratelimit-limit'] !== undefined).length
      if (configHeaderPresent > 0) {
        const limit = results.find(r => r.headers['ratelimit-limit'])?.headers?.['ratelimit-limit']
        details.push(`✅ RateLimit-Limit 头存在 (${configHeaderPresent}/${count2xx} 个缓存 MISS 请求带限流头，limit=${limit})`)
      } else {
        details.push('❌ 2xx 响应缺少 RateLimit-Limit 头（apiLimiter 未配置或全部缓存命中）')
        pass = false
      }
    }
  }

  // 断言 4: 2xx 数量不超过限流阈值（rateLimitMax 是窗口内最大允许）
  // 注意：缓存命中（X-Cache: HIT）的请求绕过 apiLimiter，缓存端点应设 skip2xxCheck=true
  if (skip2xxCheck) {
    details.push(`➖ 2xx 数量 ${count2xx}（缓存命中绕过限流，跳过此断言）`)
  } else if (count2xx > rateLimitMax) {
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

  const results = []

  // 场景 1: auth login 限流（10/15min）— 必须先跑，避免被 apiLimiter 耗满后拦截
  // /api/auth/login 同时走 apiLimiter(1000) 和 authLimiter(10)，authLimiter 先触发
  results.push(await burstAndAssert({
    name: 'auth-login-rate-limit',
    path: '/api/auth/login',
    method: 'POST',
    body: { email: TEST_ACCOUNTS.member.email, password: 'wrong' },
    expectedErrorText: '登录尝试过于频繁',
    rateLimitMax: 10,
    connections: smoke ? 10 : 20,
    duration: smoke ? 3 : 15
  }))

  // 场景 2: API 限流配置验证（缓存端点）
  // /api/stats 走 cacheMiddleware，缓存命中（HIT）绕过 apiLimiter，不产生 429
  // 验证策略：
  //   1. 用 /api/nonexistent（不匹配缓存规则）探测 apiLimiter 配置，响应头应包含 RateLimit-Limit
  //   2. burst /api/stats 验证缓存优化生效（都是 200，不产生 429）
  const probeRes = await fetch(`${TARGETS.backend}/api/nonexistent`, { signal: AbortSignal.timeout(5000) })
  const rateLimitHeader = probeRes.headers.get('ratelimit-limit')
  const apiRateLimitMax = parseInt(rateLimitHeader || '100', 10)
  const configProbeResult = rateLimitHeader
    ? { pass: true, message: `探测请求（/api/nonexistent, HTTP ${probeRes.status}）包含 RateLimit-Limit 头 (${rateLimitHeader})，apiLimiter 已配置` }
    : { pass: false, message: `探测请求（/api/nonexistent, HTTP ${probeRes.status}）缺少 RateLimit-Limit 头，apiLimiter 未配置` }
  console.log(`\n   📏 探测到 API 限流阈值: ${apiRateLimitMax}/15min (RateLimit-Limit 头: ${rateLimitHeader ? '存在' : '缺失'})`)

  results.push(await burstAndAssert({
    name: 'api-rate-limit',
    path: '/api/stats',
    method: 'GET',
    expectedErrorText: '请求过于频繁',
    rateLimitMax: apiRateLimitMax,
    connections: smoke ? 50 : 200,
    duration: smoke ? 3 : 15,
    skip2xxCheck: true,
    expect429: false,
    configProbeResult
  }))

  // 场景 3: refresh 限流（60/1h）— 烟雾模式跳过（耗时长）
  if (!smoke) {
    results.push(await burstAndAssert({
      name: 'refresh-rate-limit',
      path: '/api/auth/refresh',
      method: 'POST',
      expectedErrorText: '令牌刷新过于频繁',
      rateLimitMax: 60,
      connections: 70,
      duration: 60
    }))
  }

  // 汇总
  const allPass = results.every(r => r.pass)
  console.log(`\n${allPass ? '✅' : '❌'} L4 限流验证: ${results.filter(r => r.pass).length}/${results.length} 场景通过`)
  for (const r of results) {
    console.log(`  ${r.pass ? '✅' : '❌'} ${r.details.join('; ')}`)
  }

  console.log('\n⚠️  限流窗口已耗尽，后续 auth 相关测试前请运行:')
  console.log('   docker compose -f load-tests/docker-compose.loadtest.yml restart backend')
  process.exit(allPass ? 0 : 1)
}

main().catch(err => {
  console.error('L4 失败:', err)
  process.exit(1)
})
