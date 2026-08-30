/**
 * @file L1 公开读端点基线压测
 * @description 逐端点递增并发，建立 P50/P95/P99/QPS 基线
 * @module load-tests/scenarios/l1-baseline/readme-endpoints
 */

import { runScenario, parseArgs, probe, buildUrl } from '../../lib/client.mjs'
import { saveResult, appendSummary, evaluateThreshold } from '../../lib/report.mjs'
import { TARGETS } from '../../config/targets.mjs'

/** 压测端点列表 */
const ENDPOINTS = [
  { path: '/api/stats', name: 'stats' },
  { path: '/api/fleet', name: 'fleet' },
  { path: '/api/members', name: 'members' },
  { path: '/api/pilots', name: 'pilots' },
  { path: '/api/projects', name: 'projects' },
  { path: '/api/events', name: 'events' },
  { path: '/api/settings', name: 'settings' }
]

/** 并发递增序列 */
const CONCURRENCY_LEVELS = [1, 10, 50, 100]

/**
 * 主函数
 */
async function main() {
  const args = parseArgs()

  // 烟雾模式只测 1 个端点、1 个并发级别
  const endpoints = args.smoke ? ENDPOINTS.slice(0, 1) : ENDPOINTS
  const levels = args.smoke ? [1] : CONCURRENCY_LEVELS

  console.log(`🚀 L1 公开读端点基线 ${args.smoke ? '[SMOKE]' : '[FULL]'}`)
  console.log(`   端点数: ${endpoints.length} | 并发级别: ${levels.join('→')}`)

  // 探测后端可达
  if (!await probe(TARGETS.backend)) {
    console.error('❌ 后端不可达，跳过 L1')
    process.exit(1)
  }

  for (const endpoint of endpoints) {
    console.log(`\n📍 压测 ${endpoint.path}`)

    for (const connections of levels) {
      const title = `L1-${endpoint.name}-${connections}c`
      console.log(`  并发 ${connections}...`)

      try {
        const result = await runScenario({
          title,
          url: buildUrl('backend', endpoint.path),
          method: 'GET',
          connections,
          duration: args.duration
        })

        saveResult('l1', title, result)

        const evaluation = evaluateThreshold(result, 'l1')
        appendSummary('L1', title, result, evaluation)

        console.log(`  P50=${result.latency.p50}ms P95=${result.latency.p95}ms QPS=${result.requests.qps} 错误率=${(result.errorRate * 100).toFixed(2)}% ${evaluation.pass ? '✅' : '❌'}`)
      } catch (err) {
        console.error(`  ❌ 失败: ${err.message}`)
        saveResult('l1', `${title}-ERROR`, { title, error: err.message })
      }
    }
  }

  console.log('\n✅ L1 公开读端点基线完成')
}

main().catch(err => {
  console.error('L1 失败:', err)
  process.exit(1)
})
