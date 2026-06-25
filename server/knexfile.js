/**
 * @file Knex 配置文件
 * @description 数据库迁移和种子配置
 * @module server/knexfile
 */

import { config as appConfig } from './src/config/index.js'

/**
 * 基础数据库配置
 * @description 各环境配置的模板，通过 deepClone 为每个环境生成独立副本，
 *              避免共享引用导致 Knex 在某环境修改 pool/connection 时影响其他环境（TD-11）
 */
const baseConfig = {
  client: 'mysql2',
  connection: {
    host: appConfig.database.host,
    port: appConfig.database.port,
    user: appConfig.database.user,
    password: appConfig.database.password,
    database: appConfig.database.name
  },
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

/**
 * 深拷贝配置对象
 * @description 使用 structuredClone 实现真正的深拷贝，
 *              确保每个环境获得完全独立的配置副本（含嵌套的 connection/pool/migrations/seeds）
 * @returns 基础配置的深拷贝
 */
function cloneConfig() {
  return structuredClone(baseConfig)
}

export default {
  development: cloneConfig(),
  production: cloneConfig(),
  test: (() => {
    const cfg = cloneConfig()
    cfg.connection.database = 'test_db'
    return cfg
  })()
}
