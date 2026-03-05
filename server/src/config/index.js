/**
 * @file 应用配置
 * @description 集中管理服务器配置和环境变量
 * @module server/config
 */

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
    path: process.env.DATABASE_PATH || './data/database.sqlite'
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
  }

  if (requiredEnvVars.length > 0) {
    throw new Error(`缺少必要的环境变量: ${requiredEnvVars.join(', ')}`)
  }

  return true
}

export default config
