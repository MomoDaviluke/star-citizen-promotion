/**
 * @file 数据库表结构（DDL）共享模块
 * @description 统一定义全部建表语句，init.ts 与 migrate.ts 共用，消除 ~200 行重复；
 *              建表顺序即数组顺序（先 users 等被外键引用的基础表，后引用表）
 * @module server/database/schema
 */

export interface TableSchema {
  name: string
  sql: string
}

export const TABLE_SCHEMAS: TableSchema[] = [
  {
    name: 'users',
    sql: `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'member', 'guest') DEFAULT 'member',
      avatar VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  },
  {
    name: 'members',
    sql: `
    CREATE TABLE IF NOT EXISTS members (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      role VARCHAR(50) NOT NULL,
      intro TEXT,
      avatar VARCHAR(255),
      join_date DATE,
      status ENUM('active', 'inactive', 'retired') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  },
  {
    name: 'projects',
    sql: `
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      period VARCHAR(50),
      description TEXT,
      status ENUM('planning', 'active', 'completed', 'cancelled') DEFAULT 'planning',
      progress INT DEFAULT 0,
      participants INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  },
  {
    name: 'pilots',
    sql: `
    CREATE TABLE IF NOT EXISTS pilots (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      callsign VARCHAR(50) NOT NULL,
      ship VARCHAR(100) NOT NULL,
      description TEXT,
      image VARCHAR(255),
      missions INT DEFAULT 0,
      kills INT DEFAULT 0,
      status ENUM('active', 'inactive', 'kia') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_missions (missions DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  },
  {
    name: 'applications',
    sql: `
    CREATE TABLE IF NOT EXISTS applications (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL,
      discord VARCHAR(50),
      experience TEXT,
      availability VARCHAR(50),
      reason TEXT,
      note TEXT,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      reviewed_by VARCHAR(36),
      reviewed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_email (email),
      INDEX idx_created (created_at),
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  },
  {
    name: 'stats',
    sql: `
    CREATE TABLE IF NOT EXISTS stats (
      id VARCHAR(36) PRIMARY KEY,
      label VARCHAR(50) NOT NULL,
      value VARCHAR(50) NOT NULL,
      icon VARCHAR(50),
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sort (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  },
  {
    name: 'activity_logs',
    sql: `
    CREATE TABLE IF NOT EXISTS activity_logs (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50),
      entity_id VARCHAR(36),
      details JSON,
      ip_address VARCHAR(45),
      user_agent VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (user_id),
      INDEX idx_action (action),
      INDEX idx_created (created_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  },
  {
    name: 'ships',
    sql: `
    CREATE TABLE IF NOT EXISTS ships (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      callsign VARCHAR(50),
      ship VARCHAR(100) NOT NULL,
      category ENUM('combat', 'transport', 'explore', 'support') DEFAULT 'combat',
      status ENUM('available', 'borrowed', 'inMission', 'maintenance') DEFAULT 'available',
      value BIGINT DEFAULT 0,
      image VARCHAR(500),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  },
  {
    name: 'events',
    sql: `
    CREATE TABLE IF NOT EXISTS events (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      location VARCHAR(500),
      status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
      creator_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_start_time (start_time),
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  },
  {
    name: 'event_participants',
    sql: `
    CREATE TABLE IF NOT EXISTS event_participants (
      event_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  },
  {
    name: 'settings',
    sql: `
    CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(100) PRIMARY KEY,
      \`value\` TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  },
  {
    name: 'monitor_alerts',
    sql: `
    CREATE TABLE IF NOT EXISTS monitor_alerts (
      id VARCHAR(36) PRIMARY KEY,
      rule VARCHAR(50) NOT NULL,
      severity ENUM('warn','critical') NOT NULL,
      metric_value DECIMAL(12,4) NOT NULL,
      threshold DECIMAL(12,4) NOT NULL,
      status ENUM('active','acked','resolved') NOT NULL DEFAULT 'active',
      hit_count INT NOT NULL DEFAULT 1,
      message VARCHAR(255) NOT NULL,
      snapshot JSON,
      ack_by VARCHAR(36),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL DEFAULT NULL,
      INDEX idx_alerts_status_created (status, created_at),
      INDEX idx_alerts_rule_created (rule, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  },
  {
    name: 'monitor_reports',
    sql: `
    CREATE TABLE IF NOT EXISTS monitor_reports (
      id VARCHAR(36) PRIMARY KEY,
      request_id VARCHAR(64),
      category ENUM('frontend_error','slow_page','api_failure','manual') NOT NULL DEFAULT 'manual',
      message TEXT,
      browser JSON,
      payload JSON,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_reports_request (request_id),
      INDEX idx_reports_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  }
]