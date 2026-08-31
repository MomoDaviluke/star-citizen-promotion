<div align="center">

# 🚀 星际公民战队宣传网站 · Stellar Nexus

**企业级全栈项目 · 前后端 1337 个测试用例全通过 · AI 招募官 Agent + MCP 工具调用全链路实测 · v1.8.0**

*面向星际公民玩家的专业团队门户 — 科幻风格 UI · RAG 语义检索 · SSE 流式对话 · 完整可观测性*

[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Vitest](https://img.shields.io/badge/前端测试-591✓-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Jest](https://img.shields.io/badge/后端测试-656✓-C21325?style=flat-square&logo=jest)](https://jestjs.io/)
[![Playwright](https://img.shields.io/badge/E2E-9_spec-45ba4c?style=flat-square&logo=playwright)](https://playwright.dev/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

[功能特性](#-项目简介) ·
[AI 能力](#-ai-能力) ·
[技术架构](#-技术架构) ·
[快速开始](#-快速开始) ·
[测试体系](#-测试体系) ·
[配置指南](#-配置指南) ·
[部署方案](#-部署方案)

</div>

---

## 📖 项目简介

**Stellar Nexus（星渊枢纽）** 是一个面向星际公民（Star Citizen）玩家公会的全栈宣传与招募平台，单人开发者按企业级标准打造。

前端采用 Vue 3 + Vite 8 的科幻风格 SPA（MFD 面板式 UI / GSAP 动效 / PWA 离线支持），后端为 Express 4 + TypeScript 三层架构（Routes → Services → Database），AI 层基于 **pgvector RAG + 通用槽位制 LLM 配置**，实现对话式招募官与知识库语义检索。

### 核心数据（v1.8.0 实测）

| 指标 | 数值 |
|:-----|:-----|
| 后端测试 | **64 套件 / 721 用例** 100% 通过（Jest） |
| 前端测试 | **616 用例** 100% 通过（Vitest） |
| 前端覆盖率门禁 | **65%** 四项统一门禁（实测语句 69.35% / 行 70.41% / 分支 69.55% / 函数 68.00%） |
| 后端覆盖率 | 语句 84.22% / 分支 81.33% / 函数 89.44%（**MCP 模块 97.85%** / AI 模块 94.97%） |
| E2E | **9 个 spec**（含 real-backend 真实往返、admin CRUD 往返、AI 招募官链路） |
| ESLint / TypeScript | 0 错误 |
| 高危安全漏洞 | 0 |

### 核心亮点

| 特性 | 说明 |
|:-----|:-----|
| 🏗️ **分层架构** | Routes → Services → Database 严格分层；knex 迁移版本化 + schema 单一来源 |
| 🧪 **测试防线** | 单测 1337 + E2E 9 spec + 覆盖率门禁（随覆盖率上调，49→55→60→65 已四档）；真实路由守卫/AI 链路/转化流/MCP 工具调用全覆盖 |
| 🤖 **AI 招募官** | RAG 语义检索（pgvector）+ SSE 流式对话 + 用户画像提取与申请表预填，全链路实测（入库幂等 / 检索带相似度 / 125 token 流式） |
| 🔧 **MCP 工具调用** | Model Context Protocol 标准子集：Agent 循环 + 3 个实时数据工具 + JSON-RPC 2.0 HTTP 端点，外部 MCP 客户端可直接接入 |
| 🔌 **AI-SLOT 槽位制** | 聊天/嵌入两个通用 OpenAI 兼容槽位，DeepSeek/豆包/Ollama/vLLM 任意端点自由指向，降级链自动跳过未配置槽位 |
| 🔐 **安全加固** | httpOnly Cookie JWT、bcrypt、Helmet、速率限制、输入校验、日志脱敏、生产弱密钥拒绝 |
| 📊 **自研监控** | 后端资源采集（CPU/RSS/事件循环）+ 分级告警引擎（冷却去重/升级）+ Webhook 通知（企微/钉钉/飞书）+ 前端问题回报 |
| 📈 **转化埋点** | 申请漏斗 8 事件白名单埋点（表单进入/提交成功/失败/AI 预填），数据驱动招募优化 |
| 🎨 **科幻 UI 体系** | CSS 变量设计系统 + CI lint 守护、GSAP ScrollTrigger 动效、MFD 面板组件、亮暗双主题 |
| 🐳 **容器化** | Docker 多阶段构建、compose 编排（MySQL/Redis/pgvector/Nginx/certbot）、每日自动备份 |

---

## 🤖 AI 能力

### 招募官 Agent（全链路已实测）

```
用户提问 → RAG 检索（pgvector 余弦相似度）→ Prompt 组装 → LLM 生成 → SSE 流式返回
                                              ↓
                                    画像提取（玩法偏好/技能等级/时间投入）
                                              ↓
                                    申请表自动预填（?ai_profile= 传递）
```

- **语义检索**：舰船/活动/公会信息 5 类知识源自动入库（`ai:ingest` 幂等），检索结果带相似度分数
- **流式对话**：SSE 逐 token 返回（实测 125 token），AD-11：`fetch + ReadableStream` 手动解析
- **画像提取**：多轮对话自动构建用户画像，一键预填申请表
- **零成本嵌入**：本地 Ollama bge-m3（1024 维），云端仅付费聊天 token

### MCP 工具调用（v1.8.0 新增）

标准 **Model Context Protocol** 实现（2024-11-05 规范核心子集），Agent 具备实时数据查询能力：

```
用户提问 → Agent 决策轮（是否需要工具）
              ↓ 需要
        <tool_call> → MCP Client → tools/call → Service 层查询
              ↓ 工具结果
        <tool_result> 回填 → 继续生成 → SSE 流式回答
```

- **内置工具**：`query_fleet`（舰船查询）/ `get_fleet_stats`（舰队统计）/ `query_events`（近期活动），全部走 Service 层、参数钳制、异常兜底
- **协议端点**：`POST /api/v1/mcp`（JSON-RPC 2.0：initialize / tools/list / tools/call），外部 MCP 客户端可直接对接
- **Agent 端点**：`POST /api/v1/ai/agent/chat`（SSE，事件含 `token` / `tool_call` 工具轨迹）
- **传输层抽象**：进程内 InProcessTransport 直连，未来可无缝切换独立 MCP 进程
- **优雅降级**：MCP 不可用自动退化为纯 LLM 链路；工具失败错误回填、对话不中断；轮次上限防连环调用

### AI-SLOT 槽位制配置

```bash
# 聊天槽位：DeepSeek / 豆包 / vLLM / 任意 OpenAI 兼容端点
LLM_CHAT_API_KEY=sk-xxx
LLM_CHAT_BASE_URL=https://api.deepseek.com/v1
LLM_CHAT_MODEL=deepseek-chat

# 嵌入槽位：本地 Ollama（零 API 成本）或其他 embeddings 服务
LLM_EMBED_API_KEY=ollama
LLM_EMBED_BASE_URL=http://localhost:11434/v1
LLM_EMBEDDING_MODEL=bge-m3
```

> 不配置任何 key 时服务正常启动，AI 端点优雅降级为"服务不可用"（预期行为，非故障）。

---

## ✨ 功能特性

### 🎮 玩家端

- **沉浸式科幻 UI** — 网格背景/光晕/扫描线/MFD 面板式组件，GSAP ScrollTrigger 滚动叙事动效
- **舰船图鉴与舰队展示** — 内置舰船数据库、详情页、分类筛选（E2E 已覆盖）
- **活动日历** — 月历/列表双视图、活动报名/取消、管理员创建/编辑/删除（CRUD 全覆盖）
- **入队申请** — 表单实时校验、成功面板、AI 招募官画像一键预填、转化埋点全程追踪
- **PWA 离线支持** — Service Worker 缓存、离线回退页、安装提示
- **亮暗双主题** — CSS 变量设计系统（CI lint 守护 0 断裂），`prefers-reduced-motion` 无障碍

### 🛡️ 管理端

- **仪表盘** — 站点统计、快捷操作入口
- **成员/飞行员/项目管理** — 完整 CRUD（弹窗式 create+edit，全链路可用）
- **申请审核** — 状态筛选/关键词搜索/分页/详情弹窗，审核操作实时同步列表与弹窗
- **系统监控面板** — CPU/RSS/事件循环实时指标、告警列表认领、前端问题回报按 requestId 串联
- **RBAC 权限** — 用户/管理员两级角色，路由守卫 + API 双层校验

### ⚙️ 工程化

- **测试防线** — 前后端 1337 用例 + E2E 9 spec；覆盖率门禁随实测四档上调（49→55→60→65）
- **CI/CD 流水线** — GitHub Actions：lint / 前后端测试（MySQL service 容器）/ 安全审计 / 构建 / E2E / CodeQL
- **依赖安全** — `npm audit --omit=dev` 门禁 + overrides 锁定传递依赖修复（js-yaml、nanoid 均有实战）
- **可观测性** — Prometheus 指标、Sentry 错误追踪、requestId 全链路日志、Swagger 文档
- **数据安全** — 每日自动备份（保留 30 天）、备份恢复流程已演练
- **文档体系** — 16+ 份文档：架构决策表（AD）/ 技术债编号（TD）/ 教训标签库（SEC/ARCH/QUAL/DBG）

---

## 🛠️ 技术架构

### 技术栈总览

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx 反向代理                        │
│                    (负载均衡 / Gzip / 静态资源)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│    前端 (Vue 3)   │    │  后端 (Express+TS)│
│                  │    │                  │
│  Vue Router      │◄──►│  JWT 认证中间件    │
│  GSAP 动效       │    │  告警引擎+通知     │
│  PWA 离线        │    │  Winston 日志     │
│  Vitest 591✓     │    │  Jest 656✓       │
└──────────────────┘    └────────┬─────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
        ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐
        │  MySQL 8.0   │ │  Redis 7    │ │ PostgreSQL+pgvec │
        │  (11 表主库)  │ │ (缓存/会话) │ │ (AI 向量知识库)   │
        └──────────────┘ └─────────────┘ └────────┬─────────┘
                                                  │
                                        ┌─────────┴─────────┐
                                        │  AI-SLOT 槽位层    │
                                        │ chat→LLM 云端      │
                                        │ embed→Ollama 本地  │
                                        └───────────────────┘
```

### 前端技术栈

| 技术 | 版本 | 用途 |
|:-----|:-----|:-----|
| Vue.js | 3.5 | 渐进式 JavaScript 框架 |
| Vue Router | 5.0 | 官方路由管理器 |
| Vite | 8.x | 下一代前端构建工具 |
| Vitest | 4.x | 单元测试框架 |
| Playwright | 1.58 | 端到端测试框架 |
| ESLint | 9.x | 代码质量检查 |
| @vue/test-utils | 2.4 | Vue 组件测试工具 |
| GSAP | 3.x | ScrollTrigger 滚动动效引擎 |
| vite-plugin-pwa | latest | PWA 离线支持（Service Worker 自动生成） |
| Sentry | latest | 前端错误监控 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|:-----|:-----|:-----|
| Node.js | ≥20.0 | JavaScript 运行时 |
| Express.js | 4.21 | Web 应用框架 |
| MySQL2 | 3.12 | MySQL 数据库驱动（连接池） |
| Knex.js | latest | SQL 查询构建器 & 迁移工具 |
| jsonwebtoken | 9.0 | JWT 令牌签发与验证 |
| bcryptjs | 2.4 | 密码哈希加密 |
| Helmet | 8.0 | HTTP 安全头设置 |
| Winston | 3.17 | 企业级结构化日志 |
| express-rate-limit | 7.5 | API 速率限制 |
| express-validator | 7.2 | 请求数据校验 |
| ws | 8.18 | WebSocket 实时通信 |
| pg | 8.x | PostgreSQL 驱动（pgvector 向量检索） |
| ioredis | 5.x | Redis 客户端（LLM 缓存/会话存储） |
| OpenAI 兼容 SDK 层 | 自研 | AI-SLOT 槽位制 Provider（chat/embed/降级链） |
| Jest | 29.7 | 后端测试框架 |
| Supertest | 7.0 | HTTP 接口测试 |
| Prometheus | latest | 应用性能监控指标 |
| Swagger | OpenAPI 3.0 | API 文档自动生成 |
| Sentry | latest | 前端错误监控 |

---

## 📁 项目结构

```
star-citizen-promotion/
├── .github/workflows/          # CI/CD 配置
│   └── ci.yml                  # GitHub Actions 流水线
├── docs/                       # 项目文档 (16+ 份)
├── e2e/                        # Playwright E2E 测试（9 spec / 60 用例）
│   ├── navigation.spec.js      # 导航骨架
│   ├── home.spec.js            # 首页渲染
│   ├── fleet.spec.js           # 舰队列表/筛选/详情跳转
│   ├── join.spec.js            # 入队申请流
│   ├── apply.spec.js           # 申请提交
│   ├── auth.spec.js            # 认证流程
│   ├── admin.spec.js           # Admin 登录 + 成员 CRUD 往返
│   ├── recruiter.spec.js       # AI 招募官对话/预填链路
│   └── real-backend.spec.js    # 真实后端往返验证
├── public/                     # 静态资源
├── server/                     # ===== 后端服务 =====
│   └── src/
│       ├── config/                 # 配置
│       │   ├── index.ts                # 统一配置加载
│       │   └── swagger.ts              # Swagger 文档配置
│       ├── routes/                 # 路由层（路由定义 + 中间件编排）
│       │   ├── admin.ts                # 管理员操作
│       │   ├── ai.ts                   # AI 服务（health / retrieve / 招募官会话）
│       │   ├── applications.ts         # 申请管理
│       │   ├── auth.ts                 # 用户认证
│       │   ├── events.ts               # 活动管理
│       │   ├── fleet.ts                # 舰队管理
│       │   ├── members.ts              # 成员管理
│       │   ├── pilots.ts               # 飞行员管理
│       │   ├── projects.ts             # 项目管理
│       │   ├── settings.ts             # 站点设置
│       │   └── stats.ts                # 统计数据
│       ├── services/               # 业务逻辑层
│       │   ├── authService.ts          # 认证服务（注册/登录/令牌）
│       │   ├── ai/                     # AI 服务（LLM Provider / RAG / 招募官 Agent）
│       │   ├── memberService.ts        # 成员服务
│       │   ├── pilotService.ts         # 飞行员服务
│       │   ├── projectService.ts       # 项目服务
│       │   ├── applicationService.ts   # 申请服务
│       │   ├── fleetService.ts         # 舰队服务
│       │   ├── eventService.ts         # 活动服务
│       │   ├── settingsService.ts      # 站点设置服务
│       │   └── statsService.ts         # 统计服务
│       ├── middleware/             # Express 中间件
│       │   ├── auth.ts                 # JWT 认证 (async/await)
│       │   ├── cache.ts                # HTTP 缓存 (TTL + ETag)
│       │   ├── auditLogger.ts          # 审计日志
│       │   ├── errorHandler.ts         # 统一错误处理
│       │   ├── metrics.ts              # Prometheus 指标
│       │   ├── pagination.ts           # 分页解析
│       │   ├── requestId.ts            # 请求关联 ID
│       │   ├── requestLogger.ts        # 请求日志 (Winston)
│       │   └── validator.ts            # 输入校验
│       ├── database/               # 数据库管理
│       │   ├── pool.ts                 # MySQL 连接池 + queryWithTiming
│       │   ├── init.ts                 # 表结构初始化
│       │   ├── migrate.ts              # Knex.js 迁移
│       │   └── seed.ts                 # 种子数据
│       ├── utils/                  # 工具模块
│       │   ├── jwt.ts                  # JWT 工具函数
│       │   └── logger.ts               # Winston 日志配置
│       ├── websocket.ts            # WebSocket 服务端
│       └── index.ts                # Express 入口
├── src/                        # ===== 前端应用 =====
│   ├── components/             # Vue 组件
│   │   ├── ai/                     # AI 全息终端组件（招募官）
│   │   │   ├── RecruiterTerminal.vue    # 全息终端容器（全屏/浮层切换）
│   │   │   ├── HoloAvatar.vue           # 全息头像
│   │   │   ├── ChatStream.vue           # 流式对话（滚动节流 + ARIA live）
│   │   │   ├── QuickSuggestions.vue     # 快捷推荐气泡
│   │   │   └── ProfilePanel.vue         # 实时画像面板
│   │   ├── common/                 # 通用组件
│   │   │   ├── ErrorBoundary.vue       # 错误边界
│   │   │   ├── LoadingIndicator.vue    # 加载指示器
│   │   │   ├── PageTitle.vue           # 页面标题
│   │   │   └── PageTransition.vue      # 页面过渡动画
│   │   └── layout/                 # 布局组件
│   │       ├── SiteHeader.vue          # 站点头部导航
│   │       └── SiteFooter.vue          # 站点底部
│   ├── composables/            # 组合式函数
│   │   ├── useAiRecruiter.js        # AI 招募官（SSE 流式 + 画像同步）
│   │   ├── useAI.js                # AI 任务管理 Hook
│   │   ├── useWebSocket.js          # WebSocket 封装
│   │   ├── useGSAPReveal.js         # 滚动动画
│   │   ├── useEffectQuality.js      # 特效分级
│   │   ├── usePwa.js                # PWA 生命周期
│   │   └── useTheme.js              # 主题切换
│   ├── config/                 # 前端配置
│   │   └── site.config.js          # 站点内容配置
│   ├── data/                   # 静态数据
│   │   └── siteContent.js          # 站点内容数据
│   ├── router/                 # 路由配置
│   │   └── index.js                # 路由定义与导航守卫
│   ├── services/               # 前端服务层
│   │   ├── AIService.js            # AI 服务（队列/并发/重试/监控）
│   │   ├── PriorityQueue.js        # 优先级队列（最大堆实现）
│   │   ├── ResourceMonitor.js      # 浏览器资源监控器
│   │   ├── authService.js          # 认证 API 调用
│   │   ├── dataService.js          # 数据服务（API/静态切换）
│   │   ├── wsService.js            # WebSocket 客户端
│   │   ├── http.js                 # HTTP 客户端封装
│   │   └── errorReporting.js       # Sentry 错误上报
│   ├── stores/                 # Pinia 状态管理
│   │   ├── auth.js                 # 认证状态
│   │   ├── calendar.js             # 日历状态
│   │   └── fleet.js                # 舰队状态
│   ├── styles/                 # 全局样式
│   │   ├── base.css                # 基础样式
│   │   ├── variables.css           # CSS 变量
│   │   ├── animations.css          # 动画定义
│   │   └── utilities.css           # 工具类
│   └── views/                  # 页面视图
│       ├── Home.vue                # 首页
│       ├── About.vue               # 团队介绍
│       ├── Members.vue             # 核心成员
│       ├── Projects.vue            # 活动项目
│       ├── Join.vue                # 加入我们
│       ├── Contact.vue             # 联系我们
│       ├── Login.vue               # 登录
│       ├── Register.vue            # 注册
│       ├── Profile.vue             # 个人中心
│       ├── ApplicationStatus.vue   # 申请状态
│       ├── Calendar.vue             # 活动日历
│       ├── Fleet.vue                # 舰队展示
│       ├── Offline.vue              # 离线页面 (PWA)
│       ├── NotFound.vue            # 404 页面
│       └── admin/                  # 管理后台
│           ├── AdminLayout.vue         # 后台布局
│           ├── Dashboard.vue           # 仪表盘
│           ├── MembersAdmin.vue        # 成员管理
│           ├── PilotsAdmin.vue         # 飞行员管理
│           ├── ProjectsAdmin.vue       # 项目管理
│           ├── ApplicationsAdmin.vue   # 申请审核
│           └── Settings.vue            # 系统设置
├── tests/                      # 前端测试
│   ├── components/                 # 组件测试
│   ├── composables/                # 组合式函数测试
│   ├── services/                   # 服务层测试
│   └── views/                      # 视图测试
├── Dockerfile                  # 多阶段 Docker 构建
├── docker-compose.yml          # 容器编排配置
├── nginx.conf                  # Nginx 反向代理配置
├── vitest.config.js            # Vitest 配置
├── playwright.config.js        # Playwright 配置
├── eslint.config.js            # ESLint 配置
└── vite.config.js              # Vite 构建配置
```

---

## 🚀 快速开始

### 环境要求

| 依赖 | 最低版本 | 推荐版本 |
|:-----|:---------|:---------|
| Node.js | 20.0 | 20.19+ |
| MySQL | 8.0 | 8.0 |
| PostgreSQL + pgvector | 15 | 16（AI RAG 知识库，可选） |
| npm | 9.0 | 10+ |

### 安装部署

```bash
# 1. 克隆项目
git clone https://github.com/MomoDaviluke/star-citizen-promotion.git
cd star-citizen-promotion

# 2. 安装前端依赖
npm install

# 3. 安装后端依赖
cd server && npm install && cd ..

# 4. 配置环境变量
cp .env.example .env.development
cp server/.env.example server/.env.development
# 编辑 .env 文件，填入实际的数据库连接信息和 JWT 密钥

# 5. 初始化数据库
cd server && npm run db:init && cd ..

# 6. 启动开发服务器
npm run dev                    # 前端 → http://localhost:5173
cd server && npm run dev       # 后端 → http://localhost:3001
```

### Docker 部署

```bash
# 使用 docker-compose 一键启动
docker-compose up -d

# 生产环境（含 Nginx 反向代理）
docker-compose --profile production up -d
```

---

## 🔍 核心模块解析

### 1. 三层架构设计

项目后端遵循 **Routes → Services → Database** 分层架构：

```
请求 → Route（路由定义、中间件编排）
         ↓
      Service（业务逻辑、数据访问、错误处理）
         ↓
      MySQL（连接池 + 参数化查询）
```

- **Route 层** — 负责 HTTP 路由定义、中间件组合（认证/校验/限流）、请求分发
- **Service 层** — 核心业务逻辑，直接调用数据库连接池执行 SQL，封装业务操作
- **Database 层** — MySQL2 连接池管理，提供 `query/queryOne/execute/transaction` 统一接口

### 2. AI 服务引擎

前端 AI 服务模块提供完整的异步任务管理能力：

```javascript
import { AIService, PRIORITY } from '@/services/AIService.js'

const aiService = new AIService({
  timeout: 30000,       // 任务超时 30s
  maxRetries: 3,        // 最大重试 3 次
  maxConcurrent: 3,     // 最大并发 3 个
  enableMonitoring: true // 启用资源监控
})

// 提交高优先级任务
const result = await aiService.submit(async ({ signal, onProgress }) => {
  onProgress(50)
  const response = await fetch('/api/data', { signal })
  return response.json()
}, { priority: PRIORITY.HIGH })
```

**核心能力：**

| 能力 | 实现方式 |
|:-----|:---------|
| 优先级调度 | 最大堆优先级队列（`PriorityQueue`），4 级优先级 |
| 并发控制 | 信号量机制，可配置最大并发数 |
| 超时处理 | `AbortController` + 可配置超时时间 |
| 自动重试 | 指数退避重试策略，可配置重试次数与延迟 |
| 资源监控 | `ResourceMonitor` 定期检测内存/CPU，超阈值触发预警 |
| 任务取消 | 支持 `AbortSignal` 取消正在执行的任务 |

**组合式函数封装：**

```javascript
import { useAI } from '@/composables/useAI.js'

const { isLoading, error, result, execute, cancel } = useAI()

const data = await execute(async ({ signal, onProgress }) => {
  onProgress(50)
  // 异步操作...
  return result
}, { priority: PRIORITY.CRITICAL })
```

### 3. 认证与安全体系

**JWT 认证流程：**

```
注册/登录 → Service 层验证 → 签发 JWT → 前端存储 Token
                                              ↓
后续请求 → Authorization: Bearer <token> → auth 中间件验证 → 注入 req.user
```

**安全措施：**

| 措施 | 实现 |
|:-----|:-----|
| 密码加密 | bcryptjs，可配置 salt rounds（默认 12） |
| JWT 签名 | HS256 算法，包含 issuer/subject 声明 |
| 令牌刷新 | 前端 HTTP 客户端自动检测 401 并刷新 |
| 安全头 | Helmet 中间件，配置 CSP / XSS 保护 / HSTS |
| CORS | 限定前端域名，支持 credentials |
| 速率限制 | 15 分钟窗口内最多 100 次请求 |
| 请求体限制 | JSON 100kb / URL-encoded 100kb |
| SQL 注入防护 | mysql2 参数化查询（`?` 占位符） |
| 用户数据脱敏 | `sanitizeUser()` 移除 password_hash / passwordHash |

**认证中间件：**

```javascript
// 强制认证
router.get('/profile', authenticate, handler)

// 可选认证（未登录不报错）
router.get('/public-data', optionalAuth, handler)

// 角色鉴权
router.delete('/admin/users', authenticate, requireRole('admin'), handler)
```

### 4. 统一错误处理

后端通过 `errorHandler` 中间件统一捕获并格式化错误响应，支持 HTTP 状态码和结构化错误信息：

```json
{
  "success": false,
  "message": "无效的认证令牌"
}
```

同时处理 `JsonWebTokenError`、`TokenExpiredError`、`ER_DUP_ENTRY` 等第三方错误。

### 5. 数据库连接池

```typescript
// 连接池配置（server/src/database/pool.ts）
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  connectionLimit: config.database.connectionLimit,
  waitForConnections: true,
  timezone: '+08:00',
  charset: 'utf8mb4'
})

// 统一查询接口
export async function query(sql, params)      // 返回行数组
export async function queryOne(sql, params)   // 返回单行或 null
export async function queryWithTiming(sql, params) // 带慢查询监控（500ms 阈值）
export async function transaction(callback)   // 事务支持
export function getPoolStatus()               // 连接池状态
export function closePool()                   // 优雅关闭
```

### 6. 前端 HTTP 客户端

```javascript
// src/services/http.js — 统一 HTTP 请求封装
import { httpClient } from '@/services/http.js'

// 自动附加 Authorization 头
// 401 时自动刷新令牌并重试
// 请求/响应统一错误处理
const response = await httpClient.get('/api/members')
const response = await httpClient.post('/api/auth/login', { email, password })
```

### 8. 错误边界组件

```vue
<template>
  <ErrorBoundary title="加载失败" message="数据获取异常，请稍后重试">
    <MyComponent />
  </ErrorBoundary>
</template>
```

捕获子组件渲染错误，提供重试与返回首页操作，支持显示错误详情。

---

## ⚙️ 配置指南

### 前端环境变量

在项目根目录创建 `.env.development` 文件：

```bash
# 应用基础
VITE_APP_ENV=development
VITE_APP_NAME=Star Citizen Promotion

# 后端服务地址
VITE_BACKEND_URL=http://localhost:3001

# AI 服务配置
VITE_AI_SERVICE_URL=http://localhost:3002
VITE_AI_TIMEOUT=30000
VITE_AI_MAX_RETRIES=3
VITE_AI_MAX_CONCURRENT=3

# WebSocket 配置
VITE_WS_URL=ws://localhost:3001/ws

# 数据源切换（true=API, false=静态数据）
VITE_USE_API=false
```

### 后端环境变量

在 `server/` 目录创建 `.env.development` 文件：

```bash
# 服务配置
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# JWT 配置
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# MySQL 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=star_citizen_promotion
DB_CONNECTION_LIMIT=10

# Bcrypt
BCRYPT_SALT_ROUNDS=12

# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# WebSocket
WS_PORT=3001

# AI 槽位制配置（AI-SLOT，可选）——OpenAI 兼容端点自由指向
# 聊天槽位：DeepSeek / 豆包 / vLLM / 任意兼容网关
LLM_CHAT_API_KEY=
LLM_CHAT_BASE_URL=https://api.deepseek.com/v1
LLM_CHAT_MODEL=deepseek-chat
# 嵌入槽位：本地 Ollama（bge-m3，1024 维）/ 其他 embeddings 服务
LLM_EMBED_API_KEY=ollama
LLM_EMBED_BASE_URL=http://localhost:11434/v1
LLM_EMBEDDING_MODEL=bge-m3
# pgvector 连接（AI 知识库，可选）
PGVECTOR_URL=postgres://app_user:app_password@localhost:5432/star_citizen_ai
```

#### AI 能力启用（可选）

AI 功能采用**槽位制**设计——不配置任何 key 时服务正常启动，AI 端点自动降级为"服务不可用"（非 bug）；配置后即可获得完整 RAG + 流式招募官能力：

```bash
# 1. 启动 pgvector（AI 向量知识库）
docker run -d --name sc-pgvector-dev -e POSTGRES_USER=app_user \
  -e POSTGRES_PASSWORD=app_password -e POSTGRES_DB=star_citizen_ai \
  -p 127.0.0.1:5432:5432 pgvector/pgvector:pg16

# 2. 启动本地嵌入模型（Ollama bge-m3，1024 维，零 API 成本）
ollama pull bge-m3

# 3. 建表 + 知识入库（幂等，可重复执行）
cd server && npm run ai:migrate && npm run ai:ingest

# 4. 验证
curl http://localhost:3001/api/v1/ai/health
curl -X POST http://localhost:3001/api/v1/ai/retrieve \
  -H "Content-Type: application/json" -d '{"question":"推荐一艘适合新手的战斗机"}'
```

### 站点内容定制

编辑 `src/config/site.config.js` 可快速定制站点信息：

```javascript
export const siteConfig = {
  siteInfo: {
    name: '星际公民团队站',
    description: '面向星际公民玩家的团队门户',
    discord: 'your-discord-invite',
    qqGroup: '123456789',
    github: 'https://github.com/your-org'
  },
  navigation: [
    { label: '首页', to: '/' },
    { label: '团队介绍', to: '/about' },
    // ...
  ],
  home: {
    hero: {
      title: '星际公民战队',
      subtitle: '官方招募站'
    }
  }
}
```

---

## 📡 API 接口文档

### 接口概览

> **接口基路径**: `/api/v1`（推荐，主版本 v1）+ `/api`（兼容前缀，标记弃用，建议迁移）。代码中 `API_VERSION` 常量控制（`server/src/index.ts`）。未来 v2 发布时通过添加 `/api/v2/` 逐步迁移。

| 方法 | 路径 | 说明 | 认证 |
|:-----|:-----|:-----|:-----|
| `POST` | `/api/auth/register` | 用户注册 | 否 |
| `POST` | `/api/auth/login` | 用户登录 | 否 |
| `GET` | `/api/auth/me` | 获取当前用户 | 是 |
| `GET` | `/api/stats` | 获取统计数据 | 否 |
| `GET` | `/api/pilots` | 飞行员列表 | 否 |
| `GET` | `/api/pilots/:id` | 飞行员详情 | 否 |
| `GET` | `/api/members` | 成员列表 | 否 |
| `GET` | `/api/members/:id` | 成员详情 | 否 |
| `GET` | `/api/projects` | 项目列表 | 否 |
| `GET` | `/api/projects/:id` | 项目详情 | 否 |
| `POST` | `/api/applications` | 提交申请 | 否 |
| `GET` | `/api/health` | 健康检查 | 否 |

### 请求/响应示例

**用户注册：**

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "pilot_ace",
  "email": "ace@example.com",
  "password": "SecurePass123!"
}
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "pilot_ace",
      "email": "ace@example.com",
      "role": "member"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**提交申请：**

```bash
POST /api/applications
Content-Type: application/json

{
  "name": "新飞行员",
  "email": "new@example.com",
  "gameId": "ACE-001",
  "experience": "3年",
  "reason": "热爱星际探索"
}
```

### 统一响应格式

```json
// 成功响应
{
  "success": true,
  "data": { ... }
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "无效的认证令牌"
  }
}
```

---

## 🧪 测试体系

### 测试架构

```
测试金字塔
    ┌─────────┐
    │  E2E 测试 │  ← Playwright（用户场景模拟）
    ├─────────┤
    │ 集成测试  │  ← Jest + Supertest（API 接口测试）
    ├─────────┤
    │ 单元测试  │  ← Vitest / Jest（模块逻辑测试）
    └─────────┘
```

### 测试统计

| 测试类型 | 框架 | 规模 | 覆盖范围 |
|:---------|:-----|:-------|:---------|
| 前端单元测试 | Vitest | **616 用例** | 服务层、组合式函数、真实路由守卫、Store、核心视图（含转化流）、AI 组件、监控面板 |
| 后端测试 | Jest + Supertest | **64 套件 / 721 用例** | API 接口、认证中间件、错误处理、仓储层、缓存、AI（Providers/RAG/招募官）、MCP（协议/工具/Agent）、监控告警 |
| E2E 测试 | Playwright | **9 spec / 60 用例** | 首页、加入流程、认证流程、申请流程、导航、船队、Admin CRUD 往返、AI 招募官、真实后端往返 |

### 覆盖率门禁（随覆盖率逐步上调）

| 指标 | 门禁 | 实测 |
|:-----|:-------|:-------|
| 前端语句/行/分支/函数 | **65%** 四项统一 | 69.35% / 70.41% / 69.55% / 68.00% |
| 后端语句 | ≥60% | 84.22%（MCP 模块 **97.85%** / AI 模块 94.97%） |

> 门禁规则（G4）：实测 ≥ 目标才允许上调，禁止"先调门禁再补测试"。历史：8% → 49 → 55 → 60 → 65。

### 运行测试

```bash
# 前端测试
npm test                    # 运行所有前端单元测试
npm run test:coverage       # 生成覆盖率报告
npm run test:e2e            # 运行 E2E 测试

# 后端测试
cd server
npm test                    # 运行所有后端测试
npm test -- --coverage      # 生成覆盖率报告

# 代码检查
npm run lint                # ESLint 检查
npm run lint:fix            # ESLint 自动修复
```

---

## 🚢 部署方案

### 方案一：Docker Compose（推荐）

```bash
# 开发环境
docker-compose up -d

# 生产环境（含 Nginx）
docker-compose --profile production up -d
```

Docker 采用多阶段构建：
1. `frontend-builder` — 安装依赖并构建前端产物
2. `backend-builder` — 安装后端依赖
3. `production` — 合并前后端产物，暴露端口

### 方案二：手动部署

```bash
# 前端构建
npm run build               # 产物输出到 dist/

# 后端启动
cd server
NODE_ENV=production node src/index.js
```

### 方案三：Nginx 反向代理

项目内置 `nginx.conf`，配置了：
- 前端静态资源服务（`try_files` SPA 路由回退）
- `/api` 请求代理到后端服务
- Gzip 压缩
- 健康检查端点

---

## 🔧 可用脚本

### 前端

| 命令 | 说明 |
|:-----|:-----|
| `npm run dev` | 启动开发服务器（http://localhost:3000） |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | ESLint 代码检查 |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm test` | 运行单元测试 |
| `npm run test:coverage` | 生成覆盖率报告 |
| `npm run test:e2e` | 运行 E2E 测试 |

### 后端

| 命令 | 说明 |
|:-----|:-----|
| `cd server && npm run dev` | 启动开发服务器（http://localhost:3001） |
| `cd server && npm start` | 启动生产服务器 |
| `cd server && npm test` | 运行测试 |
| `cd server && npm run db:init` | 初始化数据库表结构 |
| `cd server && npm run db:seed` | 填充种子数据 |

---

## ❓ 常见问题

### Q: 启动后端报数据库连接失败？

确保 MySQL 服务已启动，并检查 `server/.env.development` 中的数据库配置是否正确：

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=star_citizen_promotion
```

然后运行数据库初始化：

```bash
cd server && npm run db:init
```

### Q: 前端页面无法获取数据？

默认前端使用静态数据（`VITE_USE_API=false`）。如需从后端 API 获取数据，在 `.env.development` 中设置：

```bash
VITE_USE_API=true
VITE_BACKEND_URL=http://localhost:3001
```

并确保后端服务已启动。

### Q: 如何修改站点名称和内容？

编辑 `src/config/site.config.js`，可修改站点名称、导航菜单、首页内容等所有可配置项，无需修改组件代码。

### Q: 如何添加新的 API 接口？

遵循分层架构模式：

1. **Service** — 在 `server/src/services/` 新建服务文件，封装业务逻辑和数据库操作
2. **Route** — 在 `server/src/routes/` 新建路由文件，组合中间件（认证/校验/限流）并调用 Service
3. 在 `server/src/index.ts` 中注册路由

### Q: 如何运行 E2E 测试？

```bash
# 安装 Playwright 浏览器（首次运行）
npx playwright install

# 运行 E2E 测试
npm run test:e2e
```

### Q: Docker 部署时如何配置环境变量？

修改 `docker-compose.yml` 中的 `environment` 字段，或创建 `.env` 文件通过 `${VAR}` 引用：

```yaml
backend:
  environment:
    - JWT_SECRET=${JWT_SECRET:-change-me-in-production}
    - DB_PASSWORD=${DB_PASSWORD}
```

---

## 📄 文档体系

| 文档 | 说明 |
|:-----|:-----|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 系统架构设计 |
| [TECH_STACK.md](docs/guides/TECH_STACK.md) | 技术选型依据 |
| [CONFIG.md](docs/guides/CONFIG.md) | 配置参数说明 |
| [DEVELOPMENT.md](docs/guides/DEVELOPMENT.md) | 开发指南 |
| [API.md](docs/guides/API.md) | API 接口文档 |
| [DEPLOYMENT.md](docs/guides/DEPLOYMENT.md) | 部署指南 |
| [SECURITY.md](docs/guides/SECURITY.md) | 安全体系 |
| [MONITORING.md](docs/guides/MONITORING.md) | 监控与可观测性 |
| [CONTRIBUTING.md](docs/guides/CONTRIBUTING.md) | 贡献指南 |
| [ROADMAP.md](docs/ROADMAP.md) | 优化路线图 |
| [TESTING.md](docs/TESTING.md) | 测试指南 |
| [TODO.md](docs/TODO.md) | 待办任务与质量门禁 |
| [ENTERPRISE_IMPROVEMENTS.md](docs/reports/ENTERPRISE_IMPROVEMENTS.md) | 企业级改进报告 |
| [CHANGELOG.md](CHANGELOG.md) | 版本变更记录 |

---

## 📜 许可证

本项目采用 [MIT License](LICENSE) 许可证。

---

<div align="center">

**Made with ❤️ for Star Citizen Community**

</div>
