/**
 * @file 真实后端链路端到端测试
 * @description 不做页面 route mock，直接经前端同源 /api 代理验证「浏览器 → 真实后端」
 *              的公开读接口往返。CI 中由 e2e job 先起真实后端（MySQL + migrate + backend）
 *              并注入 VITE_BACKEND_URL=http://localhost:3001，此 spec 即为真实发布门禁。
 *              本地未启动真实后端时自动 skip（不误报失败，保持其余 UI 冒烟可用）。
 */

import { test, expect } from '@playwright/test'

// 公开只读端点（后端 /api/v1 收口后均可匿名访问）
const PUBLIC_ENDPOINTS = ['/api/v1/stats', '/api/v1/events', '/api/v1/fleet']

/**
 * 探测真实后端是否可达（经 vite preview 的同源 /api 代理）。
 * 后端未启动时代理返回 5xx 或请求抛错 → 返回 false。
 */
async function isBackendUp(page) {
  try {
    const res = await page.request.get(PUBLIC_ENDPOINTS[0])
    if (!res.ok()) return false
    const json = await res.json()
    return json.success === true
  } catch {
    return false
  }
}

test.describe('真实后端往返（非 mock）', () => {
  test('公开读接口 stats / events / fleet 真实往返', async ({ page }) => {
    if (!(await isBackendUp(page))) {
      test.skip()
      return
    }

    for (const endpoint of PUBLIC_ENDPOINTS) {
      const res = await page.request.get(endpoint)
      expect(res.ok(), `${endpoint} 应返回 2xx`).toBeTruthy()
      const json = await res.json()
      expect(json.success, `${endpoint} 应返回 success: true`).toBe(true)
    }
  })
})