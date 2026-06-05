---
name: nodejs-database-patterns
description: "Node.js 关系型数据库的通用设计模式与最佳实践。覆盖连接池配置与监控（mysql2/pg）、事务封装、参数化查询防注入、动态 SQL 构建、迁移策略对比（Knex/Prisma/手写 SQL）、慢查询诊断、读写分离基础模式。用于 Node.js 后端数据库层的设计与审查。Triggers: 数据库连接池, 数据库事务, SQL 注入防护, 数据库迁移, 慢查询, 读写分离, 数据库设计, database pool, transaction, migration, knex, prisma, mysql2, pg, sql injection. Do NOT trigger for: 数据库安装, MySQL vs PostgreSQL 选型讨论, NoSQL/MongoDB, ORM 框架教程入门."
default-enabled: false
---

# Node.js 数据库模式指南

Node.js 应用操作关系型数据库的通用设计模式。代码示例以 mysql2 为主，模式适用于 pg（PostgreSQL）、sqlite3 等。

**不覆盖**：数据库安装与运维、NoSQL、GraphQL、ORM 入门教程。
**协作**：参数化查询与 express-security-hardening 互补；分页与 api-design-standards 衔接。

---

## 一、连接池配置

每个请求创建新连接开销极大（TCP握手+认证+TLS）。连接池复用连接，延迟从数百毫秒降到微秒级。

```javascript
const mysql = require('mysql2/promise')
const pool = mysql.createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 5,
  enableKeepAlive: true, keepAliveInitialDelay: 10000,
  connectTimeout: 10000, maxIdle: 10, idleTimeout: 60000,
})
```

连接数经验公式：`(核心数 * 2) + 有效磁盘数`。20 个连接足够 1000+ QPS。

健康检查：
```javascript
async function healthCheck() {
  const conn = await pool.getConnection()
  await conn.ping()
  conn.release()
  return { status: 'healthy' }
}
```

优雅关闭：
```javascript
process.on('SIGTERM', async () => {
  await pool.end()
  process.exit(0)
})
```

---

## 二、事务封装

多表操作没有事务保护会导致数据不一致。手写 beginTransaction/commit/rollback 易遗漏 finally。

```javascript
async function withTransaction(pool, callback) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await callback(conn)
    await conn.commit()
    return result
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}
```

MySQL 不支持真正嵌套事务，需要时用 SAVEPOINT/ROLLBACK TO SAVEPOINT。

---

## 三、参数化查询防注入

拼接字符串是 SQL 注入根源。参数化查询让驱动处理转义：

```javascript
const [rows] = await pool.execute(
  'SELECT * FROM members WHERE name = ? AND status = ?', [name, status]
)
```

动态表名/列名（占位符不适用）必须用白名单：
```javascript
const ALLOWED_COLUMNS = ['id', 'name', 'created_at', 'missions']
const ALLOWED_DIRECTIONS = ['ASC', 'DESC']
function buildOrderClause(sortBy, sortDir) {
  if (!ALLOWED_COLUMNS.includes(sortBy)) throw new Error('不允许的排序列')
  if (!ALLOWED_DIRECTIONS.includes(sortDir?.toUpperCase())) throw new Error('不允许的排序方向')
  return `ORDER BY ${sortBy} ${sortDir.toUpperCase()}`
}
```

IN 子句需动态占位符：`ids.map(() => '?').join(',')`

---

## 四、动态 SQL 构建

### 动态 UPDATE（只更新传入字段）

```javascript
async function updateMember(pool, id, updates) {
  const allowedFields = ['name', 'role', 'intro', 'avatar', 'status']
  const setClauses = []; const values = []
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`); values.push(updates[field])
    }
  }
  if (setClauses.length === 0) throw new Error('没有需要更新的字段')
  values.push(id)
  const [result] = await pool.execute(
    `UPDATE members SET ${setClauses.join(', ')} WHERE id = ?`, values
  )
  return result.affectedRows
}
```

### 动态查询（可选筛选）

条件动态拼接 WHERE 子句，参数数组同步追加，最后加 LIMIT/OFFSET。

---

## 五、分页模式

**Offset（小数据量）**：`LIMIT ? OFFSET ?` + COUNT(*) 获取 total。
**Cursor（大数据量/实时）**：`WHERE created_at < ? ORDER BY created_at DESC LIMIT ?`，返回最后一条的 cursor 和 hasMore。

---

## 六、迁移策略

| 方式 | 场景 | 优势 | 劣势 |
|:---|:---|:---|:---|
| 手写 SQL | 小项目 | 零依赖、完全控制 | 无版本追踪 |
| Knex.js | 中等项目 | 查询构建器+迁移合一 | 不是完整ORM |
| Prisma | 大型/TS项目 | Schema即文档、类型安全 | 学习曲线 |

Knex 迁移：exports.up 创建表结构 + 索引，exports.down 删除表。
Prisma：model 定义 + @@index + @map 字段映射。

---

## 七、慢查询诊断

MySQL：`SHOW FULL PROCESSLIST` / `SET GLOBAL slow_query_log = 'ON'` / `SET GLOBAL long_query_time = 1`
应用层：queryWithTiming 记录 >500ms 的查询日志。常见优化：加索引、避免 SELECT *、避免 N+1 查询、大 OFFSET 改 cursor。

---

## 八、读写分离

写操作走主库，读操作走副本：
```javascript
const db = {
  async query(sql, params) {
    const isWrite = /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP)/i.test(sql)
    const pool = isWrite ? masterPool : replicaPool
    const [rows] = await pool.execute(sql, params)
    return rows
  },
  async transaction(callback) { return withTransaction(masterPool, callback) },
}
```

注意主从延迟（<1s），关键场景（注册后立即跳转）读主库。

---

## 检查清单
- [ ] 连接池已配置，production 连接数 10~30
- [ ] 所有 SQL 参数化查询，零字符串拼接
- [ ] 动态表名/列名有白名单
- [ ] 多表写操作用事务封装
- [ ] 有健康检查和优雅关闭
- [ ] 分页有 LIMIT/OFFSET 或 cursor
- [ ] 慢查询有监控告警
- [ ] 高频查询列有索引
- [ ] 迁移文件有 up/down