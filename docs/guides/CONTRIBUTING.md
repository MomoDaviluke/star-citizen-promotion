# 贡献指南

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-05-31
> **版本**: v1.3.1

---

## 开发流程

### 1. 准备工作

```bash
# Fork 并克隆项目
git clone https://github.com/your-username/star-citizen-promotion.git
cd star-citizen-promotion

# 安装依赖
npm install
cd server && npm install && cd ..

# 配置环境变量
cp .env.example .env.development
cp server/.env.example server/.env.development

# 初始化 Git 钩子
cd .githooks && bash setup.sh && cd ..

# 初始化数据库
cd server && npm run db:init && cd ..

# 启动开发服务
npm run dev           # 前端 → http://localhost:3000
cd server && npm run dev  # 后端 → http://localhost:3001
```

### 2. 创建分支

```bash
# 从 develop 分支创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 3. 开发与测试

```bash
# 前端测试（监视模式）
npm run test:watch

# 后端测试（监视模式）
cd server && npm run test:watch

# 代码检查
npm run lint          # 前端
cd server && npm run lint  # 后端
```

### 4. 提交代码

```bash
git add .
git commit -m "feat: 添加新功能描述"
# pre-commit 钩子自动运行：ESLint + 敏感信息检测 + .env 文件检测
```

### 5. 推送与 PR

```bash
git push origin feature/your-feature-name
# pre-push 钩子自动运行：后端测试 + npm audit
```

在 GitHub 上创建 Pull Request，目标分支为 `develop`。

---

## 分支策略

```
main (生产)
  │
  ├── develop (开发主线)
  │     │
  │     ├── feature/auth-improvement   # 新功能
  │     ├── feature/fleet-management   # 新功能
  │     └── bugfix/login-timeout       # Bug 修复
  │
  ├── hotfix/security-patch            # 生产热修复
  └── release/v1.4.0                   # 发布准备
```

| 分支 | 用途 | 保护规则 |
|:---|:---|:---|
| `main` | 生产代码 | 需 PR + CI 全部通过 + 代码审查 |
| `develop` | 开发主线 | 需 PR + CI 全部通过 |
| `feature/*` | 新功能开发 | 无 |
| `bugfix/*` | Bug 修复 | 无 |
| `hotfix/*` | 生产紧急修复 | 从 main 创建，修复后合并回 main 和 develop |
| `release/*` | 发布准备 | 仅修复 bug，不加新功能 |

---

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 格式

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 类型

| 类型 | 说明 | 示例 |
|:---|:---|:---|
| `feat` | 新功能 | `feat(auth): 添加密码重置功能` |
| `fix` | Bug 修复 | `fix(router): 修复页面跳转动画卡顿` |
| `docs` | 文档更新 | `docs: 更新 API 接口文档` |
| `style` | 代码格式（不影响逻辑） | `style: 格式化代码缩进` |
| `refactor` | 重构（不加功能不修 bug） | `refactor(services): 重构认证服务` |
| `perf` | 性能优化 | `perf: 优化首屏加载性能` |
| `test` | 测试相关 | `test: 添加认证中间件测试` |
| `chore` | 构建/工具/依赖 | `chore: 更新依赖版本` |
| `ci` | CI/CD 配置 | `ci: 添加 CodeQL 安全扫描` |

### 范围（可选）

`auth`、`router`、`services`、`middleware`、`database`、`config`、`docker`、`docs`

---

## 代码风格

### 前端（Vue 3）

| 规则 | 配置 |
|:---|:---|
| 引号 | 单引号 |
| 分号 | 无 |
| 缩进 | 2 空格 |
| 尾逗号 | 无 |
| 行宽 | 100 字符 |
| 换行符 | LF |

**Prettier 配置**（`.prettierrc`）：

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 后端（TypeScript）

| 规则 | 配置 |
|:---|:---|
| 引号 | 单引号 |
| 分号 | 有 |
| 缩进 | 2 空格 |
| 换行符 | LF |

### 组件命名

| 类型 | 规范 | 示例 |
|:---|:---|:---|
| 组件文件 | PascalCase | `UserProfile.vue` |
| 组件注册 | PascalCase | `<UserProfile />` |
| Props | camelCase | `userName` |
| Events | kebab-case | `@update-user` |
| CSS 类 | kebab-case | `.user-profile` |
| 工具函数 | camelCase | `formatDate()` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

---

## 测试要求

### 提交前

- [ ] 所有现有测试通过
- [ ] 新功能有对应测试
- [ ] Bug 修复有回归测试
- [ ] 覆盖率未下降

### 测试命名

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return token when credentials are valid', async () => {})
    it('should throw 401 when password is incorrect', async () => {})
    it('should throw 401 when user does not exist', async () => {})
  })
})
```

### 测试结构（AAA）

```typescript
it('should deactivate member when admin requests', async () => {
  // Arrange — 准备测试数据
  const admin = await createUser({ role: 'admin' })
  const token = generateToken(admin)

  // Act — 执行操作
  const response = await request(app)
    .post(`/api/members/${member.id}/deactivate`)
    .set('Authorization', `Bearer ${token}`)

  // Assert — 验证结果
  expect(response.status).toBe(200)
})
```

---

## Git 钩子

项目配置了自动化的 Git 钩子，安装方式：

```bash
cd .githooks && bash setup.sh && cd ..
```

### pre-commit（提交前）

| 检查项 | 说明 |
|:---|:---|
| ESLint | 仅检查暂存的 JS/Vue 文件 |
| 敏感信息检测 | AWS Key、GitHub Token、OpenAI Key、私钥、硬编码密码 |
| .env 文件检测 | 禁止提交 `.env` 文件（`.env.example` 除外） |
| 大文件警告 | >1MB 文件提醒 |

### pre-push（推送前）

| 检查项 | 说明 |
|:---|:---|
| 后端测试 | 运行 Jest 全量测试 |
| npm audit | 前后端依赖安全审计（`--audit-level=high`） |

---

## Pull Request 规范

### PR 标题

与提交规范一致：`feat(auth): 添加密码重置功能`

### PR 描述模板

```markdown
## 变更说明
简述本次变更的内容和原因。

## 变更类型
- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试 (test)
- [ ] 其他 (chore)

## 测试
- [ ] 已添加/更新单元测试
- [ ] 已通过 E2E 测试（如涉及 UI 变更）
- [ ] 覆盖率未下降

## 检查清单
- [ ] 代码符合项目风格规范
- [ ] 无 console.log 残留
- [ ] 无敏感信息泄露
- [ ] 文档已同步更新（如需要）
```

### 审查要点

| 关注点 | 检查内容 |
|:---|:---|
| 安全性 | 输入校验、SQL 注入、XSS、认证绕过 |
| 正确性 | 边界条件、错误处理、空值处理 |
| 性能 | N+1 查询、不必要的渲染、内存泄漏 |
| 可维护性 | 命名清晰、职责单一、避免硬编码 |
| 测试 | 覆盖关键路径、边界条件、错误分支 |
