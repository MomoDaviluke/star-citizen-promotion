/**
 * @file 数据库初始化
 * @description SQLite 数据库连接和表结构初始化
 * @module server/database/init
 */

import Database from 'better-sqlite3'
import { config } from '../config/index.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '../../data/database.sqlite')
const dataDir = dirname(dbPath)

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

/**
 * 初始化数据库表结构
 */
export async function initDatabase() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `

  const createMembersTable = `
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      intro TEXT,
      avatar TEXT,
      join_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `

  const createProjectsTable = `
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      period TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      progress INTEGER DEFAULT 0,
      participants INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `

  const createPilotsTable = `
    CREATE TABLE IF NOT EXISTS pilots (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      callsign TEXT NOT NULL,
      ship TEXT NOT NULL,
      description TEXT,
      image TEXT,
      missions INTEGER DEFAULT 0,
      kills INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `

  const createApplicationsTable = `
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      discord TEXT,
      experience TEXT,
      availability TEXT,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      reviewed_by TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    )
  `

  const createStatsTable = `
    CREATE TABLE IF NOT EXISTS stats (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `

  const createActivityLogsTable = `
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `

  db.exec(createUsersTable)
  db.exec(createMembersTable)
  db.exec(createProjectsTable)
  db.exec(createPilotsTable)
  db.exec(createApplicationsTable)
  db.exec(createStatsTable)
  db.exec(createActivityLogsTable)

  await seedInitialData()

  console.log('📊 数据库表初始化完成')
}

/**
 * 填充初始数据
 */
async function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
  if (userCount.count > 0) return

  const insertMember = db.prepare(`
    INSERT INTO members (id, name, role, intro, status) VALUES (?, ?, ?, ?, ?)
  `)

  const members = [
    { id: 'm1', name: 'Echo', role: '舰队指挥', intro: '负责大型行动协调与战术安排。', status: 'active' },
    { id: 'm2', name: 'Nova', role: '后勤总管', intro: '管理补给路线、物资统筹与协作。', status: 'active' },
    { id: 'm3', name: 'Raven', role: '训练官', intro: '组织新人训练、飞行演练与战术复盘。', status: 'active' }
  ]

  for (const member of members) {
    insertMember.run(member.id, member.name, member.role, member.intro, member.status)
  }

  const insertPilot = db.prepare(`
    INSERT INTO pilots (id, name, callsign, ship, description, image, missions, kills, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

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
    insertPilot.run(
      pilot.id,
      pilot.name,
      pilot.callsign,
      pilot.ship,
      pilot.description,
      pilot.image,
      pilot.missions,
      pilot.kills,
      pilot.status
    )
  }

  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, period, description, status, progress, participants) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

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
    insertProject.run(
      project.id,
      project.name,
      project.period,
      project.description,
      project.status,
      project.progress,
      project.participants
    )
  }

  const insertStat = db.prepare(`
    INSERT INTO stats (id, label, value, sort_order) VALUES (?, ?, ?, ?)
  `)

  const stats = [
    { id: 's1', label: '团队成员', value: '20+', sortOrder: 1 },
    { id: 's2', label: '每周活动', value: '3 场', sortOrder: 2 },
    { id: 's3', label: '合作组织', value: '12+', sortOrder: 3 }
  ]

  for (const stat of stats) {
    insertStat.run(stat.id, stat.label, stat.value, stat.sortOrder)
  }

  console.log('🌱 初始数据填充完成')
}

export { db }
export default db
