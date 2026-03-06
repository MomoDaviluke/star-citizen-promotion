# API 参考文档

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
| `member` | 普通成员 | 访问公开接口 |
| `admin` | 管理员 | 访问所有接口 |

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
