/**
 * @file 数据库迁移脚本
 * @description 创建数据库和表结构
 * @module server/database/migrate
 */

import mysql from 'mysql2/promise'
import { config } from '../config/index.js'

/**
 * 创建数据库（如果不存在）
 */
async function createDatabase() {
  const connection = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password
  })

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database.database}\` 
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )

  console.log(`✅ 数据库 '${config.database.database}' 已创建或已存在`)

  await connection.end()
}

/**
 * 创建用户表
 */
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'member', 'guest') DEFAULT 'member',
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`

/**
 * 创建成员表
 */
const createMembersTable = `
  CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL,
    intro TEXT,
    avatar VARCHAR(255),
    join_date DATE,
    status ENUM('active', 'inactive', 'retired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`

/**
 * 创建项目表
 */
const createProjectsTable = `
  CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    period VARCHAR(50),
    description TEXT,
    status ENUM('planning', 'active', 'completed', 'cancelled') DEFAULT 'planning',
    progress INT DEFAULT 0,
    participants INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`

/**
 * 创建飞行员表
 */
const createPilotsTable = `
  CREATE TABLE IF NOT EXISTS pilots (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    callsign VARCHAR(50) NOT NULL,
    ship VARCHAR(100) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    missions INT DEFAULT 0,
    kills INT DEFAULT 0,
    status ENUM('active', 'inactive', 'kia') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_missions (missions DESC)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`

/**
 * 创建申请表
 */
const createApplicationsTable = `
  CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    discord VARCHAR(50),
    experience TEXT,
    availability VARCHAR(50),
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by VARCHAR(36),
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_created (created_at),
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`

/**
 * 创建统计表
 */
const createStatsTable = `
  CREATE TABLE IF NOT EXISTS stats (
    id VARCHAR(36) PRIMARY KEY,
    label VARCHAR(50) NOT NULL,
    value VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sort (sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`

/**
 * 创建活动日志表
 */
const createActivityLogsTable = `
  CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(36),
    details JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`

/**
 * 执行数据库迁移
 */
async function runMigration() {
  console.log('🚀 开始数据库迁移...\n')

  try {
    await createDatabase()

    const connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      multipleStatements: true
    })

    console.log('📋 创建数据表...')

    await connection.query(createUsersTable)
    console.log('   ✓ users 表')

    await connection.query(createMembersTable)
    console.log('   ✓ members 表')

    await connection.query(createProjectsTable)
    console.log('   ✓ projects 表')

    await connection.query(createPilotsTable)
    console.log('   ✓ pilots 表')

    await connection.query(createApplicationsTable)
    console.log('   ✓ applications 表')

    await connection.query(createStatsTable)
    console.log('   ✓ stats 表')

    await connection.query(createActivityLogsTable)
    console.log('   ✓ activity_logs 表')

    await connection.end()

    console.log('\n✅ 数据库迁移完成!')
  } catch (error) {
    console.error('\n❌ 数据库迁移失败:', error.message)
    process.exit(1)
  }
}

runMigration()
