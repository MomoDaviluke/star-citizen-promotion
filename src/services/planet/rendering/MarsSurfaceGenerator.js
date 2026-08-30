/**
 * @file 火星表面纹理生成器
 * @description 使用程序化噪声、陨石坑、峡谷、火山和冰冠生成火星表面纹理
 * @module services/planet/rendering/MarsSurfaceGenerator
 */

import { makeRandom, noise } from '../math/index.js'

/**
 * 火星表面生成配置
 * @typedef {Object} MarsSurfaceOptions
 * @property {number} seed - 随机种子，默认 42
 * @property {number} lightAngle - 光源方向（弧度），默认 Math.PI * 0.25
 */

/**
 * 绘制带光照的陨石坑
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {number} x - 圆心 x
 * @param {number} y - 圆心 y
 * @param {number} r - 半径
 * @param {number} lightAngle - 光源方向（弧度）
 */
function drawCrater(ctx, x, y, r, lightAngle) {
  // 撞击坑底部阴影
  const floor = ctx.createRadialGradient(x, y, 0, x, y, r)
  floor.addColorStop(0, 'rgba(30, 8, 4, 0.85)')
  floor.addColorStop(0.65, 'rgba(55, 18, 10, 0.55)')
  floor.addColorStop(1, 'rgba(80, 30, 18, 0)')
  ctx.fillStyle = floor
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()

  // 隆起的坑缘高光（朝向光源一侧）
  const rimX = x - Math.cos(lightAngle) * r * 0.55
  const rimY = y - Math.sin(lightAngle) * r * 0.55
  const rim = ctx.createRadialGradient(rimX, rimY, 0, rimX, rimY, r * 1.1)
  rim.addColorStop(0, 'rgba(220, 130, 90, 0.45)')
  rim.addColorStop(0.5, 'rgba(180, 85, 55, 0.15)')
  rim.addColorStop(1, 'rgba(180, 85, 55, 0)')
  ctx.fillStyle = rim
  ctx.beginPath()
  ctx.arc(x, y, r * 1.05, 0, Math.PI * 2)
  ctx.fill()

  // 背光侧坑缘阴影
  const shadowX = x + Math.cos(lightAngle) * r * 0.5
  const shadowY = y + Math.sin(lightAngle) * r * 0.5
  const shadow = ctx.createRadialGradient(shadowX, shadowY, 0, shadowX, shadowY, r)
  shadow.addColorStop(0, 'rgba(20, 5, 3, 0.5)')
  shadow.addColorStop(0.6, 'rgba(20, 5, 3, 0.15)')
  shadow.addColorStop(1, 'rgba(20, 5, 3, 0)')
  ctx.fillStyle = shadow
  ctx.beginPath()
  ctx.arc(x, y, r * 1.02, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * 绘制极地冰冠
 * 使用不规则形状和渐变，避免完美的圆形
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {number} x - 圆心 x
 * @param {number} y - 圆心 y
 * @param {number} r - 半径
 */
function drawIceCap(ctx, x, y, r) {
  // 主体冰冠：不规则多边形近似
  ctx.fillStyle = 'rgba(235, 242, 248, 0.75)'
  ctx.beginPath()
  const points = 16
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2
    const radiusVar = r * (0.7 + Math.random() * 0.35)
    const px = x + Math.cos(angle) * radiusVar
    const py = y + Math.sin(angle) * radiusVar * 0.55
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.filter = 'blur(2px)'
  ctx.fill()
  ctx.filter = 'none'

  // 冰冠边缘柔和过渡
  const capGradient = ctx.createRadialGradient(x, y, 0, x, y, r * 1.2)
  capGradient.addColorStop(0, 'rgba(245, 248, 250, 0.4)')
  capGradient.addColorStop(0.6, 'rgba(230, 235, 240, 0.2)')
  capGradient.addColorStop(1, 'rgba(230, 235, 240, 0)')
  ctx.fillStyle = capGradient
  ctx.beginPath()
  ctx.arc(x, y, r * 1.2, 0, Math.PI * 2)
  ctx.fill()

  // 冰冠表面裂纹/纹理
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * r * 0.6
    const cx = x + Math.cos(angle) * dist
    const cy = y + Math.sin(angle) * dist * 0.6
    const length = Math.random() * r * 0.3 + r * 0.1
    const crackAngle = Math.random() * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(crackAngle) * length, cy + Math.sin(crackAngle) * length)
    ctx.stroke()
  }
}

/**
 * 火星表面纹理生成器
 * 生成宽度为输入尺寸 4 倍的无缝循环表面纹理画布
 */
export class MarsSurfaceGenerator {
  /**
   * @param {Partial<MarsSurfaceOptions>} [options] - 配置项
   */
  constructor(options = {}) {
    this.seed = options.seed ?? 42
    this.lightAngle = options.lightAngle ?? Math.PI * 0.25
  }

