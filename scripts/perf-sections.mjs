import { chromium } from 'playwright'

async function measureAtSection(sectionName, selector) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()

  await page.addInitScript(() => {
    window.__perfMetrics = { frameDurations: [] }
    let last = performance.now()
    function measureFrame() {
      const now = performance.now()
      const delta = now - last
      last = now
      if (window.__perfMetrics.frameDurations.length > 0 || delta < 100) {
        window.__perfMetrics.frameDurations.push(delta)
      }
      requestAnimationFrame(measureFrame)
    }
    requestAnimationFrame(measureFrame)
  })

  await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  if (selector) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel)
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
    }, selector)
  }

  await page.waitForTimeout(4000)

  const metrics = await page.evaluate(() => {
    const d = window.__perfMetrics.frameDurations
    const sorted = [...d].sort((a, b) => a - b)
    const avg = d.reduce((a, b) => a + b, 0) / d.length
    return {
      fps: (1000 / avg).toFixed(1),
      avg: avg.toFixed(1),
      p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
      over16: d.filter((x) => x > 16.67).length,
      over33: d.filter((x) => x > 33.33).length,
      samples: d.length
    }
  })

  console.log(`${sectionName.padEnd(12)} FPS ${metrics.fps.padStart(6)}  avg ${metrics.avg.padStart(6)}ms  p95 ${metrics.p95.padStart(6)}ms  >16ms ${metrics.over16}/${metrics.samples}  >33ms ${metrics.over33}/${metrics.samples}`)
  await browser.close()
}

console.log('=== 分区域静态帧率 ===')
await measureAtSection('Hero', '.stellar-nexus__hero')
await measureAtSection('Worlds', '.stellar-nexus__worlds')
await measureAtSection('Route', '.stellar-nexus__route')
await measureAtSection('Fleet', '.stellar-nexus__fleet')
