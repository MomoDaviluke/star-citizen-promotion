import { Router, Request, Response, NextFunction } from 'express'
import { body, param, validationResult } from 'express-validator'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
import { paginate, PaginatedRequest } from '../middleware/pagination.js'
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

    const result = await getEvents({
      startDate,
      endDate,
      status,
      limit: 500,
      offset: 0
    })

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

router.get('/:id/ics', [param('id').notEmpty().withMessage('活动 ID 不能为空')], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const event = await getEventById(req.params.id as string)

    if (!event) {
      throw ApiError.notFound('活动不存在')
    }

    const icsContent = generateICS(event)

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="event-${event.id}.ics"`)
    res.send(icsContent)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', [param('id').notEmpty().withMessage('活动 ID 不能为空')], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('参数验证失败', errors.array())
    }

    const event = await getEventById(req.params.id as string)

    if (!event) {
      throw ApiError.notFound('活动不存在')
    }

    res.json({ success: true, data: event })
  } catch (error) {
    next(error)
  }
})

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('title').trim().notEmpty().withMessage('活动标题不能为空'),
    body('start_time').notEmpty().withMessage('开始时间不能为空'),
    body('description').optional().trim(),
    body('end_time').optional(),
    body('location').optional().trim(),
    body('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'cancelled']).withMessage('状态值无效')
  ],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const newEvent = await createEvent({ ...req.body, creatorId: req.user!.id })

      res.status(201).json({
        success: true,
        message: '活动创建成功',
        data: newEvent
      })
    } catch (error) {
      next(error)
    }
  }
)

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  [
    param('id').notEmpty().withMessage('活动 ID 不能为空'),
    body('title').optional().trim().notEmpty().withMessage('活动标题不能为空'),
    body('description').optional().trim(),
    body('start_time').optional(),
    body('end_time').optional(),
    body('location').optional().trim(),
    body('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'cancelled']).withMessage('状态值无效')
  ],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const updatedEvent = await updateEvent(req.params.id as string, req.body)

      res.json({
        success: true,
        message: '活动信息更新成功',
        data: updatedEvent
      })
    } catch (error) {
      next(error)
    }
  }
)

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').notEmpty().withMessage('活动 ID 不能为空')],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('参数验证失败', errors.array())
      }

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
  [param('id').notEmpty().withMessage('活动 ID 不能为空')],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('参数验证失败', errors.array())
      }

      const updatedEvent = await joinEvent(req.params.id as string, req.user!.id)

      res.json({
        success: true,
        message: '报名成功',
        data: updatedEvent
      })
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  '/:id/leave',
  authenticate,
  [param('id').notEmpty().withMessage('活动 ID 不能为空')],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('参数验证失败', errors.array())
      }

      const updatedEvent = await leaveEvent(req.params.id as string, req.user!.id)

      res.json({
        success: true,
        message: '取消报名成功',
        data: updatedEvent
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
