# 项目优化路线图

> **项目**: Star Citizen 战队宣传网站
> **创建日期**: 2026-05-31
> **版本**: v1.3.1 → v1.6.0 路径规划
> **约束**: 单人开发，所有任务串行执行
> **原则**: 先补最短的板，再加固地基，最后做架构升级

---

## 当前状态

| 维度 | 现状 | 目标 | 差距 |
|:---|:---|:---|:---|
| 后端测试文件 | 26 个 / 39 个源码 | — | 13 个无直接测试 |
| 后端语句覆盖率 | 63.86% | ≥ 70% | +6.14% |
| 前端测试文件 | 34 个 / 78 个源码 | — | ~40 个无测试 |
| 前端估算覆盖率 | ~60% | ≥ 70% | +10% |
| E2E spec | 5 个 | ≥ 7 个 | +2 个 |
| 高危安全漏洞 | 0 | 0 | ✅ |
| 日志轮转 | 未配置 | 自动轮转 | 需实施 |
| 数据库备份 | 无 | 自动备份 | 需实施 |
| TypeScript | 仅后端 | 保持现状 | 前端暂不迁移 |

---

## 执行路线

一个人做项目，精力有限，必须聚焦高回报、低风险的任务。以下按执行顺序排列，每个阶段完成后才进入下一个。

```
紧急: Git 清理 + 前端测试修复（~2 天）
  ├── ~140 文件按功能拆分 commit
  ├── 修复 http.test.js / Home.test.js / wsService.test.js
  └── 验证生产构建

第一阶段: 快速补漏（~1 周）
  ├── 后端低覆盖率分支补测试
  └── 运维地基验证（备份恢复 / 日志轮转）

第二阶段: 前端测试加固（~2 周）
  ├── Service 层测试（calendarService / fleetService）
  ├── Store 测试（auth / calendar / fleet）
  ├── 核心 View 测试（Home / Members / Projects / Contact）
  └── E2E 扩展（+2 spec）

第三阶段: 安全架构（~3 天）
  ├── httpOnly Cookie JWT 迁移
  ├── CSRF 防护
  └── 密码策略增强

第四阶段: 按需推进
  ├── TypeScript 迁移（第二开发者加入时）
  ├── i18n（面向国际玩家时）
  └── Redis / Grafana（生产部署后）
```

---

## 紧急阶段: 代码审查修复（2026-06-08 深度审查发现）

**目标**: 修复 4 个 P0 严重问题 + 11 个 P1 高优先级问题
**耗时**: ~1 周
**为什么最优先**: P0 问题直接影响数据正确性和安全性，必须在其他工作之前修复。

### 0.1 P0 严重问题（必须立即修复）

| # | 问题 | 文件 | 修复方案 | 预计 |
|:---|:---|:---|:---|:---|
| 1 | 缓存键忽略查询参数 | `cache.ts:166` | `buildCacheKey` 加入排序后的 query string | 半天 |
| 2 | 申请路由缺少认证 | `routes/applications.ts:59` | `optionalAuth` → `authenticate` | 半天 |
| 3 | auth store 变量遮蔽 | `stores/auth.js:70,92,131,157` | catch 块改用 `errObj` 避免遮蔽 ref | 半天 |
| 4 | Login.vue 绕过 authStore | `views/Login.vue:185` | 改为调用 `authStore.login()` | 半天 |

### 0.2 P1 高优先级问题

| # | 问题 | 文件 | 修复方案 | 预计 |
|:---|:---|:---|:---|:---|
| 5 | 速率限制对已登录用户无效 | `index.ts:196` | 移除无效的 admin 提额逻辑，简化为 IP 限流 | 半天 |
| 6 | requireRole 重复查库 | `middleware/auth.ts:99` | 直接使用 `req.user.role`，不再查库 | 半天 |
| 7 | 登录 SELECT * 泄露密码哈希 | `authService.ts:80` | 明确列出字段，排除 password_hash | 半天 |
| 8 | WebSocket 心跳 O(n²) | `websocket.ts:158` | 添加 ws→clientId 反向映射 | 半天 |
| 9 | gracefulShutdown 逻辑缺陷 | `index.ts:347` | await server.close + setTimeout.unref | 半天 |
| 10 | vite loadEnv 空前缀 | `vite.config.js:30` | 改为 `'VITE_'` 前缀 | 10 分钟 |
| 11 | manualChunks 配置 | `vite.config.js:183` | 改为函数形式 | 10 分钟 |
| 12 | App.vue 无人消费的 provide | `App.vue:276` | 删除 provide 语句 | 10 分钟 |
| 13 | Home.vue 数据硬编码 | `Home.vue:263` | 统一数据源 | 半天 |
| 14 | metrics 端点无 catch | `metrics.ts:167` | 添加 .catch() 错误处理 | 10 分钟 |
| 15 | DDL 重复 | `init.ts` + `migrate.ts` | 抽取共享 schema 模块 | 半天 |

