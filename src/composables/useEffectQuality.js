/**
 * @file 效果质量检测组合式函数
 * @description 根据设备性能自动调整动画和视觉效果的质量等级，
 *              支持 Low / Medium / High / Ultra 四个级别。
 *              检测维度：硬件并发数、设备内存、GPU 渲染能力、用户偏好。
 * @module composables/useEffectQuality
 * @example
 * const { quality, isLowEnd, shouldReduceParticles } = useEffectQuality()
 * if (shouldReduceParticles.value) { particleCount = 20 }
 */

import { ref, computed } from 'vue'

/**
 * 效果质量等级
 * @readonly
 * @enum {string}
 */
export const QUALITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  ULTRA: 'ultra'
}

/**
 * 检测设备性能分数
 * @returns {number} 0-100 的性能分数
 */
function detectPerformanceScore() {
  let score = 50

  if (navigator.hardwareConcurrency) {
    score += Math.min(navigator.hardwareConcurrency * 5, 25)
  }

  if (navigator.deviceMemory) {
    score += Math.min(navigator.deviceMemory * 3, 15)
  }

  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      if (renderer.includes('NVIDIA') || renderer.includes('AMD') || renderer.includes('Radeon')) {
        score += 15
      } else if (renderer.includes('Intel')) {
        score += 5
      }
    }
    score += 5
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    score = 0
  }

  if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    score -= 20
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * 根据性能分数确定质量等级
 * @param {number} score - 性能分数
 * @returns {string} 质量等级
 */
function scoreToLevel(score) {
  if (score < 25) return QUALITY_LEVELS.LOW
  if (score < 50) return QUALITY_LEVELS.MEDIUM
  if (score < 75) return QUALITY_LEVELS.HIGH
  return QUALITY_LEVELS.ULTRA
}

const cachedScore = detectPerformanceScore()
const cachedLevel = scoreToLevel(cachedScore)

/**
 * 效果质量检测组合式函数
 * @returns {Object} 质量检测 API
 */
export function useEffectQuality() {
  const quality = ref(cachedLevel)
  const score = ref(cachedScore)

  const isLowEnd = computed(() => quality.value === QUALITY_LEVELS.LOW)
  const isUltra = computed(() => quality.value === QUALITY_LEVELS.ULTRA)
  const shouldReduceParticles = computed(() =>
    quality.value === QUALITY_LEVELS.LOW || quality.value === QUALITY_LEVELS.MEDIUM
  )
  const shouldDisableCanvas = computed(() => quality.value === QUALITY_LEVELS.LOW)
  const maxParticleCount = computed(() => {
    switch (quality.value) {
      case QUALITY_LEVELS.LOW: return 20
      case QUALITY_LEVELS.MEDIUM: return 50
      case QUALITY_LEVELS.HIGH: return 100
      case QUALITY_LEVELS.ULTRA: return 200
      default: return 50
    }
  })
  const animationDuration = computed(() => {
    switch (quality.value) {
      case QUALITY_LEVELS.LOW: return 0.3
      case QUALITY_LEVELS.MEDIUM: return 0.6
      case QUALITY_LEVELS.HIGH: return 0.8
      case QUALITY_LEVELS.ULTRA: return 1.0
      default: return 0.6
    }
  })

  return {
    quality,
    score,
    isLowEnd,
    isUltra,
    shouldReduceParticles,
    shouldDisableCanvas,
    maxParticleCount,
    animationDuration,
    QUALITY_LEVELS
  }
}
