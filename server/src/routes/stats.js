/**
 * @file 统计路由
 * @description 团队统计数据
 * @module server/routes/stats
 */

import { Router } from 'express'
import { db } from '../database/init.js'

const router = Router()

/**
 * GET /api/stats
 * 获取团队统计数据
 */
router.get('/', (req, res) => {
  const stats = db.prepare('SELECT * FROM stats ORDER BY sort_order ASC').all()

  const memberCount = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'active'").get()

  const projectCount = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'active'").get()

  const pilotCount = db.prepare("SELECT COUNT(*) as count FROM pilots WHERE status = 'active'").get()

  const totalMissions = db.prepare('SELECT SUM(missions) as total FROM pilots').get()

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
