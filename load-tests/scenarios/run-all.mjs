/**
 * @file 压测顶层编排器
 * @description 按 L1→L2→L4→L3→L5 顺序运行所有场景，spawn 隔离单场景崩溃
 * @module load-tests/scenarios/run-all
 */

import { spawn } from 'node:child_process'
import { probeAll } from '../lib/probe.mjs'
import { seedTestData, verifySeedData } from '../lib/seeds.mjs'

/** 场景执行顺序（L3 在 L4 后，因需 L1/L2 基线；L4 在 L3 前避免限流污染长跑）*/
const SCENARIOS = [
  { layer: 'L1', script: 'l1-baseline/readme-endpoints.mjs', desc: 'L1 公开读端点基线' },
  { layer: 'L1', script: 'l1-baseline/auth-flow.mjs', desc: 'L1 认证流程' },
  { layer: 'L1', script: 'l1-baseline/write-endpoints.mjs', desc: 'L1 写端点' },
  { layer: 'L2', script: 'l2-mixed/80-20-mixed.mjs', desc: 'L2 读写混合' },
  { layer: 'L4', script: 'l4-policy/rate-limit-verify.mjs', desc: 'L4 限流验证' },
  { layer: 'L4', script: 'l4-policy/cache-hit-miss.mjs', desc: 'L4 缓存验证' },
  { layer: 'L3', script: 'l3-soak/soak-runner.mjs', desc: 'L3 稳定性长跑' },
  { layer: 'L5', script: 'l5-e2e/ws-burst.mjs', desc: 'L5 WebSocket' },
  { layer: 'L5', script: 'l5-e2e/through-nginx.mjs', desc: 'L5 Nginx 对比' },
  { layer: 'L5', script: 'l5-e2e/frontend-perf.mjs', desc: 'L5 前端性能' }
]

/**
 * 运行单个场景脚本
 * @param {string} script - 脚本相对路径
 * @returns {Promise<{success: boolean, exitCode: number}>}
 */
function runScript(script) {
  return new Promise((resolve) => {
    const child = spawn('node', [`load-tests/scenarios/${script}`], {
      stdio: 'inherit',
      shell: true
    })

    child.on('close', (code) => {
      resolve({ success: code === 0, exitCode: code })
    })

    child.on('error', (err) => {
      console.error(`场景启动失败: ${err.message}`)
      resolve({ success: false, exitCode: -1 })
    })
  })
}

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  压力测试全套编排器')
  console.log('═══════════════════════════════════════════════\n')

  // 1. 探测目标
  if (!await probeAll()) {
    console.error('\n❌ 目标不可达，请先运行: npm run load:up')
    process.exit(1)
  }

  // 2. 初始化数据
  await seedTestData()
  if (!await verifySeedData()) {
    console.error('\n❌ 测试账号验证失败')
    process.exit(1)
  }

  // 3. 依次运行场景
  const results = []
  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i]
    console.log(`\n[${i + 1}/${SCENARIOS.length}] ${scenario.desc}`)
    console.log('───────────────────────────────────────────────')

    const result = await runScript(scenario.script)
    results.push({ ...scenario, ...result })

    if (!result.success) {
      console.warn(`⚠️  ${scenario.desc} 失败 (exit ${result.exitCode})，继续下一场景`)
    }

    // L4 后等待限流窗口恢复
    if (scenario.layer === 'L4') {
      console.log('\n⏳ L4 完成，等待 90s 让限流窗口恢复...')
      await new Promise(resolve => setTimeout(resolve, 90000))
    }
  }

  // 4. 汇总
  console.log('\n═══════════════════════════════════════════════')
  console.log('  压测汇总')
  console.log('═══════════════════════════════════════════════\n')

  for (const r of results) {
    const status = r.success ? '✅' : '❌'
    console.log(`  ${status} [${r.layer}] ${r.desc}`)
  }

  const passed = results.filter(r => r.success).length
  const failed = results.length - passed
  console.log(`\n总计: ${results.length} 场景 | ✅ ${passed} 通过 | ❌ ${failed} 失败`)
  console.log('\n📊 详细报告: load-tests/reports/summary.md')

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('编排器失败:', err)
  process.exit(1)
})
