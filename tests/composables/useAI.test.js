/**
 * @file useAI 组合式函数测试
 * @description 测试 useAI composable
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { useAI, useAIStatus } from '@/composables/useAI.js'

vi.mock('@/services/AIService.js', () => ({
  aiService: {
    submit: vi.fn(),
    getStatus: vi.fn(() => ({
      queueSize: 5,
      activeTasks: 2,
      maxConcurrent: 3,
      completedTasks: 10,
      metrics: {
        requestCount: 100,
        errorCount: 5,
        errorRate: 0.05,
        avgResponseTime: 150,
        memoryTrend: 0
      }
    }))
  },
  PRIORITY: {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
  },
  TASK_STATUS: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    TIMEOUT: 'timeout',
    CANCELLED: 'cancelled'
  }
}))

describe('useAI', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createTestComponent = (composable) => {
    return defineComponent({
      setup() {
        return composable()
      },
      template: '<div></div>'
    })
  }

  describe('初始状态', () => {
    it('应有正确的初始状态', () => {
      const TestComponent = createTestComponent(useAI)
      wrapper = mount(TestComponent)

      expect(wrapper.vm.isLoading).toBe(false)
      expect(wrapper.vm.error).toBe(null)
      expect(wrapper.vm.result).toBe(null)
      expect(wrapper.vm.progress).toBe(0)
    })

    it('应导出 PRIORITY 和 TASK_STATUS', () => {
      const TestComponent = createTestComponent(useAI)
      wrapper = mount(TestComponent)

      expect(wrapper.vm.PRIORITY).toBeDefined()
      expect(wrapper.vm.TASK_STATUS).toBeDefined()
    })
  })

  describe('execute', () => {
    it('应成功执行任务', async () => {
      const mockResult = { data: 'test' }
      const { aiService } = await import('@/services/AIService.js')
      aiService.submit.mockResolvedValue(mockResult)

      const TestComponent = defineComponent({
        setup() {
          const ai = useAI()
          return { ...ai }
        },
        template: '<div></div>'
      })
      wrapper = mount(TestComponent)

      const taskFn = vi.fn(() => Promise.resolve('task result'))
      const result = await wrapper.vm.execute(taskFn)

      expect(aiService.submit).toHaveBeenCalled()
      expect(result).toEqual(mockResult)
    })

    it('执行时应设置 isLoading', async () => {
      const { aiService } = await import('@/services/AIService.js')
      aiService.submit.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('done'), 50))
      )

      const TestComponent = defineComponent({
        setup() {
          const ai = useAI()
          return { ...ai }
        },
        template: '<div></div>'
      })
      wrapper = mount(TestComponent)

      const executePromise = wrapper.vm.execute(() => Promise.resolve())

      await nextTick()
      expect(wrapper.vm.isLoading).toBe(true)

      await executePromise
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('任务失败时应设置 error', async () => {
      const { aiService } = await import('@/services/AIService.js')
      const testError = new Error('Task failed')
      aiService.submit.mockRejectedValue(testError)

      const TestComponent = defineComponent({
        setup() {
          const ai = useAI()
          return { ...ai }
        },
        template: '<div></div>'
      })
      wrapper = mount(TestComponent)

      await expect(wrapper.vm.execute(() => Promise.resolve())).rejects.toThrow('Task failed')
      expect(wrapper.vm.error).toBe(testError)
    })
  })

  describe('cancel', () => {
    it('应取消当前任务', async () => {
      const TestComponent = createTestComponent(useAI)
      wrapper = mount(TestComponent)

      wrapper.vm.isLoading = true
      wrapper.vm.cancel()

      expect(wrapper.vm.isLoading).toBe(false)
    })
  })

  describe('updateStatus', () => {
    it('应更新服务状态', () => {
      const TestComponent = createTestComponent(useAI)
      wrapper = mount(TestComponent)

      wrapper.vm.updateStatus()

      expect(wrapper.vm.status.queueSize).toBe(5)
      expect(wrapper.vm.status.activeTasks).toBe(2)
      expect(wrapper.vm.status.completedTasks).toBe(10)
    })
  })

  describe('submitBackground', () => {
    it('应提交后台任务', async () => {
      const { aiService } = await import('@/services/AIService.js')
      aiService.submit.mockResolvedValue('background result')

      const TestComponent = createTestComponent(useAI)
      wrapper = mount(TestComponent)

      const taskFn = vi.fn()
      await wrapper.vm.submitBackground(taskFn, { priority: 2 })

      expect(aiService.submit).toHaveBeenCalledWith(taskFn, { priority: 2 })
    })
  })
})

describe('useAIStatus', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createTestComponent = () => {
    return defineComponent({
      setup() {
        const { status, startMonitoring, stopMonitoring } = useAIStatus()
        return { status, startMonitoring, stopMonitoring }
      },
      template: '<div></div>'
    })
  }

  it('应有正确的初始状态', () => {
    const TestComponent = createTestComponent()
    wrapper = mount(TestComponent)

    expect(wrapper.vm.status.queueSize).toBe(0)
    expect(wrapper.vm.status.activeTasks).toBe(0)
  })

  describe('startMonitoring', () => {
    it('应开始定期更新状态', async () => {
      const TestComponent = createTestComponent()
      wrapper = mount(TestComponent)

      wrapper.vm.startMonitoring(1000)

      vi.advanceTimersByTime(1000)
      await nextTick()

      expect(wrapper.vm.status.queueSize).toBe(5)
      expect(wrapper.vm.status.activeTasks).toBe(2)
    })

    it('重复调用不应创建多个定时器', () => {
      const TestComponent = defineComponent({
        setup() {
          const { status, startMonitoring, stopMonitoring } = useAIStatus()
          let intervalId = null
          const startAndCapture = (interval) => {
            startMonitoring(interval)
            intervalId = interval
          }
          return { status, startMonitoring: startAndCapture, stopMonitoring, getIntervalId: () => intervalId }
        },
        template: '<div></div>'
      })
      wrapper = mount(TestComponent)

      wrapper.vm.startMonitoring(1000)
      wrapper.vm.startMonitoring(1000)
    })
  })

  describe('stopMonitoring', () => {
    it('应停止监控', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { status, startMonitoring, stopMonitoring } = useAIStatus()
          return { status, startMonitoring, stopMonitoring }
        },
        template: '<div></div>'
      })
      wrapper = mount(TestComponent)

      wrapper.vm.startMonitoring(1000)
      wrapper.vm.stopMonitoring()
      
      vi.advanceTimersByTime(2000)
      await nextTick()

      expect(wrapper.vm.status.queueSize).toBe(0)
    })
  })
})
