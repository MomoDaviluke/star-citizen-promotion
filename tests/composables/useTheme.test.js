/**
 * @file useTheme composable 测试
 * @description 覆盖主题切换、持久化、系统偏好
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('useTheme', () => {
  let useTheme, THEME_DARK, THEME_LIGHT

  beforeEach(async () => {
    // 清理 localStorage 和 DOM 状态
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')

    // 重置 matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false, // 默认系统偏好为暗黑
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    // 因为 currentTheme 是模块级单例，需要重新导入以重置
    vi.resetModules()
    const mod = await import('../../src/composables/useTheme.js')
    useTheme = mod.useTheme
    THEME_DARK = mod.THEME_DARK
    THEME_LIGHT = mod.THEME_LIGHT
  })

  describe('初始状态', () => {
    it('应有 toggle 和 setTheme 方法', () => {
      const { toggle, setTheme } = useTheme()
      expect(typeof toggle).toBe('function')
      expect(typeof setTheme).toBe('function')
    })

    it('默认主题应为 dark', () => {
      const { theme } = useTheme()
      expect(theme.value).toBe(THEME_DARK)
    })
  })

  describe('toggle', () => {
    it('从 dark 切换到 light', () => {
      const { theme, toggle, isLight } = useTheme()
      expect(theme.value).toBe(THEME_DARK)
      toggle()
      expect(theme.value).toBe(THEME_LIGHT)
      expect(isLight()).toBe(true)
    })

    it('从 light 切换回 dark', () => {
      const { theme, toggle } = useTheme()
      toggle() // dark -> light
      toggle() // light -> dark
      expect(theme.value).toBe(THEME_DARK)
    })

    it('toggle 应更新 DOM data-theme 属性', () => {
      const { toggle } = useTheme()
      toggle() // 切换到 light
      expect(document.documentElement.getAttribute('data-theme')).toBe(THEME_LIGHT)
    })

    it('toggle 应持久化到 localStorage', () => {
      const { toggle } = useTheme()
      toggle()
      expect(localStorage.getItem('star-citizen-theme')).toBe(THEME_LIGHT)
    })
  })

  describe('setTheme', () => {
    it('应支持直接设置主题', () => {
      const { theme, setTheme } = useTheme()
      setTheme(THEME_LIGHT)
      expect(theme.value).toBe(THEME_LIGHT)
    })

    it('应忽略无效主题值', () => {
      const { theme, setTheme } = useTheme()
      const before = theme.value
      setTheme('invalid')
      expect(theme.value).toBe(before)
    })

    it('应更新 DOM', () => {
      const { setTheme } = useTheme()
      setTheme(THEME_LIGHT)
      expect(document.documentElement.getAttribute('data-theme')).toBe(THEME_LIGHT)

      setTheme(THEME_DARK)
      expect(document.documentElement.getAttribute('data-theme')).toBe('')
    })
  })

  describe('isDark / isLight', () => {
    it('isDark 应反映当前主题', () => {
      const { isDark, toggle } = useTheme()
      expect(isDark()).toBe(true)
      toggle()
      expect(isDark()).toBe(false)
    })

    it('isLight 应反映当前主题', () => {
      const { isLight, toggle } = useTheme()
      expect(isLight()).toBe(false)
      toggle()
      expect(isLight()).toBe(true)
    })
  })
})
