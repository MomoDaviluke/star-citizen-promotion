import { chromium } from 'playwright'

/**
 * 隔离测试：分别测量不同场景下的帧时间
 * 1. 全功能
 * 2. 停止火星 Canvas 动画
 * 3. 停止星云背景 Canvas
 * 4. 同时停止两者
 */

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

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  await page.evaluate(() => {
    document.querySelector('.stellar-nexus__worlds').scrollIntoView({ behavior: 'instant', block: 'center' })
  })

  // 执行隔离操作
  if (beforeMeasure) await beforeMeasure(page)

  await page.waitForTimeout(3000)

  const metrics = await page.evaluate(() => {
    const d = window.__perfMetrics.frameDurations
    const sorted = [...d].sort((a, b) => a - b)
    const avg = d.reduce((a, b) => a + b, 0) / d.length
    return {
      fps: (1000 / avg).toFixed(1),
      avg: avg.toFixed(1),
      p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
      p99: sorted[Math.floor(sorted.length * 0.99)].toFixed(1),
      over16: d.filter((x) => x > 16.67).length,
      over33: d.filter((x) => x > 33.33).length,
      samples: d.length
    }
  })

  console.log(`${label.padEnd(30)} FPS ${metrics.fps.padStart(6)}  avg ${metrics.avg.padStart(6)}ms  p95 ${metrics.p95.padStart(6)}ms  p99 ${metrics.p99.padStart(6)}ms  >16ms ${metrics.over16}/${metrics.samples}  >33ms ${metrics.over33}/${metrics.samples}`)

  await browser.close()
}

console.log('=== 性能隔离测试 ===')

await measure('1. 全功能', null)

await measure('2. 停止火星动画', async (page) => {
  await page.evaluate(() => {
    // 通过停止 CosmicPlanet 内部 RAF
    const canvas = document.querySelector('.stellar-nexus__worlds-planet canvas')
    if (canvas) {
      // 让 Canvas 保持静态最后一帧
      canvas.__stop = true
    }
    // 更直接：隐藏火星区域 Canvas
    const planet = document.querySelector('.stellar-nexus__worlds-planet')
    if (planet) planet.style.visibility = 'hidden'
  })
})

await measure('3. 隐藏星云背景', async (page) => {
  await page.evaluate(() => {
    const nebula = document.querySelector('.cosmic-nebula canvas, .stellar-nexus__nebula canvas')
    if (nebula) nebula.style.display = 'none'
  })
})

await measure('4. 同时隐藏火星+星云', async (page) => {
  await page.evaluate(() => {
    const planet = document.querySelector('.stellar-nexus__worlds-planet')
    if (planet) planet.style.visibility = 'hidden'
    const nebula = document.querySelector('.cosmic-nebula canvas, .stellar-nexus__nebula canvas')
    if (nebula) nebula.style.display = 'none'
  })
})
