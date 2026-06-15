# 系统架构文档

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-06-15
> **版本**: v1.3.4
> **架构风格**: 分层架构 + 模块化前端

---

## 系统全景

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端层                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   桌面浏览器   │  │   移动浏览器   │  │   管理后台    │           │
│  │  (Chrome等)   │  │  (Safari等)   │  │  (Vue SPA)   │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────┼─────────────────────────────────────┐
│                         Nginx 反向代理                            │
│              (SSL终端 / 静态资源 / 负载均衡)                        │
└───────────────────────────┼─────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
┌─────────▼──────────┐            ┌───────────▼────────────┐
│      前端服务       │            │        后端服务         │
│   (Vue 3 + Vite)   │◄──────────►│   (Express + MySQL)    │
│     Port: 3000     │   REST     │     Port: 3001         │
└────────────────────┘            └───────────┬────────────┘
                                              │
                                    ┌─────────▼──────────┐
                                    │      MySQL 8.0      │
                                    │   (连接池: 默认 10)  │
                                    └────────────────────┘
```

---

## 前端架构

### 技术栈

| 层级 | 技术 | 版本 | 用途 |
|:---|:---|:---|:---|
| 框架 | Vue | 3.5 | 响应式 UI |
| 构建 | Vite | 8.x | 开发服务器 + 打包 |
| 路由 | Vue Router | 5.0 | SPA 导航 |
| 状态 | Pinia | 2.x | 全局状态管理 |
| HTTP | Axios | 1.x | API 请求 |
| 样式 | TailwindCSS | 3.x | 原子化 CSS |
| 动画 | GSAP | 3.x | 滚动动画 |
| 测试 | Vitest | 4.x | 单元测试 |
| E2E | Playwright | 1.58 | 端到端测试（5 个 spec） |

### 目录结构

```
src/
├── components/          # 组件
│   ├── ui/             # 基础 UI (MFDPanel, HoloCard, TechButton, ShipCard)
│   ├── common/         # 通用组件 (ErrorBoundary, LoadingIndicator, PageTitle, PageTransition)
│   ├── layout/         # 布局组件 (SiteHeader, SiteFooter)
│   └── effects/        # 特效组件 (StarfieldBg)
├── views/              # 页面组件
│   ├── Home.vue
│   ├── About.vue
│   ├── Members.vue
│   ├── Fleet.vue
│   ├── Join.vue
│   ├── Projects.vue
│   ├── Contact.vue
│   ├── Calendar.vue
│   ├── Login.vue
│   ├── Register.vue
│   ├── Profile.vue
│   ├── ApplicationStatus.vue
│   ├── Offline.vue
│   ├── NotFound.vue
│   └── admin/          # 管理后台
│       ├── AdminLayout.vue
│       ├── Dashboard.vue
│       ├── MembersAdmin.vue
│       ├── PilotsAdmin.vue
│       ├── ProjectsAdmin.vue
│       ├── ApplicationsAdmin.vue
│       └── Settings.vue
├── services/           # 服务层
│   ├── http.js         # Axios 实例 + 拦截器
│   ├── authService.js  # 认证 API
│   ├── dataService.js  # 数据获取 (静态 + API 回退)
│   ├── wsService.js    # WebSocket 单例
│   ├── AIService.js    # AI 服务（队列/并发/重试）
│   ├── fleetService.js # 舰队数据
│   └── calendarService.js # 日历数据
├── stores/             # Pinia 状态
│   ├── auth.js         # 认证状态
│   ├── calendar.js     # 日历状态
│   └── fleet.js        # 舰队状态
├── composables/        # 组合式函数
│   ├── useWebSocket.js # WebSocket 封装
│   ├── useGSAPReveal.js # 滚动动画
│   ├── useEffectQuality.js # 特效分级
│   ├── usePwa.js       # PWA 生命周期
│   ├── useTheme.js     # 主题切换
│   └── useAI.js        # AI 任务管理
├── router/             # 路由配置
│   └── index.js
├── config/             # 配置文件
│   └── site.config.js  # 站点元信息
├── utils/              # 工具函数
│   └── cdn.js          # CDN 路径转换
└── styles/             # 全局样式
    ├── base.css        # 基础样式
    ├── variables.css   # CSS 变量（设计 tokens）
    ├── animations.css  # 动画定义
    └── utilities.css   # 工具类
