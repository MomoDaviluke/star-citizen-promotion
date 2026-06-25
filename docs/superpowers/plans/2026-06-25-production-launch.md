# 生产上线推进计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 Star Citizen 战队宣传网站从"本地可跑 + 静态数据 + 视觉升级完成"状态推进到"公网域名 + HTTPS + 真实 MySQL + 完成技术债"的可上线状态。

**架构：** Vue 3 + Vite 前端 + Express + TypeScript + MySQL 后端 + Nginx 反向代理 + Docker Compose 编排 + Let's Encrypt HTTPS。前端走 `/api/v1/` 前缀调用后端，认证通过 httpOnly Cookie 传递 JWT。

**技术栈：** Vue 3.5 / Vite 7 / Pinia / GSAP / Vitest / Playwright · Node 22 / Express 4 / MySQL 8 / Knex / Jest · Docker / Nginx / Certbot / Prometheus / Winston

**关键现状（2026-06-25）：**
- 后端 `/api/v1/` 路由前缀已挂载（`server/src/index.ts:282-314`），同时保留 `/api/` 兼容前缀
- http.js 已迁移到 httpOnly Cookie 认证（`src/services/http.js:1-8` 注释明确）
- 前端 API_BASE_URL 仍是 `/api`（`src/services/http.js:18`），需切换到 `/api/v1`
- 前端默认 `VITE_USE_API=false`（`src/services/dataService.js:13`），走静态数据
- 后端 310 测试通过，覆盖率 63.86%
- 工作区有 2 个未提交修改：`src/views/Fleet.vue`、`src/views/Home.vue`
- 6 个本地未合并分支：`feat/enterprise-improvement`、`feature/frontend-asset-optimization`、`fix-cicd-security`、`refactor/css-vars-group-2`、`refactor/websocket-message-handler`、`feature/frontend-visual-upgrade`（注：实际视觉升级已在 main 上）
- `server/src/database/init.ts` 和 `migrate.ts` 存在 ~200 行重复 DDL（P1-16）
- `docker-compose.yml` 已配置 mysql + backend + nginx + certbot + backup 服务
- `nginx.conf` 已完整配置 HTTPS + ACME 挑战路径 + 安全头

---

## 阶段 0：工作区清理与分支决策

**目标：** 清理未提交修改 + 决策 6 个未合并分支，让 main 回到干净状态再开始后续工作。

### 任务 0.1：检查并提交 Fleet.vue / Home.vue 未提交修改

**文件：**
- 修改：`src/views/Fleet.vue`（78 行变更，主要是删除）
- 修改：`src/views/Home.vue`（44 行变更，主要是新增）

- [ ] **步骤 1：查看具体改动**

```powershell
git diff src/views/Fleet.vue
git diff src/views/Home.vue
```

预期：看到 Fleet.vue 删除了大量旧代码（约 78 行减少），Home.vue 新增了约 44 行。判断改动是否符合"前端视觉升级"的延续工作。

- [ ] **步骤 2：构建验证**

```powershell
npm run build
```

预期：构建成功，无 TypeScript 或 Vite 报错。如果失败，回到代码修复后再提交。

- [ ] **步骤 3：前端测试验证**

```powershell
npm test
```

预期：所有前端单元测试通过。如果失败，先修复测试。

- [ ] **步骤 4：提交（按 commit_convention.md 规范）**

```powershell
git add src/views/Fleet.vue src/views/Home.vue
git commit -m "refactor(views): 清理 Fleet 视图冗余代码并完善 Home 视图" -m "继续前端视觉升级收尾，Fleet 净减 78 行，Home 净增 44 行。"
```

- [ ] **步骤 5：推送到远端**

```powershell
git push origin main
```

预期：推送成功，`origin/main` 与本地 `main` 同步。

### 任务 0.2：决策 6 个未合并分支

**文件：** 无（仅 git 操作）

- [ ] **步骤 1：检查每个分支与 main 的差异和最新提交**

```powershell
git log --oneline main..feat/enterprise-improvement | head -10
git log --oneline main..feature/frontend-asset-optimization | head -10
git log --oneline main..fix-cicd-security | head -10
git log --oneline main..refactor/css-vars-group-2 | head -10
git log --oneline main..refactor/websocket-message-handler | head -10
git log --oneline main..feature/frontend-visual-upgrade | head -10
```

预期：输出每个分支领先 main 的提交列表。视觉升级分支应为空（因为已合到 main）；其他分支可能有遗留工作。

- [ ] **步骤 2：与用户确认每个分支处理方式**

向用户报告每个分支的状态（领先提交数、最后提交日期、内容摘要），让用户对每个分支选择：
- A. 已合并/已废弃 → 删除
- B. 有价值但暂不合并 → 保留
- C. 需要合并到 main → rebase 后合并

- [ ] **步骤 3：执行用户决策**

对于选择 A 的分支：

```powershell
git branch -D <branch-name>
git push origin --delete <branch-name>
```

对于选择 C 的分支：

```powershell
git checkout <branch-name>
git rebase main
# 解决冲突后
git checkout main
git merge <branch-name> --ff-only
git push origin main
git branch -D <branch-name>
```

- [ ] **步骤 4：验证 main 处于干净状态**

```powershell
git status
git log --oneline -5
```

预期：`nothing to commit, working tree clean`，main 在最新提交上。

---

## 阶段 1：修复 P1-16 DDL 重复

**目标：** 抽取 `init.ts` 和 `migrate.ts` 中 ~200 行重复 DDL 为共享 schema 模块。

### 任务 1.1：抽取共享 schema 模块

**文件：**
- 创建：`server/src/database/schema.ts`
- 修改：`server/src/database/init.ts`
- 修改：`server/src/database/migrate.ts`
- 测试：`server/tests/database/schema.test.ts`

