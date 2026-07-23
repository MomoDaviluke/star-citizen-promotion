/**
 * @file 压测目标 URL 配置
 * @description 支持通过环境变量切换 dev/prod 目标
 * @module load-tests/config/targets
 */

export const TARGETS = {
  backend:  process.env.LOADTEST_TARGET   || 'http://localhost:3001',
  nginx:    process.env.LOADTEST_NGINX    || 'http://localhost:80',
  frontend: process.env.LOADTEST_FRONTEND || 'http://localhost:3000',
  ws:       process.env.LOADTEST_WS       || 'ws://localhost:3001/ws'
}

/** 压测专用测试账号（由 lib/seeds.mjs 创建） */
export const TEST_ACCOUNTS = {
  admin: {
    email: 'loadtest-admin@test.local',
    password: 'LoadTest123Admin',
    role: 'admin'
  },
  member: {
    email: 'loadtest-member@test.local',
    password: 'LoadTest123Member',
    role: 'member'
  }
}
