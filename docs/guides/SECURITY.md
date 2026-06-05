# 安全体系文档

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-05-31
> **版本**: v1.3.1

---

## 安全架构总览

```
┌─────────────────────────────────────────────────────┐
│                    Nginx 层                          │
│  HTTPS 强制跳转 · HSTS · CSP · 安全头 · 限流         │
├─────────────────────────────────────────────────────┤
│                  Express 层                          │
│  Helmet 安全头 · CORS 白名单 · 请求体限制 · 压缩      │
├─────────────────────────────────────────────────────┤
│                  中间件层                             │
│  JWT 认证 · 角色鉴权 · 速率限制 · 输入校验 · 审计日志  │
├─────────────────────────────────────────────────────┤
│                  数据层                              │
│  参数化查询 · bcrypt 密码哈希 · 敏感数据脱敏           │
└─────────────────────────────────────────────────────┘
```

---

## 认证与授权

### JWT 认证流程

```
注册/登录 → 密码 bcrypt 比对 → 签发 JWT → 前端存储 Token
                                                ↓
后续请求 → Authorization: Bearer <token> → auth 中间件验证
                                                ↓
                                    jwt.verify() 签名校验
                                                ↓
                                    查询数据库确认用户仍存在
                                                ↓
                                    注入 req.user { id, role }
```

**关键实现**（`server/src/middleware/auth.ts`）：

- Token 来源：Cookie `auth_token` 或 `Authorization: Bearer` header
- 签名算法：HS256
- 验证后查询数据库，防止已删除用户的 Token 继续有效
- 错误区分：过期 → 401 "令牌已过期"，无效 → 401 "无效的认证令牌"

### 角色权限模型

| 角色 | 权限范围 |
|:---|:---|
| `member` | 公开接口、个人资料 |
| `officer` | + 成员管理、申请审批 |
| `admin` | + 系统管理、数据管理、管理员操作 |

### 中间件使用方式

```typescript
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js'

// 强制认证
router.get('/profile', authenticate, handler)

// 可选认证（有 token 则解析，无 token 也可访问）
router.get('/public', optionalAuth, handler)

// 角色鉴权
router.delete('/admin/users', authenticate, requireRole('admin'), handler)
```

---

## 密码安全

| 措施 | 实现 |
|:---|:---|
| 哈希算法 | bcryptjs，salt rounds 默认 12 |
| 密码要求 | 至少 8 字符，需包含大小写字母和数字 |
| 存储方式 | 仅存储哈希值，不存储明文 |
| 传输安全 | HTTPS 加密传输 |
| 脱敏处理 | 日志中密码字段显示为 `***REDACTED***` |

---

## HTTP 安全头

### Helmet 中间件

项目使用 Helmet 设置以下安全头：

| Header | 值 | 作用 |
|:---|:---|:---|
| `X-Frame-Options` | `SAMEORIGIN` | 防止点击劫持 |
| `X-Content-Type-Options` | `nosniff` | 防止 MIME 类型嗅探 |
| `X-XSS-Protection` | `1; mode=block` | XSS 过滤 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 控制 Referer 信息泄露 |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | 强制 HTTPS |
| `Content-Security-Policy` | 见下方 | 限制资源加载来源 |

### Cookie 安全属性

| 属性 | 生产环境值 | 说明 |
|:---|:---|:---|
| `httpOnly` | `true` | 禁止 JavaScript 读取 Cookie |
| `secure` | `true` | 仅通过 HTTPS 传输 |
| `sameSite` | `strict` | 防止 CSRF 攻击 |
| `maxAge` | 7 天 | 与 JWT 过期时间一致 |

### CSP 策略

```
default-src 'self';
style-src 'self' 'unsafe-inline';
script-src 'self';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self' {FRONTEND_URL} ws: wss:;
media-src 'self';
frame-src 'none';
object-src 'none'
```

- `{FRONTEND_URL}` 为 `config.frontendUrl` 的实际值（生产环境为前端域名）
- `connect-src` 允许 WebSocket 连接（`ws:` / `wss:`）和前端域名跨域请求
- `frame-src 'none'` 完全禁止 iframe 嵌入
- `unsafe-inline` 仅用于样式（部分组件使用内联样式）

---

## CORS 策略

