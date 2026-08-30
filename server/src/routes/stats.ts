/**
 * @file 统计路由
 * @description 团队统计数据
 * @module server/routes/stats
 */

import { Router, Request, Response, NextFunction } from 'express'
import { getStats } from '../services/statsService.js'

const router = Router()

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { stats, summary } = await getStats()

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