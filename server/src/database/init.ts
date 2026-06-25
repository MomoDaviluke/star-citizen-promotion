/**
 * @file 数据库初始化
 * @description MySQL 数据库表结构初始化和种子数据填充
 * @module server/database/init
 */

import { createPool, query, queryOne, testConnection, closePool } from './pool.js'
import { SCHEMA_STATEMENTS } from './schema.js'
import { RowDataPacket } from 'mysql2/promise'
import logger from '../utils/logger.js'

export { closePool }

async function createTables(): Promise<void> {
  for (const stmt of SCHEMA_STATEMENTS) {
    await query(stmt)
  }
  logger.info('数据库表结构创建完成')
}

interface MemberSeed {
  id: string
  name: string
  role: string
  intro: string
  status: string
}

interface PilotSeed {
  id: string
  name: string
  callsign: string
  ship: string
  description: string
  image: string
  missions: number
  kills: number
  status: string
}

interface ProjectSeed {
  id: string
  name: string
  period: string
  description: string
  status: string
  progress: number
  participants: number
}

interface StatSeed {
  id: string
  label: string
  value: string
  sortOrder: number
}

async function seedInitialData(): Promise<void> {
  const memberCount = await queryOne<RowDataPacket & { count: number }>('SELECT COUNT(*) as count FROM members')
  if (memberCount && memberCount.count > 0) {
    logger.info('数据已存在，跳过种子数据填充')
    return
  }

  const members: MemberSeed[] = [
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

  const pilots: PilotSeed[] = [
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

  const projects: ProjectSeed[] = [
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

  const stats: StatSeed[] = [
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

  logger.info('初始数据填充完成')
}

export async function initDatabase(): Promise<void> {
  await createPool()

  const isConnected = await testConnection()
  if (!isConnected) {
    throw new Error('数据库连接失败')
  }

  await createTables()
  await seedInitialData()

  logger.info('数据库初始化完成')
}

export default initDatabase
