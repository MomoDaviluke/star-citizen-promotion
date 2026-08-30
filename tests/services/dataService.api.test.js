/**
 * @file 数据服务 USE_API=true 分支测试（M4-2 补测）
 * @description 现有 dataService.test.js 锁定 VITE_USE_API=false（静态数据路径），
 *              本文件独立 stub 为 true，覆盖 API 成功/降级回退/管理员透传/参数校验分支
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// 与 dataService.test.js 同款约定：stubEnv 必须先于动态 import（ESM 静态提升规避）
vi.stubEnv('VITE_USE_API', 'true')

vi.mock('@/services/http.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

vi.mock('@/utils/logger.js', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })
}))

import { acePilots, members, projects } from '@/data/siteContent.js'
const { dataService } = await import('@/services/dataService.js')
const httpClient = (await import('@/services/http.js')).default

describe('dataService USE_API=true 分支', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStats', () => {
    it('成功时返回 API 的 stats 与 summary', async () => {
      httpClient.get.mockResolvedValue({
        success: true,
        data: { stats: [{ label: '成员', value: 10 }], summary: { totalMembers: 10 } }
      })
      const r = await dataService.getStats()
      expect(httpClient.get).toHaveBeenCalledWith('/stats')
      expect(r.stats).toEqual([{ label: '成员', value: 10 }])
      expect(r.summary).toEqual({ totalMembers: 10 })
    })

    it('response.success=false 时回退静态数据', async () => {
      httpClient.get.mockResolvedValue({ success: false })
      const r = await dataService.getStats()
      expect(Array.isArray(r.stats)).toBe(true)
      expect(r.summary).toBeNull()
    })

    it('API 异常时回退静态数据', async () => {
      httpClient.get.mockRejectedValue(new Error('network down'))
      const r = await dataService.getStats()
      expect(Array.isArray(r.stats)).toBe(true)
    })
  })

  describe('getPilots / getPilot', () => {
    it('成功时透传 API 响应', async () => {
      const api = { success: true, data: [{ id: 'p1' }], pagination: { total: 1 } }
      httpClient.get.mockResolvedValue(api)
      const r = await dataService.getPilots({ limit: 10 })
      expect(httpClient.get).toHaveBeenCalledWith('/pilots', { limit: 10 })
      expect(r).toBe(api)
    })

    it('API 异常时回退静态飞行员列表', async () => {
      httpClient.get.mockRejectedValue(new Error('x'))
      const r = await dataService.getPilots()
      expect(r.success).toBe(true)
      expect(Array.isArray(r.data)).toBe(true)
    })

    it('getPilot API 成功直接返回', async () => {
      const api = { success: true, data: { id: 'p1' } }
      httpClient.get.mockResolvedValue(api)
      expect(await dataService.getPilot('p1')).toBe(api)
      expect(httpClient.get).toHaveBeenCalledWith('/pilots/p1')
    })

    it('getPilot API 失败回退静态查找（命中）', async () => {
      httpClient.get.mockRejectedValue(new Error('x'))
      const r = await dataService.getPilot(acePilots[0].id)
      expect(r.success).toBe(true)
      expect(r.data.id).toBe(acePilots[0].id)
      expect(r.error).toBeNull()
    })

    it('getPilot API 失败回退静态查找（未命中报错）', async () => {
      httpClient.get.mockRejectedValue(new Error('x'))
      const r = await dataService.getPilot('no-such-pilot')
      expect(r.success).toBe(false)
      expect(r.error).toBe('飞行员不存在')
    })
  })

  describe('getMembers / getMember', () => {
    it('成功时透传 API 响应', async () => {
      const api = { success: true, data: [{ id: 'm1' }] }
      httpClient.get.mockResolvedValue(api)
      expect(await dataService.getMembers({ page: 2 })).toBe(api)
    })

    it('API 异常时回退静态成员列表', async () => {
      httpClient.get.mockRejectedValue(new Error('x'))
      const r = await dataService.getMembers()
      expect(r.success).toBe(true)
      expect(Array.isArray(r.data)).toBe(true)
    })

    it('getMember API 失败回退静态查找（命中）', async () => {
      httpClient.get.mockRejectedValue(new Error('x'))
      const r = await dataService.getMember(members[0].id)
      expect(r.success).toBe(true)
      expect(r.data.id).toBe(members[0].id)
    })

    it('getMember API 失败回退静态查找（未命中报错）', async () => {
      httpClient.get.mockRejectedValue(new Error('x'))
      const r = await dataService.getMember('no-such-member')
      expect(r.success).toBe(false)
      expect(r.error).toBe('成员不存在')
    })
  })

  describe('getProjects / getProject', () => {
    it('成功时透传 API 响应', async () => {
      const api = { success: true, data: [{ id: 'j1' }] }
      httpClient.get.mockResolvedValue(api)
      expect(await dataService.getProjects()).toBe(api)
    })

    it('API 异常时回退静态项目列表', async () => {
      httpClient.get.mockRejectedValue(new Error('x'))
      const r = await dataService.getProjects()
      expect(r.success).toBe(true)
      expect(r.data).toEqual(projects)
    })

    it('getProject API 失败回退静态查找（命中）', async () => {
      httpClient.get.mockRejectedValue(new Error('x'))
      const r = await dataService.getProject(projects[0].id)
      expect(r.success).toBe(true)
      expect(r.data.id).toBe(projects[0].id)
    })

    it('getProject API 失败回退静态查找（未命中报错）', async () => {
      httpClient.get.mockRejectedValue(new Error('x'))
      const r = await dataService.getProject('no-such-project')
      expect(r.success).toBe(false)
      expect(r.error).toBe('项目不存在')
    })
  })

  describe('submitApplication / getApplications', () => {
    it('USE_API 时提交申请走 POST /applications', async () => {
      httpClient.post.mockResolvedValue({ success: true, data: { id: 'a1' } })
      const payload = { name: '测试', email: 't@example.com' }
      const r = await dataService.submitApplication(payload)
      expect(httpClient.post).toHaveBeenCalledWith('/applications', payload)
      expect(r.success).toBe(true)
    })

    it('getApplications 成功透传', async () => {
      const api = { success: true, data: [{ id: 'a1' }], pagination: { total: 1 } }
      httpClient.get.mockResolvedValue(api)
      expect(await dataService.getApplications({ status: 'pending' })).toBe(api)
    })

    it('getApplications 失败回退空列表', async () => {
      httpClient.get.mockRejectedValue(new Error('x'))
      const r = await dataService.getApplications()
      expect(r).toEqual({
        success: true,
        data: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
      })
    })
  })

  describe('管理员方法透传', () => {
    it.each([
      ['createMember', 'post', [{ name: 'a' }], ['/members', { name: 'a' }]],
      ['deleteMember', 'delete', ['m1'], ['/members/m1']],
      ['createProject', 'post', [{ title: 'a' }], ['/projects', { title: 'a' }]],
      ['deleteProject', 'delete', ['j1'], ['/projects/j1']],
      ['createPilot', 'post', [{ name: 'a' }], ['/pilots', { name: 'a' }]],
      ['deletePilot', 'delete', ['p1'], ['/pilots/p1']]
    ])('%s 调用正确的 HTTP 方法与路径', async (method, verb, methodArgs, expectedArgs) => {
      httpClient[verb].mockResolvedValue({ success: true })
      await dataService[method](...methodArgs)
      expect(httpClient[verb]).toHaveBeenCalledWith(...expectedArgs)
    })

    it('updateSiteSettings PUT /settings', async () => {
      httpClient.put.mockResolvedValue({ success: true })
      const payload = { siteName: 'Stellar Nexus' }
      await dataService.updateSiteSettings(payload)
      expect(httpClient.put).toHaveBeenCalledWith('/settings', payload)
    })

    it('updateMember 传递 id 与数据', async () => {
      httpClient.put.mockResolvedValue({ success: true })
      await dataService.updateMember('m1', { name: '新名' })
      expect(httpClient.put).toHaveBeenCalledWith('/members/m1', { name: '新名' })
    })

    it('updateProject 传递 id 与数据', async () => {
      httpClient.put.mockResolvedValue({ success: true })
      await dataService.updateProject('j1', { title: '新标题' })
      expect(httpClient.put).toHaveBeenCalledWith('/projects/j1', { title: '新标题' })
    })

    it('updatePilot 传递 id 与数据', async () => {
      httpClient.put.mockResolvedValue({ success: true })
      await dataService.updatePilot('p1', { callsign: 'ACE' })
      expect(httpClient.put).toHaveBeenCalledWith('/pilots/p1', { callsign: 'ACE' })
    })

    it('updateApplicationStatus 传递 status 与 note', async () => {
      httpClient.put.mockResolvedValue({ success: true })
      await dataService.updateApplicationStatus('a1', 'approved', '欢迎加入')
      expect(httpClient.put).toHaveBeenCalledWith('/applications/a1/status', {
        status: 'approved',
        note: '欢迎加入'
      })
    })

    it('getActivityLogs 透传查询参数', async () => {
      httpClient.get.mockResolvedValue({ success: true, data: [] })
      await dataService.getActivityLogs({ limit: 20 })
      expect(httpClient.get).toHaveBeenCalledWith('/activity-logs', { limit: 20 })
    })

    it('getApplicationByEmail 对邮箱做 URI 编码', async () => {
      httpClient.get.mockResolvedValue({ success: true, data: null })
      const email = 'a b@example.com'
      await dataService.getApplicationByEmail(email)
      expect(httpClient.get).toHaveBeenCalledWith(
        `/applications/by-email/${encodeURIComponent(email)}`
      )
    })

    it('getApplicationByEmail 空邮箱抛错', async () => {
      await expect(dataService.getApplicationByEmail('')).rejects.toThrow('邮箱不能为空')
    })
  })

  describe('高危操作校验', () => {
    it('resetDatabase 缺确认密码抛错', async () => {
      await expect(dataService.resetDatabase('')).rejects.toThrow('请提供确认密码以执行此操作')
      expect(httpClient.post).not.toHaveBeenCalled()
    })

    it('resetDatabase POST /admin/reset-db', async () => {
      httpClient.post.mockResolvedValue({ success: true })
      await dataService.resetDatabase('confirm-pw')
      expect(httpClient.post).toHaveBeenCalledWith('/admin/reset-db', { confirmPassword: 'confirm-pw' })
    })

    it('clearCache 缺确认密码抛错', async () => {
      await expect(dataService.clearCache('')).rejects.toThrow('请提供确认密码以执行此操作')
      expect(httpClient.post).not.toHaveBeenCalled()
    })

    it('clearCache POST /admin/clear-cache', async () => {
      httpClient.post.mockResolvedValue({ success: true })
      await dataService.clearCache('confirm-pw')
      expect(httpClient.post).toHaveBeenCalledWith('/admin/clear-cache', { confirmPassword: 'confirm-pw' })
    })
  })
})
