/**
 * @file 真实纹理球体渲染器
 * @description 使用 NASA 等距圆柱纹理绘制自转的 3D 火星球体
 * @module services/planet/rendering/TexturedSphereRenderer
 */

import { bilerp } from '../math/index.js'
import { FrameRateController } from '../FrameRateController.js'

/**
 * 真实纹理球体渲染器
 * 采用低分辨率离屏渲染 + Canvas 平滑放大 + 简化光照的策略优化性能
 */
export class TexturedSphereRenderer {
  /**
   * @param {Object} options - 配置项
   * @param {HTMLCanvasElement} options.canvas - 目标画布
   * @param {string} options.texture - 纹理图片路径
   * @param {number} options.size - 渲染尺寸（像素）
   * @param {number} options.rotationDuration - 自转周期（秒）
   * @param {number} [options.targetFPS] - 目标帧率，默认 30
   */
  constructor({ canvas, texture, size, rotationDuration, targetFPS = 30 }) {
    this.canvas = canvas
    this.texture = texture
    this.size = size
    this.rotationDuration = rotationDuration
    this.frameController = new FrameRateController(targetFPS)
    this.rafId = null
    this.isActive = false
    this.isVisible = true
    this.rotation = 0
    /** @type {(() => void) | null} 纹理加载失败时的外部回调 */
    this.onError = null
  }

  /**
   * 启动渲染循环
   */
  start() {
    if (this.isActive) return
    this.isActive = true
    this.loadTexture()
  }

  /**
   * 停止渲染循环并释放资源
   */
  stop() {
    this.isActive = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /**
   * 设置可见性状态
   * @param {boolean} visible - 是否可见
   */
  setVisible(visible) {
    this.isVisible = visible
  }

  /**
   * 加载纹理图片并初始化渲染
   */
  loadTexture() {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    const size = this.size
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = size * dpr
    this.canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = this.texture

    img.onload = () => this.initRender(ctx, img, size)
    img.onerror = () => this.onTextureError()
  }

  /**
   * 纹理加载失败时的回调
   * 由调用方处理回退逻辑
   */
  onTextureError() {
    // 触发失败回调，让外部可以切换为程序化火星渲染
    if (this.onError) {
      this.onError()
    }
  }

  /**
   * 初始化渲染管线
   */
  initRender(ctx, img, size) {
    // 1. 创建缩小的纹理画布，限制最大分辨率
    const textureCanvas = document.createElement('canvas')
    const maxTextureSize = 1024
    const scale = Math.min(1, maxTextureSize / Math.max(img.width, img.height))
    textureCanvas.width = Math.floor(img.width * scale)
    textureCanvas.height = Math.floor(img.height * scale)
    const texCtx = textureCanvas.getContext('2d')
    if (!texCtx) return
    texCtx.drawImage(img, 0, 0, textureCanvas.width, textureCanvas.height)

    const textureImage = texCtx.getImageData(0, 0, textureCanvas.width, textureCanvas.height)
    const textureData = textureImage.data
    const tw = textureCanvas.width
    const th = textureCanvas.height

    // 2. 创建 1/3 分辨率的离屏渲染画布
    const renderSize = Math.max(120, Math.round(size / 3))
    const renderCanvas = document.createElement('canvas')
    renderCanvas.width = renderSize
    renderCanvas.height = renderSize
    const renderCtx = renderCanvas.getContext('2d')
    if (!renderCtx) return

    const imageData = renderCtx.createImageData(renderSize, renderSize)
    const data = imageData.data

    const center = renderSize / 2
    const radius = renderSize / 2 - 1
    const lightDir = this.normalizeLight({ x: 0.65, y: -0.25, z: 0.72 })

    const sampleColor = this.createSampler(textureData, tw, th)

    const render = (time) => {
      if (!this.isActive) return

      if (!this.frameController.shouldRender(time)) {
        this.rafId = requestAnimationFrame(render)
        return
      }

      if (this.isVisible) {
        this.rotation += (2 * Math.PI) / (this.rotationDuration * 30)
        this.renderFrame(renderCtx, renderSize, center, radius, lightDir, sampleColor, data, imageData)

        // 将低分辨率结果放大绘制到最终画布
        ctx.clearRect(0, 0, size, size)
        ctx.drawImage(renderCanvas, 0, 0, size, size)

        // 叠加边缘大气辉光
        this.drawAtmosphere(ctx, size)
      }

      this.rafId = requestAnimationFrame(render)
    }

    render()
  }

  /**
   * 归一化光源方向向量
   */
  normalizeLight(lightDir) {
    const len = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2)
    return {
      x: lightDir.x / len,
      y: lightDir.y / len,
      z: lightDir.z / len
    }
  }

