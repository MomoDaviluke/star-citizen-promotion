/**
 * @file 帧率控制器
 * @description 限制 Canvas 动画渲染帧率，降低持续动画对 CPU/GPU 的占用
 * @module services/planet/FrameRateController
 */

/**
 * 帧率控制器
 * 通过控制最小帧间隔，把动画稳定限制在目标帧率以下
 */
export class FrameRateController {
  /**
   * @param {number} targetFPS - 目标帧率，默认 30fps
   */
  constructor(targetFPS = 30) {
    this.targetFPS = targetFPS
    this.frameInterval = 1000 / targetFPS
    this.lastFrameTime = 0
  }

  /**
   * 判断当前帧是否应该执行渲染
   * @param {number} currentTime - 当前时间戳（performance.now 或 requestAnimationFrame 传入值）
   * @returns {boolean} 是否达到渲染间隔
   */
  shouldRender(currentTime) {
    if (currentTime - this.lastFrameTime >= this.frameInterval) {
      this.lastFrameTime = currentTime
      return true
    }
    return false
  }

  /**
   * 动态调整目标帧率
   * @param {number} fps - 新的目标帧率
   */
  setTargetFPS(fps) {
    this.targetFPS = fps
    this.frameInterval = 1000 / fps
  }

  /**
   * 重置上一帧时间，下一次调用将立即允许渲染
   */
  reset() {
    this.lastFrameTime = 0
  }
}
