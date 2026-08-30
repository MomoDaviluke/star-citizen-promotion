# 测试指南

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-08-27
> **版本**: v1.6.2

---

## 测试体系概览

| 层级 | 工具 | 文件数 | 测试用例 | 状态 |
|:---|:---|:---|:---|:---|
| E2E 测试 | Playwright | 5 个 spec | 覆盖认证/申请/导航/首页/加入 | ✅ 通过 |
| 集成测试 | Supertest + Jest | 26+ 个文件 | 469 个测试用例 | ✅ 全部通过 |
| 前端单元测试 | Vitest | 37 个文件 | 覆盖 components/composables/router/services/stores/views/utils | ✅ 通过 |
| 后端单元测试 | Jest | 25+ 个文件 | 覆盖 middleware、services、routes、AI | ✅ 全部通过 |
| 静态分析 | ESLint | 全代码库 | — | ✅ 0 错误 |
| 类型检查 | TypeScript | 全代码库 | — | ✅ 0 错误 |

---

## 快速命令

### 前端测试

```bash
# 进入项目根目录
cd c:\Users\Administrator\Desktop\star-citizen-promotion

# 运行 Vitest 单元测试（开发模式）
npm run test

# 生成覆盖率报告
npm run test:coverage

# 运行 Playwright E2E 测试
npm run test:e2e

# 运行 E2E 测试（带 UI）
npm run test:e2e -- --ui
```

### 后端测试

```bash
# 进入后端目录
cd server

# 运行 Jest 测试
npm test

# 生成覆盖率报告
npm run test:coverage

# 监视模式（开发时使用）
npm run test:watch

# 运行特定测试文件
npx jest tests/auth.test.ts

# 运行特定测试用例
npx jest -t "should authenticate valid token"
```

### 代码检查

```bash
# 前端 ESLint
cd c:\Users\Administrator\Desktop\star-citizen-promotion
npm run lint

# 后端 ESLint
cd server
npm run lint

# TypeScript 类型检查
cd server
npx tsc --noEmit
```

---

## 后端测试覆盖率

### 当前状态

| 维度 | 当前 | 目标 | 状态 | 差距 |
|:---|:---|:---|:---|:---|
| 语句覆盖 (Stmts) | 75.35%（整体）/ 72.25%（不含 AI） | ≥ 60% (CI 门禁) | ✅ 已达标 | +15.35% |
| 分支覆盖 (Branch) | 75.70% | ≥ 60% (CI 门禁) | ✅ 已达标 | +15.70% |
| 函数覆盖 (Funcs) | 87.06% | ≥ 70% (CI 门禁) | ✅ 已达标 | +17.06% |
| 行覆盖 (Lines) | 75.35% | ≥ 60% (CI 门禁) | ✅ 已达标 | +15.35% |
| **AI 模块覆盖** | **88.94%** | ≥ 80% (Phase 1 验收) | ✅ 已达标 | +8.94% |

> 以上为 2026-08-05 实测（`npm test -- --coverage`，范围 `src/**/*.ts`，v8 provider）。v1.5.0 新增 AI 模块（`services/ai/`：Providers / RAG / LlmService / RagService / SessionStore / ProfileEngine / RecruiterService），AI 模块实测 **88.94%**（Stmts/Lines，范围 services/ai + routes/ai.ts；2026-08-03 验收快照为 82.09%）。核心业务模块（auth 97.76%、admin 98.05%、services 93~100%）覆盖率保持高位。整体 ≥70%（v1.4.0 遗留目标）已达成。

### 覆盖率趋势

| 版本 | 语句覆盖 | 分支覆盖 | 函数覆盖 | 日期 |
|:---|:---|:---|:---|:---|
| v1.0.0 | 55.00% | 48.00% | 62.00% | 2026-03-01 |
| v1.0.1 | 58.00% | 52.00% | 65.00% | 2026-03-10 |
| v1.1.0 | 62.00% | 65.00% | 70.00% | 2026-04-15 |
| v1.2.0 | 64.69% | 70.98% | 75.78% | 2026-05-20 |
| v1.3.0 | 63.86% | 72.00% | 85.88% | 2026-05-28 |
| v1.5.0 (AI) | AI 模块 88.94% | 76.92% | 96.49% | 2026-08-03 |
| v1.5.0 (实测) | 75.35% | 75.70% | 87.06% | 2026-08-05 |
| v1.6.0 (目标) | 整体 70% | 75% | 80% | 计划中 |

### 未覆盖代码分析

#### 高优先级补充（v1.3.0 已覆盖）