- [ ] **步骤 1：阅读现有 DDL 重复部分**

```powershell
git diff --no-index server/src/database/init.ts server/src/database/migrate.ts
```

预期：看到 CREATE TABLE 语句在两个文件中完全重复。记录所有重复的表名（users / members / projects / pilots / applications / stats / activity_logs 等）。

- [ ] **步骤 2：编写 schema.ts 测试**

创建 `server/tests/database/schema.test.ts`：

```typescript
import { describe, it, expect } from '@jest/globals'
import { SCHEMA_SQL, TABLE_NAMES } from '../../src/database/schema.js'

describe('Database Schema', () => {
  it('SCHEMA_SQL 应为非空字符串', () => {
    expect(typeof SCHEMA_SQL).toBe('string')
    expect(SCHEMA_SQL.length).toBeGreaterThan(1000)
  })

  it('应包含所有核心表的 CREATE TABLE 语句', () => {
    for (const table of TABLE_NAMES) {
      const pattern = new RegExp(`CREATE TABLE.*${table}`, 'i')
      expect(SCHEMA_SQL).toMatch(pattern)
    }
  })

  it('应包含 IF NOT EXISTS 防止重复创建', () => {
    expect(SCHEMA_SQL).toMatch(/CREATE TABLE IF NOT EXISTS/i)
  })

  it('TABLE_NAMES 应包含至少 7 个核心表', () => {
    expect(TABLE_NAMES.length).toBeGreaterThanOrEqual(7)
    expect(TABLE_NAMES).toContain('users')
    expect(TABLE_NAMES).toContain('members')
    expect(TABLE_NAMES).toContain('projects')
    expect(TABLE_NAMES).toContain('pilots')
    expect(TABLE_NAMES).toContain('applications')
    expect(TABLE_NAMES).toContain('stats')
    expect(TABLE_NAMES).toContain('activity_logs')
  })
})
```

- [ ] **步骤 3：运行测试验证失败**

```powershell
cd server
npm test -- schema.test
```

预期：FAIL，报错 `Cannot find module '../../src/database/schema.js'`。

- [ ] **步骤 4：创建 schema.ts**

将 `init.ts` 中所有 `CREATE TABLE` 语句抽取到 `server/src/database/schema.ts`：

```typescript
/**
 * @file 数据库 Schema 定义
 * @description 集中管理所有表的 DDL，供 init.ts 和 migrate.ts 共享，避免重复
 * @module server/database/schema
 */

/**
 * 核心表名列表
 */
export const TABLE_NAMES = [
  'users',
  'members',
  'projects',
  'pilots',
  'applications',
  'stats',
  'activity_logs'
] as const

/**
 * 完整的数据库 Schema SQL
 * @description 包含所有表的 CREATE TABLE IF NOT EXISTS 语句
 *              使用 IF NOT EXISTS 确保幂等性
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('member', 'admin') DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 其余表的 DDL 从 init.ts 完整复制过来，保持一致
-- members / projects / pilots / applications / stats / activity_logs
`.trim()
```

- [ ] **步骤 5：运行测试验证通过**

```powershell
cd server
npm test -- schema.test
```

预期：PASS，4 个测试用例全部通过。

- [ ] **步骤 6：重构 init.ts 使用 schema.ts**

修改 `server/src/database/init.ts`，将重复的 DDL 替换为 import：

```typescript
import { SCHEMA_SQL } from './schema.js'

// 删除原有的 CREATE TABLE 字符串
// 改为：
async function initDatabase() {
  const statements = SCHEMA_SQL.split(';').filter(s => s.trim())
  for (const stmt of statements) {
    await connection.query(stmt)
  }
}
```

- [ ] **步骤 7：重构 migrate.ts 使用 schema.ts**

修改 `server/src/database/migrate.ts`，同样引用 `SCHEMA_SQL`：

```typescript
import { SCHEMA_SQL, TABLE_NAMES } from './schema.js'

// 在 Knex migration 之外保留 raw DDL 兜底
// 或将 Knex migration 改为基于 schema.ts 生成
```

- [ ] **步骤 8：运行完整后端测试验证无回归**

```powershell
cd server
npm test
```

预期：310 测试全部通过，无回归。

- [ ] **步骤 9：覆盖率检查**

```powershell
cd server
npm run test:coverage
```

预期：语句覆盖率 ≥ 63.86%（不下降），新增 schema.ts 100% 覆盖。

- [ ] **步骤 10：提交**

```powershell
git add server/src/database/schema.ts server/src/database/init.ts server/src/database/migrate.ts server/tests/database/schema.test.ts
git commit -m "refactor(database): 抽取共享 schema 模块消除 DDL 重复" -m "修复 P1-16：init.ts 和 migrate.ts 中 ~200 行重复 DDL 抽取到 schema.ts，新增 4 个测试用例。"
```

---

## 阶段 2：前端 API 前缀切换到 /api/v1

**目标：** 前端 http.js 从 `/api` 切换到 `/api/v1`，与后端版本化前缀对齐。

### 任务 2.1：切换 http.js API_BASE_URL

**文件：**
- 修改：`src/services/http.js:18`
- 修改：`.env.example:12`

- [ ] **步骤 1：修改 http.js API_BASE_URL**

将 `src/services/http.js:18` 的：

```javascript
const API_BASE_URL = '/api'
```

改为：

```javascript
const API_BASE_URL = import.meta.env.VITE_API_PREFIX || '/api/v1'
```

- [ ] **步骤 2：更新 .env.example 默认值**

将 `.env.example:12` 的：

```bash
VITE_API_PREFIX=/api
```

改为：

```bash
VITE_API_PREFIX=/api/v1
```

- [ ] **步骤 3：全局搜索硬编码 /api/ 引用**

```powershell
grep -rn "'/api/" src/ --include="*.js" --include="*.vue"
grep -rn '"/api/' src/ --include="*.js" --include="*.vue"
```

预期：列出所有硬编码 `/api/` 的位置。对于非 http.js 的引用，逐一改为通过 httpClient 调用或使用 `VITE_API_PREFIX`。

- [ ] **步骤 4：构建验证**

```powershell
npm run build
```

预期：构建成功，无报错。

- [ ] **步骤 5：前端测试验证**

```powershell
npm test
```

预期：所有前端测试通过。如果有测试硬编码 `/api`，需要同步更新。

- [ ] **步骤 6：本地端到端验证（可选，需启动后端）**

```powershell
# 终端 1：启动后端
cd server
npm run dev