```

### 设计系统（v1.3.4 更新）

**色彩体系**：统一为星际蓝 `#4a9eff` 单色 accent 系统，废弃旧版 cyan+amber 双色体系。

| Token | 值 | 用途 |
|---|---|---|
| `--color-accent` | `#4a9eff` | 主 accent 色 |
| `--raw-cyan` | `#4a9eff`（别名） | 兼容旧引用，待迁移 |
| `--amber-primary` | → `--color-accent`（别名） | 兼容旧引用，待迁移 |
| `--nebula-purple` | 独立互补色 | HoloCard、exploration 标签 |
| `--color-status-warning` | amber 系 | 语义化警告色 |

**CSS 变量完整性**：`scripts/css-var-lint.mjs` 集成 CI，双层检查（broken→error / deprecated→warning）。当前 143 个定义、47 个别名、183 处 deprecated 引用待迁移。

**设计方向**：SpaceX 极简风格。Hero 全屏沉浸、一屏一焦点、留白为武器。详见 `docs/home-redesign-plan.md`。

### 状态管理

```
┌─────────────────────────────────────────┐
│              Pinia Store                 │
├─────────────────────────────────────────┤
│  auth.js                                │
│  ├── user: { id, username, role }       │
│  ├── isAuthenticated: boolean           │
│  ├── login(credentials)                 │
│  ├── logout()                           │
│  └── refreshToken()                     │
├─────────────────────────────────────────┤
│  calendar.js                            │
│  ├── events: Event[]                    │
│  ├── selectedDate: Date                 │
│  └── fetchEvents()                      │
├─────────────────────────────────────────┤
│  fleet.js                               │
│  ├── ships: Ship[]                      │
│  ├── activeShip: Ship                   │
│  └── fetchShips()                       │
└─────────────────────────────────────────┘
```

### 组件设计原则

#### UI 组件 (Presentational)

- 只接收 props，不直接访问 store
- 通过事件向上传递用户交互
- 示例: `MFDPanel`, `HoloCard`, `TechButton`

#### 业务组件 (Container)

- 连接 store 和 UI 组件
- 处理数据获取和状态更新
- 示例: `MemberList`, `FleetOverview`, `ApplicationTable`

### 路由设计

```javascript
// src/router/index.js
const routes = [
  { path: '/', component: Home, name: 'home' },
  { path: '/about', component: About, name: 'about' },
  { path: '/members', component: Members, name: 'members' },
  { path: '/fleet', component: Fleet, name: 'fleet' },
  { path: '/join', component: Join, name: 'join' },
  { path: '/projects', component: Projects, name: 'projects' },
  { path: '/contact', component: Contact, name: 'contact' },
  { path: '/calendar', component: Calendar, name: 'calendar' },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['admin', 'officer'] },
    children: [
      { path: '', component: AdminDashboard },
      { path: 'members', component: AdminMembers },
      { path: 'pilots', component: AdminPilots },
      { path: 'projects', component: AdminProjects },
      { path: 'applications', component: AdminApplications }
    ]
  }
];
```

---

## 后端架构

### 技术栈

| 层级 | 技术 | 版本 | 用途 |
|:---|:---|:---|:---|
| 框架 | Express | 4.x | Web 服务器 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 数据库 | MySQL | 8.0 | 关系型数据 |
| ORM | Knex.js | 3.x | 查询构建 + 迁移 |
| 认证 | JWT + bcrypt | — | 无状态认证（auth 中间件已改用 async/await 模式） |
| 校验 | express-validator | 7.x | 输入验证 |
| 日志 | winston | 3.x | 结构化日志 |
| 监控 | prom-client | 15.x | Prometheus 指标 |
| 文档 | swagger-jsdoc | 6.x | API 文档 |
| 测试 | Jest + Supertest | 29.x | 单元 + 集成测试 |

### 目录结构

