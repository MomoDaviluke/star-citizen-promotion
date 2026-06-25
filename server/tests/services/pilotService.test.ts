/**
 * @file 飞行员服务层单元测试
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.unstable_mockModule('../../src/database/pool.ts', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  transaction: jest.fn((cb) => cb({ execute: jest.fn() }))
}))

const { query, queryOne, transaction } = await import('../../src/database/pool.ts')
const {
  getPilots,
  getPilotById,
  createPilot,
  updatePilot,
  deletePilot
} = await import('../../src/services/pilotService.ts')

describe('pilotService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPilots', () => {
    it('应返回飞行员列表，按任务数降序', async () => {
      query.mockResolvedValueOnce([
        { id: 'p1', name: 'Alpha', missions: 100 },
        { id: 'p2', name: 'Beta', missions: 50 }
      ])
      queryOne.mockResolvedValueOnce({ total: 2 })

      const result = await getPilots({ limit: 10, offset: 0 })

      expect(result.pilots).toHaveLength(2)
      expect(result.pilots[0].missions).toBe(100)
    })
  })

  describe('getPilotById', () => {
    it('应返回飞行员', async () => {
      queryOne.mockResolvedValueOnce({ id: 'p1', name: 'Alpha', callsign: 'WING-1' })

      const result = await getPilotById('p1')

      expect(result.callsign).toBe('WING-1')
    })
  })

  describe('createPilot', () => {
    it('应创建新飞行员', async () => {
      query.mockResolvedValueOnce({ affectedRows: 1 })
      queryOne.mockResolvedValueOnce({ id: 'p1', name: 'Gamma', callsign: 'NEW-1' })

      const result = await createPilot({ name: 'Gamma', callsign: 'NEW-1', ship: 'F8C' })

      expect(result.callsign).toBe('NEW-1')
    })
  })

  describe('updatePilot', () => {
    it('应更新飞行员', async () => {
      const conn = { execute: jest.fn() }
      conn.execute
        .mockResolvedValueOnce([[{ id: 'p1' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ id: 'p1', missions: 150 }]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      const result = await updatePilot('p1', { missions: 150 })

      expect(result.missions).toBe(150)
    })

    it('不存在的飞行员应返回 404', async () => {
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([[]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(updatePilot('p99', { missions: 1 }))
        .rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('deletePilot', () => {
    it('应删除飞行员', async () => {
      queryOne.mockResolvedValueOnce({ id: 'p1' })
      query.mockResolvedValueOnce({ affectedRows: 1 })

      await expect(deletePilot('p1')).resolves.toBeUndefined()
    })

    it('不存在的飞行员应返回 404', async () => {
      queryOne.mockResolvedValueOnce(null)

      await expect(deletePilot('p99')).rejects.toMatchObject({ statusCode: 404 })
    })
  })
})