```typescript
// server/src/index.ts
app.use(cors({
  origin: config.allowedOrigins,  // 白名单，来自 ALLOWED_ORIGINS 环境变量
  credentials: true               // 允许 Cookie
}))
```

**生产环境**务必在 `server/.env` 中设置 `ALLOWED_ORIGINS` 为实际域名，不要使用 `*`。

---

## 速率限制

分层限流策略：

| 层级 | 窗口 | 最大请求数 | 适用范围 |
|:---|:---|:---|:---|
| 全局限流 | 15 分钟 | 100（管理员 1000） | 所有 `/api/*` 请求 |
| 认证限流 | 15 分钟 | 10 | `/api/auth/login`、`/api/auth/register` |
| 刷新限流 | 1 小时 | 60 | `/api/auth/refresh` |

超限返回 `429 Too Many Requests`。

---

## 输入校验

使用 `express-validator` 进行服务端输入校验：

```typescript
import { body, validationResult } from 'express-validator'

router.post('/register',
  [
    body('username').trim().isLength({ min: 3, max: 20 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/[a-z]/).matches(/[A-Z]/).matches(/[0-9]/)
  ],
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }
    // ...
  }
)
```

---

## SQL 注入防护

所有数据库查询使用参数化查询（`?` 占位符），禁止字符串拼接：

```typescript
// ✅ 安全：参数化查询
const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId])

// ❌ 危险：字符串拼接（本项目中不存在此模式）
// const user = await queryOne(`SELECT * FROM users WHERE id = ${userId}`)
```

---

## 审计日志

`auditLogger` 中间件自动拦截写操作（POST/PUT/PATCH/DELETE）并写入 `activity_logs` 表：

| 记录内容 | 说明 |
|:---|:---|
| 操作类型 | create / update / delete / password_change |
| 实体类型 | 从 URL 自动识别（member/pilot/project/application/user） |
| 用户 ID | 从 `req.user.id` 获取 |
| IP 地址 | `req.ip` |
| User-Agent | 请求头 |
| 变更内容 | 请求体（敏感字段自动脱敏） |

**脱敏字段列表**：password、token、secret、apikey、credential、ssn、creditcard 等。

审计日志异步写入，不阻塞 API 响应。

---

## 安全扫描

### CI/CD 安全流水线

| 扫描工具 | 触发条件 | 审计级别 | 阻断合并 |
|:---|:---|:---|:---|
| `npm audit` | 每次 push/PR | `high` | ✅ 是 |
| Snyk | 每次 push/PR（需配置 `SNYK_TOKEN`） | 高危 | 信息性 |
| CodeQL | 定时 + push | 静态分析 | ✅ 是 |

### Git 钩子

| 钩子 | 检查内容 |
|:---|:---|
| `pre-commit` | 敏感信息检测（密钥、密码、Token 模式匹配） |
| `pre-push` | 测试通过 + 漏洞审计 |

### 本地安全检查

```bash
# 前端依赖审计
npm audit --audit-level=high

# 后端依赖审计
cd server && npm audit --audit-level=high

# 修复已知漏洞
npm audit fix
```

---

## 敏感信息管理

### 环境变量

| 变量 | 要求 | 说明 |
|:---|:---|:---|
| `JWT_SECRET` | ≥32 字符随机字符串 | JWT 签名密钥 |
| `DB_PASSWORD` | 强密码 | 数据库密码 |
| `ALLOWED_ORIGINS` | 精确域名 | CORS 白名单 |

**生成强密钥**：

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

### 禁止提交的文件

`.gitignore` 已配置排除：

```
.env
.env.local
.env.*.local
server/.env
server/.env.local
*.pem
*.key
```

---

## 生产环境安全检查清单

- [ ] `JWT_SECRET` 使用 ≥32 字符随机密钥
- [ ] `DB_PASSWORD` 使用强密码
- [ ] `ALLOWED_ORIGINS` 设置为实际域名（非 `*`）
- [ ] HTTPS 已启用，HTTP 已重定向
- [ ] SSL 证书有效且未过期
- [ ] MySQL 端口未暴露到公网（`127.0.0.1:3306`）
- [ ] `NODE_ENV=production`
- [ ] 调试模式已关闭
- [ ] `npm audit` 零高危漏洞
- [ ] Docker 以非 root 用户运行
- [ ] 日志中无敏感信息泄露