```
server/src/
├── config/             # 配置
│   ├── index.ts        # 统一配置入口
│   └── swagger.ts      # Swagger 配置
├── routes/             # 路由层（路由定义 + 中间件编排）
│   ├── auth.ts         # 用户认证
│   ├── members.ts      # 成员管理
│   ├── fleet.ts        # 舰队管理
│   ├── pilots.ts       # 飞行员管理
│   ├── projects.ts     # 项目管理
│   ├── applications.ts # 申请管理
│   ├── events.ts       # 活动管理
│   ├── settings.ts     # 站点设置
│   ├── stats.ts        # 统计数据
│   └── admin.ts        # 管理员操作
├── services/           # 业务服务层
│   ├── authService.ts
│   ├── memberService.ts
│   ├── fleetService.ts
│   ├── pilotService.ts
│   ├── projectService.ts
│   ├── applicationService.ts
│   ├── eventService.ts
│   ├── settingsService.ts
│   ├── statsService.ts
│   └── index.ts
├── middleware/         # 中间件
│   ├── auth.ts         # JWT 认证（async/await 模式）
│   ├── cache.ts        # HTTP 缓存（TTL + ETag + 写失效）
│   ├── errorHandler.ts # 全局错误处理
│   ├── requestLogger.ts # 请求日志（Morgan + Winston 结构化）
│   ├── requestId.ts    # 请求关联 ID（UUID 生成）
│   ├── auditLogger.ts  # 审计日志（自动写操作拦截）
│   ├── metrics.ts      # Prometheus 指标收集
│   ├── pagination.ts   # 分页参数解析
│   └── validator.ts    # 输入校验
├── database/           # 数据库
│   ├── pool.ts         # 连接池 + queryWithTiming + 慢查询监控
│   ├── init.ts         # 初始化
│   ├── migrate.ts      # Knex.js 迁移
│   └── seed.ts         # 种子数据
├── utils/              # 工具函数
│   ├── logger.ts
│   └── jwt.ts
└── websocket.ts        # WebSocket 服务端
```

### 分层架构

```
┌─────────────────────────────────────────┐
│              路由层 (Routes)             │
│  职责: HTTP 路由定义、中间件编排           │
│  示例: POST /api/auth/login              │
├─────────────────────────────────────────┤
│           服务层 (Services)               │
│  职责: 业务逻辑、数据访问、错误处理         │
│  示例: authService.login(username, pass) │
├─────────────────────────────────────────┤
│           数据层 (Database)               │
│  职责: 连接池管理、SQL 执行、事务管理       │
│  示例: query('SELECT * FROM users...')   │
└─────────────────────────────────────────┘
```

### 请求处理流程

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Client │────►│    Nginx    │────►│   Express   │────►│   Router    │
└─────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                               │
                    ┌──────────────────────────────────────────┘
                    │
           ┌────────▼────────┐
           │   Middleware    │
           │  (auth, cache,  │
           │   rate, audit)  │
           └────────┬────────┘
                    │
           ┌────────▼────────┐
           │    Service      │
           │  (business logic)
           │  + 数据访问)     │
           └────────┬────────┘
                    │
           ┌────────▼────────┐
           │    Database     │
           │ (MySQL 连接池)   │
           └─────────────────┘
```

---

## 数据库设计

### 实体关系

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │   members   │       │    ships    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────┤ id (PK)     │       │ id (PK)     │
│ username    │  1:1  │ user_id (FK)│       │ name        │
│ password    │       │ callsign    │       │ manufacturer│
│ email       │       │ role        │       │ type        │
│ role        │       │ status      │       │ owner_id(FK)│
│ created_at  │       │ joined_at   │       └─────────────┘
└─────────────┘       └─────────────┘              │
                                                   │
┌─────────────┐       ┌─────────────┐              │
│  projects   │       │applications │              │
├─────────────┤       ├─────────────┤              │
│ id (PK)     │       │ id (PK)     │              │
│ name        │       │ user_id(FK) │──────────────┘
│ description │       │ ship_id(FK) │
│ status      │       │ status      │
│ lead_id(FK) │       │ applied_at  │
└─────────────┘       └─────────────┘
```

### 核心表

| 表名 | 说明 | 记录数 | 主要字段 |
|:---|:---|:---|:---|
| `users` | 用户账户 | ~100 | id, username, password, email, role, created_at |
| `members` | 战队成员 | ~50 | id, user_id, callsign, role, status, joined_at |
| `ships` | 飞船配置 | ~200 | id, name, manufacturer, type, owner_id, config |
| `projects` | 项目/任务 | ~20 | id, name, description, status, lead_id, deadline |
| `applications` | 入队申请 | ~500 | id, user_id, ship_id, status, applied_at, reviewed_at |
| `events` | 日历事件 | ~100 | id, title, description, start_time, end_time, created_by |
| `audit_logs` | 审计日志 | ~10000 | id, user_id, action, target, details, created_at |

### 索引设计

```sql
-- 用户查询优化
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 成员查询优化
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_role ON members(role);

-- 申请查询优化
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_applied_at ON applications(applied_at);

-- 事件查询优化
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_created_by ON events(created_by);
```

