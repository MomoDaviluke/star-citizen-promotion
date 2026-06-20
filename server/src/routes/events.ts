/**
 * @file 活动路由
 * @description 活动 CRUD、报名/取消、日历导出
 * @module server/routes/events
 */

import { Router, Request, Response, NextFunction } from 'express'
import { body, param } from 'express-validator'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
import { paginate, PaginatedRequest } from '../middleware/pagination.js'
import { validate } from '../middleware/validator.js'
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  generateICS
} from '../services/eventService.js'

const router = Router()

router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, status } = req.query as { startDate?: string; endDate?: string; status?: string }

    let effectiveStartDate = startDate
    let effectiveEndDate = endDate
    if (!effectiveStartDate || !effectiveEndDate) {
      const now = new Date()
      effectiveEndDate = effectiveEndDate || now.toISOString().split('T')[0]
      const start = new Date(now)
      start.setDate(start.getDate() - 90)
      effectiveStartDate = effectiveStartDate || start.toISOString().split('T')[0]
    }

    const result = await getEvents({
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      status,
      limit: 100,
      offset: 0
    })

    if (result.events.length >= 100) {
      res.setHeader('X-Export-Limit', '100')
      res.setHeader('X-Export-Note', '结果已截断至最近100条事件')
    }

    const icsContent = result.events.map(generateICS).join('\r\n')

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="events.ics"')
    res.send(icsContent)
  } catch (error) {
    next(error)
  }
})

router.get('/', paginate(50, 200), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, status, creatorId } = req.query as {
      startDate?: string; endDate?: string; status?: string; creatorId?: string
    }
    const { limit, offset } = (req as PaginatedRequest).pagination

    const result = await getEvents({ startDate, endDate, status, creatorId, limit, offset })

    res.json({
      success: true,
      data: result.events,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
})

router.get(
  '/:id/ics',
  validate([param('id').notEmpty().withMessage('活动 ID 不能为空')]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await getEventById(req.params.id as string)
      if (!event) throw ApiError.notFound('活动不存在')

      const icsContent = generateICS(event)
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="event-${event.id}.ics"`)
      res.send(icsContent)
    } catch (error) {
      next(error)
    }
  }
)

router.get(
  '/:id',
  validate([param('id').notEmpty().withMessage('活动 ID 不能为空')]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await getEventById(req.params.id as string)
      if (!event) throw ApiError.notFound('活动不存在')
      res.json({ success: true, data: event })
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    body('title').trim().notEmpty().withMessage('活动标题不能为空'),
    body('start_time').notEmpty().withMessage('开始时间不能为空'),
    body('description').optional().trim(),
    body('end_time').optional(),
    body('location').optional().trim(),
    body('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'cancelled']).withMessage('状态值无效')
  ]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const newEvent = await createEvent({ ...req.body, creatorId: req.user!.id })
      res.status(201).json({ success: true, message: '活动创建成功', data: newEvent })
    } catch (error) {
      next(error)
    }
  }
)

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    param('id').notEmpty().withMessage('活动 ID 不能为空'),
    body('title').optional().trim().notEmpty().withMessage('活动标题不能为空'),
    body('description').optional().trim(),
    body('start_time').optional(),
    body('end_time').optional(),
    body('location').optional().trim(),
    body('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'cancelled']).withMessage('状态值无效')
  ]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updatedEvent = await updateEvent(req.params.id as string, req.body)
      res.json({ success: true, message: '活动信息更新成功', data: updatedEvent })
    } catch (error) {
      next(error)
    }
  }
)

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate([param('id').notEmpty().withMessage('活动 ID 不能为空')]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deleteEvent(req.params.id as string)
      res.json({ success: true, message: '活动删除成功' })
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  '/:id/join',
  authenticate,
  validate([param('id').notEmpty().withMessage('活动 ID 不能为空')]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updatedEvent = await joinEvent(req.params.id as string, req.user!.id)
      res.json({ success: true, message: '报名成功', data: updatedEvent })
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  '/:id/leave',
  authenticate,
  validate([param('id').notEmpty().withMessage('活动 ID 不能为空')]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updatedEvent = await leaveEvent(req.params.id as string, req.user!.id)
      res.json({ success: true, message: '取消报名成功', data: updatedEvent })
    } catch (error) {
      next(error)
    }
  }
)

export default router
