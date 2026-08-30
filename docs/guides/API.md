# API 参考文档

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-08-27
> **版本**: v1.6.2
> **接口基路径**: `/api/v1` （推荐）或 `/api`（兼容）

本文档详细描述了星际公民战队宣传网站的所有API接口。

## 目录

- [概述](#概述)
- [认证](#认证)
- [认证接口](#认证接口)
- [成员接口](#成员接口)
- [项目接口](#项目接口)
- [飞行员接口](#飞行员接口)
- [申请接口](#申请接口)
- [统计接口](#统计接口)
- [AI 接口（v1.5.0）](#ai-接口v150)
- [错误处理](#错误处理)
- [数据类型](#数据类型)

---

## 概述

### 基础信息

| 项目 | 说明 |
|------|------|
| 基础URL | `http://localhost:3001/api` |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |
| API版本 | v1 |

### 请求头

```http
Content-Type: application/json
Accept: application/json
```

认证请求需要额外添加：

```http
Authorization: Bearer <token>
```

### 响应格式

所有API响应遵循统一格式：

**成功响应：**

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

**错误响应：**

```json
{
  "success": false,
  "message": "错误描述",
  "errors": [
    {
      "field": "字段名",
      "message": "错误详情"
    }
  ]
}
```

---

## 认证

### JWT认证

API使用JWT（JSON Web Token）进行认证。

**获取令牌：**
1. 调用 `/api/auth/login` 或 `/api/auth/register` 接口
2. 从响应中获取 `token` 字段
3. 在后续请求中添加 `Authorization: Bearer <token>` 请求头

**令牌有效期：**
- 默认有效期：7天
- 配置项：`JWT_EXPIRES_IN`

### 权限级别

| 角色 | 说明 | 权限 |
|------|------|------|
| `member` | 普通成员 | 访问公开接口、个人资料 |
| `officer` | 军官 | + 成员管理、申请审批 |
| `admin` | 管理员 | 访问所有接口、系统管理 |

---

## 认证接口

### 用户注册

创建新用户账号。

**请求：**

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123"
}
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，3-20字符，支持字母、数字、下划线、中文 |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码，至少8字符，需包含大小写字母和数字 |

**成功响应：**

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "uuid-string",
      "username": "testuser",
      "email": "test@example.com",
      "role": "member"
    },
    "token": "jwt-token-string"
  }
}
```

**错误响应：**

| 状态码 | 说明 |
|--------|------|
| 400 | 输入验证失败 |
| 409 | 用户名或邮箱已被注册 |

---

### 用户登录

用户登录获取认证令牌。

**请求：**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123"
}
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 |

**成功响应：**

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid-string",
      "username": "testuser",
      "email": "test@example.com",
      "role": "member",
      "avatar": null
    },
    "token": "jwt-token-string"
  }
}
```

**错误响应：**

| 状态码 | 说明 |
|--------|------|
| 400 | 输入验证失败 |
| 401 | 邮箱或密码错误 |

---

### 获取当前用户

获取当前登录用户的信息。

**请求：**

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**成功响应：**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "username": "testuser",
    "email": "test@example.com",
    "role": "member",
    "avatar": null,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应：**

| 状态码 | 说明 |
|--------|------|
| 401 | 未授权（令牌无效或过期） |
| 404 | 用户不存在 |

---

### 更新用户资料

更新当前用户的资料信息。

**请求：**

```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newusername",
  "avatar": "https://example.com/avatar.png"
}
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 否 | 新用户名，3-20字符 |
| avatar | string | 否 | 头像URL |

**成功响应：**

```json
{
  "success": true,
  "message": "资料更新成功",
  "data": {
    "id": "uuid-string",
    "username": "newusername",
    "email": "test@example.com",
    "role": "member",
    "avatar": "https://example.com/avatar.png",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应：**

| 状态码 | 说明 |
|--------|------|
| 400 | 没有要更新的内容 |
| 401 | 未授权 |
| 409 | 用户名已被使用 |

---

### 修改密码

修改当前用户的密码。

**请求：**

```http
PUT /api/auth/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| currentPassword | string | 是 | 当前密码 |
| newPassword | string | 是 | 新密码，至少8字符，需包含大小写字母和数字 |

**成功响应：**

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

**错误响应：**

| 状态码 | 说明 |
|--------|------|
| 400 | 输入验证失败 |
| 401 | 当前密码错误 |

---

## 成员接口

### 获取成员列表

获取所有团队成员列表。

**请求：**

```http
GET /api/members
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 |
| role | string | - | 按角色筛选 |

**成功响应：**

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "uuid-string",
        "name": "成员名称",
        "role": "指挥官",
        "avatar": "https://example.com/avatar.png",
        "bio": "个人简介",
        "join_date": "2024-01-01",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

### 获取成员详情

获取指定成员的详细信息。

**请求：**

```http
GET /api/members/:id
```

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 成员ID |

**成功响应：**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "成员名称",
    "role": "指挥官",
    "avatar": "https://example.com/avatar.png",
    "bio": "个人简介",
    "join_date": "2024-01-01",
    "skills": ["战斗", "采矿"],
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应：**

| 状态码 | 说明 |
|--------|------|
| 404 | 成员不存在 |

---

### 创建成员

创建新成员（需要管理员权限）。

**请求：**

```http
POST /api/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新成员",
  "role": "飞行员",
  "avatar": "https://example.com/avatar.png",
  "bio": "个人简介",
  "join_date": "2024-01-01"
}
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 成员名称 |
| role | string | 是 | 角色 |
| avatar | string | 否 | 头像URL |
| bio | string | 否 | 个人简介 |
| join_date | string | 否 | 加入日期 |

**成功响应：**

```json
{
  "success": true,
  "message": "成员创建成功",
  "data": {
    "id": "uuid-string",
    "name": "新成员",
    "role": "飞行员",
    ...
  }
}
```

---

### 更新成员

更新成员信息（需要管理员权限）。

**请求：**

```http
PUT /api/members/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新后的名称",
  "role": "新角色"
}
```

---

### 删除成员

删除成员（需要管理员权限）。

**请求：**

```http
DELETE /api/members/:id
Authorization: Bearer <token>
```

**成功响应：**

```json
{
  "success": true,
  "message": "成员删除成功"
}
```

---

## 项目接口

### 获取项目列表

获取所有活动项目列表。

**请求：**

```http
GET /api/projects
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 |
| status | string | - | 按状态筛选（active/completed） |

**成功响应：**

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid-string",
        "title": "项目名称",
        "description": "项目描述",
        "status": "active",
        "progress": 75,
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

### 获取项目详情

获取指定项目的详细信息。

**请求：**

```http
GET /api/projects/:id
```

**成功响应：**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "项目名称",
    "description": "项目描述",
    "status": "active",
    "progress": 75,
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "participants": ["成员1", "成员2"],
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-06-01T00:00:00.000Z"
  }
}
```

---

### 创建项目

创建新项目（需要管理员权限）。

**请求：**

```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新项目",
  "description": "项目描述",
  "status": "active",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

---

### 更新项目

更新项目信息（需要管理员权限）。

**请求：**

```http
PUT /api/projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "更新后的项目名",
  "progress": 80
}
```

---

### 删除项目

删除项目（需要管理员权限）。

**请求：**

```http
DELETE /api/projects/:id
Authorization: Bearer <token>
```

---

## 飞行员接口

### 获取飞行员列表

获取所有王牌飞行员列表。

**请求：**

```http
GET /api/pilots
```

**成功响应：**

```json
{
  "success": true,
  "data": {
    "pilots": [
      {
        "id": "uuid-string",
        "name": "飞行员名称",
        "callsign": "代号",
        "avatar": "https://example.com/avatar.png",
        "specialty": "战斗专家",
        "flight_hours": 1000,
        "achievements": ["成就1", "成就2"],
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 获取飞行员详情

获取指定飞行员的详细信息。

**请求：**

```http
GET /api/pilots/:id
```

---

### 创建飞行员

创建新飞行员（需要管理员权限）。

**请求：**

```http
POST /api/pilots
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新飞行员",
  "callsign": "Alpha",
  "specialty": "战斗专家",
  "flight_hours": 500
}
```

---

### 更新飞行员

更新飞行员信息（需要管理员权限）。

**请求：**

```http
PUT /api/pilots/:id
Authorization: Bearer <token>
```

---

### 删除飞行员

删除飞行员（需要管理员权限）。

**请求：**

```http
DELETE /api/pilots/:id
Authorization: Bearer <token>
```

---

## 申请接口

### 获取申请列表

获取入队申请列表（需要管理员权限）。

**请求：**

```http
GET /api/applications
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 |
| status | string | - | 按状态筛选（pending/approved/rejected） |

**成功响应：**

```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "uuid-string",
        "name": "申请人",
        "email": "applicant@example.com",
        "game_id": "游戏ID",
        "experience": "游戏经验",
        "motivation": "申请动机",
        "status": "pending",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 30,
      "totalPages": 2
    }
  }
}
```

---

### 获取申请详情

获取指定申请的详细信息。

**请求：**

```http
GET /api/applications/:id
```

---

### 提交申请

提交入队申请。

**请求：**

```http
POST /api/applications
Content-Type: application/json

{
  "name": "申请人",
  "email": "applicant@example.com",
  "game_id": "游戏ID",
  "experience": "3年游戏经验",
  "motivation": "希望加入团队"
}
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 申请人姓名 |
| email | string | 是 | 邮箱地址 |
| game_id | string | 是 | 游戏内ID |
| experience | string | 是 | 游戏经验 |
| motivation | string | 是 | 申请动机 |

**成功响应：**

```json
{
  "success": true,
  "message": "申请提交成功",
  "data": {
    "id": "uuid-string",
    "status": "pending"
  }
}
```

---

### 更新申请状态

更新申请状态（需要管理员权限）。

**请求：**

```http
PUT /api/applications/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",
  "note": "欢迎加入！"
}
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 状态：pending/approved/rejected |
| note | string | 否 | 审核备注 |

---

### 删除申请

删除申请（需要管理员权限）。

**请求：**

```http
DELETE /api/applications/:id
Authorization: Bearer <token>
```

---

## 统计接口

### 获取统计数据

获取团队统计数据。

**请求：**

```http
GET /api/stats
```

**成功响应：**

```json
{
  "success": true,
  "data": {
    "members": {
      "total": 50,
      "active": 45
    },
    "projects": {
      "total": 10,
      "active": 5,
      "completed": 5
    },
    "applications": {
      "pending": 3,
      "approved": 20,
      "rejected": 5
    },
    "pilots": {
      "total": 15
    }
  }
}
```

---

## AI 接口（v1.5.0）

> v1.5.0 新增，用于 AI 招募官（对话式 RAG Agent）。所有 AI 接口**无需 JWT 鉴权**（公开访问，适合访客页面直接调用），响应为**裸 JSON**（非统一包装格式 `{success, message, data}`），与业务接口不同。
>
> 前置条件：`server/.env` 配置了 `DOUBAO_API_KEY` / `DEEPSEEK_API_KEY` / `ANTHROPIC_API_KEY` 中至少一个，且 PostgreSQL（pgvector）与 Redis 可达。未配置 Provider 时 `/recruiter/*` 返回 `503`。

### AI 接口一览

| 方法 | 路径 | 说明 | 鉴权 |
|:---|:---|:---|:---|
| GET | `/api/v1/ai/health` | AI 服务健康检查（已启用 Provider + 模型配置） | 无 |
| POST | `/api/v1/ai/retrieve` | RAG 检索 + 非流式回答 | 无 |
| POST | `/api/v1/ai/recruiter/session` | 创建招募官会话 | 无 |
| POST | `/api/v1/ai/recruiter/chat` | SSE 流式对话（限流 10 次/分钟/IP） | 无 |
| GET | `/api/v1/ai/recruiter/suggest` | 获取推荐问题 | 无 |

### 获取 AI 服务健康状态

```
GET /api/v1/ai/health
```

返回已启用的 Provider 列表与模型配置（用于前端/监控判断 AI 服务是否可用）。

**成功响应（200）：**

```json
{
  "status": "ok",
  "providers": ["doubao", "deepseek"],
  "models": {
    "chat": "doubao-pro-32k-241215",
    "chatStream": "deepseek-chat",
    "embedding": "doubao-embedding-text-240715"
  }
}
```

> `providers` 仅包含已配置 `API_KEY + BASE_URL` 的 Provider（未配置的不会出现在列表中）。

### RAG 检索问答

```
POST /api/v1/ai/retrieve
Content-Type: application/json
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|:---|:---|:---|:---|
| `question` | string | ✅ | 用户问题 |
| `history` | array | 否 | 对话历史 `[{role, content}]`，默认 `[]` |
| `sourceType` | string | 否 | 知识来源过滤（`ship` / `event` / `guild_info` / `faq`） |

**成功响应（200）——裸 JSON：**

```json
{
  "content": "我们舰队的战斗编队…",
  "sources": [
    {
      "id": 12,
      "content": "舰队主力…",
      "sourceType": "guild_info",
      "sourceId": "3",
      "metadata": {},
      "similarity": 0.83
    }
  ],
  "usage": { "totalTokens": 340 }
}
```

- `sources`：pgvector 检索到的 top-5 知识切片（按余弦相似度降序），可能为空数组（检索失败或知识库为空时降级，LLM 用无 RAG 上下文回答）。
- `usage.totalTokens`：LLM 消耗 token 数（Provider 未返回时可能缺失）。

**错误响应：**

| 状态码 | 场景 |
|:---|:---|
| 400 | `question` 缺失或非字符串 |
| 500 | RAG/LLM 调用失败（消息 `AI 服务暂时不可用`） |

### 创建招募官会话

```
POST /api/v1/ai/recruiter/session
```

**成功响应（200）——裸 JSON：**

```json
{
  "sessionId": "recruiter:550e8400-e29b-41d4-a716-446655440000",
  "welcome": "欢迎来到我们的公会。我是 AI 指挥官,你想了解什么?"
}
```

- `sessionId`：会话标识，后续 chat/suggest 均需携带；Redis 中 TTL **24 小时**。

**错误响应：**

| 状态码 | 场景 |
|:---|:---|
| 500 | 创建失败（Redis 不可用等） |
| 503 | 招募官服务未启用（未配置任何 Provider） |

### 招募官流式对话（SSE）

```
POST /api/v1/ai/recruiter/chat
Content-Type: application/json
```

> ⚠️ **限流**：未登录匿名访问 **10 次/分钟/IP**，超限返回 `429` `{"error":"请求过于频繁,请稍后再试"}`。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|:---|:---|:---|:---|
| `sessionId` | string | ✅ | 来自 `/recruiter/session` |
| `message` | string | ✅ | 用户消息，**最长 500 字**，超出返回 400 |

**响应：** `Content-Type: text/event-stream`（SSE 格式），事件流如下（顺序固定）：

| 事件 | data 内容 | 说明 |
|:---|:---|:---|
| `token` | `{"content": "..."}` | 流式回复分片，可多次出现，前端累加渲染 |
| `metadata` | `{"profile": {...}, "turnCount": n}` | 流结束后发送更新后的用户画像与轮次 |
| `done` | `{"sessionId": "..."}` | 正常结束标记 |
| `error` | `{"error": "AI 服务暂时不可用"}` | 服务端异常（发送后连接关闭） |

**完整示例：**

```
event: token
data: {"content":"你好，"}

event: token
data: {"content":"欢迎加入"}

event: metadata
data: {"profile":{"playStyle":["pvp"],"timeCommit":"每周10小时","shipPref":["F8C Lightning"],"skillLevel":""},"turnCount":2}

event: done
data: {"sessionId":"recruiter:550e8400-e29b-41d4-a716-446655440000"}
```

**画像（`profile`）字段：**

| 字段 | 类型 | 取值范围 |
|:---|:---|:---|
| `playStyle` | string[] | `pvp` / `trade` / `exploration` / `mining`（关键词匹配，可多值） |
| `timeCommit` | string | 形如 `每周10小时`（正则提取，空串表示未提取到） |
| `shipPref` | string[] | 舰船名（如 `F8C Lightning`、`Arrow`、`Prospector`），空数组表示未提取到 |
| `skillLevel` | string | `veteran` / `beginner` / `intermediate`（空串表示未提取到） |

> 前端消费方式：`fetch + ReadableStream reader` 逐行解析 `event:` / `data:`（**不能用 EventSource**，因需要 POST + 自定义 body）。参考 `src/composables/useAiRecruiter.js`。

**错误响应（非 SSE，普通 JSON）：**

| 状态码 | 场景 |
|:---|:---|
| 400 | `sessionId` / `message` 缺失，或消息超过 500 字 |
| 429 | 超过限流（10 次/分钟/IP） |
| 503 | 招募官服务未启用 |
| 200+SSE error 事件 | 会话不存在或服务内部错误（流内透传） |

### 获取推荐问题

```
GET /api/v1/ai/recruiter/suggest?sessionId=recruiter:550e8400-...
```

**成功响应（200）——裸 JSON：**

```json
{
  "suggestions": ["你们有 PVP 训练吗?", "如何加入公会?", "提交申请"]
}
```

**推荐逻辑**（`RecruiterService.getSuggestions`）：
- 基于画像 `playStyle` 各取 1 条对应话题推荐（如 pvp → PVP 训练/战斗编队）；
- 不足 3 条时用默认推荐补齐（加入流程 / 活动时间 / 舰船）；
- 会话轮次 ≥ 3 时追加 `提交申请`（引导转化），最多返回 4 条；
- 会话不存在时返回默认 3 条。

**错误响应：**

| 状态码 | 场景 |
|:---|:---|
| 400 | 缺少 `sessionId` 查询参数 |
| 500 | 获取失败 |
| 503 | 招募官服务未启用 |

---

## 错误处理

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 验证失败 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述",
  "errors": [
    {
      "field": "email",
      "message": "请输入有效的邮箱地址"
    }
  ]
}
```

### 速率限制

API实施速率限制：

- **窗口期**：15分钟
- **最大请求数**：100次

超出限制时返回：

```json
{
  "success": false,
  "message": "请求过于频繁，请稍后再试"
}
```

---

## 数据类型

### User（用户）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 用户唯一标识 |
| username | string | 用户名 |
| email | string | 邮箱地址 |
| role | string | 角色（member/admin） |
| avatar | string | 头像URL |
| created_at | string | 创建时间 |

### Member（成员）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 成员唯一标识 |
| name | string | 成员名称 |
| role | string | 团队角色 |
| avatar | string | 头像URL |
| bio | string | 个人简介 |
| join_date | string | 加入日期 |
| skills | array | 技能列表 |

### Project（项目）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 项目唯一标识 |
| title | string | 项目名称 |
| description | string | 项目描述 |
| status | string | 状态（active/completed） |
| progress | number | 进度百分比 |
| start_date | string | 开始日期 |
| end_date | string | 结束日期 |

### Pilot（飞行员）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 飞行员唯一标识 |
| name | string | 飞行员名称 |
| callsign | string | 代号 |
| avatar | string | 头像URL |
| specialty | string | 专长 |
| flight_hours | number | 飞行时长 |
| achievements | array | 成就列表 |

### Application（申请）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 申请唯一标识 |
| name | string | 申请人姓名 |
| email | string | 邮箱地址 |
| game_id | string | 游戏ID |
| experience | string | 游戏经验 |
| motivation | string | 申请动机 |
| status | string | 状态（pending/approved/rejected） |
| created_at | string | 创建时间 |

---

## 健康检查

### 检查服务状态

**请求：**

```http
GET /health
```

**成功响应：**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 86400
}
```
