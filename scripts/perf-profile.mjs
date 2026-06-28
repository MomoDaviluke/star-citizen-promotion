import { chromium } from 'playwright'
import fs from 'fs'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await context.newPage()

// 开启 CDP 性能追踪
const client = await page.context().newCDPSession(page)
await client.send('Performance.enable')
await client.send('Profiler.enable')

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)

// 滚动到 Worlds 区域，让火星 Canvas 进入视图并渲染
await page.evaluate(() => {
  document.querySelector('.stellar-nexus__worlds').scrollIntoView({ behavior: 'instant', block: 'center' })
})

await client.send('Profiler.start')
await page.waitForTimeout(4000)
const profile = await client.send('Profiler.stop')

fs.writeFileSync('scripts/perf-profile.json', JSON.stringify(profile.profile))
console.log('性能剖析已保存到 scripts/perf-profile.json')
console.log('可用 Chrome DevTools 打开分析，或上传到 speedscope.app')

await browser.close()
