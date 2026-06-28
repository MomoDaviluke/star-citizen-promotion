import { chromium } from 'playwright'
import fs from 'fs'

/**
 * 将 Hero 背景图预渲染 CSS filter，避免浏览器每帧实时计算
 * 桌面 filter: brightness(0.55) contrast(1.1) saturate(0.7) sepia(0.2) hue-rotate(165deg)
 * 移动 filter: brightness(0.45) contrast(1.1) saturate(0.7) sepia(0.2) hue-rotate(165deg)
 */
const inputUrl = 'http://127.0.0.1:4175/assets/cosmic/ships/constellation-andromeda.jpg'

async function filterAndSave(imageUrl, filter, outputPath) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const dataUrl = await page.evaluate(async ({ imageUrl, filter }) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.filter = filter
    ctx.drawImage(img, 0, 0)

    return canvas.toDataURL('image/jpeg', 0.92)
  }, { imageUrl, filter })

  const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '')
  fs.writeFileSync(outputPath, Buffer.from(base64, 'base64'))
  console.log(`已生成预过滤图片: ${outputPath}`)
  await browser.close()
}

await filterAndSave(
  inputUrl,
  'brightness(0.55) contrast(1.1) saturate(0.7) sepia(0.2) hue-rotate(165deg)',
  'public/assets/cosmic/ships/constellation-andromeda-hero.jpg'
)

await filterAndSave(
  inputUrl,
  'brightness(0.45) contrast(1.1) saturate(0.7) sepia(0.2) hue-rotate(165deg)',
  'public/assets/cosmic/ships/constellation-andromeda-hero-mobile.jpg'
)
