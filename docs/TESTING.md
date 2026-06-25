# 测试指南

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-05-28
> **版本**: v1.3.1

---

## 测试体系概览

| 层级 | 工具 | 文件数 | 测试用例 | 状态 |
|:---|:---|:---|:---|:---|
| E2E 测试 | Playwright | 5 个 spec | 覆盖认证/申请/导航/首页/加入 | ✅ 通过 |
| 集成测试 | Supertest + Jest | 26 个文件 | 310 个测试用例 | ✅ 全部通过 |
| 前端单元测试 | Vitest | 33 个文件 | 覆盖 components/composables/services/views/utils | ⚠️ 沙箱环境不可运行 (esbuild EPERM) |
| 后端单元测试 | Jest | 25 个文件 | 覆盖 middleware、services、routes | ✅ 全部通过 |
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
| 语句覆盖 (Stmts) | 63.86% | ≥ 60% (CI 门禁) | ✅ 已达标 | +3.86% |
| 分支覆盖 (Branch) | 72.00% | ≥ 60% (CI 门禁) | ✅ 已达标 | +12.00% |
| 函数覆盖 (Funcs) | 85.88% | ≥ 70% (CI 门禁) | ✅ 已达标 | +15.88% |
| 行覆盖 (Lines) | 63.86% | ≥ 60% (CI 门禁) | ✅ 已达标 | +3.86% |

> 覆盖率较 v1.2.0 的 64.69% 微降至 63.86%，原因是 v1.3.0 新增模块（`websocket.ts`、`swagger.ts`、`metrics.ts` 等约 500 行）尚未写测试。核心业务模块（auth 97.76%、admin 98.05%、services 93~100%）覆盖率保持高位。

### 覆盖率趋势

| 版本 | 语句覆盖 | 分支覆盖 | 函数覆盖 | 日期 |
|:---|:---|:---|:---|:---|
| v1.0.0 | 55.00% | 48.00% | 62.00% | 2026-03-01 |
| v1.0.1 | 58.00% | 52.00% | 65.00% | 2026-03-10 |
| v1.1.0 | 62.00% | 65.00% | 70.00% | 2026-04-15 |
| v1.2.0 | 64.69% | 70.98% | 75.78% | 2026-05-20 |
| v1.3.0 | 63.86% | 72.00% | 85.88% | 2026-05-28 |
| v1.4.0 (目标) | 70.00% | 75.00% | 80.00% | 2026-07-01 |

### 未覆盖代码分析

#### 高优先级补充（v1.3.0 已覆盖）

| 文件 | 原覆盖 | 现覆盖 | 新增测试 |
|:---|:---|:---|:---|
| `middleware/auth.ts` | ~85% | **97.76%** | 用户不存在 401、DB 异常 500、角色查询异常 500 |
| `routes/admin.ts` | ~85% | **98.05%** | confirmPassword 二次验证、密码错误 403、缺密码 400 |

#### 待补充（v1.4.0）

| 文件 | 未覆盖原因 | 建议测试 |
|:---|:---|:---|
| `websocket.ts` | 0% 覆盖，287 行全新模块 | WebSocket 连接、消息收发、心跳、重连 |
| `swagger.ts` | 0% 覆盖，50 行配置模块 | Swagger 配置输出验证 |
| `metrics.ts` | 0% 覆盖，170 行 | Prometheus 指标收集 |
| `services/authService.ts` | ~96% | 数据库错误分支 |

#### 中优先级补充（影响分支覆盖）

| 文件 | 未覆盖分支 | 条件 | 建议测试 |
|:---|:---|:---|:---|
| `middleware/errorHandler.ts` | 2/4 | 环境判断 (dev/prod) | 生产环境错误响应 |
| `services/fleetService.ts` | 3/6 | 空结果、权限判断 | 无数据查询、越权访问 |
| `controllers/memberController.ts` | 2/5 | 请求体验证 | 无效参数、缺失字段 |

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

```typescript
// server/tests/setup.ts
import { db } from '../src/config/database';

beforeAll(async () => {
  // 使用测试数据库
  process.env.DB_NAME = 'star_citizen_test';
  await db.migrate.latest();
});

beforeEach(async () => {
  // 每个测试前清理数据
  await db('users').truncate();
  await db('members').truncate();
});

afterAll(async () => {
  // 测试结束后销毁连接
  await db.destroy();
});
```

### 测试数据库

| 环境 | 数据库名 | 用途 |
|:---|:---|:---|
| 开发 | `star_citizen_dev` | 本地开发 |
| 测试 | `star_citizen_test` | 自动化测试 |
| 生产 | `star_citizen_prod` | 线上环境 |

### 测试数据工厂

```typescript
// server/tests/factories/userFactory.ts
export const createUser = async (overrides = {}) => {
  const defaultUser = {
    username: `user_${Date.now()}`,
    email: `user_${Date.now()}@test.com`,
    password: await hashPassword('password123'),
    role: 'member',
    ...overrides
  };

  const [id] = await db('users').insert(defaultUser);
  return { id, ...defaultUser };
};
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

###  fixtures

```typescript
// server/tests/fixtures/users.ts
export const adminUser = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin',
  password: '$2b$10$...' // hashed 'admin123'
};

export const memberUser = {
  id: 2,
  username: 'member',
  email: 'member@example.com',
  role: 'member',
  password: '$2b$10$...' // hashed 'member123'
};
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
