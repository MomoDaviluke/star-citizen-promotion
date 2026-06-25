/**
 * @file 数据库表结构 DDL 共享模块
 * @description 集中管理所有表的 CREATE TABLE 语句，消除 init.ts 与 migrate.ts 的重复定义。
 *              语句按外键依赖顺序排列：users 优先，依赖 users 的表在后。
 * @module server/database/schema
 * @version 1.0
 */

/**
 * 表名列表（按依赖顺序排列）
 * @description users 优先；applications/activity_logs/events 依赖 users；
 *              event_participants 依赖 events 和 users
 */
export const TABLE_NAMES = [
  'users',
  'members',
  'projects',
  'pilots',
  'applications',
  'stats',
  'activity_logs',
  'ships',
  'events',
  'event_participants',
  'settings'
] as const

/**
 * CREATE TABLE DDL 语句数组（按依赖顺序排列）
 * @description 顺序与 TABLE_NAMES 一致，确保外键依赖的表先创建
 */
export const SCHEMA_STATEMENTS: string[] = [
  // users 表（无依赖，优先创建）
  `
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  // members 表
  `
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  // projects 表
  `
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  // pilots 表
  `
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  // applications 表（依赖 users）
  `
    CREATE TABLE IF NOT EXISTS applications (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL,
      discord VARCHAR(50),
      experience TEXT,
      availability VARCHAR(50),
      reason TEXT,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      reviewed_by VARCHAR(36),
      reviewed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_email (email),
      INDEX idx_created (created_at),
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  // stats 表
  `
    CREATE TABLE IF NOT EXISTS stats (
      id VARCHAR(36) PRIMARY KEY,
      label VARCHAR(50) NOT NULL,
      value VARCHAR(50) NOT NULL,
      icon VARCHAR(50),
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sort (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  // activity_logs 表（依赖 users）
  `
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  // ships 表
  `
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  // events 表（依赖 users）
  `
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  // event_participants 表（依赖 events 和 users）
  `
    CREATE TABLE IF NOT EXISTS event_participants (
      event_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  // settings 表（key/value 为保留字，使用反引号转义）
  `
    CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(100) PRIMARY KEY,
      \`value\` TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `
]
