/**
 * @file 监控链路端到端验证
 * @description 覆盖「告警落库 → API 读取 → 认领 → 前端回报写入 → 按 requestId 串联」全链路。
 *              告警创建后必须在同一次执行内完成认领：后台调度器每 5 秒会用真实采样
 *              把人造故障告警判定为已恢复，跨进程操作存在竞态。
 * @usage npm run monitor:verify
 */

import { AlertEngine } from '../src/monitoring/alertEngine.js'
import { MysqlAlertRepository } from '../src/database/monitorStore.js'
import type { MetricSample } from '../src/monitoring/collector.js'
import { closePool, createPool } from '../src/database/pool.js'

const BASE = process.env.VERIFY_BASE || 'http://localhost:3001'
const EMAIL = process.env.VERIFY_EMAIL || 'probe_admin_001@test.local'
const PASSWORD = process.env.VERIFY_PASSWORD || 'Probe@12345'

const results: { name: string; ok: boolean; detail: string }[] = []

function check(name: string, ok: boolean, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`)
}

/** 构造一个「数据库拖垮接口」的典型故障现场 */
function buildSample(timestamp: number): MetricSample {
  return {
    timestamp,
    cpuPercent: 88,
    rssMb: 512,
    heapUsedMb: 198,
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

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  })
  if (!res.ok) throw new Error(`登录失败 HTTP ${res.status}`)
  const setCookie = res.headers.get('set-cookie') || ''
  const token = setCookie.split(';').find(p => p.trim().startsWith('auth_token='))
  if (!token) throw new Error('响应中未找到 auth_token')
  return token.trim()
}

async function main() {
  console.log(`\n🔬 监控链路端到端验证 — ${BASE}\n`)
  await createPool()
  const cookie = await login()
  const authHeaders = { 'Content-Type': 'application/json', Cookie: cookie }

  // 1. 告警落库（走真实 AlertEngine + MySQL 仓储）
  const repository = new MysqlAlertRepository()
  const engine = new AlertEngine({ repository })
  const requestId = `verify-req-${Date.now()}`
  engine.setRecentErrors([
    { requestId, method: 'POST', route: '/api/v1/applications', statusCode: 500, durationMs: 2100, timestamp: Date.now() },
    { requestId: `${requestId}-b`, method: 'GET', route: '/api/v1/members', statusCode: 502, durationMs: 1900, timestamp: Date.now() }
  ])

  const now = Date.now()
  await engine.evaluate(buildSample(now))
  const created = await engine.evaluate(buildSample(now + 5000))
  check('告警落库', created.length > 0, `生成 ${created.length} 条`)

  // 2. API 读取告警列表
  const listRes = await fetch(`${BASE}/api/v1/monitor/alerts?status=active&limit=50`, { headers: authHeaders })
  const listBody = await listRes.json() as { success: boolean; data: { id: string; rule: string; createdAt: number }[] }
  check('GET /alerts 读取活跃告警', listRes.ok && listBody.data.length > 0, `返回 ${listBody.data.length} 条`)

  // 3. 校验时间戳未发生偏移（曾出现 1970 事故）
  const fresh = listBody.data.filter(a => Math.abs(Date.now() - a.createdAt) < 60_000)
  check('告警时间戳落在合理区间', fresh.length === listBody.data.length,
    `合理 ${fresh.length}/${listBody.data.length}`)

  // 4. API 认领告警
  const target = listBody.data[0]
  const ackRes = await fetch(`${BASE}/api/v1/monitor/alerts/${target.id}/ack`, {
    method: 'POST',
    headers: authHeaders
  })
  const ackBody = await ackRes.json() as { success: boolean; data?: { status: string; ackBy: string } }
  check('POST /alerts/:id/ack 认领', ackRes.ok && ackBody.data?.status === 'acked',
    `status=${ackBody.data?.status ?? 'n/a'}`)

  // 5. 重复认领应被拒绝
  const reAck = await fetch(`${BASE}/api/v1/monitor/alerts/${target.id}/ack`, {
    method: 'POST',
    headers: authHeaders
  })
  check('重复认领返回 404', reAck.status === 404, `HTTP ${reAck.status}`)

  // 6. 告警快照携带可用于前后端串联的 requestId
  const detailRes = await fetch(`${BASE}/api/v1/monitor/alerts?status=acked&limit=10`, { headers: authHeaders })
  const detailBody = await detailRes.json() as { data: { snapshot?: { recentErrors?: { requestId: string }[] } }[] }
  const acked = detailBody.data.find(a => a.snapshot?.recentErrors?.some(e => e.requestId === requestId))
  check('告警快照包含错误请求 requestId', Boolean(acked), acked ? requestId : '未找到')

  // 7. 前端回报写入（模拟 sendBeacon 的 text/plain 场景）
  const beaconRes = await fetch(`${BASE}/api/v1/monitor/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      category: 'api_failure',
      message: '提交申请返回 500',
      requestId,
      browser: { userAgent: 'verify-script', url: 'http://localhost:5173/apply' }
    })
  })
  check('POST /reports 接受 text/plain（sendBeacon 兜底）', beaconRes.status === 201, `HTTP ${beaconRes.status}`)

  // 8. 按 requestId 检索回报，验证与告警串联
  const reportRes = await fetch(`${BASE}/api/v1/monitor/reports?requestId=${requestId}`, { headers: authHeaders })
  const reportBody = await reportRes.json() as { data: { requestId: string; category: string }[] }
  check('GET /reports 按 requestId 串联', reportBody.data.length > 0 && reportBody.data[0].requestId === requestId,
    `命中 ${reportBody.data.length} 条`)

  // 9. 指标端点返回采样序列
  const metricsRes = await fetch(`${BASE}/api/v1/monitor/metrics`, { headers: authHeaders })
  const metricsBody = await metricsRes.json() as {
    data: { latest: { cpuPercent: number; eventLoop: { p95: number } } | null; history: unknown[]; rules: unknown[] }
  }
  check('GET /metrics 返回采样与规则', metricsRes.ok && metricsBody.data.history.length > 0,
    `历史 ${metricsBody.data.history.length} 点 / 规则 ${metricsBody.data.rules.length} 条`)

  // 10. 未认证访问应被拦截
  const anon = await fetch(`${BASE}/api/v1/monitor/metrics`)
  check('未认证访问指标被拦截', anon.status === 401, `HTTP ${anon.status}`)

  await closePool()

  const passed = results.filter(r => r.ok).length
  console.log(`\n📊 结果: ${passed}/${results.length} 通过`)
  if (passed < results.length) process.exit(1)
}

main().catch((error: Error) => {
  console.error('验证失败:', error.message)
  process.exit(1)
})