  /**
   * 创建纹理采样函数
   */
  createSampler(textureData, tw, th) {
    return (u, v) => {
      u = ((u % 1) + 1) % 1
      v = Math.max(0, Math.min(1, v))
      const x = u * (tw - 1)
      const y = v * (th - 1)
      const x0 = Math.floor(x)
      const y0 = Math.floor(y)
      const x1 = Math.min(x0 + 1, tw - 1)
      const y1 = Math.min(y0 + 1, th - 1)
      const fx = x - x0
      const fy = y - y0

      const i00 = (y0 * tw + x0) * 4
      const i10 = (y0 * tw + x1) * 4
      const i01 = (y1 * tw + x0) * 4
      const i11 = (y1 * tw + x1) * 4

      return {
        r: bilerp(textureData[i00], textureData[i10], textureData[i01], textureData[i11], fx, fy),
        g: bilerp(
          textureData[i00 + 1],
          textureData[i10 + 1],
          textureData[i01 + 1],
          textureData[i11 + 1],
          fx,
          fy
        ),
        b: bilerp(
          textureData[i00 + 2],
          textureData[i10 + 2],
          textureData[i01 + 2],
          textureData[i11 + 2],
          fx,
          fy
        )
      }
    }
  }

  /**
   * 渲染单帧球体
   */
  renderFrame(renderCtx, renderSize, center, radius, lightDir, sampleColor, data, imageData) {
    data.fill(0)

    for (let y = 0; y < renderSize; y++) {
      for (let x = 0; x < renderSize; x++) {
        const dx = (x - center) / radius
        const dy = (y - center) / radius
        const dist2 = dx * dx + dy * dy
        if (dist2 > 1) continue

        const dz = Math.sqrt(1 - dist2)
        const nx = dx
        const ny = -dy
        const nz = dz

        // 根据法线计算经纬度采样坐标
        const lon = Math.atan2(nx, nz) + this.rotation
        const lat = Math.asin(ny)
        const u = lon / (2 * Math.PI)
        const v = 0.5 - lat / Math.PI

        const color = sampleColor(u, v)

        // 漫反射光照
        const dot = nx * lightDir.x + ny * lightDir.y + nz * lightDir.z
        const diffuse = Math.max(0.18, Math.min(1, dot * 0.85 + 0.25))

        // 极地冰冠增强
        const poleDist = Math.PI / 2 - Math.abs(lat)
        const iceCap = Math.max(0, 1 - poleDist / 0.35) * 0.55

        const r = color.r * diffuse + iceCap * 200
        const g = color.g * diffuse + iceCap * 210
        const b = color.b * diffuse + iceCap * 205

        // 边缘消隐（模拟大气薄雾）
        const edge = Math.sqrt(dist2)
        const edgeAlpha = 1 - Math.pow(edge, 12)

        const idx = (y * renderSize + x) * 4
        data[idx] = Math.min(255, r)
        data[idx + 1] = Math.min(255, g)
        data[idx + 2] = Math.min(255, b)
        data[idx + 3] = 255 * edgeAlpha
      }
    }

    renderCtx.putImageData(imageData, 0, 0)
  }

  /**
   * 绘制边缘大气辉光
   */
  drawAtmosphere(ctx, size) {
    const atmosphere = ctx.createRadialGradient(
      size * 0.45,
      size * 0.42,
      size * 0.35,
      size * 0.5,
      size * 0.5,
      size * 0.55
    )
    atmosphere.addColorStop(0, 'rgba(255, 210, 170, 0.08)')
    atmosphere.addColorStop(0.7, 'rgba(220, 120, 70, 0.12)')
    atmosphere.addColorStop(1, 'rgba(220, 120, 70, 0)')
    ctx.fillStyle = atmosphere
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }
}
