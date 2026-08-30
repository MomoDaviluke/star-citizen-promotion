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
 * 获取 JWT 密钥
 * @description 安全地获取 JWT 密钥，非测试环境必须显式设置
 * @returns JWT 密钥字符串
 * @throws 如果非测试环境未设置 JWT_SECRET
 */
function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    // 生产环境强制要求密钥长度
    if (nodeEnv === 'production' && process.env.JWT_SECRET.length < 32) {
      throw new Error(
        'FATAL: JWT_SECRET must be at least 32 characters in production. ' +
        'Use a cryptographically secure random string.'
      )
    }
    return process.env.JWT_SECRET
  }
  if (nodeEnv === 'test') {
    return 'test-jwt-secret-key-not-for-production'
  }
  throw new Error(
    'FATAL: JWT_SECRET must be explicitly set. ' +
    'Use a cryptographically secure random string (at least 32 characters).'
  )
}

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

export interface MetricsConfig {
  enabled: boolean
  allowedIps: string[]
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
  metrics: MetricsConfig
}

/**
 * Cookie 配置常量
 * @description 统一 Cookie 安全属性配置
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7天，与 JWT expiresIn 保持一致
}

/**
 * 环境配置
 */
export const config: AppConfig = {
  nodeEnv,
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  jwt: {
    secret: getJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || (nodeEnv === 'test' ? '' : ''),
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
    port: parseInt(process.env.WS_PORT || '3001', 10)
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
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    allowedIps: process.env.METRICS_ALLOWED_IPS
      ? process.env.METRICS_ALLOWED_IPS.split(',').map(ip => ip.trim())
      : ['127.0.0.1', '::1']
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
    process.stderr.write('⚠️ 警告: JWT_SECRET not set. Application is insecure.\n')
    errors.push('JWT_SECRET (not set, application is insecure)')
  }

  if (config.nodeEnv !== 'test' && !config.database.password) {
    throw new Error('FATAL: DB_PASSWORD must be set. Database connection is insecure without a password.')
  }

  if (config.nodeEnv === 'production') {
    if (!process.env.ALLOWED_ORIGINS) {
      process.stderr.write('⚠️ 警告: ALLOWED_ORIGINS not set. CORS will use FRONTEND_URL as fallback.\n')
    }
  }

  if (errors.length > 0) {
    process.stderr.write(`⚠️ 配置警告: ${errors.join(', ')}\n`)
  }

  return true
}

validateProductionConfig()

export default config
