/**
 * @file 统计业务服务层单元测试
 * @description 测试 statsService 的团队统计数据查询与汇总逻辑
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.unstable_mockModule('../../src/database/pool.ts', () => ({
  query: jest.fn()
}))

const { query } = await import('../../src/database/pool.ts')
const { getStats } = await import('../../src/services/statsService.ts')

describe('statsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getStats', () => {
    it('应返回统计项列表与汇总数据', async () => {
      query
        .mockResolvedValueOnce([
          { id: 1, title: '活跃成员', value: 120, icon: 'users', sort_order: 1 },
          { id: 2, title: '任务完成', value: 45, icon: 'rocket', sort_order: 2 }
        ])
        .mockResolvedValueOnce([
          {
            activeMembers: 120,
            activeProjects: 8,
            activePilots: 12,
            totalMissions: 356
          }
        ])

      const data = await getStats()

      expect(query).toHaveBeenCalledTimes(2)
      // 统计项列表
      expect(data.stats).toHaveLength(2)
      expect(data.stats[0]).toMatchObject({ title: '活跃成员', value: 120 })
      // 汇总数据取第一行
      expect(data.summary).toEqual({
        activeMembers: 120,
        activeProjects: 8,
        activePilots: 12,
        totalMissions: 356
      })
    })

    it('应按 sort_order 升序查询统计项', async () => {
      query.mockResolvedValueOnce([]).mockResolvedValueOnce([{
        activeMembers: 0,
        activeProjects: 0,
        activePilots: 0,
        totalMissions: 0
      }])

      await getStats()

      expect(query).toHaveBeenNthCalledWith(1, 'SELECT * FROM stats ORDER BY sort_order ASC')
    })

    it('汇总无数据时 summary 应为 undefined', async () => {
      query.mockResolvedValueOnce([]).mockResolvedValueOnce([])

      const data = await getStats()

      expect(data.stats).toEqual([])
      expect(data.summary).toBeUndefined()
    })
  })
})