/**
 * @file 数据库连接池测试
 * @description Bug 12/14 回归测试
 *   - Bug 12: query() 使用 connection.query() 而非 execute()，解决 LIMIT ? OFFSET ? 不兼容
 *   - Bug 14: normalizeParams() 将 ISO 8601 时间字符串转为 Date 对象
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// mock mysql2/promise
const mockQuery = jest.fn()
const mockGetConnection = jest.fn()
const mockPing = jest.fn()
const mockRelease = jest.fn()
const mockBeginTransaction = jest.fn()
const mockCommit = jest.fn()
const mockRollback = jest.fn()

const mockPool = {
  query: mockQuery,
  getConnection: mockGetConnection
}

jest.unstable_mockModule('mysql2/promise', () => ({
  default: {
    createPool: jest.fn(() => mockPool)
  }
}))

jest.unstable_mockModule('../../src/config/index.js', () => ({
  config: {
    nodeEnv: 'test',
    database: {
      host: 'localhost',
      port: 3306,
      user: 'test',
      password: 'test',
      name: 'test_db',
      waitForConnections: true,
      queueLimit: 0,
      connectionLimit: 10,
      timezone: '+00:00',
      charset: 'utf8mb4'
    }
  }
}))

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

const { query, queryOne, queryWithTiming, createPool, getPool } = await import('../../src/database/pool.js')

describe('数据库连接池 - Bug 12 回归（query 使用 connection.query 而非 execute）', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    mockQuery.mockResolvedValue([[{ id: 1, name: 'test' }], []])
    await createPool()
  })

  it('query() 应调用 pool.query 而非 pool.execute', async () => {
    await query('SELECT * FROM users LIMIT ? OFFSET ?', [10, 0])

    expect(mockQuery).toHaveBeenCalledTimes(1)
    // 验证调用的是 query 方法（mockPool 只有 query，若代码调用 execute 会报错）
    const [sql, params] = mockQuery.mock.calls[0]
    expect(sql).toContain('LIMIT ? OFFSET ?')
    expect(params).toEqual([10, 0])
  })

  it('query() 应支持 LIMIT ? OFFSET ? 占位符（Bug 12 核心场景）', async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 1 }], []])

    const result = await query('SELECT id FROM events ORDER BY start_time ASC LIMIT ? OFFSET ?', [20, 40])

    expect(result).toEqual([{ id: 1 }])
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT id FROM events ORDER BY start_time ASC LIMIT ? OFFSET ?',
      [20, 40]
    )
  })

  it('queryOne() 应返回首行或 null', async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'first' }], []])

    const row = await queryOne('SELECT * FROM users WHERE id = ?', ['u1'])
    expect(row).toEqual({ id: 1, name: 'first' })

    mockQuery.mockResolvedValueOnce([[], []])
    const empty = await queryOne('SELECT * FROM users WHERE id = ?', ['nonexistent'])
    expect(empty).toBeNull()
  })

  it('queryWithTiming() 也应使用 pool.query 支持 LIMIT 占位符', async () => {
    mockQuery.mockResolvedValueOnce([[{ count: 5 }], []])

    const { rows, durationMs } = await queryWithTiming(
      'SELECT COUNT(*) as count FROM events LIMIT ? OFFSET ?',
      [10, 0]
    )

    expect(rows).toEqual([{ count: 5 }])
    expect(durationMs).toBeGreaterThanOrEqual(0)
    expect(mockQuery).toHaveBeenCalled()
  })
})

describe('数据库连接池 - Bug 14 回归（normalizeParams ISO 8601 转 Date）', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    mockQuery.mockResolvedValue([[{ id: 1 }], []])
    await createPool()
  })

  it('ISO 8601 时间字符串应被转为 Date 对象', async () => {
    await query(
      'INSERT INTO events (id, title, start_time) VALUES (?, ?, ?)',
      ['evt-1', '测试活动', '2026-08-01T10:00:00Z']
    )

    const params = mockQuery.mock.calls[0][1] as unknown[]
    expect(params[0]).toBe('evt-1')
    expect(params[1]).toBe('测试活动')
    // 第三个参数应被转为 Date 对象，而非原始字符串
    expect(params[2]).toBeInstanceOf(Date)
    expect((params[2] as Date).toISOString()).toBe('2026-08-01T10:00:00.000Z')
  })

  it('带时区偏移的 ISO 8601 应被转为 Date 对象', async () => {
    await query(
      'INSERT INTO events (start_time) VALUES (?)',
      ['2026-08-01T18:00:00+08:00']
    )

    const params = mockQuery.mock.calls[0][1] as unknown[]
    expect(params[0]).toBeInstanceOf(Date)
  })

  it('普通字符串不应被转换', async () => {
    await query('SELECT * FROM users WHERE email = ?', ['test@example.com'])

    const params = mockQuery.mock.calls[0][1] as unknown[]
    expect(params[0]).toBe('test@example.com')
    expect(typeof params[0]).toBe('string')
  })

  it('数字参数不应被转换', async () => {
    await query('SELECT * FROM users LIMIT ? OFFSET ?', [10, 0])

    const params = mockQuery.mock.calls[0][1] as unknown[]
    expect(params[0]).toBe(10)
    expect(params[1]).toBe(0)
    expect(typeof params[0]).toBe('number')
  })

  it('null 参数不应被转换', async () => {
    await query('INSERT INTO events (end_time) VALUES (?)', [null])

    const params = mockQuery.mock.calls[0][1] as unknown[]
    expect(params[0]).toBeNull()
  })

  it('非 ISO 格式的日期字符串不应被转换（如 YYYY-MM-DD）', async () => {
    await query('SELECT * FROM events WHERE DATE(start_time) = ?', ['2026-08-01'])

    const params = mockQuery.mock.calls[0][1] as unknown[]
    // 纯日期 '2026-08-01' 不匹配 ISO 8601 完整模式，不应转换
    expect(params[0]).toBe('2026-08-01')
    expect(typeof params[0]).toBe('string')
  })

  it('Date 对象参数应保持不变', async () => {
    const dateObj = new Date('2026-08-01T10:00:00Z')
    await query('INSERT INTO events (start_time) VALUES (?)', [dateObj])

    const params = mockQuery.mock.calls[0][1] as unknown[]
    expect(params[0]).toBe(dateObj)
  })
})

describe('getPool - 未初始化保护', () => {
  it('未调用 createPool 时 getPool 应抛出错误', async () => {
    // 重新加载模块以重置 pool 状态
    jest.resetModules()

    const { getPool: freshGetPool } = await import('../../src/database/pool.js')
    expect(() => freshGetPool()).toThrow('数据库连接池未初始化')
  })
})
