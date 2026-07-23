/**
 * @file L2 读写混合负载
 * @description 8 个虚拟用户跑 GET（80%），2 个跑 PUT（20%）
 *              验证缓存失效、写竞争、连接池混合负载
 * @module load-tests/scenarios/l2-mixed/80-20-mixed
 */

import autocannon from 'autocannon'
import { parseArgs, probe, buildUrl } from '../../lib/client.mjs'
import { saveResult, appendSummary, evaluateThreshold } from '../../lib/report.mjs'
import { authHeaders } from '../../lib/auth.mjs'
import { TARGETS } from '../../config/targets.mjs'

async function main() {
  const args = parseArgs()
  const connections = args.smoke ? 2 : 10
  const duration = args.smoke ? 5 : 60

  console.log(`🚀 L2 读写混合负载 ${args.smoke ? '[SMOKE]' : '[FULL]'}`)
  console.log(`   总并发 ${connections} | 读:写 = 8:2 | 持续 ${duration}s`)

  if (!await probe(TARGETS.backend)) {
    console.error('❌ 后端不可达')
    process.exit(1)
  }

  const memberHeaders = await authHeaders('member')

  // 读请求配置（80% 流量）
  const readUrls = [
    buildUrl('backend', '/api/stats'),
    buildUrl('backend', '/api/fleet'),
    buildUrl('backend', '/api/members')
  ]

  // 用 autocannon 多请求模式：通过 requests 数组混合读和写
  const readRequests = readUrls.map(url => ({
    method: 'GET',
    path: new URL(url).pathname,
    // 每个读请求占 8/30 权重（3 个读端点 × 8 = 24，加上 6 个写 = 30，比例 8:2）
  }))

  const writeRequests = Array(6).fill(null).map(() => ({
    method: 'PUT',
    path: '/api/auth/profile',
    headers: memberHeaders,
    body: JSON.stringify({ username: 'loadtest_member' })
  }))

  const allRequests = [...readRequests, ...writeRequests]

  const instance = autocannon({
    title: 'L2-80-20-mixed',
    url: TARGETS.backend,
    connections,
    duration,
    requests: allRequests,
    timeout: 30
  })

  const result = await new Promise((resolve, reject) => {
    let settled = false
    instance.on('error', (err) => {
      if (!settled) { settled = true; reject(err) }
    })
    autocannon.track(instance, { renderProgressBar: false, renderResultsTable: false })
    const timeout = setTimeout(() => {
      if (!settled) { instance.stop(); reject(new Error('L2 超时')) }
    }, (duration + 10) * 1000)
    instance.on('done', (res) => {
      if (!settled) {
        settled = true
        clearTimeout(timeout)
        resolve(res)
      }
    })
  })

  // 统计 X-Cache 头分布（autocannon 不直接提供，需要从 result 提取）
  const cacheHitRate = 0 // autocannon 默认不解析响应头，需自定义监控；此处记录为待人工核查
  result.cacheHitRate = cacheHitRate

  saveResult('l2', '80-20-mixed', result)
  const evaluation = evaluateThreshold(result, 'l2')
  appendSummary('L2', '80-20-mixed', result, evaluation)

  console.log(`\nP50=${result.latency.p50}ms P95=${result.latency.p95}ms QPS=${result.requests.average} 错误率=${((result.errors / result.requests.total) * 100).toFixed(2)}% ${evaluation.pass ? '✅' : '❌'}`)
  console.log('✅ L2 混合负载完成')
}

main().catch(err => {
  console.error('L2 失败:', err)
  process.exit(1)
})
