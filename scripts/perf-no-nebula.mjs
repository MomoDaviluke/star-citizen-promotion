import { chromium } from 'playwright'

async function measure(label, beforeMeasure) {
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

  if (beforeMeasure) await beforeMeasure(page)

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

  console.log(`${label.padEnd(25)} FPS ${metrics.fps.padStart(6)}  avg ${metrics.avg.padStart(6)}ms  p95 ${metrics.p95.padStart(6)}ms  samples ${metrics.samples}`)
  await browser.close()
}

console.log('=== 组件开关隔离测试 ===')
await measure('1. 全功能', null)
await measure('2. 隐藏星云', async (page) => {
  await page.evaluate(() => {
    const nebula = document.querySelector('.cosmic-nebula')
    if (nebula) nebula.style.display = 'none'
  })
})
await measure('3. 隐藏火星', async (page) => {
  await page.evaluate(() => {
    const planet = document.querySelector('.stellar-nexus__worlds-planet')
    if (planet) planet.style.display = 'none'
  })
})
await measure('4. 隐藏星云+火星', async (page) => {
  await page.evaluate(() => {
    const nebula = document.querySelector('.cosmic-nebula')
    if (nebula) nebula.style.display = 'none'
    const planet = document.querySelector('.stellar-nexus__worlds-planet')
    if (planet) planet.style.display = 'none'
  })
})
