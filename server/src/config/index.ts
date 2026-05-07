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

export interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  name: string
  waitForConnections: boolean
  connectionLimit: number
  queueLimit: number
  timezone: string
  charset: string
}

export interface JwtConfig {
  secret: string
  expiresIn: string | number
}

export interface RateLimitConfig {
  windowMs: number
  max: number
}

export interface CorsConfig {
  allowedOrigins: string[]
}

export interface LoggingConfig {
  level: string
  file: {
    enabled: boolean
    error: string
    combined: string
  }
}

export interface AppConfig {
  nodeEnv: string
  port: number
  frontendUrl: string
  jwt: JwtConfig
  database: DatabaseConfig
  bcrypt: { saltRounds: number }
  rateLimit: RateLimitConfig
  websocket: { port: number }
  cors: CorsConfig
  logging: LoggingConfig
}

/**
 * 环境配置
 */
export const config: AppConfig = {
  nodeEnv,
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  jwt: {
    secret: process.env.JWT_SECRET || (
      nodeEnv === 'test'
        ? 'test-jwt-secret-key'
        : (() => {
            throw new Error(
              'FATAL: JWT_SECRET must be explicitly set. ' +
              'Use a cryptographically secure random string (at least 32 characters).'
            )
          })()
    ),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'star_citizen_promotion',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    queueLimit: 0,
    timezone: '+08:00',
    charset: 'utf8mb4'
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  },

  websocket: {
    port: parseInt(process.env.WS_PORT || '3003', 10)
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
export function validateProductionConfig(): boolean {
  const errors: string[] = []

  if (config.nodeEnv !== 'test' && !process.env.JWT_SECRET) {
    if (config.nodeEnv === 'production') {
      throw new Error(
        'FATAL: JWT_SECRET must be set in production. ' +
        'Please set a strong secret key (at least 32 characters).'
      )
    }
    console.warn('⚠️ 警告: JWT_SECRET not set. Application is insecure.')
    errors.push('JWT_SECRET (not set, application is insecure)')
  }

  if (config.nodeEnv !== 'test' && !config.database.password) {
    if (config.nodeEnv === 'production') {
      throw new Error('FATAL: DB_PASSWORD must be set in production.')
    }
    console.warn('⚠️ 警告: DB_PASSWORD not set. Database connection may be insecure.')
    errors.push('DB_PASSWORD')
  }

  if (config.nodeEnv === 'production') {
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
