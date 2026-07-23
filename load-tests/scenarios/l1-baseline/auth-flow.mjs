/**
 * @file L1 认证流程串压
 * @description login/refresh/register 低压压测，观察 bcrypt 12 轮开销
 *              注意：auth 限流 10 req/15min/IP，并发上限 5
 * @module load-tests/scenarios/l1-baseline/auth-flow
 */

import { runScenario, parseArgs, probe, buildUrl } from '../../lib/client.mjs'
import { saveResult, appendSummary, evaluateThreshold } from '../../lib/report.mjs'
import { TARGETS, TEST_ACCOUNTS } from '../../config/targets.mjs'

/** auth 并发上限（限流 10/15min，留余量）*/
const AUTH_MAX_CONCURRENCY = 5

async function main() {
  const args = parseArgs()
  const levels = args.smoke ? [1] : [1, 3, 5]

  console.log(`🚀 L1 认证流程 ${args.smoke ? '[SMOKE]' : '[FULL]'}`)
  console.log(`⚠️  auth 限流 10/15min，并发上限 ${AUTH_MAX_CONCURRENCY}`)

  if (!await probe(TARGETS.backend)) {
    console.error('❌ 后端不可达')
    process.exit(1)
  }

  // login 压测
  for (const connections of levels) {
    const title = `L1-login-${connections}c`
    console.log(`\n📍 login 并发 ${connections}`)
    try {
      const result = await runScenario({
        title,
        url: buildUrl('backend', '/api/auth/login'),
        method: 'POST',
        connections,
        duration: args.duration,
        headers: { 'Content-Type': 'application/json' },
        body: { email: TEST_ACCOUNTS.member.email, password: TEST_ACCOUNTS.member.password },
        expectRateLimit: true
      })
      saveResult('l1', title, result)
      const evaluation = evaluateThreshold(result, 'l1Auth')
      appendSummary('L1', title, result, evaluation)
      console.log(`  P95=${result.latency.p95}ms 429=${result.rateLimited} ${evaluation.pass ? '✅' : '❌'}`)
    } catch (err) {
      console.error(`  ❌ ${err.message}`)
    }
  }

  // refresh 压测
  for (const connections of levels) {
    const title = `L1-refresh-${connections}c`
    console.log(`\n📍 refresh 并发 ${connections}`)
    try {
      const result = await runScenario({
        title,
        url: buildUrl('backend', '/api/auth/refresh'),
        method: 'POST',
        connections,
        duration: args.duration,
        expectRateLimit: true
      })
      saveResult('l1', title, result)
      const evaluation = evaluateThreshold(result, 'l1Auth')
      appendSummary('L1', title, result, evaluation)
      console.log(`  P95=${result.latency.p95}ms 429=${result.rateLimited} ${evaluation.pass ? '✅' : '❌'}`)
    } catch (err) {
      console.error(`  ❌ ${err.message}`)
    }
  }

  console.log('\n⚠️  auth 限流窗口可能已耗尽，后续 auth 相关测试前请运行: docker compose -f load-tests/docker-compose.loadtest.yml restart backend')
  console.log('✅ L1 认证流程完成')
}

main().catch(err => {
  console.error('L1 auth 失败:', err)
  process.exit(1)
})
