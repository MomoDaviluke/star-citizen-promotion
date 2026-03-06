# 开发指南文档

本文档为开发者提供详细的开发指南，帮助快速理解和参与项目开发。

## 目录

- [开发环境搭建](#开发环境搭建)
- [项目架构详解](#项目架构详解)
- [前端开发指南](#前端开发指南)
- [后端开发指南](#后端开发指南)
- [服务层详解](#服务层详解)
- [测试指南](#测试指南)
- [调试技巧](#调试技巧)
- [最佳实践](#最佳实践)

---

## 开发环境搭建

### 必需软件

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | ^20.19.0 或 >=22.12.0 | JavaScript运行环境 |
| npm | ≥9.0.0 | 包管理器 |
| MySQL | ≥8.0 | 数据库服务 |
| Git | ≥2.0 | 版本控制 |

### 推荐IDE配置

**VS Code 扩展：**

- Vue - Official (Vue.volar)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- EditorConfig (EditorConfig.EditorConfig)

**VS Code settings.json：**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### 初始化项目

```bash
# 1. 克隆项目
git clone https://github.com/MomoDaviluke/star-citizen-promotion.git
cd star-citizen-promotion

# 2. 安装前端依赖
npm install

# 3. 安装后端依赖
cd server && npm install && cd ..

# 4. 配置环境变量
cp .env.example .env.development
cp server/.env.example server/.env.development

# 5. 编辑 server/.env.development 配置数据库

# 6. 初始化数据库
cd server && npm run db:init && cd ..

# 7. 启动开发服务
# 终端1: cd server && npm run dev
# 终端2: npm run dev
```

---

## 项目架构详解

### 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vue 3)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Views  │  │Components│  │Services │  │Composables│      │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       └────────────┴────────────┴────────────┘              │
│                         │                                    │
│                    Router + Store                            │
│                         │                                    │
└─────────────────────────┼───────────────────────────────────┘
                          │
                     HTTP/REST
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                         ▼                                    │
│                   后端 API (Express.js)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Routes │  │Middleware│  │  Utils  │  │ Config  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       └────────────┴────────────┴────────────┘              │
│                         │                                    │
│                    MySQL Pool                                │
└─────────────────────────┼───────────────────────────────────┘
                          │
                     MySQL 数据库
```

### 目录结构详解

```
star-citizen-promotion/
├── src/                           # 前端源码
│   ├── components/                # 组件目录
│   │   ├── common/                # 通用组件
│   │   │   ├── ErrorBoundary.vue  # 错误边界
│   │   │   ├── LoadingIndicator.vue # 加载指示器
│   │   │   ├── PageTitle.vue      # 页面标题
│   │   │   └── PageTransition.vue # 页面过渡
│   │   └── layout/                # 布局组件
│   │       ├── SiteHeader.vue     # 网站头部
│   │       └── SiteFooter.vue     # 网站页脚
│   ├── composables/               # 组合式函数
│   │   ├── useAI.js               # AI服务封装
│   │   └── index.js               # 导出模块
│   ├── config/                    # 配置文件
│   │   ├── site.config.js         # 站点配置
│   │   └── index.js               # 配置导出
│   ├── data/                      # 静态数据
│   │   └── siteContent.js         # 站点内容
│   ├── router/                    # 路由配置
│   │   └── index.js               # 路由定义
│   ├── services/                  # 服务层
│   │   ├── AIService.js           # AI服务核心
│   │   ├── PriorityQueue.js       # 优先级队列
│   │   ├── ResourceMonitor.js     # 资源监控
│   │   ├── authService.js         # 认证服务
│   │   ├── dataService.js         # 数据服务
│   │   ├── http.js                # HTTP客户端
│   │   └── index.js               # 服务导出
│   ├── styles/                    # 样式文件
│   │   └── base.css               # 基础样式
│   ├── views/                     # 页面视图
│   │   ├── admin/                 # 管理后台
│   │   └── *.vue                  # 各页面组件
│   ├── App.vue                    # 根组件
│   └── main.js                    # 应用入口
│
├── server/                        # 后端源码
│   ├── src/
│   │   ├── config/                # 配置
│   │   │   └── index.js           # 配置加载
│   │   ├── database/              # 数据库
│   │   │   ├── init.js            # 初始化
│   │   │   ├── migrate.js         # 迁移
│   │   │   ├── pool.js            # 连接池
│   │   │   └── seed.js            # 种子数据
│   │   ├── middleware/            # 中间件
│   │   │   ├── auth.js            # JWT认证
│   │   │   ├── errorHandler.js    # 错误处理
│   │   │   └── requestLogger.js   # 请求日志
│   │   ├── routes/                # API路由
│   │   │   ├── applications.js    # 申请管理
│   │   │   ├── auth.js            # 用户认证
│   │   │   ├── members.js         # 成员管理
│   │   │   ├── pilots.js          # 飞行员管理
│   │   │   ├── projects.js        # 项目管理
│   │   │   └── stats.js           # 统计数据
│   │   └── index.js               # 服务入口
│   └── tests/                     # 后端测试
│
├── tests/                         # 前端测试
│   ├── components/                # 组件测试
│   ├── composables/               # 组合式函数测试
│   ├── config/                    # 配置测试
│   ├── router/                    # 路由测试
│   ├── services/                  # 服务测试
│   └── views/                     # 视图测试
│
├── e2e/                           # E2E测试
│   ├── home.spec.js               # 首页测试
│   └── join.spec.js               # 申请页测试
│
└── docs/                          # 文档目录
    ├── API.md                     # API文档
    ├── CONFIG.md                  # 配置文档
    └── DEVELOPMENT.md             # 开发文档
```

---

## 前端开发指南

### 组件开发规范

#### 组件结构

```vue
<template>
  <div class="component-name">
    <!-- 模板内容 -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update', 'delete'])

const localState = ref(null)

const computedValue = computed(() => {
  return props.title.toUpperCase()
})

onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
.component-name {
  /* 组件样式 */
}
</style>
```

#### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `UserProfile.vue` |
| 组件注册 | PascalCase | `<UserProfile />` |
| Props | camelCase | `userName` |
| Events | kebab-case | `@update-user` |
| CSS类 | kebab-case | `.user-profile` |

### 路由开发

#### 添加新路由

1. 创建视图组件：

```vue
<!-- src/views/NewPage.vue -->
<template>
  <div class="new-page">
    <PageTitle title="新页面" />
    <!-- 页面内容 -->
  </div>
</template>

<script setup>
import PageTitle from '@/components/common/PageTitle.vue'
</script>
```

2. 注册路由：

```javascript
// src/router/index.js
const routes = [
  // ... 现有路由
  {
    path: '/new-page',
    name: '新页面',
    component: () => import('../views/NewPage.vue'),
    meta: { preload: true }
  }
]
```

3. 添加导航：

```javascript
// src/config/site.config.js
navigation: [
  // ... 现有导航
  { name: '新页面', path: '/new-page' }
]
```

#### 路由元信息

| Meta属性 | 说明 |
|----------|------|
| `preload: true` | 页面加载后预加载该路由 |
| `guest: true` | 仅限未登录用户访问 |
| `requiresAuth: true` | 需要登录认证 |
| `requiresAdmin: true` | 需要管理员权限 |

### 服务调用

#### HTTP请求

```javascript
import { http } from '@/services'

// GET请求
const data = await http.get('/api/members')

// POST请求
const result = await http.post('/api/applications', {
  name: '申请人',
  email: 'test@example.com'
})

// PUT请求
await http.put('/api/members/1', { name: '新名称' })

// DELETE请求
await http.delete('/api/members/1')
```

#### 认证服务

```javascript
import { authService } from '@/services'

// 登录
const user = await authService.login({
  email: 'user@example.com',
  password: 'password123'
})

// 注册
const newUser = await authService.register({
  username: 'newuser',
  email: 'new@example.com',
  password: 'password123'
})

// 登出
authService.logout()

// 获取当前用户
const currentUser = authService.getCurrentUser()

// 检查登录状态
const isLoggedIn = authService.isAuthenticated()
```

---

## 后端开发指南

### 路由开发

#### 创建新路由

```javascript
// server/src/routes/example.js
import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { query, queryOne } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/example
 * 获取列表
 */
router.get('/', async (req, res, next) => {
  try {
    const items = await query('SELECT * FROM example ORDER BY created_at DESC')
    res.json({
      success: true,
      data: items
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/example
 * 创建项目（需要认证）
 */
router.post('/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('名称不能为空'),
    body('description').optional().trim()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw ApiError.badRequest('输入验证失败', errors.array())
      }

      const { name, description } = req.body

      const result = await query(
        'INSERT INTO example (name, description) VALUES (?, ?)',
        [name, description]
      )

      res.status(201).json({
        success: true,
        message: '创建成功',
        data: { id: result.insertId, name, description }
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
```

#### 注册路由

```javascript
// server/src/index.js
import exampleRoutes from './routes/example.js'

// 注册路由
app.use('/api/example', exampleRoutes)
```

### 中间件使用

#### 认证中间件

```javascript
import { authenticate, optionalAuth, requireAdmin, requireRole } from '../middleware/auth.js'

// 需要登录
router.get('/protected', authenticate, handler)

// 可选认证（有token则解析，无token也可访问）
router.get('/public', optionalAuth, handler)

// 需要管理员权限
router.post('/admin', authenticate, requireAdmin, handler)

// 需要特定角色
router.put('/moderator', authenticate, requireRole('moderator'), handler)
```

### 数据库操作

```javascript
import { query, queryOne, insert, update, remove, transaction } from '../database/pool.js'

// 查询多条
const users = await query('SELECT * FROM users WHERE status = ?', ['active'])

// 查询单条
const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId])

// 插入
const insertId = await insert(
  'INSERT INTO users (name, email) VALUES (?, ?)',
  ['张三', 'zhang@example.com']
)

// 更新
const affectedRows = await update(
  'UPDATE users SET name = ? WHERE id = ?',
  ['李四', userId]
)

// 删除
const deletedRows = await remove('DELETE FROM users WHERE id = ?', [userId])

// 事务
await transaction(async (connection) => {
  await connection.execute('INSERT INTO orders ...')
  await connection.execute('UPDATE products SET stock = stock - 1 ...')
})
```

---

## 服务层详解

### AIService

AI服务提供任务队列管理、并发控制、超时处理和重试机制。

#### 基本使用

```javascript
import { aiService, PRIORITY } from '@/services/AIService'

// 提交任务
const result = await aiService.submit(async (context) => {
  const { signal, taskId } = context

  // 检查是否被取消
  if (signal.aborted) {
    throw new Error('Task cancelled')
  }

  // 执行异步操作
  const response = await fetch('/api/ai/generate', { signal })
  return response.json()
}, {
  priority: PRIORITY.HIGH,
  timeout: 60000,
  retries: 3
})
```

#### 任务优先级

| 优先级 | 值 | 说明 |
|--------|-----|------|
| CRITICAL | 4 | 最高优先级 |
| HIGH | 3 | 高优先级 |
| NORMAL | 2 | 普通优先级（默认） |
| LOW | 1 | 低优先级 |

#### 任务状态

| 状态 | 说明 |
|------|------|
| PENDING | 等待执行 |
| RUNNING | 正在执行 |
| COMPLETED | 执行完成 |
| FAILED | 执行失败 |
| TIMEOUT | 执行超时 |
| CANCELLED | 已取消 |

#### useAI 组合式函数

```vue
<script setup>
import { useAI } from '@/composables'

const { execute, isLoading, error, result, progress } = useAI()

const handleSubmit = async () => {
  await execute(async (context) => {
    // AI任务逻辑
    return data
  })
}
</script>

<template>
  <button @click="handleSubmit" :disabled="isLoading">
    {{ isLoading ? '处理中...' : '提交' }}
  </button>
  <p v-if="error">错误: {{ error.message }}</p>
  <p v-if="result">结果: {{ result }}</p>
</template>
```

### HTTP客户端

```javascript
import { http } from '@/services'

// 配置
http.setBaseUrl('https://api.example.com')
http.setTimeout(30000)

// 请求拦截
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.status === 401) {
      // 处理认证失败
    }
    return Promise.reject(error)
  }
)
```

---

## 测试指南

### 单元测试

#### 测试组件

```javascript
// tests/components/MyComponent.test.js
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('should render correctly', () => {
    const wrapper = mount(MyComponent, {
      props: {
        title: 'Test Title'
      }
    })

    expect(wrapper.find('h1').text()).toBe('Test Title')
  })
})
```

#### 测试服务

```javascript
// tests/services/myService.test.js
import { describe, it, expect, vi } from 'vitest'
import { myService } from '@/services'

describe('myService', () => {
  it('should fetch data correctly', async () => {
    const data = await myService.getData()
    expect(data).toBeDefined()
  })
})
```

### E2E测试

```javascript
// e2e/myPage.spec.js
import { test, expect } from '@playwright/test'

test.describe('我的页面测试', () => {
  test('应正确加载页面', async ({ page }) => {
    await page.goto('/my-page')
    await expect(page).toHaveTitle(/预期标题/)
  })

  test('应能提交表单', async ({ page }) => {
    await page.goto('/my-page')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')
    await expect(page.locator('.success-message')).toBeVisible()
  })
})
```

### 运行测试

```bash
# 单元测试
npm run test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage

# E2E测试
npm run test:e2e

# E2E测试UI模式
npm run test:e2e:ui

# 所有测试
npm run test:all
```

---

## 调试技巧

### 前端调试

#### Vue Devtools

安装Vue Devtools浏览器扩展，可以：
- 查看组件树
- 检查组件状态和props
- 追踪事件
- 查看路由状态

#### 控制台调试

```javascript
// 在组件中
import { getCurrentInstance } from 'vue'

const instance = getCurrentInstance()
console.log('Component instance:', instance)
```

#### 网络请求调试

```javascript
// 在 http.js 中添加日志
http.interceptors.request.use((config) => {
  console.log('Request:', config)
  return config
})

http.interceptors.response.use((response) => {
  console.log('Response:', response)
  return response
})
```

### 后端调试

#### 日志记录

```javascript
// server/src/middleware/requestLogger.js
console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
```

#### 数据库查询调试

```javascript
// 在 pool.js 中
export async function query(sql, params = []) {
  console.log('SQL:', sql)
  console.log('Params:', params)
  const [rows] = await connection.execute(sql, params)
  return rows
}
```

---

## 最佳实践

### 代码规范

1. **使用组合式API**：推荐使用 `<script setup>` 语法
2. **类型安全**：使用JSDoc或TypeScript提供类型提示
3. **组件拆分**：保持组件职责单一
4. **命名清晰**：使用有意义的变量和函数名

### 性能优化

1. **路由懒加载**：所有路由组件使用动态导入
2. **组件预加载**：标记关键路由 `meta.preload: true`
3. **图片优化**：使用适当尺寸和格式
4. **避免不必要的响应式**：使用 `shallowRef` 和 `markRaw`

### 安全建议

1. **输入验证**：前后端都要验证用户输入
2. **XSS防护**：使用Vue的模板语法自动转义
3. **CSRF防护**：使用SameSite Cookie
4. **敏感信息**：不要在前端存储敏感数据

### Git提交规范

遵循 Conventional Commits：

```
feat: 添加用户登录功能
fix(router): 修复页面跳转问题
docs: 更新API文档
style: 格式化代码
refactor(services): 重构AI服务
test: 添加登录测试
chore: 更新依赖版本
```

---

## 常见问题

### 开发环境问题

**Q: 热更新不生效？**

A: 检查以下项目：
1. 确保使用 `npm run dev` 启动开发服务器
2. 检查文件是否正确保存
3. 尝试重启开发服务器

**Q: 跨域请求失败？**

A: 确保Vite代理配置正确：

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

### 构建问题

**Q: 构建后路由不工作？**

A: 确保服务器配置了SPA回退：

```nginx
# nginx.conf
location / {
  try_files $uri $uri/ /index.html;
}
```

**Q: 构建产物过大？**

A: 检查代码分割配置，确保第三方库被正确分离。
