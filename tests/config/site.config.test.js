/**
 * @file 站点配置测试
 * @description 测试站点配置文件的正确性和完整性
 */

import { describe, it, expect } from 'vitest'
import { siteConfig } from '@/config/site.config.js'

describe('站点配置', () => {
  describe('siteInfo 配置', () => {
    it('应包含必要的站点信息', () => {
      expect(siteConfig.siteInfo).toBeDefined()
      expect(siteConfig.siteInfo.name).toBeDefined()
      expect(siteConfig.siteInfo.nameEn).toBeDefined()
      expect(siteConfig.siteInfo.description).toBeDefined()
      expect(siteConfig.siteInfo.version).toBeDefined()
      expect(siteConfig.siteInfo.author).toBeDefined()
    })

    it('版本号应符合语义化版本规范', () => {
      const versionPattern = /^\d+\.\d+\.\d+$/
      expect(siteConfig.siteInfo.version).toMatch(versionPattern)
    })

    it('年份应为当前年份', () => {
      expect(siteConfig.siteInfo.year).toBe(new Date().getFullYear())
    })
  })

  describe('navigation 配置', () => {
    it('应包含导航菜单', () => {
      expect(siteConfig.navigation).toBeDefined()
      expect(Array.isArray(siteConfig.navigation)).toBe(true)
      expect(siteConfig.navigation.length).toBeGreaterThan(0)
    })

    it('每个导航项应包含必要属性', () => {
      siteConfig.navigation.forEach(item => {
        expect(item.label).toBeDefined()
        expect(item.to).toBeDefined()
        expect(typeof item.label).toBe('string')
        expect(typeof item.to).toBe('string')
      })
    })

    it('导航路径应以 / 开头', () => {
      siteConfig.navigation.forEach(item => {
        expect(item.to.startsWith('/')).toBe(true)
      })
    })
  })

  describe('home 配置', () => {
    it('应包含英雄区域配置', () => {
      expect(siteConfig.home.hero).toBeDefined()
      expect(siteConfig.home.hero.badge).toBeDefined()
      expect(siteConfig.home.hero.title).toBeDefined()
      expect(siteConfig.home.hero.subtitle).toBeDefined()
      expect(siteConfig.home.hero.description).toBeDefined()
    })

    it('应包含主按钮配置', () => {
      expect(siteConfig.home.hero.primaryButton).toBeDefined()
      expect(siteConfig.home.hero.primaryButton.text).toBeDefined()
      expect(siteConfig.home.hero.primaryButton.to).toBeDefined()
    })

    it('应包含次按钮配置', () => {
      expect(siteConfig.home.hero.secondaryButton).toBeDefined()
      expect(siteConfig.home.hero.secondaryButton.text).toBeDefined()
      expect(siteConfig.home.hero.secondaryButton.href).toBeDefined()
    })

    it('应包含统计数据配置', () => {
      expect(siteConfig.home.stats).toBeDefined()
      expect(Array.isArray(siteConfig.home.stats)).toBe(true)
      expect(siteConfig.home.stats.length).toBeGreaterThan(0)
    })

    it('统计项应包含必要属性', () => {
      siteConfig.home.stats.forEach(stat => {
        expect(stat.label).toBeDefined()
        expect(stat.value).toBeDefined()
      })
    })
  })

  describe('about 配置', () => {
    it('应包含团队介绍段落', () => {
      expect(siteConfig.about.sections).toBeDefined()
      expect(Array.isArray(siteConfig.about.sections)).toBe(true)
      expect(siteConfig.about.sections.length).toBeGreaterThan(0)
    })

    it('每个段落应包含标题和内容', () => {
      siteConfig.about.sections.forEach(section => {
        expect(section.title).toBeDefined()
        expect(section.content).toBeDefined()
      })
    })

    it('应包含时间线配置', () => {
      expect(siteConfig.about.timeline).toBeDefined()
      expect(Array.isArray(siteConfig.about.timeline)).toBe(true)
    })
  })

  describe('join 配置', () => {
    it('应包含加入要求', () => {
      expect(siteConfig.join.requirements).toBeDefined()
      expect(Array.isArray(siteConfig.join.requirements)).toBe(true)
      expect(siteConfig.join.requirements.length).toBeGreaterThan(0)
    })

    it('应包含申请流程', () => {
      expect(siteConfig.join.process).toBeDefined()
      expect(Array.isArray(siteConfig.join.process)).toBe(true)
    })

    it('应包含在线时间选项', () => {
      expect(siteConfig.join.availabilityOptions).toBeDefined()
      expect(Array.isArray(siteConfig.join.availabilityOptions)).toBe(true)
    })
  })

  describe('contact 配置', () => {
    it('应包含联系渠道', () => {
      expect(siteConfig.contact.channels).toBeDefined()
      expect(Array.isArray(siteConfig.contact.channels)).toBe(true)
    })

    it('应包含合作信息', () => {
      expect(siteConfig.contact.cooperation).toBeDefined()
      expect(siteConfig.contact.cooperation.description).toBeDefined()
    })
  })

  describe('footer 配置', () => {
    it('应包含页脚描述', () => {
      expect(siteConfig.footer.description).toBeDefined()
    })

    it('应包含快速链接', () => {
      expect(siteConfig.footer.quickLinks).toBeDefined()
      expect(Array.isArray(siteConfig.footer.quickLinks)).toBe(true)
    })
  })

  describe('theme 配置', () => {
    it('应包含颜色配置', () => {
      expect(siteConfig.theme.colors).toBeDefined()
      expect(siteConfig.theme.colors.primary).toBeDefined()
      expect(siteConfig.theme.colors.secondary).toBeDefined()
      expect(siteConfig.theme.colors.background).toBeDefined()
      expect(siteConfig.theme.colors.text).toBeDefined()
    })

    it('颜色值应为有效的十六进制格式', () => {
      const hexPattern = /^#[0-9A-Fa-f]{6}$/
      const { colors } = siteConfig.theme

      expect(colors.primary).toMatch(hexPattern)
      expect(colors.secondary).toMatch(hexPattern)
      expect(colors.background).toMatch(hexPattern)
    })

    it('应包含字体配置', () => {
      expect(siteConfig.theme.fonts).toBeDefined()
      expect(siteConfig.theme.fonts.primary).toBeDefined()
    })

    it('应包含动画配置', () => {
      expect(siteConfig.theme.animation).toBeDefined()
      expect(typeof siteConfig.theme.animation.enableScanline).toBe('boolean')
      expect(typeof siteConfig.theme.animation.enableGlow).toBe('boolean')
    })
  })

  describe('features 配置', () => {
    it('应包含功能开关', () => {
      expect(siteConfig.features).toBeDefined()
      expect(typeof siteConfig.features.enableAI).toBe('boolean')
      expect(typeof siteConfig.features.enableAuth).toBe('boolean')
      expect(typeof siteConfig.features.enableNotifications).toBe('boolean')
    })
  })

  describe('api 配置', () => {
    it('应包含 API 基础配置', () => {
      expect(siteConfig.api).toBeDefined()
      expect(siteConfig.api.baseUrl).toBeDefined()
      expect(siteConfig.api.timeout).toBeDefined()
    })

    it('超时时间应为正数', () => {
      expect(siteConfig.api.timeout).toBeGreaterThan(0)
    })

    it('重试次数应为非负数', () => {
      expect(siteConfig.api.retryCount).toBeGreaterThanOrEqual(0)
    })
  })
})
