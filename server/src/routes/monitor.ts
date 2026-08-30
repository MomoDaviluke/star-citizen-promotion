/**
 * @file 监控路由
 * @description 暴露后端资源指标、告警列表与前端问题回报接口。
 *              所有外部依赖均可注入，便于在测试中隔离数据库与认证。
 * @module server/routes/monitor
 */

import { Router, Request, Response, NextFunction, RequestHandler } from 'express'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js'
import { ApiError } from '../middleware/errorHandler.js'
import type { MetricsCollector } from '../monitoring/collector.js'
import type { AlertEngine } from '../monitoring/alertEngine.js'
import type { SchedulerLike } from '../monitoring/scheduler.js'
import type { AlertFilter, AlertSeverity, AlertStatus } from '../monitoring/alertRepository.js'
import {
  createReport as defaultCreateReport,
  listReports as defaultListReports,
  type IssueReport,
  type IssueReportInput,
  type ReportCategory
} from '../database/monitorStore.js'
import logger from '../utils/logger.js'

const VALID_STATUSES = new Set<AlertStatus>(['active', 'acked', 'resolved'])
const VALID_SEVERITIES = new Set<AlertSeverity>(['warn', 'critical'])
const VALID_CATEGORIES = new Set<ReportCategory>(['frontend_error', 'slow_page', 'api_failure', 'manual'])
const MAX_PAYLOAD_BYTES = 64 * 1024
const MAX_MESSAGE_LENGTH = 2000
/** 历史采样点默认回传数量（面板 sparkline 够用，避免全量 300 点传输） */
const DEFAULT_POINTS = 60
const MAX_POINTS = 300

/**
 * 等距抽样：把数组缩到 target 个元素，始终保留首尾点
 * @description 用于 /metrics 历史降采样：300 个采样点缩到 60 个，面板趋势不变，
 *              响应体积下降约 80%
 */
export function sampleEvenly<T>(items: T[], target: number): T[] {
  if (items.length <= target) return items
  if (target <= 0) return []
  if (target === 1) return [items[0]]
  const step = (items.length - 1) / (target - 1)
  const result: T[] = []
  for (let i = 0; i < target; i += 1) {
    result.push(items[Math.round(i * step)])
  }
  return result
}

/** 解析点数参数：非法值回退默认，超上限截断 */
function resolvePoints(raw: unknown): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_POINTS
  return Math.min(Math.floor(parsed), MAX_POINTS)
}

export interface MonitorRouterDeps {
  collector: MetricsCollector
  alertEngine: AlertEngine
  /** 调度器；未提供时 /health 的 scheduler 字段为 null */
  scheduler?: SchedulerLike
  authenticate?: RequestHandler
  requireAdmin?: RequestHandler
  reportLimiter?: RequestHandler
  createReport?: (input: IssueReportInput) => Promise<IssueReport | null>
  listReports?: (options: { requestId?: string; limit?: number; offset?: number }) => Promise<IssueReport[]>
}

/**
 * 回报限流：单 IP 每分钟 10 次。
 * 该端点匿名可访问，必须限制写入速率以免被刷。
 */
const defaultReportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: '问题上报过于频繁，请稍后再试' }
})

/**
 * 解析请求体：同时接受 JSON 与纯文本
 * @description navigator.sendBeacon 直传字符串时 Content-Type 被强制为 text/plain，
 *              若不兜底解析会导致请求体为空，回报静默丢失
 */
function parseBody(req: Request): Record<string, unknown> | null {
  const raw = req.body
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null
    } catch {
      return null
    }
  }
  return null
}

