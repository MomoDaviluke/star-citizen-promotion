---
name: express-security-hardening
description: "加固 Express 应用安全基线。覆盖 JWT httpOnly Cookie 迁移、CSRF 双验证、Zod 输入校验中间件、Helmet 生产配置、分层 rate limiting、审计日志设计、统一错误处理。用于 Express/Node.js 后端上线前的安全审查与加固。Triggers: 安全加固, 安全检查, JWT 安全, CSRF 防护, 输入校验, rate limiting, helmet 配置, 审计日志, 后端安全, express 安全, API 安全, 生产环境安全, security hardening, secure express, input validation middleware. Do NOT trigger for: 什么是 JWT, 什么是 XSS 等基础概念教学, 前端 XSS 防护, 网络层防火墙配置."
default-enabled: false
---

# Express 安全加固指南

为 Express 应用提供生产级安全基线的标准化加固路径。本 skill 假定你已经有一个能跑的 Express 应用，需要把它加固到可以放心上线的水平。

**本 skill 不覆盖**：OAuth2/SSO 集成、WAF/DDoS 等网络层防护、前端安全（XSS/CSP 在浏览器侧的细节）、安全基础概念科普。

**与其他 skill 的协作**：完成加固后，用 verification-before-completion 验证所有改动；遇到加固引入的 bug，用 systematic-debugging 排查。

---

## 加固优先级

按攻击面从大到小排列。如果时间有限，至少完成前 4 项。

```
JWT 存储迁移  >  CSRF 防护  >  输入校验  >  Helmet 配置
        ↓
Rate Limiting  >  审计日志  >  错误处理收敛
```

---

## 一、JWT 存储：从 localStorage 迁移到 httpOnly Cookie

### 为什么

localStorage 可被任何 JS 读取，一次成功的 XSS 就能偷走所有用户的 token。httpOnly Cookie 对 JS 完全不可见，XSS 即使成功也无法窃取认证凭证。

### 后端改造

```javascript
// 登录成功时设置 Cookie 而非返回 token body
const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
  expiresIn: '7d',
})

res.cookie('auth_token', token, {
  httpOnly: true,        // JS 不可读
  secure: true,          // 仅 HTTPS
  sameSite: 'strict',    // 防 CSRF（第一步）
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
})

res.json({ success: true, data: { user: sanitizeUser(user) } })
```

Cookie 配置的三个关键决策：

- **sameSite: 'strict'** 提供了基础 CSRF 防护，但如果你的前端和后端在不同子域名，需要用 'lax' 或 'none'（配合 secure: true）
- **secure: true** 要求 HTTPS。开发环境可以通过 req.secure || req.headers['x-forwarded-proto'] === 'https' 判断，Nginx 反向代理后面设置 app.set('trust proxy', 1)
- **maxAge** 与 JWT 的 expiresIn 保持一致

### 前端改造
移除 localStorage 读写 token 的代码。移除 axios 拦截器中手动添加 Authorization header 的逻辑。fetch/axios 请求默认携带 Cookie（same-origin），跨域需设置 credentials: 'include'。

### 登出

```javascript
res.clearCookie('auth_token', {
  httpOnly: true, secure: true, sameSite: 'strict', path: '/',
})
```

---

## 二、CSRF 防护

### 为什么

即使 JWT 存入了 httpOnly Cookie，攻击者仍然可以在第三方网站发起跨域请求，浏览器会自动携带 Cookie，导致未授权操作。sameSite: 'strict' 能挡住大部分场景，但对同站（子域名）攻击无效，对旧浏览器也不兼容。需要叠加 CSRF token 作为双保险。

### 推荐模式：SameSite Cookie + CSRF Token 双验证

```javascript
const crypto = require('crypto')

function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()

  const token = req.headers['x-csrf-token']
  const cookieToken = req.cookies['csrf_token']

  if (!token || !cookieToken || token !== cookieToken) {
    return res.status(403).json({ success: false, error: 'CSRF token 验证失败' })
  }
  next()
}

function setCsrfToken(res) {
  const token = crypto.randomBytes(32).toString('hex')
  res.cookie('csrf_token', token, {
    httpOnly: false, secure: true, sameSite: 'strict', maxAge: 3600000,
  })
}
```

### 前端配合
前端从 Cookie 读取 csrf_token，非 GET 请求放入 x-csrf-token 请求头。

---

## 三、输入校验：Zod 中间件

### 为什么

散落在路由里的 if (!email) 校验容易遗漏、不一致、难以测试。把校验收敛到一个可复用的中间件里，schema 即文档，校验即类型守卫。

### 可复用的 validate 中间件

```javascript
const { ZodError } = require('zod')

function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source])
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: '请求参数校验失败',
          details: error.errors.map((e) => ({
            field: e.path.join('.'), message: e.message,
          })),
        })
      }
      next(error)
    }
  }
}
```

### Schema 定义示例

```javascript
const { z } = require('zod')

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位').max(128),
})

const registerSchema = z.object({
  username: z.string().min(2).max(50)
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名包含非法字符'),
  email: z.string().email(),
  password: z.string().min(8).max(128),
})
```

### 路由中使用

```javascript
router.post('/login', validate(loginSchema), authController.login)
router.get('/members', validate(paginationSchema, 'query'), memberController.list)
```

---

## 四、Helmet 安全头

### 生产配置模板

```javascript
const helmet = require('helmet')

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.API_URL].filter(Boolean),
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))
```

关键注意事项：CSP 需要根据实际静态资源来源调整；开发环境可能不需要 HSTS；纯 API 后端 CSP 可以更宽松。

---

## 五、Rate Limiting 分层策略

### 分层配置

```javascript
const rateLimit = require('express-rate-limit')

const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 })
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, skipSuccessfulRequests: false })
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 })

app.use('/api/', publicLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/admin', adminLimiter)
```

---

## 六、审计日志

设计原则：自动拦截写操作、敏感字段脱敏、异步写入不阻塞请求、设置存储上限和归档策略。

中间件监听 res.on('finish') 事件，只记录非 GET 请求，敏感字段（password/token/secret）替换为 ***REDACTED***，fire-and-forget 异步写入数据库。

存储上限：CREATE EVENT 每天清理 90 天前的日志。量大时考虑按月分表或迁移到 Elasticsearch/Loki。

---

## 七、统一错误处理

错误响应信封：{ success: false, error: "描述" }。生产环境隐藏堆栈。自定义 ApiError 类提供 badRequest/unauthorized/forbidden/notFound/conflict/tooMany 工厂方法。

---

## 加固检查清单

- [ ] JWT 从 localStorage 迁移到 httpOnly + secure + sameSite Cookie
- [ ] CSRF token 双验证已启用
- [ ] 所有路由有 Zod schema 校验
- [ ] Helmet 已配置 CSP、HSTS、frameguard
- [ ] 认证接口有严格 rate limiting
- [ ] 审计日志自动记录写操作并脱敏、有清理策略
- [ ] 全局错误处理不泄露堆栈
- [ ] trust proxy 已设置
- [ ] npm audit 零高危