# 终端 2：启动前端
npm run dev
```

访问 `http://localhost:3000`，打开开发者工具 Network 面板，确认所有 API 请求都走 `/api/v1/` 前缀。

- [ ] **步骤 7：提交**

```powershell
git add src/services/http.js .env.example
git commit -m "feat(services): 前端 API 前缀切换到 /api/v1" -m "完成 ROADMAP 第四阶段 4.1：http.js 从 /api 切换到 /api/v1，与后端版本化前缀对齐。"
```

---

## 阶段 3：数据源切换与本地全栈验证

**目标：** 在本地启动真实 MySQL + 后端，切换前端到 `VITE_USE_API=true`，验证全栈链路通畅。

### 任务 3.1：本地启动 MySQL 并初始化数据库

**文件：**
- 创建：`server/.env.development`（基于 `.env.example`）

- [ ] **步骤 1：安装本地 MySQL 8.0（如果未安装）**

下载地址：https://dev.mysql.com/downloads/installer/

安装时设置 root 密码，记录下来供后续使用。

或使用 Docker 单独启动 MySQL：

```powershell
docker run -d --name sc-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=your_local_password -e MYSQL_DATABASE=star_citizen_promotion -v sc-mysql-data:/var/lib/mysql mysql:8.0
```

预期：MySQL 服务在 `localhost:3306` 可访问。

- [ ] **步骤 2：创建 server/.env.development**

基于 `server/.env.example` 复制并填入本地实际值：

```bash
cp server/.env.example server/.env.development
```

编辑 `server/.env.development`，设置：

```bash
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# 使用本地 MySQL 凭据
JWT_SECRET=dev-secret-at-least-32-characters-long-aaaa
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<你的本地 MySQL root 密码>
DB_NAME=star_citizen_promotion
DB_CONNECTION_LIMIT=10

ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=debug
LOG_FILE_ENABLED=true
```

- [ ] **步骤 3：初始化数据库表结构**

```powershell
cd server
npm run db:init
```

预期：输出"数据库初始化完成"，无报错。在 MySQL 客户端验证：

```powershell
docker exec -it sc-mysql mysql -uroot -p -e "USE star_citizen_promotion; SHOW TABLES;"
```

预期：列出 7 张表（users / members / projects / pilots / applications / stats / activity_logs）。

- [ ] **步骤 4：填充种子数据**

```powershell
cd server
npm run db:seed
```

预期：输出"种子数据填充完成"。验证：

```powershell
docker exec -it sc-mysql mysql -uroot -p -e "USE star_citizen_promotion; SELECT COUNT(*) FROM members; SELECT COUNT(*) FROM pilots; SELECT COUNT(*) FROM projects;"
```

预期：每张表都有数据。

### 任务 3.2：启动后端验证 API 可用

**文件：** 无

- [ ] **步骤 1：启动后端开发服务器**

```powershell
cd server
npm run dev
```

预期：输出"Server running on port 3001"，无报错。

- [ ] **步骤 2：测试健康检查端点**

```powershell
curl http://localhost:3001/health
```

预期：返回 `{"status":"ok",...}` JSON。

- [ ] **步骤 3：测试公开 API**

```powershell
curl http://localhost:3001/api/v1/stats
curl http://localhost:3001/api/v1/pilots
curl http://localhost:3001/api/v1/members
```

预期：每个端点返回 `{"success":true,"data":...}` 格式 JSON，包含种子数据。

- [ ] **步骤 4：测试注册接口**

```powershell
curl -X POST http://localhost:3001/api/v1/auth/register -H "Content-Type: application/json" -d '{"username":"testadmin","email":"test@example.com","password":"TestPass123!"}'
```

预期：返回 `{"success":true,"data":{"user":{...}}}` 并设置 httpOnly Cookie。

- [ ] **步骤 5：登录并测试认证接口**

```powershell
# 登录（保存 Cookie）
curl -c cookies.txt -X POST http://localhost:3001/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"TestPass123!"}'

# 使用 Cookie 访问认证接口
curl -b cookies.txt http://localhost:3001/api/v1/auth/me
```

预期：登录成功，`/auth/me` 返回当前用户信息。

- [ ] **步骤 6：将测试用户提升为管理员**

```powershell
docker exec -it sc-mysql mysql -uroot -p -e "UPDATE star_citizen_promotion.users SET role='admin' WHERE email='test@example.com';"
```

### 任务 3.3：切换前端到真实 API

**文件：**
- 创建：`.env.development`（基于 `.env.example`）

- [ ] **步骤 1：创建前端 .env.development**

```bash
cp .env.example .env.development
```

编辑 `.env.development`，关键设置：

```bash
VITE_APP_ENV=development
VITE_SERVER_PORT=3000
VITE_API_PREFIX=/api/v1
VITE_BACKEND_URL=http://localhost:3001
VITE_USE_API=true
```

