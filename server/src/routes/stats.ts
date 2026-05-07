/**
 * @file 统计路由
 * @description 团队统计数据
 * @module server/routes/stats
 */

import { Router, Request, Response, NextFunction } from 'express'
import { query } from '../database/pool.js'

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

    const summaryRows = await query<SummaryRow>(`
      SELECT
        (SELECT COUNT(*) FROM members WHERE status = 'active') AS activeMembers,
        (SELECT COUNT(*) FROM projects WHERE status = 'active') AS activeProjects,
        (SELECT COUNT(*) FROM pilots WHERE status = 'active') AS activePilots,
        (SELECT COALESCE(SUM(missions), 0) FROM pilots) AS totalMissions
    `)

    const summary = (summaryRows as unknown as SummaryRow[])[0]

    res.json({
      success: true,
      data: {
        stats,
        summary: {
          activeMembers: summary.activeMembers,
          activeProjects: summary.activeProjects,
          activePilots: summary.activePilots,
          totalMissions: summary.totalMissions
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
