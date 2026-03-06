# 配置说明文档

本文档详细说明了星际公民战队宣传网站的所有配置选项。

## 目录

- [环境变量](#环境变量)
- [前端配置](#前端配置)
- [后端配置](#后端配置)
- [站点配置](#站点配置)
- [构建配置](#构建配置)
- [测试配置](#测试配置)
- [Docker配置](#docker配置)

---

## 环境变量

### 环境文件

项目使用不同的环境文件管理配置：

| 文件 | 环境 | 说明 |
|------|------|------|
| `.env.example` | 模板 | 环境变量模板文件 |
| `.env.development` | 开发 | 开发环境配置 |
| `.env.production` | 生产 | 生产环境配置 |

### 加载优先级

1. `.env.[mode].local` - 本地覆盖（不提交到Git）
2. `.env.[mode]` - 环境配置
3. `.env.local` - 本地配置（不提交到Git）
4. `.env` - 默认配置

---

## 前端配置

### 基础配置

创建 `.env.development` 文件：

```bash
# ===========================================
# 应用基础配置
# ===========================================
VITE_APP_ENV=development
VITE_APP_NAME=Star Citizen Promotion

# ===========================================
# 前端服务配置
# ===========================================
VITE_SERVER_PORT=3000
VITE_SERVER_HOST=localhost
VITE_API_PREFIX=/api

# ===========================================
# 后端服务配置
# ===========================================
VITE_BACKEND_PORT=3001
VITE_BACKEND_HOST=localhost
VITE_BACKEND_URL=http://localhost:3001

# ===========================================
# AI 服务配置
# ===========================================
VITE_AI_SERVICE_PORT=3002
VITE_AI_SERVICE_HOST=localhost
VITE_AI_SERVICE_URL=http://localhost:3002
VITE_AI_TIMEOUT=30000
VITE_AI_MAX_RETRIES=3
VITE_AI_MAX_CONCURRENT=3

# ===========================================
# WebSocket 配置
# ===========================================
VITE_WS_PORT=3003
VITE_WS_HOST=localhost
VITE_WS_URL=ws://localhost:3003

# ===========================================
# 第三方服务配置
# ===========================================
# VITE_OPENAI_API_KEY=your_openai_api_key
# VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 配置项说明

| 变量 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `VITE_APP_ENV` | string | development | 应用环境 |
| `VITE_APP_NAME` | string | Star Citizen Promotion | 应用名称 |
| `VITE_SERVER_PORT` | number | 3000 | 开发服务器端口 |
| `VITE_SERVER_HOST` | string | localhost | 开发服务器主机 |
| `VITE_API_PREFIX` | string | /api | API请求前缀 |
| `VITE_BACKEND_URL` | string | http://localhost:3001 | 后端服务地址 |
| `VITE_AI_SERVICE_URL` | string | http://localhost:3002 | AI服务地址 |
| `VITE_AI_TIMEOUT` | number | 30000 | AI请求超时（毫秒） |
| `VITE_AI_MAX_RETRIES` | number | 3 | AI请求最大重试次数 |
| `VITE_AI_MAX_CONCURRENT` | number | 3 | AI请求最大并发数 |
| `VITE_WS_URL` | string | ws://localhost:3003 | WebSocket服务地址 |

### 生产环境配置

创建 `.env.production` 文件：

```bash
VITE_APP_ENV=production
VITE_BACKEND_URL=https://api.your-domain.com
VITE_AI_SERVICE_URL=https://ai.your-domain.com
VITE_WS_URL=wss://ws.your-domain.com
```

---

## 后端配置

### 环境变量

创建 `server/.env.development` 文件：

```bash
# ===========================================
# 服务配置
# ===========================================
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# ===========================================
# JWT 配置
# ===========================================
JWT_SECRET=your-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# ===========================================
# MySQL 数据库配置
# ===========================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=star_citizen_promotion
DB_CONNECTION_LIMIT=20

# ===========================================
# Bcrypt 配置
# ===========================================
BCRYPT_SALT_ROUNDS=12

# ===========================================
# 速率限制
# ===========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# ===========================================
# WebSocket 配置
# ===========================================
WS_PORT=3003
```

### 配置项说明

#### 服务配置

| 变量 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `NODE_ENV` | string | development | 运行环境 |
| `PORT` | number | 3001 | 服务端口 |
| `FRONTEND_URL` | string | http://localhost:3000 | 前端地址（CORS配置） |

#### JWT配置

| 变量 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `JWT_SECRET` | string | - | JWT签名密钥（**必须设置**） |
| `JWT_EXPIRES_IN` | string | 7d | 令牌有效期 |

**安全建议：**
- 使用至少32字符的随机字符串作为密钥
- 生产环境使用环境变量注入，不要硬编码

生成密钥示例：

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

#### 数据库配置

| 变量 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `DB_HOST` | string | localhost | 数据库主机 |
| `DB_PORT` | number | 3306 | 数据库端口 |
| `DB_USER` | string | root | 数据库用户 |
| `DB_PASSWORD` | string | - | 数据库密码 |
| `DB_NAME` | string | star_citizen_promotion | 数据库名称 |
| `DB_CONNECTION_LIMIT` | number | 20 | 连接池大小 |

#### 安全配置

| 变量 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `BCRYPT_SALT_ROUNDS` | number | 12 | 密码哈希轮数 |
| `RATE_LIMIT_WINDOW_MS` | number | 900000 | 速率限制窗口（毫秒） |
| `RATE_LIMIT_MAX` | number | 100 | 窗口内最大请求数 |

---

## 站点配置

站点配置文件位于 `src/config/site.config.js`，用于管理站点内容。

### 配置结构

```javascript
export default {
  // 站点基本信息
  siteInfo: {
    name: '星际公民战队',
    slogan: '探索未知，征服星海',
    description: '星际公民团队介绍站',
    url: 'https://your-domain.com',
    version: '1.0.0'
  },

  // 导航菜单
  navigation: [
    { name: '首页', path: '/' },
    { name: '团队介绍', path: '/about' },
    { name: '核心成员', path: '/members' },
    { name: '活动项目', path: '/projects' },
    { name: '加入我们', path: '/join' },
    { name: '联系我们', path: '/contact' }
  ],

  // 首页配置
  home: {
    hero: {
      title: '星际公民战队',
      subtitle: '探索未知，征服星海',
      backgroundImage: '/images/hero-bg.jpg'
    },
    stats: [
      { label: '团队成员', value: 50 },
      { label: '活动项目', value: 10 },
      { label: '王牌飞行员', value: 15 }
    ]
  },

  // 团队介绍页配置
  about: {
    title: '关于我们',
    description: '团队介绍内容'
  },

  // 加入我们页配置
  join: {
    title: '加入我们',
    requirements: [
      '年满18岁',
      '拥有星际公民游戏账号',
      '每周在线时间不少于10小时'
    ]
  },

  // 联系我们页配置
  contact: {
    email: 'contact@your-domain.com',
    discord: 'https://discord.gg/your-invite',
    social: [
      { name: 'Discord', url: 'https://discord.gg/your-invite' },
      { name: 'Twitter', url: 'https://twitter.com/your-handle' }
    ]
  },

  // 主题配置
  theme: {
    colors: {
      primary: '#00d4ff',
      secondary: '#ff6b35',
      background: '#030810',
      surface: '#0a1628',
      text: '#ffffff'
    },
    fonts: {
      primary: 'Rajdhani, sans-serif'
    },
    animation: {
      duration: 300,
      easing: 'ease-in-out'
    }
  },

  // 功能开关
  features: {
    enableRegistration: true,
    enableApplications: true,
    enableAI: true,
    enableWebSocket: true
  },

  // API配置
  api: {
    timeout: 30000,
    retries: 3
  }
}
```

### 配置项详解

#### siteInfo（站点信息）

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 站点名称 |
| slogan | string | 站点口号 |
| description | string | 站点描述 |
| url | string | 站点URL |
| version | string | 版本号 |

#### navigation（导航菜单）

导航菜单项数组，每项包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 菜单项名称 |
| path | string | 路由路径 |
| icon | string | 图标名称（可选） |
| external | boolean | 是否外部链接（可选） |

#### theme（主题配置）

| 字段 | 类型 | 说明 |
|------|------|------|
| colors.primary | string | 主色调 |
| colors.secondary | string | 辅助色 |
| colors.background | string | 背景色 |
| colors.surface | string | 表面色 |
| colors.text | string | 文字色 |
| fonts.primary | string | 主字体 |
| animation.duration | number | 动画时长（毫秒） |
| animation.easing | string | 动画缓动函数 |

#### features（功能开关）

| 字段 | 类型 | 说明 |
|------|------|------|
| enableRegistration | boolean | 启用用户注册 |
| enableApplications | boolean | 启用入队申请 |
| enableAI | boolean | 启用AI服务 |
| enableWebSocket | boolean | 启用WebSocket |

---

## 构建配置

### Vite配置

配置文件：`vite.config.js`

```javascript
export default defineConfig(({ mode }) => {
  return {
    plugins: [vue(), vueDevTools()],
    
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    server: {
      port: 3000,
      host: 'localhost',
      open: true,
      cors: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        },
        '/ai': {
          target: 'http://localhost:3002',
          changeOrigin: true
        }
      }
    },

    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router']
          }
        }
      }
    }
  }
})
```

### 构建选项

| 选项 | 说明 |
|------|------|
| `target` | 构建目标 |
| `minify` | 压缩工具 |
| `sourcemap` | Source Map生成 |
| `manualChunks` | 代码分割配置 |

---

## 测试配置

### Vitest配置

配置文件：`vitest.config.js`

```javascript
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

### Playwright配置

配置文件：`playwright.config.js`

```javascript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI
  }
})
```

---

## Docker配置

### 环境变量

Docker环境使用 `docker-compose.yml` 中的环境变量：

```yaml
services:
  backend:
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_USER=root
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=star_citizen_promotion
      - JWT_SECRET=${JWT_SECRET}
```

### 创建.env文件

在项目根目录创建 `.env` 文件：

```bash
# Docker Compose 环境变量
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
```

### Nginx配置

配置文件：`nginx.conf`

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
```

---

## 安全建议

### 生产环境检查清单

- [ ] 更改所有默认密码
- [ ] 使用强密码（至少16字符）
- [ ] JWT_SECRET使用随机生成的密钥
- [ ] 启用HTTPS
- [ ] 配置CORS白名单
- [ ] 设置适当的速率限制
- [ ] 启用安全HTTP头（Helmet）
- [ ] 禁用调试模式
- [ ] 配置日志记录
- [ ] 设置数据库备份

### 敏感信息处理

**不要提交到Git的文件：**
- `.env`
- `.env.local`
- `.env.*.local`
- `server/.env`
- 包含密钥的配置文件

**.gitignore 配置：**

```gitignore
# 环境变量
.env
.env.local
.env.*.local
server/.env
server/.env.local
server/.env.*.local

# 密钥文件
*.pem
*.key
```