### 紧急阶段验收标准

- [ ] 4 个 P0 问题全部修复并通过测试
- [ ] 11 个 P1 问题全部修复
- [ ] 所有现有测试仍然通过（310 后端 + 前端 + E2E）
- [ ] 生产构建验证通过

---

## 第一阶段: 快速补漏

**目标**: 后端覆盖率从 63.86% → 70%+
**耗时**: ~1 周
**为什么先做这个**: 覆盖率是可量化的指标，补测试的投入产出比最高，且能直接提升代码信心。

### 1.1 websocket.ts（287 行，0% 覆盖）

这是最大的无覆盖模块，补完后对覆盖率贡献最大。

**需要覆盖的场景**:

| 场景 | 测试要点 |
|:---|:---|
| 连接认证 | 有效 JWT 连接成功、无 token 拒绝、过期 token 断开 |
| 心跳检测 | 30 秒 ping、超时断开、pong 重置计时器 |
| 消息路由 | broadcast 全局广播、sendToUser 定向推送 |
| 优雅关闭 | closeWebSocket 通知所有客户端 |

**实现思路**:
- 用 `ws` 库的客户端连接测试服务器
- Mock `jwt.verify` 和 `queryOne` 控制认证分支
- `jest.useFakeTimers()` 测试心跳超时
- 随机端口避免冲突

**预计**: 2~3 天

### 1.2 metrics.ts（170 行，0% 覆盖）

| 场景 | 测试要点 |
|:---|:---|
| 指标收集 | histogram 记录请求耗时、counter 递增 |
| IP 白名单 | 生产环境非白名单 IP 返回 403、CIDR 匹配 |
| 端点开关 | `METRICS_ENABLED=false` 返回 404 |

**预计**: 1~2 天

### 1.3 swagger.ts（50 行，0% 覆盖）

验证 OpenAPI 规范对象结构正确、servers 配置正确。

**预计**: 半天

### 1.4 低覆盖率分支补测

| 文件 | 未覆盖分支 | 测试 |
|:---|:---|:---|
| `errorHandler.ts` | 生产环境错误格式 | mock `config.nodeEnv = 'production'` |
| `fleetService.ts` | 空结果集 | mock 返回空数组 |
| `authService.ts` | DB 异常分支 | mock queryOne 抛异常 |

**预计**: 半天

### 第一阶段验收标准

- [ ] 后端语句覆盖率 ≥ 70%
- [ ] websocket.ts 覆盖率 ≥ 80%
- [ ] metrics.ts 覆盖率 ≥ 80%
- [ ] 所有现有测试仍然通过

---

## 第二阶段: 运维地基

**目标**: 生产环境基本安全保障
**耗时**: ~3 天
**状态**: ✅ 已完成
**为什么排第二**: 这些是上线前必须有的基础设施，没有日志轮转和备份，生产环境就是裸奔。

### 2.1 日志轮转

**问题**: Winston 文件日志没有大小限制，生产环境会撑爆磁盘。

**方案**: `winston-daily-rotate-file`，单文件 20MB，保留 14 天。

```bash
cd server && npm install winston-daily-rotate-file
```

```typescript
// server/src/utils/logger.ts
import DailyRotateFile from 'winston-daily-rotate-file'

const transports: winston.transport[] = [
  new winston.transports.Console({ format: ... })
]

if (config.logging?.file?.enabled) {
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    })
  )
}
```

**预计**: 半天

### 2.2 数据库自动备份

