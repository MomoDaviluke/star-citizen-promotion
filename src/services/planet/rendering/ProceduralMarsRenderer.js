/**
 * @file 程序化火星渲染器
 * @description 使用程序生成的火星表面纹理绘制自转的 2D 火星圆盘
 * @module services/planet/rendering/ProceduralMarsRenderer
 */

import { MarsSurfaceGenerator } from './MarsSurfaceGenerator.js'
import { FrameRateController } from '../FrameRateController.js'

/**
 * 程序化火星渲染器
 * 通过循环滚动表面纹理画布并叠加球体光照来模拟自转
 */
export class ProceduralMarsRenderer {
  /**
   * @param {Object} options - 配置项
   * @param {HTMLCanvasElement} options.canvas - 目标画布
   * @param {number} options.size - 渲染尺寸（像素）
   * @param {number} options.rotationDuration - 自转周期（秒）
   * @param {number} [options.targetFPS] - 目标帧率，默认 30
   */
  constructor({ canvas, size, rotationDuration, targetFPS = 30 }) {
    this.canvas = canvas
    this.size = size
    this.rotationDuration = rotationDuration
    this.frameController = new FrameRateController(targetFPS)
    this.rafId = null
    this.isActive = false
    this.isVisible = true
    this.rotation = 0
    this.surfaceCanvas = null
    this.surfaceWidth = 0
  }

  /**
   * 启动渲染循环
   */
  start() {
    if (this.isActive) return
    this.isActive = true
    this.initCanvas()
    this.surfaceCanvas = new MarsSurfaceGenerator().generate(this.size, this.size)
    this.surfaceWidth = this.surfaceCanvas.width / Math.min(window.devicePixelRatio || 1, 2)
    this.render()
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
   * 初始化目标画布尺寸和 DPR 缩放
   */
  initCanvas() {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = this.size * dpr
    this.canvas.height = this.size * dpr
    ctx.scale(dpr, dpr)
  }

  /**
   * 渲染单帧
   */
  render() {
    if (!this.isActive) return

    this.rafId = requestAnimationFrame((time) => {
      if (!this.frameController.shouldRender(time) || !this.isVisible) {
        this.render()
        return
      }

      const ctx = this.canvas.getContext('2d')
      if (!ctx || !this.surfaceCanvas) {
        this.render()
        return
      }

      const size = this.size
      const surfaceWidth = this.surfaceWidth

      // 自转速度：每帧偏移像素（30fps 下加倍以保持视觉速度）
      const speed = (surfaceWidth / (this.rotationDuration * 60)) * 2
      this.rotation = (this.rotation + speed) % surfaceWidth

      ctx.clearRect(0, 0, size, size)

      const center = size / 2
      const radius = size / 2 - 2

      // 1. 绘制星球圆盘并裁剪
      ctx.save()
      ctx.beginPath()
      ctx.arc(center, center, radius, 0, Math.PI * 2)
      ctx.clip()

      // 2. 从表面纹理画布中截取圆形区域
      ctx.drawImage(
        this.surfaceCanvas,
        this.rotation,
        0,
        size,
        size,
        0,
        0,
        size,
        size
      )

      // 为了无缝循环，在右侧补上一段开头
      if (this.rotation + size > surfaceWidth) {
        const overflow = this.rotation + size - surfaceWidth
        ctx.drawImage(
          this.surfaceCanvas,
          0,
          0,
          overflow,
          size,
          size - overflow,
          0,
          overflow,
          size
        )
      }

      ctx.restore()

      // 3. 球体光照与阴影
      this.drawLighting(ctx, center, radius)

      // 4. 边缘大气散射
      this.drawAtmosphere(ctx, center, radius)

      this.render()
    })
  }

  /**
   * 绘制球体光照与阴影
   */
  drawLighting(ctx, center, radius) {
    const lightGradient = ctx.createRadialGradient(
      center - radius * 0.35,
      center - radius * 0.25,
      radius * 0.1,
      center,
      center,
      radius
    )
    lightGradient.addColorStop(0, 'rgba(255, 230, 200, 0.22)')
    lightGradient.addColorStop(0.35, 'rgba(255, 220, 180, 0.08)')
    lightGradient.addColorStop(0.65, 'rgba(0, 0, 0, 0)')
    lightGradient.addColorStop(0.9, 'rgba(0, 0, 0, 0.55)')
    lightGradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)')
    ctx.fillStyle = lightGradient
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * 绘制边缘大气散射
   */
  drawAtmosphere(ctx, center, radius) {
    const atmosphere = ctx.createRadialGradient(
      center,
      center,
      radius * 0.92,
      center,
      center,
      radius * 1.08
    )
    atmosphere.addColorStop(0, 'rgba(220, 120, 70, 0)')
    atmosphere.addColorStop(0.7, 'rgba(220, 120, 70, 0.15)')
    atmosphere.addColorStop(1, 'rgba(220, 120, 70, 0)')
    ctx.fillStyle = atmosphere
    ctx.beginPath()
    ctx.arc(center, center, radius * 1.1, 0, Math.PI * 2)
    ctx.fill()
  }
}