---

## API 设计

### 认证流程

```
┌─────────┐                                    ┌─────────┐
│  客户端  │ ── POST /api/auth/login ────────► │  服务端  │
│         │    { username, password }          │         │
│         │ ◄──── { token, user } ──────────── │         │
│         │                                    │         │
│         │ ── GET /api/user/profile ────────► │         │
│         │    Authorization: Bearer <token>   │         │
│         │ ◄──── { id, username, role } ───── │         │
│         │                                    │         │
│         │ ── POST /api/auth/refresh ───────► │         │
│         │ ◄──── { token } ────────────────── │         │
└─────────┘                                    └─────────┘
```

### API 端点概览

| 端点 | 方法 | 认证 | 说明 |
|:---|:---|:---|:---|
| `/api/auth/login` | POST | 否 | 用户登录 |
| `/api/auth/register` | POST | 否 | 用户注册 |
| `/api/auth/refresh` | POST | 是 | 刷新 Token |
| `/api/auth/logout` | POST | 是 | 用户登出 |
| `/api/user/profile` | GET | 是 | 获取用户信息 |
| `/api/user/profile` | PUT | 是 | 更新用户信息 |
| `/api/members` | GET | 否 | 获取成员列表 |
| `/api/members/:id` | GET | 否 | 获取成员详情 |
| `/api/members/:id` | PUT | 是 | 更新成员信息 |
| `/api/fleet` | GET | 否 | 获取舰队列表 |
| `/api/fleet/:id` | GET | 否 | 获取飞船详情 |
| `/api/fleet` | POST | 是 | 添加飞船 |
| `/api/projects` | GET | 否 | 获取项目列表 |
| `/api/projects` | POST | 是 | 创建项目 |
| `/api/applications` | GET | 是 | 获取申请列表 |
| `/api/applications` | POST | 否 | 提交申请 |
| `/api/applications/:id/approve` | POST | 是 | 审批通过 |
| `/api/applications/:id/reject` | POST | 是 | 审批拒绝 |
| `/api/events` | GET | 否 | 获取事件列表 |
| `/api/events` | POST | 是 | 创建事件 |
| `/api/admin/reset-db` | POST | 是(Admin) | 重置数据库 |
| `/api/admin/clear-cache` | POST | 是(Admin) | 清除缓存 |

### WebSocket 通信

```
┌─────────┐              ┌─────────┐
│  客户端  │ ◄──────────► │  服务端  │
│         │    connect   │         │
│         │ ── auth ───► │         │
│         │ ◄── ack ──── │         │
│         │              │         │
│         │ ◄── notification ──── │  广播通知
│         │ ── ping ───► │         │  心跳
│         │ ◄── pong ─── │         │
└─────────┘              └─────────┘
```

#### WebSocket 事件

| 事件 | 方向 | 说明 |
|:---|:---|:---|
| `auth` | Client → Server | 连接认证 |
| `notification` | Server → Client | 系统通知 |
| `application_update` | Server → Client | 申请状态更新 |
| `member_update` | Server → Client | 成员信息更新 |
| `ping` | Client → Server | 心跳检测 |
| `pong` | Server → Client | 心跳响应 |

---

## 安全架构

### 认证授权

```
┌─────────────────────────────────────────┐
│            JWT 认证流程                  │
├─────────────────────────────────────────┤
│  1. 登录成功 → 签发 access + refresh     │
│  2. 请求 API → 验证 access token         │
│  3. Token 过期 → 用 refresh 换取新 token │
│  4. refresh 过期 → 重新登录              │
└─────────────────────────────────────────┘
```

### Token 设计

| Token 类型 | 有效期 | 用途 | 存储位置 |
|:---|:---|:---|:---|
| Access Token | 15 分钟 | API 请求认证 | HTTP-only Cookie |
| Refresh Token | 7 天 | 换取 Access Token | HTTP-only Cookie |

### 权限模型 (RBAC)

| 角色 | 权限 | 可访问资源 |
|:---|:---|:---|
| `guest` | 浏览公开页面 | 首页、成员列表、舰队展示 |
| `member` | 查看成员信息、报名活动 | + 个人资料、活动报名 |
| `officer` | 管理成员、审批申请 | + 成员管理、申请审批 |
| `admin` | 全权限、系统管理 | + 系统设置、数据管理 |

