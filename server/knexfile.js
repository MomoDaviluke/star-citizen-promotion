/**
 * @file Knex 配置文件
 * @description 数据库迁移和种子配置
 *              直接读取环境变量，避免依赖编译后的 src/config/index.js
 *              （CI 中先执行 db:migrate 再 build，src 目录下是 .ts 文件无法直接被 ESM 加载）
 *              每个环境通过工厂函数生成独立配置副本，避免共享对象引用互相污染
 * @module server/knexfile
 */

/**
 * 读取必需的环境变量，提供与 src/config/index.ts 一致的默认值
 */
const nodeEnv = process.env.NODE_ENV || 'development'

/**
 * 构建数据库连接配置（独立副本，避免跨环境共享引用）
 */
function buildConnection() {
  const conn = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'star_citizen_promotion'
  }

  // test 环境强制使用 test_db 数据库（与 CI services.mysql.MYSQL_DATABASE 对齐）
  if (nodeEnv === 'test' && process.env.DB_NAME === undefined) {
    conn.database = 'test_db'
  }

  return conn
}

/**
 * 构建完整 Knex 配置（工厂函数，每次调用返回独立对象）
 */
function createDbConfig() {
  return {
    client: 'mysql2',
    connection: buildConnection(),
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
      loadExtensions: ['.js']
    },
    seeds: {
      directory: './seeds',
      loadExtensions: ['.js']
    },
    pool: {
      min: 2,
      max: 10
    }
  }
}

export default {
  development: createDbConfig(),
  production: createDbConfig(),
  test: createDbConfig()
}