- [ ] **步骤 2：启动前端开发服务器**

```powershell
npm run dev
```

预期：Vite 启动，监听 `http://localhost:3000`。

- [ ] **步骤 3：浏览器验证全链路**

打开 `http://localhost:3000`，操作并验证：

| 页面 | 操作 | 预期 |
|---|---|---|
| 首页 | 查看 | 统计数据从 API 加载（不再用静态数据） |
| 飞行员 | 查看 | 显示种子数据中的飞行员 |
| 成员 | 查看 | 显示种子数据中的成员 |
| 项目 | 查看 | 显示种子数据中的项目 |
| 舰队 | 查看 | 舰船数据来自 `shipDatabase.js`（本地静态，正常） |
| 登录 | 用 test@example.com / TestPass123! 登录 | 登录成功，跳转到 Profile |
| Profile | 查看 | 显示当前用户信息 |
| 管理后台 | 访问 /admin | 显示管理界面（因为已提升为 admin） |

- [ ] **步骤 4：检查 Network 面板**

打开开发者工具 Network 面板，确认：
- 所有 API 请求走 `/api/v1/` 前缀
- 请求带 Cookie（`withCredentials` 生效）
- 无 CORS 错误
- 无 401 / 500 错误

- [ ] **步骤 5：运行 E2E 测试（可选）**

```powershell
npx playwright install  # 首次运行需要
npm run test:e2e
```

预期：5 个 spec 全部通过。如果失败，记录失败场景供后续修复。

- [ ] **步骤 6：提交环境配置**

注意：`.env.development` 不应提交到 git（已在 .gitignore），仅提交 `.env.example` 的更新。

```powershell
git status
# 确认 .env.development 未被追踪
git add .env.example  # 如果有更新
git commit -m "chore(config): 完成本地全栈验证环境配置" -m "VITE_USE_API=true + VITE_API_PREFIX=/api/v1，本地全栈链路验证通过。"
```

---

## 阶段 4：内容生成与素材准备

**目标：** 替换占位文案为可信的中文示例内容，准备舰船占位图说明文档，让网站具备"可对外展示"的内容基础。

### 任务 4.1：生成战队介绍与首页内容

**文件：**
- 修改：`src/config/site.config.js`
- 修改：`src/data/siteContent.js`

- [ ] **步骤 1：阅读现有站点配置**

```powershell
cat src/config/site.config.js
```

记录所有需要填写的字段：站点名称、Discord、QQ 群、首页 hero 文案、导航菜单等。

- [ ] **步骤 2：编写可信的示例文案**

示例战队设定（可由用户后续替换为真实信息）：

```javascript
// src/config/site.config.js 关键字段示例
siteInfo: {
  name: '深空先锋舰队',  // 示例战队名
  description: '专注星际公民宇宙探索与团队作战的中文玩家舰队',
  discord: 'https://discord.gg/your-invite-code',
  qqGroup: '123456789',
  github: 'https://github.com/your-fleet',
  email: 'fleet@example.com'
},
home: {
  hero: {
    title: '深空先锋舰队',
    subtitle: '探索 · 征服 · 守护',
    tagline: '面向星际公民玩家的专业中文舰队，招募活跃飞行员与探索者'
  }
}
```

- [ ] **步骤 3：将示例文案写入 site.config.js**

打开 `src/config/site.config.js`，将所有 `your-xxx`、占位符替换为上述示例值。保留 `discord.gg/your-invite-code` 等明显占位（提醒用户后续替换）。

- [ ] **步骤 4：更新 siteContent.js 静态数据**

修改 `src/data/siteContent.js` 中的 `teamStats`、`acePilots`、`members`、`projects` 数组，提供 5-8 条可信的中文示例数据。例如：

```javascript
export const teamStats = [
  { label: '舰队成员', value: '128', icon: 'users' },
  { label: '现役飞行员', value: '64', icon: 'plane' },
  { label: '累计任务', value: '1,247', icon: 'flag' },
  { label: '舰队成立', value: '2024.06', icon: 'calendar' }
]

export const acePilots = [
  {
    id: 'p1',
    name: '李昂',
    callsign: 'Ghost',
    ship: 'F7C-M Super Hornet',
    description: '前职业电竞选手，空战经验丰富，擅长能量管理格斗',
    missions: 247,
    kills: 89,
    status: 'active'
  }
  // ... 共 6 条
]

export const members = [
  {
    id: 'm1',
    name: '阿瑞斯',
    role: '舰队司令',
    intro: '星际公民 5 年老玩家，组织过 30+ 大型舰队行动',
    status: 'active'
  }
  // ... 共 6 条
]

export const projects = [
  {
    id: 'pr1',
    name: 'Pyro 星系首探',
    period: '2026.05 - 进行中',
    description: '组织 12 名飞行员完成 Pyro 星系首次系统性探索',
    status: 'active',
    progress: 75,
    participants: 12
  }
  // ... 共 4 条
]
```

- [ ] **步骤 5：同步更新 server/src/database/seed.ts**

修改 `server/src/database/seed.ts`，将种子数据中的占位英文内容替换为与 `siteContent.js` 一致的中文示例数据。确保前端走 API 时也能看到相同内容。

- [ ] **步骤 6：重新运行种子数据**

```powershell
cd server
npm run db:reset
```

预期：清空并重新填充种子数据，无报错。

- [ ] **步骤 7：构建与测试验证**

```powershell
npm run build
npm test
```

预期：构建成功，测试通过。

- [ ] **步骤 8：提交**

```powershell
git add src/config/site.config.js src/data/siteContent.js server/src/database/seed.ts
git commit -m "feat(content): 生成可信的中文示例内容" -m "替换 site.config / siteContent / seed.ts 中的占位符，提供 8 名成员、6 名飞行员、4 个项目的示例数据。用户可在上线前替换为真实信息。"
```

