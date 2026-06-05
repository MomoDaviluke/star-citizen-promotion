---
name: api-design-standards
description: "REST API 设计标准化。覆盖统一响应信封 { success, data, error, meta }、DTO 层设计（请求/响应分离）、分页标准（offset vs cursor）、错误码体系、OpenAPI/Swagger 自动生成、API 版本管理、幂等性设计。用于设计新 API 或审查已有 API 的一致性。Triggers: API 设计, RESTful API, 响应格式, 分页设计, 错误码, Swagger, OpenAPI, DTO, API 版本, 接口规范, API 标准化, 接口文档, API design, response envelope, pagination, error codes. Do NOT trigger for: GraphQL API, gRPC, WebSocket 消息格式, 前端 API 调用封装."
default-enabled: false
---

# API 设计标准指南

为 REST API 提供一致、可预测的设计模式。关注 API 的"契约层"，不涉及具体框架实现细节。

**不覆盖**：GraphQL、gRPC、WebSocket 消息格式、REST 基础概念。
**协作**：响应格式与 express-security-hardening 错误处理一致；分页与 nodejs-database-patterns 衔接。

---

## 一、统一响应信封

```typescript
// 成功
{ "success": true, "data": { ... }, "meta"?: { "page": 1, "limit": 20, "total": 150 } }

// 列表
{ "success": true, "data": [ ... ], "meta": { ... } }

// 错误
{ "success": false, "error": "描述", "details"?: [{ "field": "email", "message": "格式不正确" }] }
```

实现工具函数：
```javascript
function success(res, data, meta = null, statusCode = 200) {
  const body = { success: true, data }
  if (meta) body.meta = meta
  return res.status(statusCode).json(body)
}
function error(res, message, statusCode = 400, details = null) {
  const body = { success: false, error: message }
  if (details) body.details = details
  return res.status(statusCode).json(body)
}
```

---

## 二、DTO 层：请求与响应分离

数据库字段（created_at、password_hash）不直接暴露给 API 消费者。

```javascript
// 请求 DTO：API 参数 → 数据库格式
function toCreateMember(body) {
  return { name: body.name?.trim(), role: body.role || 'member', status: body.status || 'active' }
}

// 响应 DTO：数据库记录 → API 格式
function toMemberResponse(dbRow) {
  return {
    id: dbRow.id, name: dbRow.name, role: dbRow.role,
    joinedAt: dbRow.created_at,  // snake_case → camelCase
    updatedAt: dbRow.updated_at,
  }
}
```

---

## 三、分页标准

| 场景 | 推荐 |
|:---|:---|
| 管理后台、需展示总页数 | Offset：`?page=1&limit=20` |
| 实时 Feed、无限滚动 | Cursor：`?cursor=2024-01-15T10:30:00Z&limit=20` |

---

## 四、错误码体系

格式：`DOMAIN_CODE`（如 AUTH_001, MEMBER_003）
域：AUTH/MEMBER/APP/PROJ/FILE/SYS

```javascript
class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message)
    this.statusCode = statusCode; this.code = code; this.details = details
  }
}
// throw new ApiError(409, 'AUTH_003', '邮箱已被注册')
```

---

## 五、OpenAPI 自动生成

用 swagger-jsdoc 从代码注释生成文档：

```javascript
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const spec = swaggerJsdoc({
  definition: { openapi: '3.0.0', info: { title: 'API', version: '1.0.0' } },
  apis: ['./src/routes/*.js'],
})
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec))
```

路由注释用 @swagger 标记：summary、tags、parameters、responses。

---

## 六、API 版本管理

推荐 URL 路径版本：`/api/v1/members`、`/api/v2/members`
新增字段不破坏兼容性；删除/重命名需新版本，旧版保留 ≥1 个发布周期。

---

## 七、幂等性设计

关键写操作要求客户端传 Idempotency-Key 头。服务端检查是否已处理过，已处理则返回缓存结果。

```javascript
// 检查幂等键
const existing = await db.query('SELECT result FROM idempotency_keys WHERE key = ?', [key])
if (existing.length > 0) return success(res, JSON.parse(existing[0].result))
// 执行业务 → 记录幂等键
```

定期清理超过 24 小时的幂等键。

---

## 检查清单
- [ ] 所有接口使用统一响应信封
- [ ] 数据库字段不直接暴露（snake_case→camelCase）
- [ ] 分页参数和响应格式一致
- [ ] 错误码有 DOMAIN_CODE 体系
- [ ] API 文档由注释自动生成
- [ ] 有版本策略
- [ ] 写操作考虑幂等性
- [ ] HTTP 方法语义正确