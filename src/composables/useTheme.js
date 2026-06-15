/**
 * @file 主题管理 composable
 * @description 管理亮色/暗黑主题切换，持久化到 localStorage
 * @module composables/useTheme
 */

import { ref } from 'vue'

export const THEME_DARK = 'dark'
export const THEME_LIGHT = 'light'

const STORAGE_KEY = 'star-citizen-theme'

/** 当前主题（全局单例） */
const currentTheme = ref(THEME_DARK)

/** 获取系统偏好（已禁用：科幻主题站默认暗色） */
function getSystemPreference() {
  return THEME_DARK
}

/** 从 localStorage 恢复 */
function getStoredTheme() {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === THEME_LIGHT || stored === THEME_DARK) return stored
  return null
}

/** 应用主题到 DOM */
function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme === THEME_LIGHT ? THEME_LIGHT : '')
}

/** 持久化 */
function persistTheme(theme) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, theme)
}

/**
 * 使用主题
 * @returns {Object} { theme, isDark, isLight, toggle, setTheme }
 */
export function useTheme() {
  // 初始化
  if (currentTheme.value === THEME_DARK && !getStoredTheme()) {
    const stored = getStoredTheme()
    const initial = stored || getSystemPreference()
    currentTheme.value = initial
    applyTheme(initial)
  }

  const isDark = () => currentTheme.value === THEME_DARK
  const isLight = () => currentTheme.value === THEME_LIGHT

  function toggle() {
    const next = currentTheme.value === THEME_DARK ? THEME_LIGHT : THEME_DARK
    currentTheme.value = next
    applyTheme(next)
    persistTheme(next)
  }

  function setTheme(theme) {
    if (theme !== THEME_DARK && theme !== THEME_LIGHT) return
    currentTheme.value = theme
    applyTheme(theme)
    persistTheme(theme)
  }

  return {
    theme: currentTheme,
    isDark,
    isLight,
    toggle,
    setTheme
  }
}

export default useTheme
