# 未合并分支评估清单

> 采集时间：2026-06-25（P1 基线阶段）
> 评估基准分支：`main`

## 评估结论总览

| 分支 | 提交数 | 类型 | 与本次重构关系 | 处理方案 |
|------|--------|------|----------------|----------|
| `feat/enterprise-improvement` | 11 | 功能开发 | 无直接关系 | 保留不动，不在本次重构范围内 |
| `fix-cicd-security` | 13 | 修复+性能 | 部分重叠（覆盖率阈值） | 保留不动，注意 P5 门禁冲突 |
| `refactor/css-vars-group-2` | 3 | 重构 | **直接相关**（P4 任务 4.1） | P4 阶段评估 cherry-pick |
| `refactor/websocket-message-handler` | 10 | 重构 | 无直接关系 | 保留不动，后续独立评估 |

## 详细分析

### 1. feat/enterprise-improvement（11 commits）

**内容**：统计仪表板 + Chart.js、Swagger 文档、标准化错误码系统、统一响应封装、慢查询诊断、连接池监控、通用事务包装器、审计日志清理测试、CSRF 保护中间件、Zod 验证。

**评估**：纯功能开发分支，不涉及本次系统性重构的 7 项技术债务。保留不动。

### 2. fix-cicd-security（13 commits）

**内容**：CI/CD 优化、CORS 安全配置、数据库连接池超时、mysql2 timeout 修复、WebSocket 心跳性能优化、统计查询性能优化、认证中间件异步处理修复、测试覆盖率阈值提升到 80%。

**评估**：bug 修复 + 性能优化分支。

**⚠️ 注意**：此分支将测试覆盖率阈值提升到 80%，而 P5 门禁目标为前端 ≥60%、后端 ≥70%。当前基线前端 62.73%、后端 71.91%。若此分支后续合并，需重新评估覆盖率门禁。保留不动。

### 3. refactor/css-vars-group-2（3 commits）⭐ 重点

**内容**：
- `3d637fc` refactor(css): migrate Group 2 deprecated CSS variables
- `0e1b1b5` refactor(css): migrate Group 3 deprecated CSS variables
- `e4b803e` docs(superpowers): 添加前端美术资产优化设计文档与实现计划

**评估**：**与 P4 任务 4.1（TD-13 CSS 变量迁移）直接相关**。此分支已完成 Group 2 和 Group 3 的 CSS 变量迁移工作。

**处理方案**：在 P4 阶段执行任务 4.1 时，优先评估此分支的 cherry-pick 可能性，避免重复工作。需验证：
- 迁移是否完整（lint 通过）
- 是否与当前基线存在冲突
- Group 1 和 Group 4 是否仍需处理

### 4. refactor/websocket-message-handler（10 commits）

**内容**：WebSocket 服务重构，使用策略模式拆分消息处理器（base 类、注册表、auth/ping 处理器、连接管理器提取、集成测试）。

**评估**：完整的 WebSocket 重构，独立于本次系统性重构的 7 项技术债务。保留不动，后续可独立评估是否合并。

## 工作树状态

之前发现的 3 个废弃工作树已在 P1 阶段清理（无残留）。当前无活跃工作树。

## P2 阶段处理结果（2026-06-25）

### 工作树清理

- 3 个工作树（enterprise-improvement、fix-cicd-security、websocket-refactor）已通过 `git worktree remove` 从 git 注册移除
- `.worktrees/` 目录已删除（在 .gitignore 中，无 git 变更）
- websocket-refactor 工作树中有未跟踪文件 `server/vitest.config.ts`（废弃的 vitest 配置，后端实际使用 jest），已随工作树移除丢弃

### 分支清理

- `feature/frontend-asset-optimization`：已合并到 main 无独有 commits，已删除（`git branch -d`）
- 其余 4 个未合并分支按 P1 评估结论保留不动：
  - `feat/enterprise-improvement`（11 commits 功能开发）
  - `fix-cicd-security`（13 commits 修复+性能）
  - `refactor/css-vars-group-2`（3 commits，P4 评估 cherry-pick）
  - `refactor/websocket-message-handler`（10 commits 重构）
