/**
 * @file AI 服务测试
 * @description 测试 AIService 任务队列功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AIService, TASK_STATUS, PRIORITY, aiService } from '@/services/AIService.js'

describe('AIService', () => {
  let service

  beforeEach(() => {
    service = new AIService({
      timeout: 100,
      maxRetries: 2,
      retryDelay: 10,
      maxConcurrent: 2,
      enableMonitoring: false
    })
  })

  afterEach(() => {
    service.destroy()
  })

  describe('构造函数', () => {
    it('应使用默认配置创建实例', () => {
      const defaultService = new AIService()
      expect(defaultService.config.timeout).toBe(30000)
      expect(defaultService.config.maxRetries).toBe(3)
      expect(defaultService.config.maxConcurrent).toBe(3)
      defaultService.destroy()
    })

    it('应合并自定义配置', () => {
      expect(service.config.timeout).toBe(100)
      expect(service.config.maxRetries).toBe(2)
      expect(service.config.maxConcurrent).toBe(2)
    })
  })

  describe('submit', () => {
    it('应成功执行任务并返回结果', async () => {
      const result = await service.submit(async () => {
        return 'test-result'
      })

      expect(result).toBe('test-result')
    })

    it('应传递上下文给任务函数', async () => {
      let receivedContext = null

      await service.submit(async (context) => {
        receivedContext = context
        return true
      })

      expect(receivedContext).toHaveProperty('signal')
      expect(receivedContext).toHaveProperty('taskId')
      expect(receivedContext.taskId).toMatch(/^task_/)
    })

    it('应支持任务优先级', async () => {
      const results = []

      const lowPriority = service.submit(
        async () => {
          results.push('low')
          return 'low'
        },
        { priority: PRIORITY.LOW }
      )

      const highPriority = service.submit(
        async () => {
          results.push('high')
          return 'high'
        },
        { priority: PRIORITY.HIGH }
      )

      await Promise.all([lowPriority, highPriority])

      expect(results).toContain('high')
      expect(results).toContain('low')
    })

    it('任务失败时应重试', async () => {
      let attempts = 0

      await service.submit(async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Temporary error')
        }
        return 'success'
      })

      expect(attempts).toBe(2)
    })

    it('超过最大重试次数应抛出错误', async () => {
      await expect(
        service.submit(async () => {
          throw new Error('Always fails')
        })
      ).rejects.toThrow('Always fails')
    })

    it('任务超时应有正确的状态', async () => {
      const slowService = new AIService({
        timeout: 50,
        maxRetries: 0,
        enableMonitoring: false
      })

      await expect(
        slowService.submit(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
          return 'too slow'
        })
      ).rejects.toThrow()

      slowService.destroy()
    })

    it('预先中止的任务应立即取消', async () => {
      const controller = new AbortController()
      controller.abort()

      await expect(
        service.submit(async () => 'result', { signal: controller.signal })
      ).rejects.toThrow('Task cancelled')
    })
  })

  describe('cancelTask', () => {
    it('应取消正在运行的任务', async () => {
      let cancelled = false

      const taskPromise = service.submit(
        async ({ signal }) => {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, 1000)
            signal.addEventListener('abort', () => {
              cancelled = true
              clearTimeout(timeout)
              reject(new DOMException('Task cancelled', 'AbortError'))
            })
          })
          return 'completed'
        },
        { timeout: 2000 }
      )

      await new Promise(resolve => setTimeout(resolve, 10))
      const taskId = Array.from(service.runningTasks.keys())[0]
      service.cancelTask(taskId)

      await expect(taskPromise).rejects.toThrow()
      expect(cancelled).toBe(true)
    })
  })

  describe('cancelAll', () => {
    it('应取消所有任务', () => {
      service.submit(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return 'task1'
      })
      service.submit(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return 'task2'
      })

      service.cancelAll()

      expect(service.queue.size()).toBe(0)
    })
  })

  describe('getStatus', () => {
    it('应返回服务状态', () => {
      const status = service.getStatus()

      expect(status).toHaveProperty('queueSize')
      expect(status).toHaveProperty('activeTasks')
      expect(status).toHaveProperty('maxConcurrent')
      expect(status).toHaveProperty('completedTasks')
      expect(status).toHaveProperty('metrics')
    })
  })

  describe('generateTaskId', () => {
    it('应生成唯一任务 ID', () => {
      const id1 = service.generateTaskId()
      const id2 = service.generateTaskId()

      expect(id1).toMatch(/^task_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('cleanupCompletedTasks', () => {
    it('应限制已完成任务缓存大小', async () => {
      const smallCacheService = new AIService({
        enableMonitoring: false
      })

      for (let i = 0; i < 105; i++) {
        await smallCacheService.submit(async () => i)
      }

      expect(smallCacheService.completedTasks.size).toBeLessThanOrEqual(100)
      smallCacheService.destroy()
    })
  })
})

describe('TASK_STATUS', () => {
  it('应定义所有状态', () => {
    expect(TASK_STATUS.PENDING).toBe('pending')
    expect(TASK_STATUS.RUNNING).toBe('running')
    expect(TASK_STATUS.COMPLETED).toBe('completed')
    expect(TASK_STATUS.FAILED).toBe('failed')
    expect(TASK_STATUS.TIMEOUT).toBe('timeout')
    expect(TASK_STATUS.CANCELLED).toBe('cancelled')
  })
})

describe('PRIORITY', () => {
  it('应定义所有优先级', () => {
    expect(PRIORITY.CRITICAL).toBeDefined()
    expect(PRIORITY.HIGH).toBeDefined()
    expect(PRIORITY.NORMAL).toBeDefined()
    expect(PRIORITY.LOW).toBeDefined()
  })

  it('优先级数值应正确排序', () => {
    expect(PRIORITY.CRITICAL).toBeGreaterThan(PRIORITY.HIGH)
    expect(PRIORITY.HIGH).toBeGreaterThan(PRIORITY.NORMAL)
    expect(PRIORITY.NORMAL).toBeGreaterThan(PRIORITY.LOW)
  })
})

describe('aiService 默认实例', () => {
  it('应存在默认实例', () => {
    expect(aiService).toBeInstanceOf(AIService)
  })

  it('应有默认配置', () => {
    expect(aiService.config.timeout).toBe(30000)
    expect(aiService.config.maxConcurrent).toBe(3)
  })
})
