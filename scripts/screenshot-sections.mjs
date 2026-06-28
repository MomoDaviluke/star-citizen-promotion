import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await context.newPage()

await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)

// 关闭 PWA 离线可用提示，避免遮挡设计
await page.evaluate(() => {
  const toast = document.querySelector('.pwa-update-toast, [class*="pwa-toast"]')
  if (toast) toast.style.display = 'none'
})
await page.waitForTimeout(300)

const sections = [
  { name: 'hero', selector: '.stellar-nexus__hero' },
  { name: 'worlds', selector: '.stellar-nexus__worlds' },
  { name: 'route', selector: '.stellar-nexus__route' },
  { name: 'fleet', selector: '.stellar-nexus__fleet' }
]

for (const section of sections) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, section.selector)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `screenshots/section-${section.name}.png` })
  console.log(`Saved screenshots/section-${section.name}.png`)
}

await browser.close()