### 权限检查流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │────►│  JWT Verify │────►│  Role Check │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                    │
                    ┌──────▼──────┐      ┌──────▼──────┐
                    │   Invalid   │      │  Forbidden  │
                    │   401       │      │   403       │
                    └─────────────┘      └─────────────┘
                           │                    │
                           └────────┬───────────┘
                                    │
                             ┌──────▼──────┐
                             │   Proceed   │
                             │   to API    │
                             └─────────────┘
```

### 安全防护层

```
┌─────────────────────────────────────────┐
│            安全层                        │
├─────────────────────────────────────────┤
│  Nginx                                  │
│  ├── HTTPS 强制跳转                      │
│  ├── HSTS 头                            │
│  ├── CSP 策略                           │
│  └── 限流 (Express: 100req/15min)       │
├─────────────────────────────────────────┤
│  Express                                │
│  ├── Helmet 安全头                       │
│  ├── CORS 白名单                         │
│  ├── 请求体大小限制 (100kb)              │
│  └── 输入验证 (express-validator)        │
├─────────────────────────────────────────┤
│  应用层                                  │
│  ├── SQL 注入防护 (参数化查询)            │
│  ├── XSS 防护 (输出转义)                 │
│  ├── JWT 签名验证                        │
│  └── 敏感操作审计日志                     │
└─────────────────────────────────────────┘
```

---

## 部署架构

### Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=star_citizen
      - DB_USER=root
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
      - MYSQL_DATABASE=star_citizen
    ports:
      - "3306:3306"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  mysql_data:
```

### 环境配置

| 环境 | 域名 | 数据库 | 调试模式 |
|:---|:---|:---|:---|
| 开发 | `localhost:3000` | `star_citizen_dev` | 开启 |
| 测试 | `localhost:3001` | `star_citizen_test` | 关闭 |
| 预发布 | `staging.example.com` | `star_citizen_staging` | 关闭 |
| 生产 | `www.example.com` | `star_citizen_prod` | 关闭 |

### CI/CD 流水线

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  Push   │──►│  Lint   │──►│  Test   │──►│  Build  │──►│ Deploy  │
│         │   │         │   │         │   │         │   │         │
│  main   │   │ ESLint  │   │ Jest    │   │ Docker  │   │ VPS     │
│ 分支    │   │ tsc     │   │ Vitest  │   │ image   │   │ 自动部署 │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
     │                                              │
     └────────────── 安全扫描 ───────────────────────┘
                    (npm audit)
```

### GitHub Actions 工作流

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: cd server && npm ci && npm run lint

  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: star_citizen_test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd server && npm ci && npm run test:coverage
      - run: npm ci && npm run test:coverage

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
      - run: cd server && npm audit --audit-level=high

  build:
    runs-on: ubuntu-latest
    needs: [lint, test, security]
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t star-citizen-web .
      - run: cd server && docker build -t star-citizen-api .

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: |
          echo "${{ secrets.SSH_KEY }}" > key.pem
          chmod 600 key.pem
          ssh -i key.pem user@server "cd /app && docker-compose pull && docker-compose up -d"
```

---

## 性能指标

### 当前性能

| 指标 | 目标 | 当前 | 状态 |
|:---|:---|:---|:---|
| 首屏加载 (FCP) | < 1.8s | ~1.5s | ✅ 达标 |
| 可交互时间 (TTI) | < 3.8s | ~2.5s | ✅ 达标 |
| API 响应 (P50) | < 100ms | ~80ms | ✅ 达标 |
| API 响应 (P95) | < 200ms | ~150ms | ✅ 达标 |
| API 响应 (P99) | < 500ms | ~300ms | ✅ 达标 |
| 数据库查询 (P95) | < 50ms | ~30ms | ✅ 达标 |
| 并发用户 | 1000 | 未测试 | ⚠️ 待验证 |
| 测试覆盖率 (后端) | ≥ 60% | 63.86% | ✅ 已达标 |
| 测试覆盖率 (前端) | ≥ 80% | ~60% | 📋 待提升 |

### 性能优化策略

| 策略 | 实施状态 | 效果 |
|:---|:---|:---|
| 代码分割 (Code Splitting) | ✅ 已实施 | 减少 30% 初始包体积 |
| 图片懒加载 | ✅ 已实施 | 减少首屏图片请求 |
| 数据库索引优化 | ✅ 已实施 | 查询性能提升 40% |
| 连接池配置 | ✅ 已实施 | 减少连接开销 |
| CDN 加速 | ✅ 已实施 | `cdnUrl()` + `VITE_CDN_BASE_URL` |
| 缓存策略 | ✅ 已实施 | TTL 内存缓存 + ETag + 写操作自动失效 |
| 数据库读写分离 | ❌ 未实施 | 高并发时必要 |