### 任务 4.2：舰船图片素材说明文档

**文件：**
- 创建：`docs/IMAGE_ASSETS_GUIDE.md`

- [ ] **步骤 1：创建图片素材指南**

```markdown
# 舰船图片素材指南

## 当前状态
- 12 艘舰船使用程序化生成的 .webp 占位图（深空 HUD 风格）
- 路径：`public/images/ships/{slug}.webp`
- 风格：侧 45° 角、冷白侧光、青色边缘光、琥珀指示灯

## 替换为真实渲染图的步骤
1. 从 RSI 官网媒体包或社区创作者获取授权图片
2. 保持文件名与 `src/data/shipDatabase.js` 中的 slug 一致
3. 推荐尺寸：1920×1080 或 1600×900
4. 推荐格式：.webp（质量 85）
5. 替换 `public/images/ships/{slug}.webp`

## 版权注意事项
- 星际公民是 Cloud Imperium Games (CIG) 的 IP
- RSI 官网媒体包允许粉丝站点用于非商业用途，需注明版权
- 商业用途需联系 CIG 获得授权
- 建议：上线时在页脚添加"Star Citizen 是 CIG 的商标，本站为非官方粉丝站点"
```

- [ ] **步骤 2：提交**

```powershell
git add docs/IMAGE_ASSETS_GUIDE.md
git commit -m "docs: 添加舰船图片素材替换指南"
```

---

## 阶段 5：云服务器部署

**目标：** 选择云服务商 + 域名 + 部署 Docker Compose 全栈到公网服务器。

### 任务 5.1：选购云服务器与域名（用户操作）

**文件：** 无

- [ ] **步骤 1：选择云服务商**

推荐选项（按性价比排序，2026 年中国市场）：

| 服务商 | 推荐配置 | 月费 | 适合 |
|---|---|---|---|
| 阿里云 ECS | 2 核 4G + 3M 带宽 | ¥80-150 | 国内访问快，需备案 |
| 腾讯云轻量服务器 | 2 核 4G + 4M 带宽 | ¥60-100 | 国内访问快，需备案 |
| Vultr / Hetzner | 2 核 4G + 4TB 流量 | $6-12/月 | 海外访问，无需备案 |
| Cloudflare Workers + R2 | 无服务器 | $0-5/月 | 静态站点 + 边缘加速 |

向用户确认选择，并完成购买。本计划后续以"阿里云 ECS + 已备案域名"为例。

- [ ] **步骤 2：购买并备案域名**

推荐注册商：阿里云万网、腾讯云、Namesilo（海外）。

域名建议：
- 短而易记：如 `sc-fleet.cn`、`deep-spacefleet.com`
- 与战队名一致：与 `site.config.js` 中的 `siteInfo.name` 呼应

如果使用国内服务器，必须完成 ICP 备案（约 7-20 个工作日）。海外服务器无需备案。

- [ ] **步骤 3：配置 DNS 解析**

在域名注册商后台添加 A 记录：

```
类型: A
主机: @（或 www）
值: <服务器公网 IP>
TTL: 600
```

验证解析：

```powershell
nslookup your-domain.com
```

预期：返回服务器公网 IP。

### 任务 5.2：服务器初始化

**文件：**
- 创建：`deploy/server-setup.sh`（服务器初始化脚本，可选）

- [ ] **步骤 1：SSH 登录服务器**

```powershell
ssh root@your-server-ip
```

- [ ] **步骤 2：安装 Docker 与 Docker Compose**

```bash
# Ubuntu/Debian
apt update && apt install -y curl git
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
docker --version
docker compose version
```

预期：Docker 与 Compose 已安装。

- [ ] **步骤 3：创建部署用户（非 root）**

```bash
adduser deploy
usermod -aG docker deploy
su - deploy
```

- [ ] **步骤 4：克隆代码仓库**

```bash
cd /home/deploy
git clone https://github.com/MomoDaviluke/star-citizen-promotion.git
cd star-citizen-promotion
```

- [ ] **步骤 5：创建生产环境配置文件**

```bash
cp .env.example .env.production
cp server/.env.example server/.env.production
```

编辑 `.env.production`：

```bash
VITE_APP_ENV=production
VITE_API_PREFIX=/api/v1
VITE_BACKEND_URL=https://your-domain.com
VITE_USE_API=true
```

编辑 `server/.env.production`：

```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# 生成强随机 JWT_SECRET（至少 32 字符）
JWT_SECRET=$(openssl rand -base64 48)

DB_HOST=mysql  # Docker 内部网络
DB_PORT=3306
DB_USER=app_user
DB_PASSWORD=<生成强随机密码>
DB_ROOT_PASSWORD=<生成更强的随机密码>
DB_NAME=star_citizen_promotion
DB_CONNECTION_LIMIT=20

ALLOWED_ORIGINS=https://your-domain.com

LOG_LEVEL=info
LOG_FILE_ENABLED=true
```

- [ ] **步骤 6：创建 docker-compose.prod.yml（覆盖默认配置）**

可选：直接使用 `docker-compose --profile production` 启动。但建议创建独立的 `docker-compose.prod.yml` 简化命令：

