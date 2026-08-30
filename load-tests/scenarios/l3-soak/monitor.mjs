/**
 * @file L3 旁路监控独立入口
 * @description 可单独运行，持续采集 metrics 直到 Ctrl+C
 * @module load-tests/scenarios/l3-soak/monitor
 */

import { startMonitoring, sample, sparkline } from '../../lib/monitor.mjs'
import { TARGETS } from '../../config/targets.mjs'

async function main() {
  console.log('📡 L3 旁路监控（独立模式）')
  console.log(`   目标: ${TARGETS.backend}`)
  console.log('   按 Ctrl+C 停止并输出时序数据\n')

  const stop = startMonitoring(5000, 'load-tests/reports/l3/timeseries-standalone.json')

  // 每 30s 打印一次状态
  const printTimer = setInterval(async () => {
    const s = await sample()
    const heapMB = s.heapUsed ? (s.heapUsed / 1024 / 1024).toFixed(1) : 'N/A'
    const lagMs = s.eventLoopLag ? (s.eventLoopLag * 1000).toFixed(1) : 'N/A'
    const pool = s.poolActive ?? 'N/A'
    console.log(`heap=${heapMB}MB | eventloop lag=${lagMs}ms | pool active=${pool} | healthy=${s.healthy}`)
  }, 30000)

  process.on('SIGINT', async () => {
    clearInterval(printTimer)
    console.log('\n停止监控...')
    const samples = await stop()
    console.log(`\n采集 ${samples.length} 个样本`)

    // 输出 sparkline
    const heapValues = samples.map(s => s.heapUsed).filter(v => v != null)
    const lagValues = samples.map(s => s.eventLoopLag).filter(v => v != null)

    if (heapValues.length > 0) {
      console.log(`\nheap 趋势: ${sparkline(heapValues)}`)
    }
    if (lagValues.length > 0) {
      console.log(`eventloop lag 趋势: ${sparkline(lagValues)}`)
    }

    process.exit(0)
  })
}

main().catch(err => {
  console.error('监控失败:', err)
  process.exit(1)
})