---

## 监控与日志

### 日志体系

| 层级 | 工具 | 输出 | 保留期 |
|:---|:---|:---|:---|
| 应用日志 | Winston | 文件 + Console | 30 天 |
| 访问日志 | Nginx | 文件 | 7 天 |
| 错误日志 | Sentry | 云端 | 90 天 |
| 审计日志 | MySQL | 数据库 | 1 年 |

### 日志格式

```json
{
  "timestamp": "2026-05-27T10:30:00.000Z",
  "level": "info",
  "message": "User login successful",
  "service": "star-citizen-api",
  "requestId": "req-123456",
  "userId": 42,
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "duration": 150,
  "path": "/api/auth/login",
  "method": "POST",
  "statusCode": 200
}
```

### 监控指标

| 指标 | 工具 | 告警阈值 |
|:---|:---|:---|
| CPU 使用率 | Prometheus | > 80% |
| 内存使用率 | Prometheus | > 85% |
| 磁盘使用率 | Prometheus | > 90% |
| API 错误率 | Prometheus | > 1% |
| API 响应时间 | Prometheus | P95 > 500ms |
| 数据库连接数 | Prometheus | > 40 |
| 活跃用户数 | Prometheus | — |

---

## 扩展性设计

### 水平扩展

```
                    ┌─────────────┐
                    │    Nginx    │
                    │   (LB)      │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
        │  Frontend │ │ Frontend │ │ Frontend │
        │   #1      │ │   #2     │ │   #N     │
        └─────┬─────┘ └────┬─────┘ └────┬─────┘
              │            │            │
        ┌─────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
        │  Backend  │ │ Backend  │ │ Backend  │
        │   #1      │ │   #2     │ │   #N     │
        └─────┬─────┘ └────┬─────┘ └────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼──────┐
                    │   MySQL     │
                    │  (Primary)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   MySQL     │
                    │  (Replica)  │
                    └─────────────┘
```

### 扩展点

| 组件 | 当前 | 扩展方案 |
|:---|:---|:---|
| 前端 | 单实例 | CDN + 多实例 |
| 后端 | 单实例 | 负载均衡 + 多实例 |
| 数据库 | 单节点 | 主从复制 + 读写分离 |
| 缓存 | 无 | Redis 缓存层 |
| 文件存储 | 本地 | 对象存储 (S3/OSS) |

---

## 故障处理

### 降级策略

| 场景 | 降级方案 | 影响 |
|:---|:---|:---|
| 数据库不可用 | 返回缓存数据或静态页面 | 部分数据可能过期 |
| API 超时 | 返回友好错误提示 | 功能暂时不可用 |
| 高并发 | 限流 + 队列 | 部分请求延迟 |
| 前端资源加载失败 | 显示基础 HTML 页面 | 失去交互功能 |

### 应急预案

| 故障 | 检测 | 响应 | 恢复 |
|:---|:---|:---|:---|
| 服务崩溃 | 健康检查失败 | 自动重启容器 | 检查日志修复 |
| 数据库连接池耗尽 | 监控告警 | 增加连接数/重启 | 优化查询 |
| 磁盘空间不足 | 监控告警 | 清理日志/扩容 | 设置自动清理 |
| 内存泄漏 | 内存持续增长 | 重启服务 | 代码修复 |

---

## 开发规范

### 代码风格

- **前端**: ESLint + Prettier，单引号，无分号，2 空格缩进
- **后端**: ESLint + Prettier，单引号，有分号，2 空格缩进
- **提交**: Conventional Commits 规范

### 分支策略

```
main (生产)
  │
  ├── develop (开发)
  │     │
  │     ├── feature/auth-improvement
  │     ├── feature/fleet-management
  │     └── bugfix/login-timeout
  │
  ├── hotfix/security-patch
  └── release/v1.3.1
```

### 提交规范

```
feat: 添加用户登录功能
fix(router): 修复页面跳转动画卡顿问题
docs: 更新README部署说明
refactor(services): 重构AI服务队列逻辑
perf: 优化首屏加载性能
test: 添加认证中间件测试
```
