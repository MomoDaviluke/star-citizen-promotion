/**
 * @file 统计路由
 * @description 团队统计数据
 * @module server/routes/stats
 */

import { Router, Request, Response, NextFunction } from 'express'
import { query, queryOne } from '../database/pool.js'

interface StatsRow {
  id: number
  title: string
  value: number
  icon: string
  sort_order: number
}

interface SummaryRow {
  activeMembers: number
  activeProjects: number
  activePilots: number
  totalMissions: number
}

const router = Router()

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await query<StatsRow>('SELECT * FROM stats ORDER BY sort_order ASC')

    // 并行执行独立查询，避免子查询性能问题
    // 使用 .catch(() => null) 防止单个查询失败影响整体结果
    const [
      activeMembersResult,
      activeProjectsResult,
      activePilotsResult,
      totalMissionsResult
    ] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM members WHERE status = 'active'").catch(() => null),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM projects WHERE status = 'active'").catch(() => null),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM pilots WHERE status = 'active'").catch(() => null),
      queryOne<{ total: number }>('SELECT COALESCE(SUM(missions), 0) as total FROM pilots').catch(() => null)
    ])

    const summary: SummaryRow = {
      activeMembers: activeMembersResult?.count ?? 0,
      activeProjects: activeProjectsResult?.count ?? 0,
      activePilots: activePilotsResult?.count ?? 0,
      totalMissions: totalMissionsResult?.total ?? 0
    }

    res.json({
      success: true,
      data: {
        stats,
        summary
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