  /**
   * 生成火星表面纹理
   * @param {number} width - 目标宽度（生成纹理宽度为该值的 4 倍）
   * @param {number} height - 目标高度
   * @returns {HTMLCanvasElement} 包含表面纹理的离屏 Canvas
   */
  generate(width, height) {
    const surfaceCanvas = document.createElement('canvas')
    const surfaceWidth = width * 4
    surfaceCanvas.width = surfaceWidth
    surfaceCanvas.height = height
    const ctx = surfaceCanvas.getContext('2d')

    const rand = makeRandom(this.seed)

    this.drawBaseTerrain(ctx, surfaceWidth, height, rand)
    this.addLargeScaleTerrain(ctx, surfaceWidth, height)
    this.drawVolcano(ctx, surfaceWidth, height, rand)
    this.drawCanyons(ctx, surfaceWidth, height, rand)
    this.drawCraters(ctx, surfaceWidth, height, rand)
    this.addRidgesAndGrooves(ctx, surfaceWidth, height, rand)
    this.drawIceCaps(ctx, surfaceWidth, height)
    this.addDustAndHaze(ctx, surfaceWidth, height, rand)

    return surfaceCanvas
  }

  /**
   * 1. 基础地形色：从深红褐到亮赭石的渐变
   */
  drawBaseTerrain(ctx, surfaceWidth, height, rand) {
    const baseGradient = ctx.createLinearGradient(0, 0, surfaceWidth, 0)
    for (let i = 0; i <= 8; i++) {
      const stop = i / 8
      const hue = 12 + rand() * 8
      const sat = 55 + rand() * 25
      const light = 22 + rand() * 18
      baseGradient.addColorStop(stop, `hsl(${hue}, ${sat}%, ${light}%)`)
    }
    ctx.fillStyle = baseGradient
    ctx.fillRect(0, 0, surfaceWidth, height)
  }