```yaml
# docker-compose.prod.yml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    restart: unless-stopped
    env_file:
      - server/.env.production
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - ./server/data:/app/server/data
      - ./logs:/app/logs
    networks:
      - sc-network

  mysql:
    image: mysql:8.0
    restart: unless-stopped
    env_file:
      - server/.env.production
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - sc-network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./dist:/usr/share/nginx/html:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - backend
    networks:
      - sc-network

  certbot:
    image: certbot/certbot:v2.6.0
    restart: unless-stopped
    volumes:
      - ./certbot/www:/var/www/certbot
      - ./ssl:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew --quiet; sleep 12h & wait $${!}; done'"

  backup:
    image: mysql:8.0
    restart: unless-stopped
    env_file:
      - server/.env.production
    volumes:
      - ./backups:/backups
    entrypoint: >
      sh -c '
      while true; do
        mysqldump -h mysql -u root -p"$${DB_ROOT_PASSWORD}" \
          --single-transaction --routines --triggers \
          "$${DB_NAME}" | gzip > /backups/backup_$$(date +%Y%m%d_%H%M%S).sql.gz
        find /backups -name "backup_*.sql.gz" -mtime +30 -delete
        sleep 86400
      done'
    depends_on:
      mysql:
        condition: service_healthy

volumes:
  mysql_data:

networks:
  sc-network:
    driver: bridge
```

- [ ] **步骤 7：首次构建镜像**

```bash
docker compose -f docker-compose.prod.yml build
```

预期：构建 frontend-builder / backend-builder / production 三阶段，无报错。

- [ ] **步骤 8：首次启动 MySQL 并初始化数据库**

```bash
docker compose -f docker-compose.prod.yml up -d mysql
# 等待 MySQL 健康
docker compose -f docker-compose.prod.yml exec mysql mysql -uroot -p -e "SHOW DATABASES;"

# 初始化表结构
docker compose -f docker-compose.prod.yml exec backend npm run db:init
# 填充种子数据
docker compose -f docker-compose.prod.yml exec backend npm run db:seed
```

预期：数据库表创建完成，种子数据填充成功。

- [ ] **步骤 9：创建初始管理员账号**

通过 API 注册第一个用户：

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@your-domain.com","password":"StrongAdminPass123!"}'
```

然后在 MySQL 中提升为 admin：

```bash
docker compose -f docker-compose.prod.yml exec mysql mysql -uroot -p -e \
  "UPDATE star_citizen_promotion.users SET role='admin' WHERE email='admin@your-domain.com';"
```

### 任务 5.3：申请 SSL 证书并启动 HTTPS

**文件：** 无

- [ ] **步骤 1：临时修改 nginx.conf 监听 80 端口**

注释掉 nginx.conf 中 443 ssl 块，仅保留 80 端口的 ACME 挑战路径。

- [ ] **步骤 2：启动 nginx 仅监听 80**

```bash
docker compose -f docker-compose.prod.yml up -d nginx
```

- [ ] **步骤 3：申请 Let's Encrypt 证书**

```bash
docker run -it --rm \
  -v /home/deploy/star-citizen-promotion/certbot/www:/var/www/certbot \
  -v /home/deploy/star-citizen-promotion/ssl:/etc/letsencrypt \
  certbot/certbot:v2.6.0 certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@your-domain.com \
  --agree-tos \
  --no-eff-email \
  -d your-domain.com \
  -d www.your-domain.com
```

预期：证书生成在 `./ssl/live/your-domain.com/` 目录。

- [ ] **步骤 4：恢复 nginx.conf 443 配置并重启**

确保 `nginx.conf` 中：

```nginx
ssl_certificate /etc/nginx/ssl/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/live/your-domain.com/privkey.pem;
```

替换原有的 `ssl_certificate /etc/nginx/ssl/fullchain.pem;` 路径。

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

- [ ] **步骤 5：验证 HTTPS 可访问**

```powershell
# 在本地执行
curl -I https://your-domain.com
curl https://your-domain.com/api/v1/health
```

预期：返回 200 OK，证书有效。

- [ ] **步骤 6：完整启动所有服务**

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

预期：所有服务状态为 `running` 或 `healthy`。

- [ ] **步骤 7：提交部署配置到仓库**

```powershell
git add docker-compose.prod.yml
git commit -m "feat(deploy): 添加生产环境 docker-compose 配置"
git push origin main
```

注意：`.env.production`、`ssl/`、`certbot/`、`backups/`、`logs/` 应在 .gitignore 中。

---

## 阶段 6：备份、监控与运维收尾

**目标：** 验证自动备份 / 配置基础监控 / 文档化运维流程。

### 任务 6.1：验证数据库自动备份

**文件：** 无

- [ ] **步骤 1：手动触发一次备份**

```bash
docker compose -f docker-compose.prod.yml exec backup sh -c \
  'mysqldump -h mysql -u root -p"$DB_ROOT_PASSWORD" --single-transaction --routines --triggers "$DB_NAME" | gzip > /backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql.gz'
```

- [ ] **步骤 2：验证备份文件**

```bash
ls -lh /home/deploy/star-citizen-promotion/backups/
```

预期：看到 `manual_backup_YYYYMMDD_HHMMSS.sql.gz` 文件，大小 > 0。

- [ ] **步骤 3：验证备份恢复流程**

```bash
# 解压并查看备份内容
gunzip -c /home/deploy/star-citizen-promotion/backups/manual_backup_*.sql.gz | head -50

# 在测试数据库中恢复
docker compose -f docker-compose.prod.yml exec mysql mysql -uroot -p -e \
  "CREATE DATABASE sc_restore_test;"
gunzip < /home/deploy/star-citizen-promotion/backups/manual_backup_*.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T mysql mysql -uroot -p sc_restore_test

# 验证恢复的数据
docker compose -f docker-compose.prod.yml exec mysql mysql -uroot -p sc_restore_test -e \
  "SELECT COUNT(*) FROM members;"

# 清理测试数据库
docker compose -f docker-compose.prod.yml exec mysql mysql -uroot -p -e \
  "DROP DATABASE sc_restore_test;"
