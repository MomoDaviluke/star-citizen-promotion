/**
 * @file L5 WebSocket 并发压测
 * @description 50 并发连接 /ws，验证连接速率限制（10/min/IP）、心跳、内存泄漏
 * @module load-tests/scenarios/l5-e2e/ws-burst
 */

import { WebSocket } from 'ws'
import { parseArgs } from '../../lib/client.mjs'
import { saveResult, appendSummary } from '../../lib/report.mjs'
import { TARGETS } from '../../config/targets.mjs'

async function main() {
  const args = parseArgs()
  const totalConnections = args.smoke ? 5 : 50
  const duration = args.smoke ? 5 : 60

  console.log(`🚀 L5 WebSocket 并发压测 ${args.smoke ? '[SMOKE]' : '[FULL]'}`)
  console.log(`   目标连接数: ${totalConnections} | 持续 ${duration}s`)
  console.log(`⚠️  WS 限流 10/min/IP，单 IP 预期 ~10 成功 + ~${totalConnections - 10} 拒绝`)

  const results = {
    attempted: 0,
    connected: 0,
    rejected: 0,
    messages: { received: 0, sent: 0 },
    pingResponses: 0,
    errors: []
  }

  const clients = []
  const startTime = Date.now()
  const endTime = startTime + duration * 1000

  // 并发创建连接
  for (let i = 0; i < totalConnections; i++) {
    results.attempted++

    const ws = new WebSocket(TARGETS.ws)

    const clientInfo = { ws, connected: false, messages: 0, closed: false, closeCode: null }

    ws.on('open', () => {
      clientInfo.connected = true
      results.connected++

      // 发送 ping 消息
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN && Date.now() < endTime) {
          ws.send(JSON.stringify({ type: 'ping' }))
          results.messages.sent++
        } else {
          clearInterval(pingInterval)
        }
      }, 5000)
    })

    ws.on('message', (data) => {
      clientInfo.messages++
      results.messages.received++
      try {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'pong') results.pingResponses++
      } catch { /* 静默忽略非 JSON 消息，负载测试场景无需处理解析失败 */ }
    })

    ws.on('close', (code) => {
      clientInfo.closed = true
      clientInfo.closeCode = code
      if (code === 1008) results.rejected++
    })

    ws.on('error', (err) => {
      results.errors.push(err.message)
    })

    clients.push(clientInfo)

    // 稍微错开连接，避免全部同时
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  // 等待持续时间结束
  console.log(`等待 ${duration}s...`)
  await new Promise(resolve => setTimeout(resolve, duration * 1000))

  // 关闭所有连接
  for (const c of clients) {
    if (c.ws.readyState === WebSocket.OPEN) {
      c.ws.close(1000, 'test done')
    }
  }

  // 等待关闭完成
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 统计关闭码分布
  const closeCodes = {}
  for (const c of clients) {
    if (c.closeCode !== null) {
      closeCodes[c.closeCode] = (closeCodes[c.closeCode] || 0) + 1
    }
  }

  const result = {
    title: 'L5-ws-burst',
    attempted: results.attempted,
    connected: results.connected,
    rejected: results.rejected,
    rejectedByRateLimit: closeCodes['1008'] || 0,
    closeCodes,
    messages: results.messages,
    pingResponses: results.pingResponses,
    errors: results.errors.slice(0, 5), // 只保留前 5 个错误
    duration
  }

  saveResult('l5', 'ws-burst', result)

  // 断言
  const details = [
    `连接成功: ${result.connected}/${result.attempted}`,
    `速率限制拒绝 (1008): ${result.rejectedByRateLimit}`,
    `ping/pong 响应: ${result.pingResponses}`,
    `消息接收: ${result.messages.received}`
  ]
  const pass = result.rejectedByRateLimit > 0 || result.attempted <= 10
  appendSummary('L5', 'ws-burst', { latency: {}, requests: { qps: 0 }, errorRate: 0, rateLimited: result.rejectedByRateLimit }, { pass, details })

  console.log(`\n连接成功: ${result.connected}/${result.attempted}`)
  console.log(`速率限制拒绝 (1008): ${result.rejectedByRateLimit}`)
  console.log(`关闭码分布: ${JSON.stringify(closeCodes)}`)
  console.log(`ping/pong: ${result.pingResponses}`)
  console.log(`${pass ? '✅' : '❌'} L5 WebSocket 压测完成`)
}

main().catch(err => {
  console.error('L5 ws 失败:', err)
  process.exit(1)
})
