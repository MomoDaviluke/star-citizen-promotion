/**
 * 音效管理组合式函数
 * @description 管理网站音效，支持按钮点击、页面切换等音效
 * @module composables/useSoundEffect
 * @author Full-stack Team
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { createLogger } from '../utils/logger.js'
const logger = createLogger('SoundEffect')


// 音效配置
const soundConfig = {
  click: { url: '/sounds/click.mp3', volume: 0.3 },
  hover: { url: '/sounds/hover.mp3', volume: 0.2 },
  success: { url: '/sounds/success.mp3', volume: 0.5 },
  error: { url: '/sounds/error.mp3', volume: 0.5 },
  transition: { url: '/sounds/transition.mp3', volume: 0.4 }
}

// 音频缓存
const audioCache = new Map()

// 是否启用音效
const soundEnabled = ref(true)

/**
 * 使用音效管理
 * @param {Object} options - 配置选项
 * @param {boolean} [options.enabled=true] - 是否启用音效
 * @param {string} [options.baseUrl=''] - 音效文件基础路径
 * @returns {Object} 暴露的方法
 */
export function useSoundEffect(options = {}) {
  const { enabled = true, baseUrl = '' } = options

  soundEnabled.value = enabled
  const base = baseUrl || import.meta.env.BASE_URL || '/'

  /**
   * 预加载音效
   * @param {string|Array<string>} soundNames - 音效名称或名称数组
   * @returns {Promise<void>}
   */
  async function preloadSounds(soundNames) {
    const names = Array.isArray(soundNames) ? soundNames : [soundNames]
    
    const promises = names.map(name => {
      if (audioCache.has(name)) {
        return Promise.resolve()
      }

      const config = soundConfig[name]
      if (!config) {
        logger.warn(`Sound "${name}" not found in config`)
        return Promise.resolve()
      }

      return new Promise((resolve) => {
        const audio = new Audio(`${base}${config.url}`)
        audio.preload = 'auto'
        audio.load()
        
        audio.addEventListener('canplaythrough', () => {
          audioCache.set(name, audio)
          resolve()
        }, { once: true })

        audio.addEventListener('error', () => {
          logger.warn(`Failed to load sound: ${name}`)
          resolve()
        }, { once: true })
      })
    })

    await Promise.all(promises)
  }

  /**
   * 播放音效
   * @param {string} soundName - 音效名称
   * @param {Object} [options] - 播放选项
   * @param {number} [options.volume] - 音量覆盖（0-1）
   * @param {number} [options.playbackRate=1] - 播放速率
   * @returns {Promise<void>}
   */
  async function playSound(soundName, options = {}) {
    if (!soundEnabled.value) return

    const { volume, playbackRate = 1 } = options

    try {
      let audio = audioCache.get(soundName)

      if (!audio) {
        const config = soundConfig[soundName]
        if (!config) {
          logger.warn(`Sound "${soundName}" not found in config`)
          return
        }

        audio = new Audio(`${base}${config.url}`)
        audioCache.set(soundName, audio)
      }

      // 克隆音频以支持重叠播放
      const clone = audio.cloneNode()
      clone.volume = volume ?? soundConfig[soundName].volume
      clone.playbackRate = playbackRate

      await clone.play()
    } catch (err) {
      // 将 unknown 类型的 err 断言为 Error，确保可以安全访问 message
      const error = err instanceof Error ? err : new Error(String(err))
      // 自动播放策略可能导致错误，静默失败
      logger.debug('Sound play failed:', error.message)
    }
  }

  /**
   * 停止所有音效
   */
  function stopAllSounds() {
    audioCache.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
  }

  /**
   * 启用音效
   */
  function enableSound() {
    soundEnabled.value = true
  }

  /**
   * 禁用音效
   */
  function disableSound() {
    soundEnabled.value = false
    stopAllSounds()
  }

  /**
   * 切换音效状态
   */
  function toggleSound() {
    if (soundEnabled.value) {
      disableSound()
    } else {
      enableSound()
    }
  }

  /**
   * 添加自定义音效
   * @param {string} name - 音效名称
   * @param {string} url - 音效文件URL
   * @param {number} [volume=0.5] - 默认音量
   */
  function addSound(name, url, volume = 0.5) {
    soundConfig[name] = { url, volume }
  }

  /**
   * 移除音效
   * @param {string} name - 音效名称
   */
  function removeSound(name) {
    delete soundConfig[name]
    audioCache.delete(name)
  }

  // 组件挂载时预加载常用音效
  onMounted(() => {
    // 延迟预加载，避免阻塞首屏渲染
    setTimeout(() => {
      preloadSounds(['click', 'hover', 'success', 'transition']).catch(() => {})
    }, 2000)
  })

  // 组件卸载时清理
  onUnmounted(() => {
    stopAllSounds()
  })

  return {
    // 状态
    soundEnabled,

    // 方法
    preloadSounds,
    playSound,
    stopAllSounds,
    enableSound,
    disableSound,
    toggleSound,
    addSound,
    removeSound,

    // 便捷方法
    playClick: () => playSound('click'),
    playHover: () => playSound('hover'),
    playSuccess: () => playSound('success'),
    playError: () => playSound('error'),
    playTransition: () => playSound('transition')
  }
}

/**
 * 全局音效管理（单例模式）
 */
let globalSoundInstance = null

/**
 * 获取全局音效实例
 * @returns {Object} 音效管理实例
 */
export function useGlobalSound() {
  if (!globalSoundInstance) {
    globalSoundInstance = useSoundEffect()
  }
  return globalSoundInstance
}