| 文件 | 原覆盖 | 现覆盖 | 新增测试 |
|:---|:---|:---|:---|
| `middleware/auth.ts` | ~85% | **97.76%** | 用户不存在 401、DB 异常 500、角色查询异常 500 |
| `routes/admin.ts` | ~85% | **98.05%** | confirmPassword 二次验证、密码错误 403、缺密码 400 |

#### 0% 模块已补充（2026-05-31 完成 ✅）

| 文件 | 原覆盖 | 现覆盖 | 新增测试 |
|:---|:---|:---|:---|
| `websocket.ts` | 0% | ✅ 已覆盖 | 17 个测试（连接认证、心跳、消息路由、优雅关闭） |
| `swagger.ts` | 0% | ✅ 已覆盖 | 8 个测试（`tests/config/swagger.test.ts`，Swagger 配置输出验证） |
| `middleware/metrics.ts` | 0% | ✅ 已覆盖 | 10 个测试（`tests/middleware/metrics.test.ts`，Prometheus 指标收集） |
| `services/authService.ts` | ~96% | 🔄 基本覆盖 | 数据库错误分支待补充（可选） |

#### 中优先级补充（影响分支覆盖）

| 文件 | 未覆盖分支 | 条件 | 建议测试 |
|:---|:---|:---|:---|
| `middleware/errorHandler.ts` | 2/4 | 环境判断 (dev/prod) | 生产环境错误响应 |
| `services/fleetService.ts` | 3/6 | 空结果、权限判断 | 无数据查询、越权访问 |
| `services/memberService.ts` | 2/5 | 请求体验证 | 无效参数、缺失字段（项目无 controllers 层，成员逻辑在 service） |

---

## 已知测试失败

### 失败清单（v1.3.0 已全部修复 ✅）

| 编号 | 测试文件 | 测试用例 | 状态 | 修复方式 |
|:---|:---|:---|:---|:---|
| FAIL-1 | `server/tests/auth.test.ts` | "valid token should set req.user" | ✅ 已修复 | `authenticate` 改 async/await + 测试补 `mockQueryOne` |
| FAIL-2 | `server/tests/routes/admin.test.ts` | "POST /reset-db should return 200" | ✅ 已修复 | 测试补 `{ confirmPassword }` 请求体 + bcrypt mock |
| FAIL-3 | `server/tests/routes/admin.test.ts` | "POST /clear-cache should return 200" | ✅ 已修复 | 同上，新增 403/400 安全场景验证 |

### FAIL-1 详细分析（已修复 ✅）

**根因**：`authenticate` 使用同步函数签名 `() => void` 但内部有 `.then().catch()` Promise 链。
测试 `await authenticate()` 等到的是 `void`（未返回 Promise），断言时 `req.user` 尚未赋值。
同时测试未设 `mockQueryOne.mockResolvedValue()`。

**修复**：`authenticate` 改为 `async` 函数，jwt 验证和 DB 查询分两个 try/catch 处理，保持原有错误语义。测试补 mock 并修正期望值类型。

### FAIL-2/FAIL-3 详细分析（已修复 ✅）

**根因**：路由加了 `adminActionValidation`（`express-validator` 校验 `confirmPassword` 非空）
和 `verifyAdminPassword`（bcrypt 密码比对）。测试未发 `{ confirmPassword }` 请求体。

**修复**：测试 mock `bcryptjs.compare` 和 `database/pool.queryOne`，发送完整请求体，新增密码错误 403 和缺密码 400 的测试场景。

---

## 测试环境配置

### 后端测试环境

后端测试采用**纯 Mock 隔离**模式（`jest.unstable_mockModule`），不连接真实数据库。每个测试文件在 `import` 被测模块前 mock 其依赖：

```typescript
// server/tests/routes/members.test.ts（项目实际写法）
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'

const mockGetMembers = jest.fn()

// 在 import 被测模块之前 mock 其依赖
jest.unstable_mockModule('../../src/services/memberService.js', () => ({
  getMembers: mockGetMembers
}))
jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
  authenticate: (req, _res, next) => { req.user = { id: 'user-1', role: 'admin' }; next() }
}))

const { router } = await import('../../src/routes/members.js')
```

要点：
- jest 配置见 `server/jest.config.js`（ts-jest ESM + V8 provider，无 setupFiles）
- 断言统一使用 `@jest/globals` 显式导入（项目用 jest，不是 vitest）
- 测试数据以内联 mock 形式定义在测试文件中，无独立工厂/夹具文件

### 测试数据库

后端测试不依赖真实数据库（全部模块级 mock）。仅 `server/tests/database/pool.test.ts` 通过 mock `mysql2/promise` 验证连接池行为。数据库名约定（仅开发/生产使用）：

