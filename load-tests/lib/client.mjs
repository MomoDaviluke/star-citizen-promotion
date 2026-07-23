/**
 * @file autocannon 统一封装
 * @description 提供场景运行、参数解析、结果格式化
 * @module load-tests/lib/client
 */

import autocannon from 'autocannon'
import { TARGETS } from '../config/targets.mjs'

/**
 * 解析命令行参数（--smoke、--duration、--connections）
 * @param {string[]} argv - process.argv.slice(2)
 * @returns {{smoke: boolean, duration: number, connections: number}}
 */
export function parseArgs(argv = process.argv.slice(2)) {
  const smoke = argv.includes('--smoke')
  const durationArg = argv.find(a => a.startsWith('--duration='))
  const connectionsArg = argv.find(a => a.startsWith('--connections='))

  return {
    smoke,
    duration: smoke ? 5 : (durationArg ? parseInt(durationArg.split('=')[1], 10) : 30),
    connections: smoke ? 1 : (connectionsArg ? parseInt(connectionsArg.split('=')[1], 10) : 10)
  }
}

/**
 * 探测目标可达性
 * @param {string} url - 目标 URL
 * @returns {Promise<boolean>}
 */
export async function probe(url) {
  try {
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url
    const res = await fetch(`${cleanUrl}/health/live`, {
      signal: AbortSignal.timeout(5000)
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * 运行单个压测场景
 * @param {Object} opts - 场景选项
 * @param {string} opts.title - 场景标题
 * @param {string} opts.url - 完整 URL（已拼接 target）
 * @param {string} [opts.method='GET'] - HTTP 方法
 * @param {number} opts.connections - 并发连接数
 * @param {number} opts.duration - 持续秒数
 * @param {Object} [opts.headers] - 请求头
 * @param {string|Object} [opts.body] - 请求体（POST/PUT）
 * @param {boolean} [opts.expectRateLimit=false] - 是否预期 429（不计为错误）
 * @returns {Promise<Object>} autocannon 结果
 */
export async function runScenario(opts) {
  const {
    title,
    url,
    method = 'GET',
    connections,
    duration,
    headers = {},
    body,
    expectRateLimit = false
  } = opts

  const instance = autocannon({
    title,
    url,
    method,
    connections,
    duration,
    headers,
    body: typeof body === 'object' ? JSON.stringify(body) : body,
    timeout: 30
  })

  return new Promise((resolve, reject) => {
    let settled = false
    instance.on('error', (err) => {
      if (!settled) {
        settled = true
        reject(err)
      }
    })
    autocannon.track(instance, { renderProgressBar: false, renderResultsTable: false })

    // 超时保护
    const timeoutMs = (duration + 10) * 1000
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        instance.stop()
        reject(new Error(`场景超时: ${title} (${timeoutMs}ms)`))
      }
    }, timeoutMs)

    instance.on('done', (r) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve(formatResult(r, expectRateLimit))
      }
    })
  })
}

/**
 * 格式化 autocannon 结果
 * @param {Object} result - autocannon 原始结果
 * @param {boolean} expectRateLimit - 是否预期 429
 * @returns {Object} 标准化结果
 */
function formatResult(result, expectRateLimit) {
  const statusCodeStats = {}
  for (const [code, count] of Object.entries(result.statusCodeStats || {})) {
    statusCodeStats[code] = count
  }

  const total = result.requests.total || 0
  const errors = result.errors || 0
  const rateLimited = statusCodeStats['429'] || 0
  const nonRateLimitErrors = expectRateLimit ? errors : errors - rateLimited

  return {
    title: result.title,
    url: result.url,
    method: result.method,
    connections: result.connections,
    duration: result.duration,
    requests: {
      total,
      average: result.requests.average,
      sent: result.requests.sent,
      qps: result.requests.average
    },
    latency: {
      min: result.latency.min,
      p50: result.latency.p50,
      p90: result.latency.p90,
      p95: result.latency.p97_5 || result.latency.p95,
      p99: result.latency.p99,
      max: result.latency.max
    },
    statusCodes: statusCodeStats,
    errors,
    rateLimited,
    nonRateLimitErrors: Math.max(0, nonRateLimitErrors),
    errorRate: total > 0 ? (Math.max(0, nonRateLimitErrors) / total) : 0
  }
}

/**
 * 拼接完整 URL
 * @param {string} target - TARGETS 中的 key
 * @param {string} path - API 路径
 * @returns {string}
 */
export function buildUrl(target, path) {
  const base = TARGETS[target] || target
  return `${base}${path}`
}
