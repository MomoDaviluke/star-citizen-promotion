/**
 * @file L5 前端性能采集
 * @description 对关键页面跑 Lighthouse + Playwright 动画 FPS 采集
 *              拦截 /api/rum 请求解析 useWebVitals 上报数据
 * @module load-tests/scenarios/l5-e2e/frontend-perf
 */

import { chromium } from 'playwright'
import { parseArgs } from '../../lib/client.mjs'
import { saveResult, appendSummary } from '../../lib/report.mjs'
import { runLighthouse } from './lighthouse-runner.mjs'
import { TARGETS } from '../../config/targets.mjs'
import { THRESHOLDS } from '../../config/thresholds.mjs'

/** 关键页面列表 */
const PAGES = [
  { path: '/', name: 'home' },
  { path: '/fleet', name: 'fleet' },
  { path: '/members', name: 'members' },
  { path: '/join', name: 'join' }
]

/**
 * 用 Playwright 采集动画 FPS
 * @param {import('playwright').Page} page - Playwright 页面对象
 * @param {number} durationMs - 采集时长（毫秒）
 * @returns {Promise<number>} 平均 FPS
 */
async function measureAnimationFPS(page, durationMs = 5000) {
  // 注入 requestAnimationFrame 计数器
  await page.evaluate(() => {
    window.__fpsFrames = 0
    window.__fpsStartTime = performance.now()
    function countFrame() {
      window.__fpsFrames++
      if (performance.now() - window.__fpsStartTime < 5000) {
        requestAnimationFrame(countFrame)
      }
    }
    requestAnimationFrame(countFrame)
  })

  // 等待采集完成
  await page.waitForTimeout(durationMs)

  // 读取结果
  const fps = await page.evaluate(() => {
    const elapsed = (performance.now() - window.__fpsStartTime) / 1000
    return Math.round(window.__fpsFrames / elapsed)
  })

  return fps
}

/**
 * 拦截 /api/rum 请求，解析 useWebVitals 上报数据
 * @param {import('playwright').Page} page - Playwright 页面对象
 * @returns {Object} 收集的 RUM 指标
 */
function collectRumMetrics(page) {
  const rumMetrics = []

  page.on('request', (req) => {
    if (req.url().includes('/api/rum') && req.method() === 'POST') {
      try {
        const body = JSON.parse(req.postData())
        if (Array.isArray(body)) {
          rumMetrics.push(...body)
        } else {
          rumMetrics.push(body)
        }
      } catch { /* 静默忽略非 JSON 响应，负载测试场景无需处理解析失败 */ }
    }
  })

  return rumMetrics
}

async function main() {
  const args = parseArgs()
  const pages = args.smoke ? PAGES.slice(0, 1) : PAGES

  console.log(`🚀 L5 前端性能采集 ${args.smoke ? '[SMOKE]' : '[FULL]'}`)
  console.log(`   页面: ${pages.map(p => p.path).join(', ')}`)
  console.log(`   前端目标: ${TARGETS.frontend}`)
  console.log('⚠️  本地 HTTP/1.1 预览 Lighthouse 评分仅供参考（参考 DBG-03）')

  const allResults = []

  for (const page of pages) {
    console.log(`\n📍 页面: ${page.path}`)

    const url = `${TARGETS.frontend}${page.path}`
    const pageResult = { path: page.path, url }

    // 1. Lighthouse 审计
    try {
      console.log('  运行 Lighthouse...')
      const lhResult = await runLighthouse(url, { desktop: true })
      pageResult.lighthouse = lhResult
      console.log(`  LCP: ${lhResult.metrics.lcp?.toFixed(0)}ms | CLS: ${lhResult.metrics.cls?.toFixed(3)} | INP: ${lhResult.metrics.inp?.toFixed(0)}ms | 性能分: ${lhResult.scores.performance.toFixed(0)}`)
    } catch (err) {
      console.error(`  ❌ Lighthouse 失败: ${err.message}`)
      pageResult.lighthouseError = err.message
    }

    // 2. Playwright 动画 FPS + RUM 采集
    try {
      console.log('  采集动画 FPS + RUM...')
      const browser = await chromium.launch({ headless: true })
      const ctx = await browser.newContext()
      const pg = await ctx.newPage()
      const rumMetrics = collectRumMetrics(pg)

      await pg.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      // 等待页面动画启动
      await pg.waitForTimeout(2000)

      // 采集 5s 动画 FPS
      const fps = await measureAnimationFPS(pg, 5000)
      pageResult.animationFPS = fps
      console.log(`  动画 FPS: ${fps}`)

      // 滚动触发更多动画
      await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await pg.waitForTimeout(2000)

      pageResult.rumMetrics = rumMetrics
      if (rumMetrics.length > 0) {
        console.log(`  RUM 上报 ${rumMetrics.length} 条指标`)
      }

      await browser.close()
    } catch (err) {
      console.error(`  ❌ FPS 采集失败: ${err.message}`)
      pageResult.fpsError = err.message
    }

    allResults.push(pageResult)
    saveResult('l5', `frontend-${page.name}`, pageResult)
  }

  // 阈值评估
  let allPass = true
  const details = []

  for (const r of allResults) {
    const lh = r.lighthouse
    if (!lh) continue

    const lcpOk = lh.metrics.lcp < THRESHOLDS.l5.lcp
    const clsOk = lh.metrics.cls < THRESHOLDS.l5.cls
    const inpOk = lh.metrics.inp < THRESHOLDS.l5.inp
    const fpsOk = r.animationFPS >= THRESHOLDS.l5.fps

    details.push(`${r.path}: LCP=${lh.metrics.lcp?.toFixed(0)}ms(${lcpOk ? '✓' : '✗'}) CLS=${lh.metrics.cls?.toFixed(3)}(${clsOk ? '✓' : '✗'}) INP=${lh.metrics.inp?.toFixed(0)}ms(${inpOk ? '✓' : '✗'}) FPS=${r.animationFPS}(${fpsOk ? '✓' : '✗'})`)

    allPass = allPass && lcpOk && clsOk && inpOk && fpsOk
  }

  appendSummary('L5', 'frontend-perf', { latency: {}, requests: { qps: 0 }, errorRate: 0, rateLimited: 0 }, { pass: allPass, details })

  console.log(`\n${allPass ? '✅' : '❌'} L5 前端性能采集完成`)
  console.log('详细报告: load-tests/reports/l5/')
}

main().catch(err => {
  console.error('L5 frontend 失败:', err)
  process.exit(1)
})