```

预期：恢复成功，数据条数与生产一致。

### 任务 6.2：配置 Prometheus 指标监控

**文件：**
- 修改：`server/src/middleware/metrics.ts`（确认 IP 白名单）
- 修改：`nginx.conf`（可选：暴露 /metrics 端点）

- [ ] **步骤 1：配置 metrics IP 白名单**

在 `server/.env.production` 中添加：

```bash
METRICS_ENABLED=true
METRICS_ALLOWED_IPS=127.0.0.1,::1
```

- [ ] **步骤 2：通过 SSH 隧道安全访问 metrics**

```bash
# 在本地执行
ssh -L 9091:localhost:3001 root@your-server-ip
# 然后访问 http://localhost:9091/metrics
```

预期：看到 Prometheus 格式的指标输出。

- [ ] **步骤 3：（可选）部署 Grafana**

如果需要可视化监控，添加 Grafana 服务到 docker-compose.prod.yml：

```yaml
grafana:
  image: grafana/grafana:latest
  restart: unless-stopped
  ports:
    - "127.0.0.1:3000:3000"
  volumes:
    - grafana_data:/var/lib/grafana
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=<强密码>
  networks:
    - sc-network
```

注：Grafana 仅绑定到 127.0.0.1，通过 SSH 隧道访问，不暴露到公网。

### 任务 6.3：日志轮转验证

**文件：** 无

- [ ] **步骤 1：验证日志轮转配置**

```bash
docker compose -f docker-compose.prod.yml exec backend ls -la /app/logs/
```

预期：看到按日期命名的日志文件（如果配置了 winston-daily-rotate-file）。

- [ ] **步骤 2：验证日志内容**

```bash
docker compose -f docker-compose.prod.yml exec backend tail -50 /app/logs/combined.log
```

预期：看到结构化 JSON 日志，包含 requestId、timestamp、level、message 字段。

### 任务 6.4：编写运维手册

**文件：**
- 创建：`docs/OPERATIONS.md`

- [ ] **步骤 1：编写运维手册**

```markdown
# 运维手册

## 服务器信息
- 服务器 IP: <填入实际 IP>
- 域名: <填入实际域名>
- SSH 用户: deploy
- 部署目录: /home/deploy/star-citizen-promotion

## 常用命令

### 服务管理
```bash
docker compose -f docker-compose.prod.yml ps           # 查看服务状态
docker compose -f docker-compose.prod.yml logs -f      # 实时日志
docker compose -f docker-compose.prod.yml restart backend  # 重启后端
docker compose -f docker-compose.prod.yml down         # 停止所有服务
docker compose -f docker-compose.prod.yml up -d        # 启动所有服务
```

### 数据库
```bash
# 进入 MySQL
docker compose -f docker-compose.prod.yml exec mysql mysql -uroot -p

# 手动备份
docker compose -f docker-compose.prod.yml exec backup sh -c \
  'mysqldump -h mysql -u root -p"$DB_ROOT_PASSWORD" --single-transaction "$DB_NAME" | gzip > /backups/manual_$(date +%Y%m%d).sql.gz'

# 恢复备份
gunzip < /backups/backup_YYYYMMDD.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T mysql mysql -uroot -p "$DB_NAME"
```

### 证书续期
```bash
# 手动续期（自动续期由 certbot 容器处理）
docker compose -f docker-compose.prod.yml exec certbot certbot renew
docker compose -f docker-compose.prod.yml restart nginx
```

### 更新部署
```bash
cd /home/deploy/star-citizen-promotion
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## 故障排查
- 502 Bad Gateway → 检查 backend 容器健康状态
- 数据库连接失败 → 检查 mysql 容器健康状态 + .env.production 凭据
- HTTPS 证书过期 → 检查 certbot 容器日志
- 磁盘满 → 检查 logs/ 和 backups/ 目录，清理旧文件
```

- [ ] **步骤 2：提交运维手册**

```powershell
git add docs/OPERATIONS.md
git commit -m "docs: 添加生产环境运维手册"
git push origin main
```

---

## 阶段 7：上线前最终验证

**目标：** 按"可验证条件"清单逐项确认，确保达到可上线状态。

### 任务 7.1：上线前检查清单

**文件：** 无

- [ ] **步骤 1：代码层验证**

```powershell
# 本地执行
git status                                    # 工作区干净
git log --oneline -10                         # 最近提交符合规范
npm run lint                                  # ESLint 无错误
npm run build                                 # 构建成功
cd server && npm run typecheck && cd ..       # TypeScript 编译无错
npm test                                      # 前端测试通过
cd server && npm test && cd ..                # 后端测试通过
```

- [ ] **步骤 2：部署层验证**

```bash
# 服务器执行
docker compose -f docker-compose.prod.yml ps  # 所有服务 healthy
docker compose -f docker-compose.prod.yml logs --tail=50 backend  # 无错误日志
```

- [ ] **步骤 3：功能层验证（浏览器访问 https://your-domain.com）**

按以下清单逐项验证：

| 页面 | 操作 | 预期结果 |
|---|---|---|
| 首页 | 访问 | Hero 区显示，统计数据从 API 加载 |
| 团队介绍 | 访问 | 显示成员列表（来自 API） |
| 飞行员 | 访问 | 显示飞行员列表（来自 API） |
| 项目 | 访问 | 显示项目列表（来自 API） |
| 舰队 | 访问 | 12 艘舰船卡片正常显示 |
| 舰船详情 | 点击任意舰船 | 跳转到 /fleet/:slug 详情页 |
| 活动日历 | 访问 | 显示日历界面 |
| 加入我们 | 访问 | 申请表单可填写 |
| 联系我们 | 访问 | 联系信息显示 |
| 注册 | 用新邮箱注册 | 注册成功，跳转登录 |
| 登录 | 用管理员账号登录 | 登录成功，跳转 Profile |
| 管理后台 | 访问 /admin | 显示管理界面 |
| PWA | 浏览器安装按钮 | 可安装为 PWA |

