/**
 * @file schema 共享模块单元测试
 * @description 验证表名列表和 DDL 语句的完整性
 */

import { describe, it, expect } from '@jest/globals'
import { TABLE_NAMES, SCHEMA_STATEMENTS } from '../../src/database/schema.js'

describe('database/schema', () => {
  describe('TABLE_NAMES', () => {
    it('应包含所有 11 个表', () => {
      expect(TABLE_NAMES).toHaveLength(11)
      expect(TABLE_NAMES).toEqual(
        expect.arrayContaining([
          'users',
          'members',
          'projects',
          'pilots',
          'applications',
          'stats',
          'activity_logs',
          'ships',
          'events',
          'event_participants',
          'settings'
        ])
      )
    })

    it('应按依赖顺序排列（users 优先）', () => {
      expect(TABLE_NAMES[0]).toBe('users')
      // applications 依赖 users，应在 users 之后
      expect(TABLE_NAMES.indexOf('applications')).toBeGreaterThan(TABLE_NAMES.indexOf('users'))
      // activity_logs 依赖 users
      expect(TABLE_NAMES.indexOf('activity_logs')).toBeGreaterThan(TABLE_NAMES.indexOf('users'))
      // events 依赖 users
      expect(TABLE_NAMES.indexOf('events')).toBeGreaterThan(TABLE_NAMES.indexOf('users'))
      // event_participants 依赖 events 和 users
      expect(TABLE_NAMES.indexOf('event_participants')).toBeGreaterThan(TABLE_NAMES.indexOf('events'))
      expect(TABLE_NAMES.indexOf('event_participants')).toBeGreaterThan(TABLE_NAMES.indexOf('users'))
    })
  })

  describe('SCHEMA_STATEMENTS', () => {
    it('应包含 11 条 DDL 语句', () => {
      expect(SCHEMA_STATEMENTS).toHaveLength(11)
    })

    it('每条语句应包含 CREATE TABLE IF NOT EXISTS', () => {
      for (const stmt of SCHEMA_STATEMENTS) {
        expect(stmt).toMatch(/CREATE TABLE IF NOT EXISTS/i)
      }
    })

    it('每条语句应以分号结尾', () => {
      for (const stmt of SCHEMA_STATEMENTS) {
        expect(stmt.trim().endsWith(';')).toBe(true)
      }
    })

    it('应包含所有 11 个表的 DDL', () => {
      const joined = SCHEMA_STATEMENTS.join('\n')
      for (const table of TABLE_NAMES) {
        // 表名后紧跟空格和左括号（DDL 中表名未加反引号）
        const pattern = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\(`, 'i')
        expect(joined).toMatch(pattern)
      }
    })

    it('应包含必要的 ENGINE 和 CHARSET 声明', () => {
      for (const stmt of SCHEMA_STATEMENTS) {
        expect(stmt).toMatch(/ENGINE=InnoDB/i)
        expect(stmt).toMatch(/CHARSET=utf8mb4/i)
        expect(stmt).toMatch(/COLLATE=utf8mb4_unicode_ci/i)
      }
    })

    it('applications 表应包含指向 users 的外键', () => {
      const applicationsStmt = SCHEMA_STATEMENTS.find((s) => s.includes('applications')) || ''
      expect(applicationsStmt).toMatch(/FOREIGN KEY.*reviewed_by.*REFERENCES users/i)
    })

    it('event_participants 表应包含复合主键', () => {
      const epStmt = SCHEMA_STATEMENTS.find((s) => s.includes('event_participants')) || ''
      expect(epStmt).toMatch(/PRIMARY KEY\s*\(\s*event_id\s*,\s*user_id\s*\)/i)
    })

    it('settings 表应使用反引号转义保留字', () => {
      const settingsStmt = SCHEMA_STATEMENTS.find((s) => s.includes('settings')) || ''
      // 匹配 `key` 或 `value`（带反引号）
      expect(settingsStmt).toMatch(/`key`/)
      expect(settingsStmt).toMatch(/`value`/)
    })
  })

  describe('TABLE_NAMES 与 SCHEMA_STATEMENTS 一致性', () => {
    it('TABLE_NAMES 与 SCHEMA_STATEMENTS 数量一致', () => {
      expect(TABLE_NAMES.length).toBe(SCHEMA_STATEMENTS.length)
    })
  })
})
