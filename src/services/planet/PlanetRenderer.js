/**
 * @file Planet 渲染协调器
 * @description 根据配置协调纹理懒加载、真实纹理球体或程序化火星渲染
 * @module services/planet/PlanetRenderer
 */

import { TextureLazyLoader } from './TextureLoader.js'
import { TexturedSphereRenderer } from './rendering/TexturedSphereRenderer.js'
import { ProceduralMarsRenderer } from './rendering/ProceduralMarsRenderer.js'

/**
 * Planet 渲染协调器
 * 封装渲染器的选择、启动、暂停和资源释放逻辑，让 Vue 组件只关心状态管理
 */
export class PlanetRenderer {
  /**
   * @param {Object} options - 配置项
   * @param {HTMLElement} options.container - 行星容器 DOM 元素
   * @param {HTMLCanvasElement} options.canvas - 目标画布
   * @param {string} options.variant - 行星变体
   * @param {number} options.size - 渲染尺寸（像素）
   * @param {number} options.rotationDuration - 自转周期（秒）
   * @param {string} options.texture - 真实纹理图片路径，可选
   */
  constructor({ container, canvas, variant, size, rotationDuration, texture = '' }) {
    this.container = container
    this.canvas = canvas
    this.variant = variant
    this.size = size
    this.rotationDuration = rotationDuration
    this.texture = texture

    this.lazyLoader = null
    this.activeRenderer = null
    this.visibilityObserver = null
    this.isVisible = true
    this.isTextureReady = false
    this.onTextureReadyChange = null
  }

  /**
   * 设置纹理就绪状态变化回调
   * @param {(ready: boolean) => void} callback - 回调函数
   */
  setTextureReadyCallback(callback) {
    this.onTextureReadyChange = callback
  }

  /**
   * 初始化纹理懒加载和渲染
   */
  init() {
    this.initTextureLazyLoad()
    this.initVisibilityObserver()

    // 仅在无纹理的程序化火星模式下立即启动渲染
    if (this.variant === 'mars' && !this.texture) {
      this.startProceduralMars()
    }
  }

  /**
   * 初始化纹理懒加载
   */
  initTextureLazyLoad() {
    if (!this.texture) {
      // 无纹理时直接标记为就绪，CSS 类会忽略这个值
      this.isTextureReady = true
      this.notifyTextureReady(true)
      return
    }

    this.lazyLoader = new TextureLazyLoader({
      target: this.container,
      src: this.texture,
      onChange: (ready) => {
        this.isTextureReady = ready
        this.notifyTextureReady(ready)
      }
    })
    this.lazyLoader.observe()
  }

  /**
   * 初始化可见性观察器
   */
  initVisibilityObserver() {
    if (!this.canvas || typeof IntersectionObserver === 'undefined') return

    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        this.isVisible = entries.some((entry) => entry.isIntersecting)
        if (this.activeRenderer) {
          this.activeRenderer.setVisible(this.isVisible)
        }
      },
      { threshold: 0 }
    )
    this.visibilityObserver.observe(this.canvas)
  }

  /**
   * 当纹理就绪后启动真实纹理球体渲染
   */
  startTexturedSphere() {
    if (!this.texture || !this.canvas) return
    this.stopActiveRenderer()
    this.activeRenderer = new TexturedSphereRenderer({
      canvas: this.canvas,
      texture: this.texture,
      size: this.size,
      rotationDuration: this.rotationDuration
    })
    this.activeRenderer.onError = () => {
      // 真实纹理加载失败时回退到程序化火星渲染
      this.startProceduralMars()
    }
    this.activeRenderer.setVisible(this.isVisible)
    this.activeRenderer.start()
  }

  /**
   * 启动程序化火星渲染
   */
  startProceduralMars() {
    if (!this.canvas || this.variant !== 'mars') return
    this.stopActiveRenderer()
    this.activeRenderer = new ProceduralMarsRenderer({
      canvas: this.canvas,
      size: this.size,
      rotationDuration: this.rotationDuration
    })
    this.activeRenderer.setVisible(this.isVisible)
    this.activeRenderer.start()
  }

  /**
   * 停止当前激活的渲染器
   */
  stopActiveRenderer() {
    if (this.activeRenderer) {
      this.activeRenderer.stop()
      this.activeRenderer = null
    }
  }

  /**
   * 通知外部纹理就绪状态变化
   */
  notifyTextureReady(ready) {
    if (this.onTextureReadyChange) {
      this.onTextureReadyChange(ready)
    }
  }

  /**
   * 释放所有资源
   */
  dispose() {
    this.stopActiveRenderer()
    if (this.lazyLoader) {
      this.lazyLoader.disconnect()
      this.lazyLoader = null
    }
    if (this.visibilityObserver) {
      this.visibilityObserver.disconnect()
      this.visibilityObserver = null
    }
  }
}