export function createMonitorRouter(deps: MonitorRouterDeps): Router {
  const router = Router()
  const authGuard = deps.authenticate ?? (authenticate as RequestHandler)
  const adminGuard = deps.requireAdmin ?? (requireAdmin as RequestHandler)
  const limiter = deps.reportLimiter ?? (defaultReportLimiter as RequestHandler)
  const saveReport = deps.createReport ?? defaultCreateReport
  const findReports = deps.listReports ?? defaultListReports

  /**
   * 获取实时监控指标
   * @description 返回最新采样点、历史序列、告警规则定义、活跃告警统计与调度器健康摘要
   */
  router.get('/metrics', authGuard, adminGuard, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const rules = deps.alertEngine.getRules().map(({ name, label, unit, warn, critical, consecutivePoints }) => ({
        name, label, unit, warn, critical, consecutivePoints
      }))
      const activeAlerts = await deps.alertEngine.list({ status: 'active', limit: 50 })
      const latest = deps.collector.latest()
      const points = resolvePoints(req.query.points)

      res.json({
        success: true,
        data: {
          latest,
          // 历史序列降采样：默认 60 点，latest 与实时统计保持原样
          history: sampleEvenly(deps.collector.history(), points),
          rules,
          alerts: {
            active: activeAlerts.length,
            critical: activeAlerts.filter(a => a.severity === 'critical').length,
            latest: activeAlerts.slice(0, 5)
          },
          requests: deps.collector.getRequestStats(),
          scheduler: deps.scheduler ? deps.scheduler.getHealth() : null
        }
      })
    } catch (error) {
      next(error)
    }
  })

  /**
   * 监控自检端点
   * @description 让外部探活能发现「监控系统自身」是否瘫痪：
   *              调度器停摆、连续采样失败、进入自警状态都会在这里体现
   */
  router.get('/health', authGuard, adminGuard, (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const history = deps.collector.history()
      res.json({
        success: true,
        data: {
          scheduler: deps.scheduler ? deps.scheduler.getHealth() : null,
          note: deps.scheduler ? null : '调度器未配置，仅提供采集器状态',
          collector: {
            bufferSize: history.length,
            hasLatest: deps.collector.latest() !== null,
            requestWindow: deps.collector.getRequestStats()
          }
        }
      })
    } catch (error) {
      next(error)
    }
  })

  /**
   * 获取告警列表
   * @description 支持按状态、级别、规则过滤，默认返回最近 50 条
   */
  router.get('/alerts', authGuard, adminGuard, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { status, severity, rule, limit, offset } = req.query

      if (typeof status === 'string' && !VALID_STATUSES.has(status as AlertStatus)) {
        throw ApiError.badRequest(`status 参数非法，可选值：${[...VALID_STATUSES].join(' / ')}`)
      }
      if (typeof severity === 'string' && !VALID_SEVERITIES.has(severity as AlertSeverity)) {
        throw ApiError.badRequest(`severity 参数非法，可选值：${[...VALID_SEVERITIES].join(' / ')}`)
      }

      const parsedLimit = Number(limit)
      const parsedOffset = Number(offset)
      const filter: AlertFilter = {
        status: status as AlertStatus | undefined,
        severity: severity as AlertSeverity | undefined,
        rule: typeof rule === 'string' ? rule : undefined,
        limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 50,
        offset: Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0
      }

      res.json({ success: true, data: await deps.alertEngine.list(filter) })
    } catch (error) {
      next(error)
    }
  })

  /**
   * 认领告警
   */
  router.post('/alerts/:id/ack', authGuard, adminGuard, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const alertId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
      const acked = await deps.alertEngine.ack(alertId, req.user!.id)
      if (!acked) {
        throw ApiError.notFound('告警不存在、已恢复或已被认领')
      }
      logger.info('告警已被认领', { alertId: acked.id, userId: req.user!.id })
      res.json({ success: true, data: acked })
    } catch (error) {
      next(error)
    }
  })

  /**
   * 提交前端问题回报
   * @description 匿名可访问（限流保护），供监控面板与页面上的「回报问题」按钮调用
   */
  router.post(
    '/reports',
    express.text({ limit: '128kb' }),
    limiter,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = parseBody(req)
        if (!body) {
          throw ApiError.badRequest('请求体不是合法的对象')
        }

        const message = typeof body.message === 'string' ? body.message.slice(0, MAX_MESSAGE_LENGTH) : null
        const payload = body.payload && typeof body.payload === 'object'
          ? body.payload as Record<string, unknown>
          : null
        const browser = body.browser && typeof body.browser === 'object'
          ? body.browser as Record<string, unknown>
          : null

        if (!message && !payload) {
          throw ApiError.badRequest('message 与 payload 至少需要提供一个')
        }

        // payload 与 browser 都限长：恶意客户端可借未校验字段撑大行体积
        if (payload && JSON.stringify(payload).length > MAX_PAYLOAD_BYTES) {
          throw new ApiError(413, 'payload 超过 64KB 上限')
        }
        if (browser && JSON.stringify(browser).length > MAX_PAYLOAD_BYTES) {
          throw new ApiError(413, 'browser 超过 64KB 上限')
        }

        const rawCategory = typeof body.category === 'string' ? body.category : ''
        const category = VALID_CATEGORIES.has(rawCategory as ReportCategory)
          ? rawCategory as ReportCategory
          : 'manual'

        const saved = await saveReport({
          requestId: typeof body.requestId === 'string' ? body.requestId.slice(0, 64) : null,
          category,
          message,
          browser,
          payload
        })

        if (!saved) {
          throw ApiError.internal('问题回报写入失败')
        }
        res.status(201).json({ success: true, data: { id: saved.id } })
      } catch (error) {
        next(error)
      }
    }
  )

  /**
   * 查询前端问题回报
   * @description 按 requestId 检索可与后端告警快照中的错误请求串联；
   *              支持 limit/offset 分页（对齐告警列表）
   */
  router.get('/reports', authGuard, adminGuard, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { requestId, limit, offset } = req.query
      const parsedLimit = Number(limit)
      const parsedOffset = Number(offset)

      const reports = await findReports({
        requestId: typeof requestId === 'string' ? requestId : undefined,
        limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 50,
        offset: Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0
      })
      res.json({ success: true, data: reports })
    } catch (error) {
      next(error)
    }
  })

  return router
}

export default createMonitorRouter
