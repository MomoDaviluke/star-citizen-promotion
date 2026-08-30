/**
 * @file L3 稳定性长跑
 * @description 30min 持续负载，旁路监控 heap/eventloop/pool
 *              并发数从 L1 基线推导：/api/stats P95<200ms 时的最大并发 × 0.8
 * @module load-tests/scenarios/l3-soak/soak-runner
 */

import { runScenario, parseArgs, probe, buildUrl } from '../../lib/client.mjs'
import { startMonitoring, sample } from '../../lib/monitor.mjs'
import { saveResult, appendSummary, evaluateThreshold } from '../../lib/report.mjs'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { TARGETS } from '../../config/targets.mjs'

/** 默认并发（L1 基线推导失败时 fallback）*/
const DEFAULT_CONCURRENCY = 50

/**
 * 从 L1 基线结果推导 L3 并发数
 * @returns {number}
 */
function deriveConcurrencyFromL1() {
  try {
    // 查找 /api/stats P95<200ms 的最大并发级别
    const l1Dir = 'load-tests/reports/l1'
    const files = readdirSync(l1Dir).filter(f => f.startsWith('L1-stats-') && f.endsWith('.json'))

    let maxValidConcurrency = 0
    for (const file of files) {
      const data = JSON.parse(readFileSync(join(l1Dir, file), 'utf-8'))
      if (data.latency?.p95 != null && data.latency.p95 < 200 && data.connections > maxValidConcurrency) {
        maxValidConcurrency = data.connections
      }
    }

    if (maxValidConcurrency > 0) {
      const derived = Math.floor(maxValidConcurrency * 0.8)
      console.log(`📊 从 L1 基线推导并发: ${maxValidConcurrency} × 0.8 = ${derived}`)
      return derived
    }
  } catch (err) {
    console.warn(`⚠️  无法从 L1 基线推导并发: ${err.message}，使用默认 ${DEFAULT_CONCURRENCY}`)
  }
  return DEFAULT_CONCURRENCY
}

/**
 * 计算百分位数
 * @param {number[]} values - 数值数组
 * @param {number} p - 百分位（0-100）
 * @returns {number}
 */
function percentile(values, p) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

async function main() {
  const args = parseArgs()
  const duration = args.smoke ? 10 : 1800 // 烟雾 10s，完整 30min
  const connections = args.smoke ? 1 : deriveConcurrencyFromL1()

  console.log(`🚀 L3 稳定性长跑 ${args.smoke ? '[SMOKE]' : '[FULL]'}`)
  console.log(`   并发 ${connections} | 持续 ${duration}s`)

  if (!await probe(TARGETS.backend)) {
    console.error('❌ 后端不可达')
    process.exit(1)
  }

  // 启动旁路监控
  const stopMonitoring = startMonitoring(5000, 'load-tests/reports/l3/timeseries.json')
  console.log('📡 旁路监控已启动（5s 采样间隔）')

  // 记录起始 heap
  const startSample = await sample()
  const startHeap = startSample.heapUsed
  console.log(`   起始 heap: ${startHeap} bytes`)

  try {
    const result = await runScenario({
      title: 'L3-soak',
      url: buildUrl('backend', '/api/stats'),
      method: 'GET',
      connections,
      duration
    })

    // 停止监控并获取时序数据
    const samples = await stopMonitoring()

    // 计算 heap 增长
    const endSample = samples[samples.length - 1] || {}
    const endHeap = endSample.heapUsed
    const heapGrowthPct = startHeap && endHeap ? ((endHeap - startHeap) / startHeap) * 100 : 0

    // 计算 event loop lag P95
    const lagValues = samples.map(s => s.eventLoopLag).filter(v => v != null)
    const lagP95 = lagValues.length > 0 ? percentile(lagValues, 95) : null

    result.heapGrowthPct = heapGrowthPct
    result.eventLoopLagP95 = lagP95
    result.samples = samples.length

    saveResult('l3', 'soak', result)

    // 阈值评估
    const thresholdEval = {
      pass: heapGrowthPct < 30 && (lagP95 === null || lagP95 * 1000 < 50),
      details: [
        `heap 增长: ${heapGrowthPct.toFixed(1)}% < 30% ${heapGrowthPct < 30 ? '✓' : '✗'}`,
        `event loop lag P95: ${lagP95 ? (lagP95 * 1000).toFixed(1) + 'ms' : 'N/A'} < 50ms ${lagP95 === null || lagP95 * 1000 < 50 ? '✓' : '✗'}`
      ]
    }
    appendSummary('L3', 'soak', result, thresholdEval)

    console.log(`\nheap 增长: ${heapGrowthPct.toFixed(1)}% | event loop lag P95: ${lagP95 ? (lagP95 * 1000).toFixed(1) + 'ms' : 'N/A'}`)
    console.log(`错误率: ${(result.errorRate * 100).toFixed(3)}%`)
    console.log(`${thresholdEval.pass ? '✅' : '❌'} L3 长跑完成`)
  } catch (err) {
    await stopMonitoring()
    throw err
  }
}

main().catch(err => {
  console.error('L3 失败:', err)
  process.exit(1)
})
