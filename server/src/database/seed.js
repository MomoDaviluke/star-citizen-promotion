/**
 * @file 数据库种子数据
 * @description 填充初始测试数据
 * @module server/database/seed
 */

import mysql from 'mysql2/promise'
import { config } from '../config/index.js'

/**
 * 执行种子数据填充
 */
async function runSeed() {
  console.log('🌱 开始填充种子数据...\n')

  const connection = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  })

  try {
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users')
    if (userCount[0].count > 0) {
      console.log('⚠️ 数据库已有数据，跳过种子数据填充')
      await connection.end()
      return
    }

    console.log('📝 插入成员数据...')
    const members = [
      { id: 'm1', name: 'Echo', role: '舰队指挥', intro: '负责大型行动协调与战术安排。', status: 'active' },
      { id: 'm2', name: 'Nova', role: '后勤总管', intro: '管理补给路线、物资统筹与协作。', status: 'active' },
      { id: 'm3', name: 'Raven', role: '训练官', intro: '组织新人训练、飞行演练与战术复盘。', status: 'active' }
    ]

    for (const member of members) {
      await connection.query(
        'INSERT INTO members (id, name, role, intro, status) VALUES (?, ?, ?, ?, ?)',
        [member.id, member.name, member.role, member.intro, member.status]
      )
    }
    console.log(`   ✓ 插入 ${members.length} 条成员数据`)

    console.log('📝 插入飞行员数据...')
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
      await connection.query(
        'INSERT INTO pilots (id, name, callsign, ship, description, image, missions, kills, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [pilot.id, pilot.name, pilot.callsign, pilot.ship, pilot.description, pilot.image, pilot.missions, pilot.kills, pilot.status]
      )
    }
    console.log(`   ✓ 插入 ${pilots.length} 条飞行员数据`)

    console.log('📝 插入项目数据...')
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
      await connection.query(
        'INSERT INTO projects (id, name, period, description, status, progress, participants) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [project.id, project.name, project.period, project.description, project.status, project.progress, project.participants]
      )
    }
    console.log(`   ✓ 插入 ${projects.length} 条项目数据`)

    console.log('📝 插入统计数据...')
    const stats = [
      { id: 's1', label: '团队成员', value: '20+', sortOrder: 1 },
      { id: 's2', label: '每周活动', value: '3 场', sortOrder: 2 },
      { id: 's3', label: '合作组织', value: '12+', sortOrder: 3 }
    ]

    for (const stat of stats) {
      await connection.query(
        'INSERT INTO stats (id, label, value, sort_order) VALUES (?, ?, ?, ?)',
        [stat.id, stat.label, stat.value, stat.sortOrder]
      )
    }
    console.log(`   ✓ 插入 ${stats.length} 条统计数据`)

    console.log('\n✅ 种子数据填充完成!')
  } catch (error) {
    console.error('\n❌ 种子数据填充失败:', error.message)
    process.exit(1)
  } finally {
    await connection.end()
  }
}

runSeed()
