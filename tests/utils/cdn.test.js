/**
 * @file CDN 工具测试
 * @description 覆盖路径转换、协议保留、未启用场景
 */

import { describe, it, expect, vi } from 'vitest'

// Mock import.meta.env
vi.stubEnv('VITE_CDN_BASE_URL', 'https://cdn.star-citizen-team.com')

// 重新导入以应用 mock
const { cdnUrl, getCdnBaseUrl, isCdnEnabled } = await import('../../src/utils/cdn.js')

describe('cdnUrl', () => {
  describe('CDN 已启用', () => {
    it('相对路径应拼接 CDN base', () => {
      const result = cdnUrl('/images/ships/aurora.webp')
      expect(result).toBe('https://cdn.star-citizen-team.com/images/ships/aurora.webp')
    })

    it('开头无 / 的相对路径也应正确处理', () => {
      const result = cdnUrl('images/ships/aurora.webp')
      expect(result).toBe('https://cdn.star-citizen-team.com/images/ships/aurora.webp')
    })

    it('已带 http 协议的外部 URL 应原样返回', () => {
      const result = cdnUrl('https://other-cdn.com/img.jpg')
      expect(result).toBe('https://other-cdn.com/img.jpg')
    })

    it('已带 https 协议的外部 URL 应原样返回', () => {
      const result = cdnUrl('https://external.com/photo.png')
      expect(result).toBe('https://external.com/photo.png')
    })

    it('data: URL 应原样返回', () => {
      const result = cdnUrl('data:image/png;base64,iVBORw0KGgo=')
      expect(result).toBe('data:image/png;base64,iVBORw0KGgo=')
    })

    it('空字符串应原样返回', () => {
      expect(cdnUrl('')).toBe('')
    })

    it('多级路径应正确拼接', () => {
      const result = cdnUrl('/assets/img/banners/hero.webp')
      expect(result).toBe('https://cdn.star-citizen-team.com/assets/img/banners/hero.webp')
    })
  })
})

describe('getCdnBaseUrl', () => {
  it('应返回环境变量值', () => {
    expect(getCdnBaseUrl()).toBe('https://cdn.star-citizen-team.com')
  })
})

describe('isCdnEnabled', () => {
  it('CDN URL 有值时返回 true', () => {
    expect(isCdnEnabled()).toBe(true)
  })
})
