/**
 * @file Knex 配置文件
 * @description 数据库迁移和种子配置
 * @module server/knexfile
 */

import { config as appConfig } from './src/config/index.js'

const dbConfig = {
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

export default {
  development: dbConfig,
  production: dbConfig,
  test: {
    ...dbConfig,
    connection: {
      ...dbConfig.connection,
      database: 'test_db'
    }
  }
}
