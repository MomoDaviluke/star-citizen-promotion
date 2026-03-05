/**
 * @file 数据库初始化
 * @description MySQL 数据库表结构初始化和种子数据填充
 * @module server/database/init
 */

import { createPool, query, queryOne, testConnection } from './pool.js'
import { config } from '../config/index.js'

/**
 * 初始化数据库
 * @description 创建连接池、测试连接、初始化表结构、填充种子数据
 */
export async function initDatabase() {
  await createPool()

  const isConnected = await testConnection()
  if (!isConnected) {
    throw new Error('数据库连接失败')
  }

  await createTables()
  await seedInitialData()

  console.log('📊 数据库初始化完成')
}

/**
 * 创建数据库表结构
 */
async function createTables() {
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

  await query(createUsersTable)
  await query(createMembersTable)
  await query(createProjectsTable)
  await query(createPilotsTable)
  await query(createApplicationsTable)
  await query(createStatsTable)
  await query(createActivityLogsTable)

  console.log('📋 数据库表结构创建完成')
}

/**
 * 填充初始数据
 */
async function seedInitialData() {
  const userCount = await queryOne('SELECT COUNT(*) as count FROM users')
  if (userCount.count > 0) {
    console.log('🌱 数据已存在，跳过种子数据填充')
    return
  }

  const members = [
    { id: 'm1', name: 'Echo', role: '舰队指挥', intro: '负责大型行动协调与战术安排。', status: 'active' },
    { id: 'm2', name: 'Nova', role: '后勤总管', intro: '管理补给路线、物资统筹与协作。', status: 'active' },
    { id: 'm3', name: 'Raven', role: '训练官', intro: '组织新人训练、飞行演练与战术复盘。', status: 'active' }
  ]

  for (const member of members) {
    await query(
      'INSERT INTO members (id, name, role, intro, status) VALUES (?, ?, ?, ?, ?)',
      [member.id, member.name, member.role, member.intro, member.status]
    )
  }

  const pilots = [
    {
      id: 'p1',
      name: '维穆 · 王牌飞行员',
      callsign: 'F8C Vanguard Spearhead',
      ship: 'Anvil F8C Lightning',
      description: '专注于制空和快速拦截任务，擅长以 F8C Lightning 进行高强度近距空战与舰队护航。',
      image: '/images/F8C.png',
      missions: 128,
      kills: 47,
      status: 'active'
    },
    {
      id: 'p2',
      name: 'Orion · 战术领航员',
      callsign: 'F8C Night Lance',
      ship: 'Anvil F8C Lightning',
      description: '负责小队切入路线规划与火力牵引，擅长夜战和高风险突防。',
      image: '/images/f8c-lightning.svg',
      missions: 96,
      kills: 32,
      status: 'active'
    },
    {
      id: 'p3',
      name: 'Vega · 拦截专家',
      callsign: 'F8C Blue Comet',
      ship: 'Anvil F8C Lightning',
      description: '以高速截击和近距压制见长，常执行护航核心与快速救援任务。',
      image: '/images/f8c-lightning.svg',
      missions: 84,
      kills: 28,
      status: 'active'
    }
  ]

  for (const pilot of pilots) {
    await query(
      'INSERT INTO pilots (id, name, callsign, ship, description, image, missions, kills, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [pilot.id, pilot.name, pilot.callsign, pilot.ship, pilot.description, pilot.image, pilot.missions, pilot.kills, pilot.status]
    )
  }

  const projects = [
    {
      id: 'pr1',
      name: '新人成长营',
      period: '每月第 1 周',
      description: '提供从飞船入门到组队协作的完整训练路线。',
      status: 'active',
      progress: 75,
      participants: 12
    },
    {
      id: 'pr2',
      name: '跨组织联合行动',
      period: '每月第 3 周',
      description: '与友方组织共同执行大型护航与区域控制任务。',
      status: 'active',
      progress: 60,
      participants: 24
    },
    {
      id: 'pr3',
      name: '赛事与展示',
      period: '季度活动',
      description: '通过竞速、编队飞行等活动提升团队曝光与凝聚力。',
      status: 'planning',
      progress: 30,
      participants: 8
    }
  ]

  for (const project of projects) {
    await query(
      'INSERT INTO projects (id, name, period, description, status, progress, participants) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [project.id, project.name, project.period, project.description, project.status, project.progress, project.participants]
    )
  }

  const stats = [
    { id: 's1', label: '团队成员', value: '20+', sortOrder: 1 },
    { id: 's2', label: '每周活动', value: '3 场', sortOrder: 2 },
    { id: 's3', label: '合作组织', value: '12+', sortOrder: 3 }
  ]

  for (const stat of stats) {
    await query(
      'INSERT INTO stats (id, label, value, sort_order) VALUES (?, ?, ?, ?)',
      [stat.id, stat.label, stat.value, stat.sortOrder]
    )
  }

  console.log('🌱 初始数据填充完成')
}

export default initDatabase
