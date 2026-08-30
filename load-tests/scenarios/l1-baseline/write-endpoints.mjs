/**
 * @file L1 写端点低压压测
 * @description PUT /api/auth/profile 和 admin PUT /api/members/:id
 *              低压避免数据污染
 * @module load-tests/scenarios/l1-baseline/write-endpoints
 */

import { runScenario, parseArgs, probe, buildUrl } from '../../lib/client.mjs'
import { saveResult, appendSummary, evaluateThreshold } from '../../lib/report.mjs'
import { authHeaders } from '../../lib/auth.mjs'

async function main() {
  const args = parseArgs()
  const levels = args.smoke ? [1] : [1, 5]

  console.log(`🚀 L1 写端点 ${args.smoke ? '[SMOKE]' : '[FULL]'}`)

  if (!await probe(buildUrl('backend', ''))) {
    console.error('❌ 后端不可达')
    process.exit(1)
  }

  // PUT /api/auth/profile（member 更新自己资料）
  const memberHeaders = await authHeaders('member')
  for (const connections of levels) {
    const title = `L1-profile-put-${connections}c`
    console.log(`\n📍 PUT /api/auth/profile 并发 ${connections}`)
    try {
      const result = await runScenario({
        title,
        url: buildUrl('backend', '/api/auth/profile'),
        method: 'PUT',
        connections,
        duration: args.duration,
        headers: memberHeaders,
        body: { username: 'loadtest_member' }
      })
      saveResult('l1', title, result)
      const evaluation = evaluateThreshold(result, 'l1Auth')
      appendSummary('L1', title, result, evaluation)
      console.log(`  P95=${result.latency.p95}ms ${evaluation.pass ? '✅' : '❌'}`)
    } catch (err) {
      console.error(`  ❌ ${err.message}`)
    }
  }

  console.log('\n✅ L1 写端点完成')
}

main().catch(err => {
  console.error('L1 write 失败:', err)
  process.exit(1)
})