  /**
   * 2. 大范围地貌起伏（暗色熔岩平原 / 亮色高地）
   */
  addLargeScaleTerrain(ctx, surfaceWidth, height) {
    const imageData = ctx.getImageData(0, 0, surfaceWidth, height)
    const data = imageData.data

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < surfaceWidth; x++) {
        const nx = x / surfaceWidth
        const ny = y / height

        // 经度方向的地形噪声
        const terrain = noise(nx * 6, 11, 5) * 0.6 + noise(nx * 18 + ny * 4, 23, 4) * 0.3
        // 纬度方向弯曲，模拟球面投影
        const latitude = (ny - 0.5) * 2
        const sphereFactor = Math.cos(latitude * Math.PI * 0.45)

        // 大型暗区（熔岩平原 / 撞击盆地）
        const maria = noise(nx * 3 + 100, 7, 4)
        // 小型表面粗糙度
        const roughness = noise(nx * 40 + ny * 20, 31, 3) * 0.15

        const idx = (y * surfaceWidth + x) * 4
        let r = data[idx]
        let g = data[idx + 1]
        let b = data[idx + 2]

        // 高地提亮、低地压暗（赤道附近地形更明显）
        const heightShift = terrain * 45 * sphereFactor + roughness * 30
        r = Math.min(255, Math.max(0, r + heightShift))
        g = Math.min(255, Math.max(0, g + heightShift * 0.85))
        b = Math.min(255, Math.max(0, b + heightShift * 0.6))

        // 暗色平原
        if (maria < -0.25) {
          const darken = (maria + 0.25) * -80
          r = Math.max(0, r - darken)
          g = Math.max(0, g - darken * 0.9)
          b = Math.max(0, b - darken * 0.8)
        }

        // 球面边缘压暗（简单模拟）
        const edgeDarken = Math.pow(Math.abs(latitude), 2.2) * 35
        r = Math.max(0, r - edgeDarken)
        g = Math.max(0, g - edgeDarken)
        b = Math.max(0, b - edgeDarken)

        data[idx] = r
        data[idx + 1] = g
        data[idx + 2] = b
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * 3. 巨型地貌：奥林匹斯山风格的盾状火山
   */
  drawVolcano(ctx, surfaceWidth, height, rand) {
    const volcanoX = rand() * surfaceWidth
    const volcanoY = height * 0.35 + rand() * height * 0.3
    const volcanoR = height * 0.16

    const volcano = ctx.createRadialGradient(volcanoX, volcanoY, 0, volcanoX, volcanoY, volcanoR * 1.4)
    volcano.addColorStop(0, 'rgba(210, 130, 90, 0.5)')
    volcano.addColorStop(0.45, 'rgba(180, 95, 60, 0.35)')
    volcano.addColorStop(0.75, 'rgba(120, 55, 35, 0.2)')
    volcano.addColorStop(1, 'rgba(120, 55, 35, 0)')
    ctx.fillStyle = volcano
    ctx.beginPath()
    ctx.arc(volcanoX, volcanoY, volcanoR * 1.4, 0, Math.PI * 2)
    ctx.fill()

    // 火山口
    const caldera = ctx.createRadialGradient(volcanoX, volcanoY, 0, volcanoX, volcanoY, volcanoR * 0.35)
    caldera.addColorStop(0, 'rgba(40, 12, 6, 0.8)')
    caldera.addColorStop(0.6, 'rgba(80, 30, 18, 0.45)')
    caldera.addColorStop(1, 'rgba(80, 30, 18, 0)')
    ctx.fillStyle = caldera
    ctx.beginPath()
    ctx.arc(volcanoX, volcanoY, volcanoR * 0.4, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * 4. 大型峡谷系统（水手谷风格）
   */
  drawCanyons(ctx, surfaceWidth, height, rand) {
    for (let c = 0; c < 3; c++) {
      const canyonX = rand() * surfaceWidth
      const canyonY = height * 0.3 + rand() * height * 0.4
      const canyonLength = height * (0.6 + rand() * 0.25)
      const canyonAngle = (rand() - 0.5) * 0.4
      const canyonWidth = height * (0.02 + rand() * 0.015)

      const canyonGrad = ctx.createLinearGradient(
        canyonX,
        canyonY,
        canyonX + Math.cos(canyonAngle) * canyonLength,
        canyonY + Math.sin(canyonAngle) * canyonLength
      )
      canyonGrad.addColorStop(0, 'rgba(25, 6, 3, 0)')
      canyonGrad.addColorStop(0.15, 'rgba(25, 6, 3, 0.7)')
      canyonGrad.addColorStop(0.5, 'rgba(35, 10, 5, 0.85)')
      canyonGrad.addColorStop(0.85, 'rgba(25, 6, 3, 0.7)')
      canyonGrad.addColorStop(1, 'rgba(25, 6, 3, 0)')

      ctx.strokeStyle = canyonGrad
      ctx.lineWidth = canyonWidth
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(canyonX, canyonY)
      ctx.lineTo(
        canyonX + Math.cos(canyonAngle) * canyonLength,
        canyonY + Math.sin(canyonAngle) * canyonLength
      )
      ctx.stroke()

      // 峡谷两侧的断崖高光
      const rimOffset = canyonWidth * 0.7
      ctx.strokeStyle = 'rgba(200, 130, 90, 0.18)'
      ctx.lineWidth = canyonWidth * 0.25
      ctx.beginPath()
      ctx.moveTo(
        canyonX - Math.sin(canyonAngle) * rimOffset,
        canyonY + Math.cos(canyonAngle) * rimOffset
      )
      ctx.lineTo(
        canyonX + Math.cos(canyonAngle) * canyonLength - Math.sin(canyonAngle) * rimOffset,
        canyonY + Math.sin(canyonAngle) * canyonLength + Math.cos(canyonAngle) * rimOffset
      )
      ctx.stroke()
    }
  }

  /**
   * 5. 陨石坑群
   */
  drawCraters(ctx, surfaceWidth, height, rand) {
    const craterCount = Math.floor(surfaceWidth / 28)
    for (let i = 0; i < craterCount; i++) {
      const cx = rand() * surfaceWidth
      const cy = rand() * height * 0.86 + height * 0.07
      const sizeBias = Math.pow(rand(), 3.5)
      const r = sizeBias * (height * 0.16) + 2
      drawCrater(ctx, cx, cy, r, this.lightAngle)
    }
  }

  /**
   * 6. 小型山脊与沟壑纹理
   */
  addRidgesAndGrooves(ctx, surfaceWidth, height, rand) {
    ctx.globalCompositeOperation = 'overlay'
    for (let i = 0; i < 60; i++) {
      const x = rand() * surfaceWidth
      const y = rand() * height * 0.8 + height * 0.1
      const length = rand() * (height * 0.25) + height * 0.05
      const angle = rand() * Math.PI * 2
      const thickness = rand() * 1.5 + 0.4
      const isRidge = rand() > 0.5

      const gradient = ctx.createLinearGradient(
        x,
        y,
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length
      )
      gradient.addColorStop(0, 'rgba(0,0,0,0)')
      gradient.addColorStop(0.5, isRidge ? 'rgba(255,200,160,0.3)' : 'rgba(20,5,3,0.55)')
      gradient.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.strokeStyle = gradient
      ctx.lineWidth = thickness
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length)
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  /**
   * 7. 极地冰冠
   */
  drawIceCaps(ctx, surfaceWidth, height) {
    const capRadius = height * 0.18
    drawIceCap(ctx, surfaceWidth * 0.25, height * 0.08, capRadius)
    drawIceCap(ctx, surfaceWidth * 0.75, height * 0.92, capRadius * 0.85)
  }

  /**
   * 8. 尘埃/薄雾层
   */
  addDustAndHaze(ctx, surfaceWidth, height, rand) {
    ctx.fillStyle = 'rgba(200, 120, 70, 0.06)'
    for (let i = 0; i < 60; i++) {
      const x = rand() * surfaceWidth
      const y = rand() * height
      const r = rand() * (height * 0.05) + height * 0.008
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
