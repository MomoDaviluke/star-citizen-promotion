/**
 * @file 目标可达性探测
 * @description 压测前验证所有目标 URL 可达
 * @module load-tests/lib/probe
 */

import { TARGETS } from '../config/targets.mjs'

/**
 * 探测单个 URL
 * @param {string} url - 目标 URL
 * @param {string} name - 显示名称
 * @returns {Promise<boolean>}
 */
async function probeUrl(url, name) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const ok = res.ok || res.status === 404 // 404 也算可达（服务在运行）
    console.log(`  ${ok ? '✅' : '❌'} ${name}: ${url} (${res.status})`)
    return ok
  } catch (err) {
    console.log(`  ❌ ${name}: ${url} (${err.message})`)
    return false
  }
}

/**
 * 探测所有目标
 * @returns {Promise<boolean>} 全部可达返回 true
 */
export async function probeAll() {
  console.log('🔍 探测目标可达性...')

  const checks = [
    probeUrl(`${TARGETS.backend}/health/live`, 'backend'),
    probeUrl(`${TARGETS.nginx}/`, 'nginx'),
    probeUrl(`${TARGETS.frontend}/`, 'frontend')
  ]

  const results = await Promise.all(checks)
  const allOk = results.every(Boolean)

  if (allOk) {
    console.log('✅ 所有目标可达')
  } else {
    console.log('❌ 部分目标不可达，请先运行 npm run load:up')
  }

  return allOk
}