- [ ] **步骤 4：安全层验证**

```powershell
# 在本地执行
# HTTPS 证书有效性
curl -vI https://your-domain.com 2>&1 | grep -E "subject|issuer|expire"

# 安全头检查
curl -I https://your-domain.com | grep -E "Strict-Transport|X-Frame|X-Content|Content-Security"

# API 限流测试（连续请求 100+ 次）
for ($i=1; $i -le 110; $i++) { curl -o /dev/null -s -w "%{http_code}\n" https://your-domain.com/api/v1/stats }
```

预期：
- 证书有效，颁发机构为 Let's Encrypt
- 安全头全部存在
- 前 100 次返回 200，之后返回 429

- [ ] **步骤 5：性能层验证（可选）**

使用 Google PageSpeed Insights：
- 访问 https://pagespeed.web.dev/?url=https://your-domain.com
- 目标：性能分数 ≥ 70

- [ ] **步骤 6：监控层验证**

```bash
# 服务器执行
# Prometheus 指标可访问
docker compose -f docker-compose.prod.yml exec backend wget -qO- http://localhost:3001/metrics | head -20

# 日志在写入
docker compose -f docker-compose.prod.yml exec backend ls -la /app/logs/
```

- [ ] **步骤 7：备份验证**

```bash
# 等待自动备份执行（或手动触发）
ls -lh /home/deploy/star-citizen-promotion/backups/
```

预期：至少有一个 .sql.gz 备份文件，大小 > 0。

### 任务 7.2：上线宣告

**文件：** 无

- [ ] **步骤 1：将站点信息更新到真实值**

如果之前用的是阶段 4 的示例内容，现在替换为真实战队信息：
- 修改 `src/config/site.config.js` 中的 Discord/QQ 群/邮箱
- 重新构建并部署：

```bash
cd /home/deploy/star-citizen-promotion
git pull  # 如果是从本地提交并 push 后
# 或者直接在服务器编辑后构建
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

- [ ] **步骤 2：在战队社群公告上线**

准备一段宣告文案，发到战队 Discord/QQ 群：

```
🚀 我们的舰队官网正式上线了！

🌐 网址：https://your-domain.com
✨ 特色：
- 完整的舰队展示与成员介绍
- 舰队详情数据库（12 艘主力舰船）
- 在线招募申请
- 活动日历
- PWA 支持（可安装到桌面/手机）

欢迎所有星际公民玩家访问、加入！
```

---

## 自检结果

### 1. 规格覆盖度

| 用户需求 | 对应阶段/任务 |
|---|---|
| 域名 + 云托管 | 阶段 5（任务 5.1、5.2、5.3） |
| 全栈跑通 | 阶段 3（任务 3.1、3.2、3.3） |
| 完成技术债 | 阶段 1（P1-16 DDL 重复）+ 阶段 2（API v1 切换）+ 阶段 0（分支清理） |
| 切到真实 MySQL+API | 阶段 3（任务 3.1、3.2）+ 阶段 5（任务 5.2） |
| 协助生成内容 | 阶段 4（任务 4.1、4.2） |
| HTTPS + 备份 + 监控 | 阶段 5（任务 5.3）+ 阶段 6 |

无遗漏。

### 2. 占位符扫描

扫描全文，识别并修复以下潜在占位符：
- `<your-domain.com>` / `your-domain.com` —— 用户需替换为实际域名（已在阶段 5.1 步骤 2 说明）
- `<服务器公网 IP>` —— 同上
- `<你的本地 MySQL root 密码>` —— 用户本地配置
- `<生成强随机密码>` —— 已给出 `openssl rand` 命令
- `<强密码>` —— 同上

所有 `<...>` 都是用户在执行时需要填入的实际值，已在步骤中说明生成方法，不算计划缺陷。

### 3. 类型一致性

- `VITE_API_PREFIX` 在 `.env.example`、`src/services/http.js`、阶段 2、阶段 3、阶段 5 中一致使用
- `VITE_USE_API` 在 `src/services/dataService.js`、阶段 3、阶段 5 中一致使用
- `docker-compose.prod.yml` 服务名（backend / mysql / nginx / certbot / backup）与各阶段引用一致
- `DB_ROOT_PASSWORD` / `DB_PASSWORD` 在 docker-compose.prod.yml 和 .env.production 中一致

无类型不一致问题。

---

## 执行路径概览

| 阶段 | 任务数 | 关键交付 | 阻塞条件 |
|---|---|---|---|
| 0 | 2 | 工作区干净 + 分支决策完成 | 无 |
| 1 | 1 | P1-16 DDL 重复修复 | 阶段 0 完成 |
| 2 | 1 | 前端 API 前缀切到 /api/v1 | 阶段 1 完成 |
| 3 | 3 | 本地全栈真实 MySQL 链路验证 | 阶段 2 完成 |
| 4 | 2 | 中文示例内容 + 图片素材指南 | 阶段 3 完成 |
| 5 | 3 | 公网域名 + HTTPS 上线 | 阶段 4 完成 + 用户购买服务器 |
| 6 | 4 | 备份/监控/运维手册 | 阶段 5 完成 |
| 7 | 2 | 上线前最终验证 + 宣告 | 阶段 6 完成 |

**关键外部依赖：**
- 阶段 5.1：用户需购买云服务器 + 域名 + 完成备案（如选国内）
- 阶段 7.2：用户需提供真实战队信息（Discord/QQ 群/邮箱等）