| 环境 | 数据库名 | 用途 |
|:---|:---|:---|
| 开发 | `star_citizen_dev` | 本地开发 |
| 测试 | `star_citizen_test` | 自动化测试（若启用真实库） |
| 生产 | `star_citizen_prod` | 线上环境 |

### 测试数据工厂

项目不维护独立工厂文件，测试数据以内联 mock 返回值定义：

```typescript
// server/tests/services/authService.test.ts（示例）
const mockUser = { id: 'user-1', username: 'tester', role: 'member' }
mockQueryOne.mockResolvedValue(mockUser)
```

---

## 编写测试规范

### 命名规范

```typescript
// ✅ 好的命名
describe('AuthService', () => {
  describe('login', () => {
    it('should return token when credentials are valid', async () => {});
    it('should throw error when password is incorrect', async () => {});
    it('should throw error when user does not exist', async () => {});
  });
});

// ❌ 差的命名
describe('test auth', () => {
  it('works', async () => {});
  it('fails', async () => {});
});
```

### 测试结构 (AAA)

```typescript
it('should deactivate member when admin requests', async () => {
  // Arrange (准备)
  const admin = await createUser({ role: 'admin' });
  const member = await createUser({ role: 'member' });
  const token = generateToken(admin);

  // Act (执行)
  const response = await request(app)
    .post(`/api/members/${member.id}/deactivate`)
    .set('Authorization', `Bearer ${token}`);

  // Assert (断言)
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('inactive');
});
```

### 测试隔离

```typescript
// ✅ 每个测试独立
beforeEach(async () => {
  await db('users').truncate();
  await db('members').truncate();
});

// ❌ 不要依赖其他测试的状态
it('should create user', async () => {
  // 不要在这里假设数据库已有数据
});
```

---

## CI/CD 集成

### GitHub Actions 测试步骤

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  backend-test:
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
      - run: cd server && npm ci
      - run: cd server && npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./server/coverage/lcov.info
          flags: backend
          fail_ci_if_error: true

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: frontend
          fail_ci_if_error: true
```

### 质量门禁

```yaml
# codecov.yml
coverage:
  status:
    project:
      backend:
        target: 70%
        threshold: 2%
        flags:
          - backend
      frontend:
        target: 80%
        threshold: 2%
        flags:
          - frontend
```

---

## 测试数据管理

### 种子数据

```bash
# 开发环境种子数据
cd server
npx knex seed:run

# 测试环境专用种子
cd server
NODE_ENV=test npx knex seed:run --specific=test_data.js
```

### 数据清理策略

| 策略 | 适用场景 | 实现方式 |
|:---|:---|:---|
| 事务回滚 | 单元测试 | `db.transaction()` + `rollback()` |
| 表截断 | 集成测试 | `TRUNCATE TABLE` |
| 数据库重建 | E2E 测试 | `migrate:rollback` + `migrate:latest` |

### 测试夹具（Fixture）

项目不维护独立 fixture 文件，测试夹具以内联对象形式定义。若后续引入共享夹具，建议放置于 `server/tests/fixtures/`：

```typescript
// server/tests/fixtures/users.ts（示例，当前未使用）
export const adminUser = { id: 'user-1', username: 'admin', role: 'admin' }
export const memberUser = { id: 'user-2', username: 'member', role: 'member' }
```

---

## 调试技巧

### 测试调试

```bash
# 使用 Node.js 调试器
node --inspect-brk node_modules/.bin/jest --runInBand

# 输出详细日志
DEBUG=* npm test

# 只运行失败的测试
npx jest --onlyFailures

# 更新快照
npx jest --updateSnapshot
```

### 覆盖率调试

```bash
# 生成 HTML 报告
npx jest --coverage --coverageReporters=html

# 查看特定文件覆盖
npx jest --coverage --collectCoverageFrom='src/services/authService.ts'

