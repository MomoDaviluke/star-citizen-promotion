/**
 * @file 统计业务服务层
 * @description 封装团队统计数据查询逻辑
 * @module server/services/statsService
 */

import { query } from '../database/pool.js'

export interface StatsRow {
  id: number
  title: string
  value: number
  icon: string
  sort_order: number
}

export interface SummaryRow {
  activeMembers: number
  activeProjects: number
  activePilots: number
  totalMissions: number
}

export interface StatsData {
  stats: StatsRow[]
  summary: SummaryRow
}

/**
 * 获取团队统计数据
 * 包含统计项列表和汇总数据
 */
export async function getStats(): Promise<StatsData> {
  const stats = await query<StatsRow[]>('SELECT * FROM stats ORDER BY sort_order ASC')

  const summaryRows = await query<SummaryRow>(`
    SELECT
      (SELECT COUNT(*) FROM members WHERE status = 'active') AS activeMembers,
      (SELECT COUNT(*) FROM projects WHERE status = 'active') AS activeProjects,
      (SELECT COUNT(*) FROM pilots WHERE status = 'active') AS activePilots,
      (SELECT COALESCE(SUM(missions), 0) FROM pilots) AS totalMissions
  `)

  const summary = (summaryRows as unknown as SummaryRow[])[0]

  return { stats, summary }
}