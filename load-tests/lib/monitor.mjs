/**
 * @file 监控采集
 * @description 轮询后端 /metrics 和 /health，写时序数据
 * @module load-tests/lib/monitor
 */

import { TARGETS } from '../config/targets.mjs'

/**
 * 采样一次后端运行时状态
 * @returns {Promise<Object>} 采样数据
 */
export async function sample() {
  const timestamp = Date.now()

  // 并行拉取 metrics 和 health
  const [metricsRes, healthRes] = await Promise.allSettled([
    fetch(`${TARGETS.backend}/metrics`, { signal: AbortSignal.timeout(5000) }),
    fetch(`${TARGETS.backend}/health`, { signal: AbortSignal.timeout(5000) })
  ])

  const sampleData = { timestamp, heapUsed: null, eventLoopLag: null, poolActive: null, healthy: null }

  if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
    const text = await metricsRes.value.text()
    sampleData.heapUsed = extractMetric(text, 'nodejs_heap_size_used_bytes')
    sampleData.eventLoopLag = extractMetric(text, 'nodejs_eventloop_lag_seconds')
    sampleData.poolActive = extractMetric(text, 'mysql_pool_active_connections')
  }

  if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
    const data = await healthRes.value.json()
    sampleData.healthy = data.status === 'ok'
    if (data.checks?.poolStatus) {
      sampleData.poolActive = sampleData.poolActive ?? data.checks.poolStatus.active
    }
  }

  return sampleData
}

/**
 * 从 Prometheus 文本格式中提取指标值
 * @param {string} text - metrics 文本
 * @param {string} metricName - 指标名
 * @returns {number|null}
 */
function extractMetric(text, metricName) {
  const regex = new RegExp(`^${metricName}\\s+([\\d.]+)`, 'm')
  const match = text.match(regex)
  return match ? parseFloat(match[1]) : null
}

/**
 * 启动定时采样
 * @param {number} intervalMs - 采样间隔（毫秒）
 * @param {string} outputPath - 时序数据输出路径
 * @returns {Function} 停止函数
 */
export function startMonitoring(intervalMs, outputPath) {
  const samples = []
  let stopped = false

  const timer = setInterval(async () => {
    if (stopped) return
    try {
      const s = await sample()
      samples.push(s)
    } catch (err) {
      console.warn(`监控采样失败: ${err.message}`)
    }
  }, intervalMs)

  return async function stop() {
    stopped = true
    clearInterval(timer)
    const { writeFileSync, mkdirSync } = await import('node:fs')
    const { dirname } = await import('node:path')
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, JSON.stringify(samples, null, 2))
    return samples
  }
}

/**
 * 生成 ASCII sparkline 时序图
 * @param {number[]} values - 数值序列
 * @param {number} [width=60] - 图形宽度
 * @returns {string}
 */
export function sparkline(values, width = 60) {
  if (values.length === 0) return ''
  const chars = '▁▂▃▄▅▆▇█'
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  // 降采样到指定宽度
  const step = Math.max(1, Math.floor(values.length / width))
  const sampled = []
  for (let i = 0; i < values.length; i += step) {
    sampled.push(values[i])
  }

  return sampled.map(v => {
    const idx = Math.floor((v - min) / range * (chars.length - 1))
    return chars[Math.max(0, Math.min(chars.length - 1, idx))]
  }).join('')
}