**方案**: Docker Compose 中添加 backup 服务，每天凌晨 3 点备份，保留 30 天。

```yaml
# docker-compose.yml
  backup:
    image: mysql:8.0
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
    environment:
      - DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
      - DB_NAME=${DB_NAME}
    depends_on:
      mysql:
        condition: service_healthy
    profiles:
      - production
```

**恢复命令**:
```bash
gunzip < backups/backup_20260531_030000.sql.gz | \
  docker-compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME"
```

**预计**: 半天

### 2.3 SSL 证书自动化

**方案**: 在 `docker-compose.yml` 添加 certbot 服务，12 小时检查一次续期。

```yaml
  certbot:
    image: certbot/certbot:v2.6.0
    volumes:
      - ./certbot/www:/var/www/certbot
      - ./ssl:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done'"
    profiles:
      - production
```

**预计**: 半天

### 第二阶段验收标准

- [x] 日志文件按日期轮转，单文件 ≤ 20MB
- [x] 数据库每天自动备份，备份文件存在于 `backups/` 目录
- [ ] 备份恢复流程已验证（在测试环境跑一次恢复）
- [x] SSL 证书自动续期容器已配置

---

## 第三阶段: 前端测试加固

**目标**: 前端覆盖率从 ~60% → 70%+
**耗时**: ~2 周
**为什么排第三**: 测试是长期维护的保障，但前端测试优先级低于后端覆盖率和运维安全。

**策略调整**: 原计划目标 80%，单人开发调为 70%，够用就好。UI 组件的纯渲染测试投入产出比低，优先补 Service/Store/Router 的逻辑测试。

### 3.1 Service 层测试（优先级最高）

| 文件 | 测试数 | 测试重点 |
|:---|:---|:---|
| `calendarService.js` | 8~10 | API 调用、错误处理、数据格式化 |
| `fleetService.js` | 8~10 | API 调用、缓存回退、空数据处理 |

`errorReporting.js` 跳过，Sentry 集成测试价值不大。

**预计**: 1~2 天

### 3.2 Store + Router 测试

| 文件 | 测试数 | 测试重点 |
|:---|:---|:---|
| `stores/auth.js` | 6~8 | login/logout/refreshToken 状态流转 |
| `stores/calendar.js` | 4~6 | fetchEvents/selectedDate |
| `stores/fleet.js` | 4~6 | fetchShips/activeShip |
| `router/index.js` | 4~6 | 路由守卫、权限检查 |

**预计**: 2~3 天

### 3.3 核心 View 测试

只补用户路径上的关键页面，Admin 页面和辅助页面暂不补。

| 文件 | 测试数 | 测试重点 |
|:---|:---|:---|
| `views/Home.vue` | 4~6 | 渲染、统计数据、CTA 按钮 |
| `views/Members.vue` | 4~6 | 列表渲染、分页 |
| `views/Projects.vue` | 4~6 | 列表渲染、状态筛选 |
| `views/Contact.vue` | 4~6 | 表单渲染、提交、验证 |

`About.vue`、`Offline.vue`、`NotFound.vue` 是纯展示页面，测试价值低，跳过。

**预计**: 3~4 天

### 3.4 E2E 扩展（+2 spec）

| spec | 场景 |
|:---|:---|
| `fleet.spec.js` | 舰队页面加载、飞船卡片展示 |
| `admin.spec.js` | 管理后台登录、成员管理 CRUD |

`members.spec.js` 与 `navigation.spec.js` 有重叠，跳过。

**预计**: 2 天

### 第三阶段验收标准

- [ ] 前端估算覆盖率 ≥ 70%
- [ ] Service/Store/Router 逻辑测试全部通过
- [ ] E2E 7 个 spec 全部通过
- [ ] 所有现有测试无回归

---

## 第四阶段: 安全架构

**目标**: 消除两个已知的安全风险点
**耗时**: ~3 天
**为什么排第四**: 这两项改动涉及前后端协同，需要仔细测试，放在测试体系完善之后更安全。

### 4.1 API 客户端迁移到 /api/v1/

**改动量**: 很小，核心只改一行。

```javascript
// src/services/http.js
const API_BASE_URL = import.meta.env.VITE_API_PREFIX || '/api/v1'  // 原来是 '/api'
```

