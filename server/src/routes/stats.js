/**
 * @file 统计路由
 * @description 团队统计数据
 * @module server/routes/stats
 */

import { Router } from 'express'
import { query, queryOne } from '../database/pool.js'

const router = Router()

/**
 * GET /api/stats
 * 获取团队统计数据
 */
router.get('/', async (req, res) => {
  const stats = await query('SELECT * FROM stats ORDER BY sort_order ASC')

  const memberCount = await queryOne(
    "SELECT COUNT(*) as count FROM members WHERE status = 'active'"
  )

  const projectCount = await queryOne(
    "SELECT COUNT(*) as count FROM projects WHERE status = 'active'"
  )

  const pilotCount = await queryOne(
    "SELECT COUNT(*) as count FROM pilots WHERE status = 'active'"
  )

  const totalMissions = await queryOne('SELECT SUM(missions) as total FROM pilots')

  res.json({
    success: true,
    data: {
      stats,
      summary: {
        activeMembers: memberCount.count,
        activeProjects: projectCount.count,
        activePilots: pilotCount.count,
        totalMissions: totalMissions.total || 0
      }
    }
  })
})

export default router
