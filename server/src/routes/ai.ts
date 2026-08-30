/**
 * @file AI 路由
 * @description /api/v1/ai/* 接口(Phase 0: health + retrieve)
 * @module server/routes/ai
 */

import { Router, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import { aiConfig } from '../config/ai.js'
import { getRegistry } from '../services/ai/providers/index.js'
import type { RagService } from '../services/ai/ragService.js'
import { RecruiterService } from '../services/ai/recruiterService.js'

export interface AiRouterDeps {
  ragService: RagService
  recruiterService?: RecruiterService
}

export function createAiRouter(deps: AiRouterDeps): Router {
  const router = Router()

  /**
   * AI 招募官限流器
   * @description inline 定义以满足 CodeQL 静态分析(SEC-12)
   *              未登录: 10 次/分钟/IP
   */
  const recruiterLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: '请求过于频繁,请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false,
  })

  /**
   * GET /api/v1/ai/health
   * AI 服务健康检查
   */
  router.get('/health', (_req: Request, res: Response) => {
    const registry = getRegistry()
    const providers = Object.keys(registry)
    res.json({
      status: 'ok',
      providers,
      models: aiConfig.models,
    })
  })

  /**
   * POST /api/v1/ai/retrieve
   * RAG 检索 + 回答
   */
  router.post('/retrieve', async (req: Request, res: Response) => {
    const { question, history, sourceType } = req.body
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'question is required and must be a string' })
      return
    }

    try {
      const result = await deps.ragService.query({
        question,
        history: Array.isArray(history) ? history : [],
        guild: { guildName: process.env.GUILD_NAME || 'Star Citizen 战队' },
        sourceType,
      })
      res.json(result)
    } catch (err) {
      console.error('[AI /retrieve] Error:', err)
      res.status(500).json({ error: 'AI 服务暂时不可用' })
    }
  })

  /**
   * POST /api/v1/ai/recruiter/session
   * 创建新会话
   */
  router.post('/recruiter/session', async (_req: Request, res: Response) => {
    if (!deps.recruiterService) {
      res.status(503).json({ error: '招募官服务未启用' })
      return
    }
    try {
      const result = await deps.recruiterService.initSession()
      res.json(result)
    } catch (err) {
      console.error('[AI /recruiter/session] Error:', err)
      res.status(500).json({ error: '创建会话失败' })
    }
  })

  /**
   * POST /api/v1/ai/recruiter/chat
   * SSE 流式对话
   */
  router.post('/recruiter/chat', recruiterLimiter, async (req: Request, res: Response) => {
    if (!deps.recruiterService) {
      res.status(503).json({ error: '招募官服务未启用' })
      return
    }

    const { sessionId, message } = req.body
    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' })
      return
    }
    if (message.length > 500) {
      res.status(400).json({ error: '消息过长(最多 500 字)' })
      return
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    try {
      // 获取画像用于 metadata 事件
      const session = await deps.recruiterService['sessionStore'].getSession(sessionId)
      let profile = session?.profile || { playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' }

      for await (const token of deps.recruiterService.chatStream(sessionId, message)) {
        res.write(`event: token\ndata: ${JSON.stringify({ content: token })}\n\n`)
      }

      // 流结束后发送画像更新
      const updatedSession = await deps.recruiterService['sessionStore'].getSession(sessionId)
      if (updatedSession) {
        profile = updatedSession.profile
      }

      res.write(`event: metadata\ndata: ${JSON.stringify({ profile, turnCount: updatedSession?.turnCount || 0 })}\n\n`)
      res.write(`event: done\ndata: ${JSON.stringify({ sessionId })}\n\n`)
      res.end()
    } catch (err) {
      console.error('[AI /recruiter/chat] Error:', err)
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'AI 服务暂时不可用' })}\n\n`)
      res.end()
    }
  })

  /**
   * GET /api/v1/ai/recruiter/suggest
   * 获取推荐问题
   */
  router.get('/recruiter/suggest', async (req: Request, res: Response) => {
    if (!deps.recruiterService) {
      res.status(503).json({ error: '招募官服务未启用' })
      return
    }

    const sessionId = req.query.sessionId as string
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }

    try {
      const result = await deps.recruiterService.getSuggestions(sessionId)
      res.json(result)
    } catch (err) {
      console.error('[AI /recruiter/suggest] Error:', err)
      res.status(500).json({ error: '获取推荐失败' })
    }
  })

  return router
}
