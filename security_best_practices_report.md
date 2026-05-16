# 安全审查报告

## 执行摘要

本次安全审查对 `star-citizen-promotion` 项目进行了全面代码安全分析。项目采用 Vue 3 + Vite 前端 + Express + MySQL 后端架构，整体安全基础较好，已实施多项安全最佳实践（Helmet、CORS、速率限制、输入验证、密码哈希、审计日志等）。但仍发现 **3 个中危安全问题** 需要修复。

---

## 发现的安全问题

### 中危问题

#### 【M-001】WebSocket 消息处理缺乏类型验证与大小限制

- **位置**: [server/src/websocket.ts](file:///c:/Users/Administrator/Desktop/star-citizen-promotion/server/src/websocket.ts#L186-L220)
- **问题描述**: WebSocket 消息处理函数 `handleMessage` 对接收到的消息仅进行 JSON 解析，未对 `message.type` 和 `message.data` 进行严格的类型和结构验证。虽然设置了 `maxPayload: 1024 * 100`，但消息内容本身未做深度校验。
- **风险影响**: 攻击者可能发送畸形或超大消息导致服务异常，或在 `handleAuth` 中传入非预期格式的 `token` 数据。
- **修复建议**: 在 `handleMessage` 中添加对 `message.type` 的允许列表校验，并对 `message.data` 进行结构验证。

#### 【M-002】管理员路由缺少二次密码验证实际校验逻辑

- **位置**: [server/src/routes/admin.ts](file:///c:/Users/Administrator/Desktop/star-citizen-promotion/server/src/routes/admin.ts#L14-L71)
- **问题描述**: `/admin/reset-db` 和 `/admin/clear-cache` 路由虽然定义了 `adminActionValidation` 要求提供 `confirmPassword`，但在处理函数中**仅验证了字段存在性**，并未将提供的密码与当前管理员的真实密码进行比对验证。
- **风险影响**: 任何获得管理员身份（如通过 XSS 窃取 cookie 或会话劫持）的攻击者，只需在请求体中随意填写一个非空字符串即可执行数据库重置或缓存清除等高风险操作。
- **修复建议**: 在处理函数中调用 `bcrypt.compare()` 将 `req.body.confirmPassword` 与数据库中当前管理员用户的 `password_hash` 进行比对验证。

#### 【M-003】JWT Token 刷新端点缺少速率限制

- **位置**: [server/src/routes/auth.ts](file:///c:/Users/Administrator/Desktop/star-citizen-promotion/server/src/routes/auth.ts#L165-L185)
- **问题描述**: `/auth/refresh` 端点未配置专门的速率限制中间件。虽然 `/auth/login` 和 `/auth/register` 有 `authLimiter`（15 分钟 10 次），但令牌刷新端点可以被无限次调用。
- **风险影响**: 攻击者可能通过暴力尝试刷新无效/过期令牌，造成不必要的计算资源消耗，或在配合其他漏洞时用于探测有效的令牌模式。
- **修复建议**: 为 `/api/auth/refresh` 添加适当的速率限制，例如每 IP 每小时 60 次。

---

## 已确认安全的良好实践

以下方面项目已正确实施，无需修复：

1. **密码安全**: 使用 `bcryptjs` 进行密码哈希，盐轮数可配置（默认 12 轮）
2. **JWT 安全**: 使用强密钥验证，生产环境强制要求 32 字符以上密钥，设置过期时间
3. **Cookie 安全**: httpOnly、secure（生产环境）、sameSite=strict 配置正确
4. **SQL 注入防护**: 所有数据库查询使用参数化查询/预处理语句
5. **XSS 防护**: Helmet CSP 配置完善，前端无 `innerHTML`/`eval` 等危险操作
6. **CORS 配置**: 生产环境严格限制来源，开发环境有合理的白名单
7. **速率限制**: API 通用限制和认证端点严格限制已配置
8. **输入验证**: 使用 `express-validator` 对请求参数和体进行校验
9. **错误处理**: 生产环境隐藏内部错误堆栈，防止信息泄露
10. **审计日志**: 自动记录管理操作，敏感字段自动脱敏
11. **请求日志脱敏**: 密码、token 等敏感字段在日志中被自动替换
12. **Metrics 端点保护**: 生产环境仅允许白名单 IP 访问 `/metrics`
13. **数据库连接安全**: 使用连接池，密码通过环境变量配置

---

## 修复优先级

| 优先级 | 问题编号 | 风险等级 | 描述 |
|--------|----------|----------|------|
| P1 | M-002 | 中危 | 管理员操作缺少实际密码校验 |
| P2 | M-003 | 中危 | Token 刷新缺少速率限制 |
| P3 | M-001 | 中危 | WebSocket 消息缺乏类型验证 |

---

*报告生成时间: 2026-05-16*
*审查范围: 前端 src/ + 后端 server/src/ 全部代码*