然后全局搜索硬编码的 `/api/` 路径确认无遗漏。

**预计**: 半天

### 4.2 httpOnly Cookie JWT 迁移

**后端已就绪**：`COOKIE_OPTIONS` 已定义，`auth.ts` 已支持从 Cookie 读取 token。

**前端改动**:

1. `http.js`: 移除 Authorization header 拦截器，启用 `withCredentials: true`
2. `authService.js`: 登录/注册后不再存 token 到 localStorage
3. `auth.js` store: 移除 token 状态，改为依赖 Cookie 自动携带

**风险点**: 跨域部署时 Cookie 行为不同，需要在实际部署环境验证。

**预计**: 2~2.5 天

### 第四阶段验收标准

- [ ] 前端使用 `/api/v1/` 前缀
- [ ] JWT 通过 httpOnly Cookie 传递，localStorage 无 token
- [ ] 登录/登出/刷新全链路正常
- [ ] E2E 认证流程测试通过

---

## 第五阶段: 按需推进

以下任务**不急于现在做**，等业务需要或用户量起来后再启动。

### 软删除机制

**触发条件**: 上线后有用户误删数据的反馈，或业务需要数据审计。

**工作量**: 2~3 天

**方案**: 核心表添加 `deleted_at` 字段，Service 层查询加 `WHERE deleted_at IS NULL`。

### 前端性能优化

**触发条件**: 用户量起来后，Lighthouse 评分需要优化。

**当前已有**: 代码分割、图片懒加载、CDN、PWA 缓存

**可进一步**: Bundle 分析、图片 WebP 格式、字体子集化。

**工作量**: 3~5 天

### 前端 TypeScript 迁移

**触发条件**: 前端代码量增长到维护困难时，或有第二个开发者加入时。

**单人开发不建议现在做**: 投入产出比低，2~3 周的迁移工作不会直接提升用户体验或系统稳定性。

**如果要做**: 从 `src/utils/` 和 `src/services/` 开始，逐文件重命名 `.js` → `.ts`，`allowJs: true` 渐进迁移。

### i18n 国际化

**触发条件**: 面向国际玩家，有多语言需求。

**工作量**: 1~2 周

### Grafana 监控仪表盘

**触发条件**: 部署到生产环境后，需要可视化监控。

**当前状态**: Prometheus 指标已就绪，Grafana 配置文件待创建。

**工作量**: 1~2 天

---

## 总览

| 阶段 | 内容 | 耗时 | 累计 |
|:---|:---|:---|:---|
| **紧急阶段** | **代码审查修复（4 P0 + 11 P1）** | **~1 周** | **1 周** |
| 第一阶段 | 后端 0% 模块补测试 | ~1 周 | 2 周 |
| 第二阶段 | 日志轮转 + 数据库备份 + SSL | ~3 天 | 2.5 周 |
| 第三阶段 | 前端测试加固 + E2E 扩展 | ~2 周 | 4.5 周 |
| 第四阶段 | API v1 迁移 + httpOnly Cookie | ~3 天 | 5 周 |
| 第五阶段 | 按需推进 | — | — |

**总计约 5 周**完成前五个阶段，项目达到可上线状态。第五阶段根据实际业务需求择机启动。

---

## 版本规划

| 版本 | 关键交付 | 预计时间 |
|:---|:---|:---|
| v1.3.1（当前） | 文档体系完善、安全扫描清零 | ✅ 已完成 |
| v1.3.2 | **代码审查修复（P0 缓存/认证/状态 + P1 架构/安全）** | +1 周 |
| v1.4.0 | 后端覆盖率 ≥70%、日志轮转、数据库备份、SSL 自动化 | +2 周 |
| v1.5.0 | 前端覆盖率 ≥70%、E2E 7 spec、API v1 迁移 | +4 周 |
| v1.6.0 | httpOnly Cookie JWT、安全架构完善 | +5 周 |

---

## 一句话总结

**先补后端测试（1 周）→ 再加固运维（3 天）→ 再补前端测试（2 周）→ 最后做安全架构升级（3 天）**。4 周后项目可上线。TypeScript 迁移、i18n、软删除这些大工程，等业务需要时再启动，不要提前投资。