# 打开覆盖率报告
open coverage/lcov-report/index.html
```

---

## 压力测试

> **更新日期**: 2026-07-23
> **说明**: 压测设计/计划文档已随历史文档清理移除（git 历史可查），本节保留压测体系与执行方法

### 压测体系

| 层级 | 场景 | 工具 | 目标 |
|:---|:---|:---|:---|
| L1 基线 | 单端点递增并发 | autocannon | P50/P95/P99/QPS 基线 |
| L2 混合 | 读写 8:2 混合 | autocannon | 缓存失效、写竞争 |
| L3 长跑 | 30min 持续负载 | autocannon + prom-client | heap/eventloop/pool 稳定性 |
| L4 策略 | 限流/缓存验证 | autocannon + fetch | 429 行为、HIT/MISS 切换 |
| L5 端到端 | WS/Nginx/前端 | autocannon + Playwright + Lighthouse | 全栈链路、前端性能 |

### 目录结构

```
load-tests/
├── config/                 # 配置
│   ├── targets.mjs         # 目标 URL + 测试账号
│   └── thresholds.mjs      # 各层级阈值
├── docker-compose.loadtest.yml  # 独立压测环境（端口 3001/13306）
├── lib/                    # 工具库
│   ├── client.mjs          # autocannon 封装 + 参数解析
│   ├── auth.mjs            # token 缓存 + authHeaders
│   ├── seeds.mjs           # 测试账号注册/验证
│   ├── monitor.mjs         # Prometheus 指标采样
│   ├── report.mjs          # 结果保存 + 阈值评估 + 汇总
│   └── probe.mjs           # 目标可达性探测
└── scenarios/              # 场景脚本
    ├── l1-baseline/        # L1 基线（3 脚本）
    ├── l2-mixed/           # L2 混合（1 脚本）
    ├── l3-soak/            # L3 长跑（2 脚本）
    ├── l4-policy/          # L4 策略（2 脚本）
    ├── l5-e2e/             # L5 端到端（4 脚本）
    └── run-all.mjs         # 顶层编排器
```

### 快速命令

```bash
# 启动压测环境（Docker Compose 模拟生产）
npm run load:up

# 运行全套压测（L1→L2→L4→L3→L5，约 40 分钟）
npm run test:load

# 运行单层压测
npm run test:load:l1   # L1 基线
npm run test:load:l2   # L2 混合
npm run test:load:l3   # L3 长跑（30 分钟）
npm run test:load:l4   # L4 限流/缓存
npm run test:load:l5   # L5 前端性能

# 烟雾测试（5s + 1 并发，用于 CI 验证脚本可用性）
node load-tests/scenarios/l1-baseline/readme-endpoints.mjs --smoke

# 单独运行 L3 旁路监控
node load-tests/scenarios/l3-soak/monitor.mjs

# 关闭并清理压测环境
npm run load:down
```

### 压测阈值

| 层级 | 指标 | 阈值 |
|:---|:---|:---|
| L1 公开读 | P95 | < 200ms |
| L1 公开读 | 错误率 | < 1% |
| L1 公开读 | QPS | >= 50 |
| L1 认证 | P95 | < 500ms（bcrypt 12 轮）|
| L2 混合 | P95 | < 300ms |
| L3 长跑 | heap 增长 | < 30% |
| L3 长跑 | event loop lag P95 | < 50ms |
| L5 前端 | LCP | < 2.5s |
| L5 前端 | CLS | < 0.1 |
| L5 前端 | INP | < 200ms |
| L5 前端 | 动画 FPS | > 50 |

### 执行顺序

编排器（`run-all.mjs`）按以下顺序运行，避免限流污染和基线依赖问题：

```
L1 基线 → L2 混合 → L4 策略 → [等 90s 限流恢复] → L3 长跑 → L5 端到端
```

- L4 在 L3 前：避免限流窗口耗尽影响长跑
- L3 在 L4 后：可从 L1 基线推导并发数（`/api/stats` P95<200ms 时的最大并发 × 0.8）
- L5 最后：避免前端测试与后端压测资源竞争

### 报告位置

- 原始结果: `load-tests/reports/<layer>/`
- 汇总报告: `load-tests/reports/summary.md`
- L3 时序数据: `load-tests/reports/l3/timeseries.json`

### 注意事项

- 压测环境使用独立 MySQL volume（`mysql_loadtest_data`），与生产数据隔离
- L4 限流验证会耗尽限流窗口，后续 auth 测试前需 `docker compose -f load-tests/docker-compose.loadtest.yml restart backend`
- L3 长跑并发数从 L1 基线自动推导（`/api/stats` P95<200ms 时的最大并发 × 0.8）
- Lighthouse 本地 HTTP/1.1 评分仅供参考（参考 DBG-03），生产环境需结合 HTTP/2 结果
- 所有场景支持 `--smoke` 参数（5s + 1 并发），用于快速验证脚本可用性
- `--duration <秒>` 和 `--connections <数>` 可覆盖默认值

---

## 测试检查清单

### 提交前检查

- [ ] 所有测试通过 (`npm test`)
- [ ] 覆盖率未下降 (`npm run test:coverage`)
- [ ] ESLint 无错误 (`npm run lint`)
- [ ] TypeScript 编译通过 (`npx tsc --noEmit`)
- [ ] 新功能有对应测试
- [ ] 修复的 bug 有回归测试

### 发布前检查

- [ ] E2E 测试通过 (`npm run test:e2e`)
- [ ] 安全扫描通过 (`npm audit`)
- [ ] 性能测试达标
- [ ] 兼容性测试通过
