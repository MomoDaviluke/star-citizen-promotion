import { chromium } from 'playwright'

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

// 禁用所有 CSS 动画
await page.evaluate(() => {
  const style = document.createElement('style')
  style.textContent = '* { animation: none !important; transition: none !important; }'
  document.head.appendChild(style)
})

await page.waitForTimeout(4000)

const metrics = await page.evaluate(() => {
  const d = window.__perfMetrics.frameDurations
  const sorted = [...d].sort((a, b) => a - b)
  const avg = d.reduce((a, b) => a + b, 0) / d.length
  return {
    fps: (1000 / avg).toFixed(1),
    avg: avg.toFixed(1),
    p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
    samples: d.length
  }
})

console.log(`禁用所有动画: FPS ${metrics.fps}  avg ${metrics.avg}ms  p95 ${metrics.p95}ms  samples ${metrics.samples}`)
await browser.close()
