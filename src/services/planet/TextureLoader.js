/**
 * @file 纹理加载器
 * @description 预加载行星纹理图片，支持懒加载场景下的进入视口触发
 * @module services/planet/TextureLoader
 */

/**
 * 预加载单张图片
 * @param {string} src - 图片路径
 * @returns {Promise<void>} 加载完成或失败的 Promise
 */
export function preloadTexture(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * 纹理懒加载观察器
 * 在目标元素进入视口时触发纹理加载，加载完成后调用回调
 */
export class TextureLazyLoader {
  /**
   * @param {Object} options - 配置项
   * @param {HTMLElement} options.target - 需要观察的 DOM 元素
   * @param {string} options.src - 纹理图片路径
   * @param {(ready: boolean) => void} options.onChange - 状态变化回调
   * @param {string} [options.rootMargin] - IntersectionObserver 的 rootMargin，默认 '200px'
   */
  constructor({ target, src, onChange, rootMargin = '200px' }) {
    this.target = target
    this.src = src
    this.onChange = onChange
    this.rootMargin = rootMargin
    this.observer = null
    this.hasTriggered = false
  }

  /**
   * 开始观察目标元素
   */
  observe() {
    if (!this.target || typeof IntersectionObserver === 'undefined') {
      // 环境不支持观察者时直接标记为就绪，保证非懒加载场景正常显示
      this.onChange(true)
      return
    }

    this.observer = new IntersectionObserver(
      (entries) => this.handleEntries(entries),
      { threshold: 0, rootMargin: this.rootMargin }
    )
    this.observer.observe(this.target)
  }

  /**
   * 处理 IntersectionObserver 回调
   * @param {IntersectionObserverEntry[]} entries - 观察条目
   */
  async handleEntries(entries) {
    const visible = entries.some((entry) => entry.isIntersecting)
    if (visible && !this.hasTriggered) {
      this.hasTriggered = true
      try {
        await preloadTexture(this.src)
        this.onChange(true)
      } catch (err) {
        // 预加载失败时保持未就绪，调用方可以回退到默认渐变
        // eslint-disable-next-line no-console
        console.warn('[TextureLoader] preload failed:', this.src, err)
      }
      this.disconnect()
    }
  }

  /**
   * 停止观察并释放资源
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}
