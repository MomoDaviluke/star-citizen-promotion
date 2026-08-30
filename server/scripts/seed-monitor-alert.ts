/**
 * @file 告警链路验证脚本
 * @description 用真实的 AlertEngine + MysqlAlertRepository 构造一条告警落库，
 *              用于验证「采样 → 判定 → 落库 → API → 前端面板」整条链路，
 *              以及本地演示告警面板效果。不会伪造数据到业务表。
 * @usage npm run monitor:seed-alert
 */

import { AlertEngine } from '../src/monitoring/alertEngine.js'
import { MysqlAlertRepository } from '../src/database/monitorStore.js'
import type { MetricSample } from '../src/monitoring/collector.js'
import { closePool, createPool } from '../src/database/pool.js'

/**
 * 构造一个「数据库拖垮接口」的典型故障现场
 */
function buildSample(): MetricSample {
  return {
    timestamp: Date.now(),
    cpuPercent: 88,
    rssMb: 512,
    heapUsedMb: 186,
    heapTotalMb: 200,
    externalMb: 12,
    systemMemTotalMb: 16384,
    systemMemUsedPercent: 76,
    rssPercent: 3.2,
    eventLoop: { mean: 180, p95: 420, max: 900 },
    dbPool: {
      totalConnections: 10,
      activeConnections: 10,
      idleConnections: 0,
      waitingRequests: 6,
      connectionLimit: 10
    },
    redis: { up: true, latencyMs: 4 },
    requests: { count: 120, errorRate5xx: 0.22, p95LatencyMs: 1850, rpm: 120 }
  }
}

async function main() {
  await createPool()
  const repository = new MysqlAlertRepository()
  const engine = new AlertEngine({ repository })

  // 模拟窗口内的错误请求，让快照带上可用于前后端串联的 requestId
  engine.setRecentErrors([
    { requestId: 'seed-req-0001', method: 'POST', route: '/api/v1/applications', statusCode: 500, durationMs: 2100, timestamp: Date.now() },
    { requestId: 'seed-req-0002', method: 'GET', route: '/api/v1/members', statusCode: 500, durationMs: 1900, timestamp: Date.now() }
  ])

  const sample = buildSample()
  // 连续两个采样点，满足需要 consecutivePoints=2 的规则
  await engine.evaluate(sample)
  const alerts = await engine.evaluate({ ...sample, timestamp: Date.now() + 5000 })

  console.log(`\n已生成 ${alerts.length} 条告警：`)
  for (const alert of alerts) {
    console.log(`  [${alert.severity.toUpperCase()}] ${alert.rule} 实测 ${alert.metricValue} / 阈值 ${alert.threshold}`)
  }

  const stored = await repository.list({ limit: 10 })
  console.log(`\n数据库中现有 ${stored.length} 条告警记录`)

  await closePool()
}

main().catch((error: Error) => {
  console.error('生成告警失败:', error.message)
  process.exit(1)
})
