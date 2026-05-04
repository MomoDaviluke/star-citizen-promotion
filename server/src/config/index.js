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

const nodeEnv = process.env.NODE_ENV || 'development'

/**
 * 环境配置
 * @type {Object}
 */
export const config = {
  nodeEnv,
  port: parseInt(process.env.PORT, 10) || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  jwt: {
    secret: process.env.JWT_SECRET || (
      nodeEnv === 'test'
        ? 'test-jwt-secret-key'
        : nodeEnv === 'development'
          ? 'dev-only-jwt-secret-do-not-use-in-prod'
          : undefined
    ),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'star_citizen_promotion',
    /** @deprecated 使用 name 代替，为向后兼容保留 */
    get database() { return this.name },
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
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [process.env.FRONTEND_URL || 'http://localhost:3000']
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      error: process.env.LOG_FILE_ERROR || 'logs/error.log',
      combined: process.env.LOG_FILE_COMBINED || 'logs/combined.log'
    }
  }
}

/**
 * 生产环境强制校验
 * @description 生产环境启动前必须满足安全要求，否则抛出错误阻断启动
 */
export function validateProductionConfig() {
  const errors = []

  // JWT_SECRET 在非 test 环境中必须显式设置
  if (config.nodeEnv !== 'test' && !process.env.JWT_SECRET) {
    if (config.nodeEnv === 'production') {
      throw new Error(
        'FATAL: JWT_SECRET must be set in production. ' +
        'Please set a strong secret key (at least 32 characters).'
      )
    }
    errors.push('JWT_SECRET (not set, using fallback is insecure)')
  }

  if (config.nodeEnv === 'production') {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error(
        'FATAL: JWT_SECRET must be at least 32 characters in production.'
      )
    }

    if (!process.env.DB_PASSWORD) {
      errors.push('DB_PASSWORD')
    }

    if (!process.env.ALLOWED_ORIGINS) {
      console.warn('⚠️ 警告: ALLOWED_ORIGINS not set. CORS will use FRONTEND_URL as fallback.')
    }
  }

  if (errors.length > 0) {
    console.warn(`⚠️ 配置警告: ${errors.join(', ')}`)
  }

  return true
}

validateProductionConfig()

export default config
