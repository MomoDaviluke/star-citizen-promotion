/**
 * @file 优先级队列测试
 * @description 测试 PriorityQueue 功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PriorityQueue, PRIORITY } from '@/services/PriorityQueue.js'

describe('PriorityQueue', () => {
  let queue

  beforeEach(() => {
    queue = new PriorityQueue()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('enqueue', () => {
    it('应添加元素到队列', () => {
      queue.enqueue('item1', PRIORITY.NORMAL)
      expect(queue.size()).toBe(1)
    })

    it('应按优先级排序', () => {
      queue.enqueue('low', PRIORITY.LOW)
      queue.enqueue('high', PRIORITY.HIGH)
      queue.enqueue('normal', PRIORITY.NORMAL)

      const items = []
      while (!queue.isEmpty()) {
        items.push(queue.dequeue().item)
      }

      expect(items).toEqual(['high', 'normal', 'low'])
    })

    it('相同优先级应保持 FIFO 顺序', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      queue.enqueue('first', PRIORITY.NORMAL)
      vi.setSystemTime(now + 10)
      queue.enqueue('second', PRIORITY.NORMAL)
      vi.setSystemTime(now + 20)
      queue.enqueue('third', PRIORITY.NORMAL)

      const items = []
      while (!queue.isEmpty()) {
        items.push(queue.dequeue().item)
      }

      expect(items).toEqual(['first', 'second', 'third'])
    })
  })

  describe('dequeue', () => {
    it('应移除并返回最高优先级元素', () => {
      queue.enqueue('low', PRIORITY.LOW)
      queue.enqueue('high', PRIORITY.HIGH)

      const node = queue.dequeue()
      expect(node.item).toBe('high')
      expect(queue.size()).toBe(1)
    })

    it('空队列应返回 null', () => {
      expect(queue.dequeue()).toBeNull()
    })
  })

  describe('peek', () => {
    it('应返回最高优先级元素但不移除', () => {
      queue.enqueue('item', PRIORITY.NORMAL)

      const node = queue.peek()
      expect(node.item).toBe('item')
      expect(queue.size()).toBe(1)
    })

    it('空队列应返回 null', () => {
      expect(queue.peek()).toBeNull()
    })
  })

  describe('isEmpty', () => {
    it('空队列应返回 true', () => {
      expect(queue.isEmpty()).toBe(true)
    })

    it('非空队列应返回 false', () => {
      queue.enqueue('item', PRIORITY.NORMAL)
      expect(queue.isEmpty()).toBe(false)
    })
  })

  describe('size', () => {
    it('应返回正确的大小', () => {
      expect(queue.size()).toBe(0)
      queue.enqueue('item1', PRIORITY.NORMAL)
      expect(queue.size()).toBe(1)
      queue.enqueue('item2', PRIORITY.HIGH)
      expect(queue.size()).toBe(2)
    })
  })

  describe('clear', () => {
    it('应清空队列', () => {
      queue.enqueue('item1', PRIORITY.NORMAL)
      queue.enqueue('item2', PRIORITY.HIGH)
      queue.clear()

      expect(queue.size()).toBe(0)
      expect(queue.isEmpty()).toBe(true)
    })
  })

  describe('remove', () => {
    it('应移除匹配的元素', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      queue.enqueue({ id: 1 }, PRIORITY.NORMAL)
      vi.setSystemTime(now + 10)
      queue.enqueue({ id: 2 }, PRIORITY.HIGH)
      vi.setSystemTime(now + 20)
      queue.enqueue({ id: 3 }, PRIORITY.LOW)

      queue.remove(item => item.id === 2)

      expect(queue.size()).toBe(2)

      const items = []
      while (!queue.isEmpty()) {
        items.push(queue.dequeue().item)
      }
      expect(items.find(i => i.id === 2)).toBeUndefined()
    })
  })
})

describe('PRIORITY 常量', () => {
  it('应定义所有优先级级别', () => {
    expect(PRIORITY.LOW).toBeDefined()
    expect(PRIORITY.NORMAL).toBeDefined()
    expect(PRIORITY.HIGH).toBeDefined()
    expect(PRIORITY.CRITICAL).toBeDefined()
  })

  it('优先级数值应正确排序', () => {
    expect(PRIORITY.CRITICAL).toBeGreaterThan(PRIORITY.HIGH)
    expect(PRIORITY.HIGH).toBeGreaterThan(PRIORITY.NORMAL)
    expect(PRIORITY.NORMAL).toBeGreaterThan(PRIORITY.LOW)
  })
})
