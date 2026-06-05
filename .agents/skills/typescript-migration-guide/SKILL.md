---
name: typescript-migration-guide
description: "JavaScript 项目渐进式迁移到 TypeScript 的完整指南。覆盖迁移策略（allowJs → strict 逐步收紧）、tsconfig 分层配置（base/node/vue）、JSDoc 中间态方案、.d.ts 手写模式、Express Request 扩展等常见类型陷阱、迁移优先级排序（工具函数→服务层→路由层→视图层）。用于任何 JS 项目启动 TypeScript 迁移。Triggers: TypeScript 迁移, JS 转 TS, tsconfig 配置, TypeScript 类型定义, .d.ts, JS to TS, TypeScript migration, 加类型, 类型标注. Do NOT trigger for: TypeScript 入门教程, 基础类型语法教学, 在已完成的 TS 项目中新增功能."
default-enabled: false
---

# TypeScript 渐进式迁移指南

从 JS 到 TS 的渐进迁移路径。核心思想："让项目先跑在 TS 模式下，再逐步收紧类型检查"。适用于 Vue 3 前端、Express 后端、Node.js 工具项目。

**不覆盖**：TS 基础语法教学、从零搭建 TS 项目、高级类型体操。

---

## 一、三阶段迁移策略

```
阶段1: allowJs + checkJs:false（零改动，TS 先认识 JS）
   ↓
阶段2: 工具函数加类型 + checkJs:true + strictNullChecks（核心逻辑类型化）
   ↓
阶段3: strict:true（生产级类型安全）
```

### 阶段1 最小 tsconfig

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "bundler",
    "allowJs": true, "checkJs": false, "noEmit": true,
    "strict": false, "esModuleInterop": true, "skipLibCheck": true,
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.js", "src/**/*.vue"]
}
```

### 阶段3 生产级

```json
{
  "compilerOptions": {
    "strict": true, "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true, "forceConsistentCasingInFileNames": true
  }
}
```

---

## 二、迁移优先级

类型标注价值取决于被引用频率。工具函数被几十处调用，加类型一次性保护所有调用方。

```
优先级1（最快收益）：工具函数 + 配置文件
优先级2（核心保护）：服务层 + DTO
优先级3（边界保护）：路由层 + 中间件
优先级4（可选）：视图层 + 组件
```

---

## 三、JSDoc 中间态

不想改文件名时，用 JSDoc 给 .js 加类型：

```javascript
// @ts-check
/**
 * @typedef {Object} Member
 * @property {string} id
 * @property {'active'|'inactive'|'retired'} status
 */

/**
 * @param {{ status?: string, page?: number }} filters
 * @returns {Promise<{data: Member[], total: number}>}
 */
export async function getMembers(filters = {}) { ... }
```

---

## 四、分层 tsconfig

```
tsconfig.base.json        ← 共享配置
  ├── tsconfig.node.json  ← 后端（extends base）
  └── tsconfig.app.json   ← 前端（extends base）
```

---

## 五、常见类型陷阱

### Express Request 扩展
```typescript
// types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string; role: 'admin' | 'member' }
    }
  }
}
```

### 环境变量
```typescript
// types/env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string; DB_HOST: string; DB_NAME: string
    }
  }
}
```

### Vue SFC
```vue
<script setup lang="ts">
const props = defineProps<{ ships: Ship[]; loading?: boolean }>()
const emit = defineEmits<{ select: [shipId: string]; filter: [category: string] }>()
</script>
```

---

## 检查清单
- [ ] 阶段1：tsconfig 已创建，allowJs:true，checkJs:false，tsc --noEmit 不报 fatal error
- [ ] 阶段2：工具函数已重命名为 .ts 并加类型，服务层有 interface，Express Request 已扩展
- [ ] 阶段3：strict:true，零 TS 错误，环境变量有类型声明
- [ ] CI 中 tsc --noEmit 作为类型检查门禁
- [ ] 不使用 as any 除非有充分理由并注释