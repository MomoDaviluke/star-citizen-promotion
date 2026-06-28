import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await context.newPage()

await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)
await page.evaluate(() => {
  document.querySelector('.stellar-nexus__fleet').scrollIntoView({ behavior: 'instant', block: 'start' })
})
await page.waitForTimeout(1500)
await page.screenshot({ path: 'screenshots/fullpage-fleet-playwright.png' })

await browser.close()
console.log('Screenshot saved to screenshots/fullpage-fleet-playwright.png')
