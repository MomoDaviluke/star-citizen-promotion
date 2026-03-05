/**
 * @file 应用配置
 * @description 集中管理服务器配置和环境变量
 * @module server/config
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: join(__dirname, '../../', envFile) })

/**
 * 环境配置
 * @type {Object}
 */
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  jwt: {
    secret: process.env.JWT_SECRET || 'star-citizen-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'star_citizen_promotion',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    queueLimit: 0,
    timezone: '+08:00',
    charset: 'utf8mb4'
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
  },

  websocket: {
    port: parseInt(process.env.WS_PORT, 10) || 3003
  }
}

/**
 * 验证必要的环境变量
 * @throws {Error} 如果缺少必要的环境变量
 */
export function validateConfig() {
  const requiredEnvVars = []

  if (config.nodeEnv === 'production') {
    if (config.jwt.secret === 'star-citizen-secret-key-change-in-production') {
      console.warn('⚠️ 警告: 生产环境应设置自定义 JWT_SECRET')
    }
    if (!process.env.DB_PASSWORD) {
      console.warn('⚠️ 警告: 生产环境应设置数据库密码')
    }
  }

  if (requiredEnvVars.length > 0) {
    throw new Error(`缺少必要的环境变量: ${requiredEnvVars.join(', ')}`)
  }

  return true
}

export default config
