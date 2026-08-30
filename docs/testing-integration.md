# 真实集成测试环境运行手册

> 目的：让你在**不上前端、不依赖 mock** 的前提下，对后端做真实的全链路往返验证（读 / 写 / 埋点 / 注册）。
> 这正是定位"接口和细节问题"的关键——单元测试跑最新源码无法暴露的部署/镜像/环境问题，只有真实栈能暴露。

> ⚠️ **定位说明（不是替代工具，是补齐一层）**：本脚本是「自动化回归 / CI」，与 Postman/Insomnia 这类「人工探索调试」工具是**配合关系，不是二选一**——
>
> | 场景 | 工具 | 谁在用 |
> |:--|:--|:--|
> | 开发/上线前**手动点验**接口、改参数、看返回、对字段 | Postman / Insomnia / yaak | 测试 + 前后端工程师 |
> | 每次提交/发版**自动拦回归**（无人值守） | `npm run test:integration`（本脚本）+ connectivity-smoke | CI/流水线 |
> | 逻辑/边界细节 | 单元测试 | 自动化 |
> | 关键用户旅程 UI/交互 | E2E（Playwright） | 自动化 |
>
> 典型配合：先跑 `npm run test:integration` 拉起真实栈（`http://localhost:3101`），再用 Postman 对着同一端口**手动点验细节**。本脚本把已验证路径固化防回退；Postman 负责发现新问题、对齐预期。

## 1. 必备条件（环境前置）

| 项 | 要求 | 缺失后果 |
|:--|:--|:--|
| Docker + Docker Compose | 已安装且 daemon 运行 | `test:integration` 直接报"未检测到 docker" |
| 端口 | 宿主 `3101`（backend）、`13306`（MySQL）未被占用 | 端口冲突/映射失败 |
| Node.js | 已装（运行编排脚本用），根目录依赖已 `npm install` | `node scripts/...` 执行失败 |
| （可选）Playwright 浏览器 | 仅前端 E2E 需要；本文的后端往返不需 | 不影响本手册 |

**后端真实往返只需 MySQL**：读/写/注册/埋点均由 MySQL + 结构化日志承担；PostgreSQL（向量库）/ Redis（LLM 缓存）为惰性连接，不调用 AI 功能时不会触发。

## 2. 环境变量（均有安全默认，可覆盖）

复制 `.env.test.example` 为 `.env.test` 可按需覆盖自定义项（JWT_SECRET / 密码 / 端口）。**三个关键约束**（都是实测踩过的坑）：

- `TEST_JWT_SECRET`：**必须 ≥ 32 字符**。<32 时 config 生产模式抛 `FATAL: JWT_SECRET must be at least 32 characters`，后端起不来。
- `TEST_DB_PASSWORD`：**用无特殊字符值**（如 `TestPass123456`）。含 `!` 等字符可能在 shell/CLI 转义层导致 `Access denied`。
- 端口避免与本机开发服务（3001/3306）冲突。

## 3. 一键用法

```powershell
npm run test:integration          # 拉起栈→迁移→backend→真实冒烟→自动清理
npm run test:integration -- --keep   # 保留环境便于调试（用毕手动 down -v）
```

流程：启动 MySQL → `run --rm migrate`（真实建 11 表）→ 启动 backend（`backend-builder` 编译**最新源码**）→ 轮询 `/health/live` 就绪 → 运行 `connectivity-smoke.mjs` → 结束自动 `down -v` 清理（含 `--keep` 提示手动清理）。

## 4. 分步手动命令（等价于一次一键）

```powershell
docker compose -f docker-compose.test.yml up -d mysql
docker compose -f docker-compose.test.yml run --rm migrate
docker compose -f docker-compose.test.yml up -d backend
node scripts/connectivity-smoke.mjs http://localhost:3101
docker compose -f docker-compose.test.yml down -v        # 记得清理
```

## 5. 真实往返覆盖与验收标准

`connectivity-smoke.mjs` 会断言并输出 ✅/❌：

| 类别 | 端点 | 验收 |
|:--|:--|:--|
| 存活 | `/health` `/health/live` `/health/ready` | 200 且 `database=true` |
| 读 | `/api/v1/stats` `/fleet` `/pilots` `/members` `/projects` | 200 `success=true` |
| 权限 | 未认证访问 `/api/v1/admin/cache-stats` | 401/403（非 500） |
| 写 / 认证 | `POST /api/v1/auth/register` | 201（或预期 400/409） |
| AI | `/api/v1/ai/health` | 200 |

**通过标准**：最终 `N/N 通过`，exit 0。任何 ❌ 即视为集成失败。

> 提示：本套 smoke 覆盖"后端完整往返（读+写+注册）"；埋点 `POST /api/v1/analytics` 无独立 2xx 断言行，若需显式验证可对已 running 栈执行：
> `curl -si -X POST http://localhost:3101/api/v1/analytics -H "Content-Type: application/json" -d '{"event":"page_view"}' -o /dev/null -w "%{http_code}"` → 预期 `204`。

## 6. 为什么这样可以发现问题（而非 mock）

- 直接连真实 MySQL，验证**真实 SQL + 表结构 + 连接**，而非 `query: jest.fn()`。
- backend 用 `backend-builder` **每次编译最新源码**，不会踩"镜像 dist 缓存过期导致新路由 404"（DBG-13，曾导致 `POST /api/v1/analytics` 404）。
- 迁移真实建表，若 schema 与 service 查询不一致会立即暴露。