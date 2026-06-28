import { chromium } from 'playwright'

const DURATION = 8000 // 测量时长 ms

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await context.newPage()

// 收集 PerformanceObserver 长任务与帧时间
await page.addInitScript(() => {
  window.__perfMetrics = {
    longTasks: [],
    frameDurations: [],
    layoutShifts: []
  }

  // 长任务
  if ('PerformanceObserver' in window) {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perfMetrics.longTasks.push({
          start: entry.startTime,
          duration: entry.duration
        })
      }
    })
    longTaskObserver.observe({ entryTypes: ['longtask'] })

    // Layout Shift
    const lsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__perfMetrics.layoutShifts.push(entry.value)
        }
      }
    })
    lsObserver.observe({ entryTypes: ['layout-shift'] })
  }

  // 用 requestAnimationFrame 估算帧时间
  let last = performance.now()
  function measureFrame() {
    const now = performance.now()
    const delta = now - last
    last = now
    // 丢弃首个异常值
    if (window.__perfMetrics.frameDurations.length > 0 || delta < 100) {
      window.__perfMetrics.frameDurations.push(delta)
    }
    requestAnimationFrame(measureFrame)
  }
  requestAnimationFrame(measureFrame)
})

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)

// 模拟滚动经过所有区块，触发 GSAP 动画与 Canvas 渲染
await page.evaluate(async () => {
  const sections = ['.stellar-nexus__hero', '.stellar-nexus__worlds', '.stellar-nexus__route', '.stellar-nexus__fleet']
  for (const sel of sections) {
    const el = document.querySelector(sel)
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
    await new Promise((r) => setTimeout(r, 1200))
  }
})

await page.waitForTimeout(2000)

const metrics = await page.evaluate(() => {
  const frameDurations = window.__perfMetrics.frameDurations
  const longTasks = window.__perfMetrics.longTasks
  const sorted = [...frameDurations].sort((a, b) => a - b)
  const avg = frameDurations.reduce((a, b) => a + b, 0) / frameDurations.length
  const p50 = sorted[Math.floor(sorted.length * 0.5)]
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  const p99 = sorted[Math.floor(sorted.length * 0.99)]
  const over16ms = frameDurations.filter((d) => d > 16.67).length
  const over33ms = frameDurations.filter((d) => d > 33.33).length
  const longTaskTotal = longTasks.reduce((a, b) => a + b.duration, 0)

  return {
    sampleCount: frameDurations.length,
    avgFrameMs: avg,
    p50FrameMs: p50,
    p95FrameMs: p95,
    p99FrameMs: p99,
    over16ms,
    over33ms,
    longTaskCount: longTasks.length,
    longTaskTotalMs: longTaskTotal,
    maxLongTaskMs: longTasks.length ? Math.max(...longTasks.map((t) => t.duration)) : 0,
    layoutShiftSum: window.__perfMetrics.layoutShifts.reduce((a, b) => a + b, 0)
  }
})

console.log('=== 性能基线 ===')
console.log(`帧样本数: ${metrics.sampleCount}`)
console.log(`平均帧时间: ${metrics.avgFrameMs.toFixed(2)} ms (≈ ${(1000 / metrics.avgFrameMs).toFixed(1)} FPS)`)
console.log(`P50 帧时间: ${metrics.p50FrameMs.toFixed(2)} ms`)
console.log(`P95 帧时间: ${metrics.p95FrameMs.toFixed(2)} ms`)
console.log(`P99 帧时间: ${metrics.p99FrameMs.toFixed(2)} ms`)
console.log(`超过 16.67ms (60FPS 掉帧): ${metrics.over16ms} (${((metrics.over16ms / metrics.sampleCount) * 100).toFixed(1)}%)`)
console.log(`超过 33.33ms (30FPS 严重掉帧): ${metrics.over33ms} (${((metrics.over33ms / metrics.sampleCount) * 100).toFixed(1)}%)`)
console.log(`长任务数: ${metrics.longTaskCount}, 总计 ${metrics.longTaskTotalMs.toFixed(0)} ms, 最大 ${metrics.maxLongTaskMs.toFixed(0)} ms`)
console.log(`累计 Layout Shift: ${metrics.layoutShiftSum.toFixed(4)}`)

await browser.close()
