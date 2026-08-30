/**
 * @file 报告生成
 * @description 汇总压测结果到 JSON 和 Markdown
 * @module load-tests/lib/report
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { THRESHOLDS } from '../config/thresholds.mjs'

const REPORTS_DIR = 'load-tests/reports'

/**
 * 安全读取文件（不存在返回空字符串）
 * @param {string} path - 文件路径
 * @returns {string}
 */
function readFileSyncSafe(path) {
  try {
    return readFileSync(path, 'utf-8')
  } catch {
    return ''
  }
}

/**
 * 保存单场景结果
 * @param {string} layer - 层级（l1/l2/l3/l4/l5）
 * @param {string} scenario - 场景名
 * @param {Object} result - 结果数据
 */
export function saveResult(layer, scenario, result) {
  const dir = join(REPORTS_DIR, layer)
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `${scenario}.json`)
  writeFileSync(path, JSON.stringify(result, null, 2))
  console.log(`📊 结果已保存: ${path}`)
}

/**
 * 判定结果是否达标
 * @param {Object} result - 格式化后的结果
 * @param {string} thresholdKey - THRESHOLDS 中的 key
 * @returns {{pass: boolean, details: string[]}}
 */
export function evaluateThreshold(result, thresholdKey) {
  const threshold = THRESHOLDS[thresholdKey]
  if (!threshold) return { pass: true, details: ['无阈值定义'] }

  const details = []
  let pass = true

  if (threshold.p95Ms && result.latency?.p95 != null) {
    const ok = result.latency.p95 < threshold.p95Ms
    details.push(`P95: ${result.latency.p95}ms < ${threshold.p95Ms}ms ${ok ? '✓' : '✗'}`)
    pass = pass && ok
  }

  if (threshold.errorRate != null && result.errorRate != null) {
    const ok = result.errorRate < threshold.errorRate
    details.push(`错误率: ${(result.errorRate * 100).toFixed(2)}% < ${(threshold.errorRate * 100).toFixed(1)}% ${ok ? '✓' : '✗'}`)
    pass = pass && ok
  }

  if (threshold.minQps && result.requests?.qps != null) {
    const ok = result.requests.qps >= threshold.minQps
    details.push(`QPS: ${result.requests.qps} >= ${threshold.minQps} ${ok ? '✓' : '✗'}`)
    pass = pass && ok
  }

  return { pass, details }
}

/**
 * 追加到汇总报告
 * @param {string} layer - 层级
 * @param {string} scenario - 场景名
 * @param {Object} result - 结果
 * @param {{pass: boolean, details: string[]}} evaluation - 阈值评估
 */
export function appendSummary(layer, scenario, result, evaluation) {
  const summaryPath = join(REPORTS_DIR, 'summary.md')
  let content = readFileSyncSafe(summaryPath)

  if (!content) {
    content = '# 压测汇总报告\n\n| 层级 | 场景 | P50(ms) | P95(ms) | P99(ms) | QPS | 错误率 | 429 | 达标 | 备注 |\n|---|---|---|---|---|---|---|---|---|---|\n'
  }

  const p50 = result.latency?.p50 ?? '-'
  const p95 = result.latency?.p95 ?? '-'
  const p99 = result.latency?.p99 ?? '-'
  const qps = result.requests?.qps ?? '-'
  const errRate = result.errorRate != null ? `${(result.errorRate * 100).toFixed(2)}%` : '-'
  const rateLimited = result.rateLimited ?? 0
  const passMark = evaluation.pass ? '✅' : '❌'
  const detail = evaluation.details.join('; ')

  content += `| ${layer} | ${scenario} | ${p50} | ${p95} | ${p99} | ${qps} | ${errRate} | ${rateLimited} | ${passMark} | ${detail} |\n`
  writeFileSync(summaryPath, content)
}
