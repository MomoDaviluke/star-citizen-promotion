# 后续任务执行计划（交付外部 AI 执行）

> **项目**: Star Citizen 战队宣传网站
> **创建日期**: 2026-08-27
> **版本**: v1.6.2
> **执行模式**: 单人串行，每任务独立 commit，禁止并行推进多批次

---

## 0. 执行者必读（全局约束）

**你（执行 AI）对代码库零上下文。本计划自包含，按批次顺序执行，不要跳批次、不要并行。**

### 0.1 硬约束（违反会导致测试/构建失败）

| # | 约束 | 原因 |
|:--|:--|:--|
| C1 | 前端测试跑 `npm test`（vitest），测试文件放 `tests/` 目录镜像源码结构；后端测试跑 `cd server && npm test`（jest），**两者框架不可混用**（后端规格文档曾误写 vi() 导致返工） |
| C2 | `vi.doMock` 在 vitest 共享 worker 上下文有模块实例分裂 bug（历史教训 FE-08）——mock 模块一律用 `vi.mock`（hoisted）或直接切换全局对象属性 + `afterEach` 恢复 |
| C3 | E2E 断言必须基于真实 DOM（历史教训 FE-10）：写断言前先读组件 template 或用 Playwright aria snapshot 确认 |
| C4 | Vue 模板中数字/布尔/Object 类型 prop 必须 `:` 动态绑定（QUAL-18） |
| C5 | 验证 = 实际运行命令并确认输出，禁止"应该能过"式断言 |
| C6 | commit 遵循 Conventional Commits（`.trae/rules/commit_convention.md`），PowerShell 不支持 heredoc，多行 body 用多个 `-m` |

### 0.2 验证命令速查

```powershell
# 前端（仓库根目录）
npm run lint                          # ESLint，期望 0 error
npm run typecheck                     # tsc --noEmit -p jsconfig.json，期望 0 error
npm test                              # vitest run（全量单测）
npm run test:coverage                 # 覆盖率（当前门禁 49%）
npm run build                         # vite build 生产构建
npx playwright test e2e/recruiter.spec.js   # 单跑某 E2E

# 后端（server/ 目录）
cd server; npm test                   # jest，498 用例全绿
cd server; npm run typecheck          # tsc --noEmit

# CSS 变量迁移专用
node scripts/css-var-lint.mjs . --strict
```

### 0.3 环境基线（2026-08-26 实测）

- 后端：498 测试 / 100% 通过，语句覆盖率 75.35%（AI 模块 88.94%）
- 前端：语句覆盖率 50.3%（门禁 49% 已生效）
- E2E：6 个 spec（navigation / home / join / apply / auth / real-backend）
- AI 前端缺口：`src/composables/useAiRecruiter.js` + 5 个 `src/components/ai/*.vue` 共 1583 行**零覆盖**（TD-14）
- 工作树应干净；开始前先 `git status` 确认

---

## 批次 1：AI 前端测试地基（TD-19 + TD-14）— P1

**目标**：修复 Home.vue 挂载即触发 AI 请求的隔离缺陷，补齐 useAiRecruiter + 5 组件单测，AI 前端覆盖 ≥ 80%。

**背景（已实测的根因）**：
- [Home.vue](../src/views/Home.vue) L124 无条件渲染 `<RecruiterTerminal :is-open="showRecruiter">`（`v-if` 只控制内部内容显示，组件本身总是挂载）
- [RecruiterTerminal.vue](../src/components/ai/RecruiterTerminal.vue) L137-140：`onMounted(() => { initSession() ... })` —— **首页加载即发 2 个 AI 请求（POST session + GET suggest），即使没人点开终端**
- `useAiRecruiter` API：`{ sessionId, messages, profile, turnCount, suggestions, isStreaming, error, initSession, sendMessage, reset }`，SSE 解析在 `sendMessage` 内（`event: `/`data: ` 行协议，`data.content` 追加流、`data.profile` 更新画像 + turnCount 并重载 suggest）

### 任务 1.1：TD-19 — RecruiterTerminal 懒初始化（TDD）

**文件**：
- 创建：`tests/components/ai/RecruiterTerminal.test.js`
- 修改：`src/components/ai/RecruiterTerminal.vue`（script setup 部分）

- [ ] **步骤 1：编写失败的测试**

```js
// tests/components/ai/RecruiterTerminal.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/composables/useAiRecruiter', () => ({
  useAiRecruiter: () => ({
    sessionId: { value: null },
    messages: { value: [] },
    profile: { playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' },
    turnCount: { value: 0 },
    suggestions: { value: [] },
    isStreaming: { value: false },
    error: { value: null },
    initSession: vi.fn(),
    sendMessage: vi.fn(),
    reset: vi.fn(),
  }),
}))
vi.mock('@/services/analyticsService', () => ({
  trackEvent: vi.fn(),
}))

import RecruiterTerminal from '@/components/ai/RecruiterTerminal.vue'
import { useAiRecruiter } from '@/composables/useAiRecruiter'

describe('RecruiterTerminal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('isOpen=false 挂载时不触发 initSession（懒初始化）', () => {
    mount(RecruiterTerminal, { props: { isOpen: false } })
    expect(useAiRecruiter().initSession).not.toHaveBeenCalled()
  })

  it('isOpen 首次变为 true 时触发 initSession，且仅一次', async () => {
    const wrapper = mount(RecruiterTerminal, { props: { isOpen: false } })
    await wrapper.setProps({ isOpen: true })
    expect(useAiRecruiter().initSession).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ isOpen: false })
    await wrapper.setProps({ isOpen: true })
    expect(useAiRecruiter().initSession).toHaveBeenCalledTimes(1) // 不重复初始化
  })
})
```

- [ ] **步骤 2：运行验证失败**

```powershell
npx vitest run tests/components/ai/RecruiterTerminal.test.js
```
预期：FAIL —— 第一条 `initSession` 被调用（当前 onMounted 无条件调用）

- [ ] **步骤 3：修改 RecruiterTerminal.vue 实现懒初始化**

script setup 中（当前 L107、L133、L137-140 附近）：
1. import 增加 `watch`：`import { ref, watch, onMounted, onUnmounted } from 'vue'`
2. 新增 `const initialized = ref(false)`
3. `onMounted` 中删除 `initSession()`，保留 `window.addEventListener('keydown', handleKeydown)`
4. 新增 watch：

```js
watch(() => props.isOpen, (open) => {
  if (open && !initialized.value) {
    initialized.value = true
    initSession()
  }
})
```

- [ ] **步骤 4：运行验证通过**

```powershell
npx vitest run tests/components/ai/RecruiterTerminal.test.js
npm test   # 全量回归，重点确认 tests/views/Home.test.js 仍全绿
```
预期：PASS；Home.test.js 不再因 fetch 未 mock 报错（懒初始化后挂载不发请求）

- [ ] **步骤 5：Commit**

```powershell
git add src/components/ai/RecruiterTerminal.vue tests/components/ai/RecruiterTerminal.test.js
git commit -m "fix(components): AI 招募官终端懒初始化，首页挂载不再触发 AI 会话请求（TD-19）"
```

### 任务 1.2：useAiRecruiter 单测（核心，SSE 流 mock）

**文件**：
- 创建：`tests/composables/useAiRecruiter.test.js`

- [ ] **步骤 1：编写完整测试**

```js
// tests/composables/useAiRecruiter.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

import { useAiRecruiter } from '@/composables/useAiRecruiter'

/** 构造 SSE 流式响应 mock（模拟 ReadableStream + getReader） */
function sseResponse(chunks) {
  const encoder = new TextEncoder()
  let i = 0
  return {
    ok: true,
    body: {
      getReader() {
        return {
          async read() {
            if (i < chunks.length) return { done: false, value: encoder.encode(chunks[i++]) }
            return { done: true, value: undefined }
          },
        }
      },
    },
  }
}

function jsonRes(data) {
  return { ok: true, json: async () => data }
}

describe('useAiRecruiter', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('initSession 成功：设置 sessionId、追加 welcome、拉取 suggest', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonRes({ sessionId: 's1', welcome: '欢迎指挥官' }))
      .mockResolvedValueOnce(jsonRes({ suggestions: ['你的游戏时长？'] }))
    const { sessionId, messages, suggestions, error, initSession } = useAiRecruiter()
    await initSession()
    expect(sessionId.value).toBe('s1')
    expect(messages.value).toEqual([{ role: 'assistant', content: '欢迎指挥官' }])
    expect(suggestions.value).toEqual(['你的游戏时长？'])
    expect(error.value).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/ai/recruiter/session')
  })

  it('initSession 网络失败：设置用户可见错误', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'))
    const { error, initSession } = useAiRecruiter()
    await initSession()
    expect(error.value).toBe('连接失败,请稍后重试')
  })

  it('sendMessage 前置拦截：无 session 或流式中不发送', async () => {
    const { sendMessage } = useAiRecruiter()
    await sendMessage('你好')  // sessionId 为 null
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sendMessage 流式：content 分块追加、profile 更新、turnCount 同步', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonRes({ sessionId: 's1', welcome: 'w' }))
      .mockResolvedValueOnce(jsonRes({ suggestions: [] }))
      .mockResolvedValueOnce(sseResponse([
        'event: message\ndata: {"content":"你"}\n\n',
        'event: message\ndata: {"content":"好"}\n\n',
        'event: metadata\ndata: {"profile":{"playStyle":["探索"]},"turnCount":2}\n\n',
        'event: done\ndata: {"done":true}\n\n',
      ]))
      .mockResolvedValueOnce(jsonRes({ suggestions: ['推荐飞船'] }))  // profile 事件触发重载
    const { initSession, sendMessage, messages, profile, turnCount, suggestions, isStreaming } = useAiRecruiter()
    await initSession()
    const p = sendMessage('我喜欢探索')
    await p
    expect(messages.value.at(-1).content).toBe('你好')
    expect(messages.value).toContainEqual({ role: 'user', content: '我喜欢探索' })
    expect(profile.playStyle).toEqual(['探索'])
    expect(turnCount.value).toBe(2)
    expect(suggestions.value).toEqual(['推荐飞船'])
    expect(isStreaming.value).toBe(false)
  })

  it('sendMessage 通讯失败：移除空 assistant 消息并置错误', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonRes({ sessionId: 's1', welcome: 'w' }))
      .mockResolvedValueOnce(jsonRes({ suggestions: [] }))
      .mockResolvedValueOnce({ ok: false, status: 500, body: null })
    const { initSession, sendMessage, messages, error } = useAiRecruiter()
    await initSession()
    await sendMessage('你好')
    expect(error.value).toBe('通讯中断,请重试')
    // user 消息保留，空 assistant 消息被移除
    expect(messages.value.filter((m) => m.role === 'assistant' && m.content === '')).toHaveLength(0)
  })

  it('reset：清空全部状态', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonRes({ sessionId: 's1', welcome: 'w' }))
      .mockResolvedValueOnce(jsonRes({ suggestions: ['s'] }))
    const s = useAiRecruiter()
    await s.initSession()
    s.reset()
    expect(s.sessionId.value).toBeNull()
    expect(s.messages.value).toEqual([])
    expect(s.suggestions.value).toEqual([])
    expect(s.error.value).toBeNull()
  })
})
```

- [ ] **步骤 2：运行验证**

```powershell
npx vitest run tests/composables/useAiRecruiter.test.js
```
预期：6 用例 PASS。若 SSE 用例失败，对照源码 L72-102 的行解析逻辑（`buffer.split('\n')` + `lines.pop()`）调整 mock chunk 的换行符——**chunk 必须以 `\n\n` 结尾**保证事件块完整解析。

- [ ] **步骤 3：Commit**

```powershell
git add tests/composables/useAiRecruiter.test.js
git commit -m "test(composables): 补 useAiRecruiter 单测覆盖 SSE 流解析与画像同步（TD-14）"
```

### 任务 1.3：其余 4 个 AI 组件单测

**文件**：
- 创建：`tests/components/ai/ChatStream.test.js`、`QuickSuggestions.test.js`、`ProfilePanel.test.js`、`HoloAvatar.test.js`

**统一模式**：先读各组件源码确认 props/emits 契约（C3），再按 [BaseButton.test.js](../tests/components/common/BaseButton.test.js) 的现有 mount 模式编写。核心用例：

- [ ] **ChatStream**：`messages` prop（含 user/assistant 两种 role）→ 渲染对应数量消息节点；长内容不截断
- [ ] **QuickSuggestions**：`suggestions` prop 渲染按钮列表；`disabled` 时不响应 click；点击 emit `select` 事件携带建议文本
- [ ] **ProfilePanel**：`profile` prop（playStyle/timeCommit/shipPref/skillLevel）→ 各字段有值时渲染，空值时显示占位或隐藏（按源码实际行为断言）
- [ ] **HoloAvatar**：默认状态渲染；`isStreaming`（或等价 prop，以源码为准）为 true 时渲染活跃状态样式类
- [ ] 每个文件完成后单独运行 `npx vitest run tests/components/ai/<file>` 确认 PASS，最后统一：

```powershell
npm test && npm run lint && npm run typecheck
```

- [ ] **Commit**

```powershell
git add tests/components/ai/
git commit -m "test(components): 补 AI 招募官 4 个子组件单测（TD-14）"
```

### 任务 1.4：覆盖率验收（批次 1 收口）

- [ ] **步骤 1**：`npm run test:coverage`，确认 `src/composables/useAiRecruiter.js` + `src/components/ai/**` 语句覆盖 ≥ 80%
- [ ] **步骤 2**：不达标则读覆盖率报告 HTML（`coverage/`）定位未覆盖分支，补用例（重点：sendMessage 的 `data.content === undefined` 分支、SSE JSON 解析 catch 分支）
- [ ] **步骤 3**：`npm run build` 确认生产构建不受影响

---

## 批次 2：TD-15 — AI 招募官 E2E spec

**目标**：自动化验证「打开终端 → 对话 → 流式回复 → 画像预填跳转」完整链路。

**文件**：
- 创建：`e2e/recruiter.spec.js`

- [ ] **步骤 1：确认真实 DOM 契约**

读 [Home.vue](../src/views/Home.vue) L118-127（触发按钮 class 为 `recruiter-trigger`）与 [RecruiterTerminal.vue](../src/components/ai/RecruiterTerminal.vue) template（L7-104），确认：终端面板根元素 class、消息列表渲染节点、输入框/发送按钮的可定位属性、画像「去申请」跳转按钮及其目标路由与 query 参数。**断言 selector 全部以此为准（C3）。**

- [ ] **步骤 2：编写 E2E（page.route mock 后端，项目既有策略）**

```js
// e2e/recruiter.spec.js
import { test, expect } from '@playwright/test'

test.describe('AI 招募官对话链路', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/ai/recruiter/session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessionId: 'e2e-1', welcome: '欢迎加入舰队，指挥官' }),
      })
    )
    await page.route('**/api/v1/ai/recruiter/suggest*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ suggestions: ['你的游戏风格是？', '每周能玩多久？'] }),
      })
    )
    await page.route('**/api/v1/ai/recruiter/chat', (route) => {
      const body = [
        'event: message\ndata: {"content":"了解，你偏爱探索。"}\n\n',
        'event: metadata\ndata: {"profile":{"playStyle":["探索"],"timeCommit":"每周10小时"},"turnCount":1}\n\n',
        'event: done\ndata: {"done":true}\n\n',
      ].join('')
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body })
    })
  })

  test('打开终端 → 欢迎/建议渲染 → 发送消息 → 流式回复与画像更新', async ({ page }) => {
    await page.goto('/')
    // 懒初始化（TD-19）后：挂载不请求，点开才发 session
    let sessionCalled = false
    page.on('request', (req) => { if (req.url().includes('/ai/recruiter/session')) sessionCalled = true })
    await page.click('.recruiter-trigger')
    await expect(page.getByText('欢迎加入舰队，指挥官')).toBeVisible()
    await expect(page.getByText('你的游戏风格是？')).toBeVisible()
    expect(sessionCalled).toBe(true)

    // 发送对话（输入框 selector 以步骤 1 实读为准，下行为占位示例——必须替换）
    await page.fill('输入框实际 selector', '我喜欢探索和贸易')
    await page.keyboard.press('Enter')   // 或点击实际发送按钮
    await expect(page.getByText('了解，你偏爱探索。')).toBeVisible({ timeout: 5000 })

    // 画像面板同步（selector 以实读为准）
    await expect(page.getByText('探索').first()).toBeVisible()
  })

  test('画像就绪后跳转申请页并预填（以步骤 1 实读的跳转行为为准）', async ({ page }) => {
    // 若 RecruiterTerminal 存在「去申请」按钮 → 点击断言 URL 为 /join（含预填 query）且表单字段带值
    // 断言必须基于真实跳转实现，禁止复制本注释框架
  })
})
```

> **警告**：上方两处「以实读为准」不是可保留的占位——执行时必须替换为真实 selector 与断言后删除注释（C3/FE-10）。

- [ ] **步骤 3：运行验证**

```powershell
npx playwright test e2e/recruiter.spec.js --project=chromium
```
预期：PASS；E2E spec 总数 6 → 7

- [ ] **步骤 4：Commit**

```powershell
git add e2e/recruiter.spec.js
git commit -m "test(e2e): AI 招募官完整对话链路 spec，覆盖画像同步与申请预填（TD-15）"
```

---

## 批次 3：上线前验证与运维演练（AI-DEP-1/2 + OPS-1）— P1

### 任务 3.1：AI-DEP-1 — ai:ingest 真实知识库种子验证

- [ ] **步骤 1**：确认 `.env`（server 目录）已配置真实 LLM Provider key 与 `PGVECTOR_URL`（参考 [CONFIG.md](guides/CONFIG.md)）
- [ ] **步骤 2**：`cd server; npm run ai:migrate`（pgvector 表结构就绪）
- [ ] **步骤 3**：`cd server; npm run ai:ingest` —— 记录 5 类知识源（飞船/阵营/活动/FAQ/战队介绍，以 [ingest.ts](../server/src/scripts/ingest.ts) 实际清单为准）的入库条数
- [ ] **步骤 4**：验证入库——起后端 `cd server; npm run dev`，调 `GET /api/v1/ai/recruiter/health` 与招募官对话，确认 RAG 检索返回真实知识内容
- [ ] **步骤 5**：把实测命令与入库统计记入 [TECH_ARCHIVE_2026-08-26.md](reports/TECH_ARCHIVE_2026-08-26.md) 新增小节，更新 TODO.md 状态 AI-DEP-1 → ✅
- [ ] **Commit**：`docs: 记录 ai:ingest 真实知识库入库验证结果（AI-DEP-1）`

### 任务 3.2：AI-DEP-2 — 生产 AI 环境变量确认

- [ ] **步骤 1**：读 [docker-compose.yml](../docker-compose.yml) 的 backend 服务 `environment:` 块，逐项核对：`PGVECTOR_URL`、`REDIS_URL`、LLM Provider key 变量名与 `server/src/config` 中实际读取的变量名**一一对应**（变量名不匹配是静默失败，服务会以"未配置 Provider"降级）
- [ ] **步骤 2**：核对值来源均为 `${...}` 引用而非硬编码（SEC-09：禁止默认弱凭据）
- [ ] **步骤 3**：`docker compose config --quiet` 验证语法；有真实域名部署时再实测 `GET /api/v1/ai/health` 返回非空 Provider 列表
- [ ] **步骤 4**：结论写入 TODO.md AI-DEP-2 备注；若发现变量名错配，修复后单独 commit：`fix(docker): 修正 backend AI 环境变量名与 config 读取对齐（AI-DEP-2）`

### 任务 3.3：OPS-1 — 数据库备份恢复演练

- [ ] **步骤 1**：确认 [docker-compose.yml](../docker-compose.yml) 中 mysql 备份服务（每日 cron）产出在 `backups/`，取最近一份 `.sql.gz`
- [ ] **步骤 2**：隔离环境演练恢复——`docker compose -f docker-compose.test.yml up -d mysql`（测试栈，端口 13306），将备份灌入：

```powershell
# 解压并导入测试库（容器名以实际 compose -p 前缀为准）
docker exec -i <test-mysql-container> mysql -uroot -p$env:TEST_MYSQL_PASSWORD < (gunzip 输出流)
```

> Windows 下建议两步：先本地 `gunzip` 或用 7-Zip 解出 `.sql`，再 `Get-Content backup.sql -Raw | docker exec -i <container> mysql -uroot -p<pwd>`；密码含特殊字符用引号包裹。

- [ ] **步骤 3**：恢复后验证——起 backend 连测试库，`GET /api/v1/stats` 返回非零数据、抽查 `ships`/`members` 表条数与备份前一致
- [ ] **步骤 4**：实测命令与结果记入 TODO.md OPS-1 → ✅；`docker compose -f docker-compose.test.yml down -v` 清理
- [ ] **Commit**：`docs: 记录数据库备份恢复演练实测结果（OPS-1）`

---

## 批次 4：AI Phase 2 — GEO 生成式搜索优化（v1.7.0，~3 天）— P2

**前置**：这是新功能开发，**先运行 brainstorming 技能做需求分析**（项目规则「设计先于编码」），产出 spec 后再按 TDD 实施。SEO 基础（sitemap/robots/预渲染/OG-canonical）已于 2026-08-24 交付，本批次只做 AI 搜索增强。

**任务卡**（brainstorming 后细化为 spec）：

| # | 任务 | 文件 | 验收 |
|:--|:--|:--|:--|
| 4.1 | `llms.txt` + `llms-full.txt` 生成 | `public/llms.txt`（手写）+ 构建脚本按站点内容生成 full 版 | 两个文件可访问，覆盖舰队/活动/加入流程核心事实 |
| 4.2 | 结构化数据 JSON-LD 扩展 | `index.html` / 预渲染产物 | Organization + FAQPage schema，[validator](https://validator.schema.org) 通过 |
| 4.3 | FAQ 知识入库 RAG | 复用 `server/src/scripts/ingest.ts` 扩展 FAQ 源 | 招募官对话可回答 FAQ 类问题（E2E 断言） |
| 4.4 | 知识图谱实体标注 | 视 brainstorming 结论决定范围 | spec 中定义的实体覆盖率达标 |

**每任务**：先写失败测试/验证 → 实现 → `npm run build` → commit（`feat(seo): ...`）。收口：CHANGELOG 记 v1.7.0，TODO.md AI-P2 → ✅。

---

## 批次 5：AI Phase 3 — 选舰助手精简版（v1.8.0，~1 周）— P2

**前置**：同批次 4，先 brainstorming。约束：复用 Phase 0 RAG 基建（pgvector + LLM 适配层），**不新增基础设施**；首页动态个性化已砍（RICE 0.10），只做问答式选舰。

**任务卡**：

| # | 任务 | 验收 |
|:--|:--|:--|
| 5.1 | 后端 `/api/v1/ai/ship-advisor` 端点（SSE 流式，复用招募官模式） | jest 单测 ≥ 80%，覆盖限流/输入校验/流式响应 |
| 5.2 | 飞船知识源入库（shipDatabase 前端数据 → ingest 源） | 对话能引用真实飞船参数推荐 |
| 5.3 | 前端 `components/ai/ShipAdvisor.vue`（终端风格复用） | 单测覆盖（同 TD-14 标准）+ E2E 一条链路 |
| 5.4 | 入口集成（Fleet 页或首页次级入口） | 视觉走全息 HUD 语言，无布局回归 |

收口：CHANGELOG 记 v1.8.0。

---

## 批次 6：前端覆盖率与 E2E 扩展（FE-COV + E2E-EXT）— P2

### 任务 6.1：FE-COV 前端覆盖率 50.3% → ≥70%

- [ ] 跑 `npm run test:coverage`，按报告列出覆盖最低的 10 个文件，**从最高行数×最低覆盖排序**逐个补测
- [ ] 补测模式照搬批次 1（读源码确认契约 → 写用例 → 单文件验证）；优先级：`src/stores/*` > `src/services/*` > `src/views/*`
- [ ] 每完成一个文件单独 commit：`test(<scope>): 补 <文件名> 单测`（scope 用 composables/services/stores/views）
- [ ] 覆盖率每提升 ~5% 更新 TODO.md FE-COV 备注；达 70% 后将 `vitest.config.js` 覆盖率门禁从 49 上调至 65（留 5% 余量），commit：`chore(config): 前端覆盖率门禁 49% → 65%`
- [ ] 注意 C2：涉及 siteConfig 的测试直接切属性 + afterEach 恢复

### 任务 6.2：E2E-EXT spec 6 → ≥7

- [ ] 若批次 2 已交付 recruiter.spec（7 个），则本任务为 fleet 页 spec：覆盖舰队列表渲染 + 船卡交互（selector 实读，C3）
- [ ] `npx playwright test --project=chromium` 全绿后 commit：`test(e2e): fleet 舰队页 spec`

---

## 批次 7：P3 技术债串行（低风险独立小步）— P3

> 顺序按「影响面小 → 大」排列，任一步失败可独立回滚不阻塞后续。

### 任务 7.1：TD-8 sanitizeBody 去重
1. 读 `server/src/middleware/auditLogger.ts` L34 与 `requestLogger.ts` L32 确认两份实现签名一致
2. 创建 `server/src/utils/sanitizeBody.ts` 导出统一函数（以两处实现中更完整者为准）
3. 两处改 import；补 `server/src/__tests__/utils/sanitizeBody.test.ts`（脱敏 key 集合、嵌套对象、数组）
4. `cd server; npm test` 全绿 → commit `refactor(middleware): 抽取 sanitizeBody 共享工具（TD-8）`

### 任务 7.2：TD-10 Sentry 静态导入
1. `src/services/errorReporting.js` 4 处 `import('@sentry/vue')` → 顶部静态 import + `if (条件) Sentry.init(...)` 守卫
2. 验证：`npm test && npm run build`（Sentry 未配置时零副作用）
3. commit `refactor(services): Sentry 改静态导入消除动态 import ×4（TD-10）`

### 任务 7.3：P1-16 DDL 去重
1. 读 `server/src/database/init.ts` 与 `migrate.ts` 各 11 个 CREATE TABLE，创建 `server/src/database/schema.ts` 导出 `SCHEMA_STATEMENTS: string[]`
2. 两文件消费数组执行；`cd server; npm run db:init`（开发库）实测建表成功 + `npm test`
3. commit `refactor(database): 抽 schema.ts 消除 init/migrate 重复 DDL ~200 行（P1-16）`

### 任务 7.4：TD-9 统一滚动动画系统
1. `Grep 'scrollReveal'` 定位 8 个引用文件
2. 逐文件改为 `useGSAPReveal.js`（ScrollTrigger），确认每文件动效目标元素等价迁移
3. 全部迁移后删除 `src/directives/scrollReveal.js` 及其注册点；`npm run build` + 目验首页滚动 reveal 正常 + `npx playwright test e2e/home.spec.js`
4. commit `refactor(components): 统一 GSAP 滚动动画系统，移除 scrollReveal 指令（TD-9）`

### 任务 7.5：TD-13 CSS 变量迁移组②③④
按 [TODO.md](TODO.md) TD-13 既有分组（②UI 组件 ~30 处 → ③Admin ~60 处 → ④用户页面 ~38 处）逐组执行：
1. 每组逐文件按 `variables.css` 别名块映射替换（长名优先，`--text-muted` → `--color-text-dim` 等映射表见 TODO.md L65-72）
2. 每组完成：`node scripts/css-var-lint.mjs . --strict` 零 deprecated + `npm run build` + dev 目验该组页面
3. 每组一 commit：`style(components): 迁移组② UI 组件 CSS 变量别名（TD-13）`
4. 三组全过后 TODO.md 质量门禁表 CSS deprecated 行归零

---

## 交付物与状态同步（每批次收口必做）

1. [TODO.md](TODO.md)：对应编号状态更新（⚠️ → ✅），版本头日期更新
2. [ROADMAP.md](ROADMAP.md)：执行路线树对应节点状态
3. [CHANGELOG.md](../CHANGELOG.md)：功能批次（4/5）记版本号；技术债批次（7）记 Fixed 项
4. 记忆更新：执行 AI 会话结束前按 AGENTS.md 自动记忆机制写入项目记忆

## 执行顺序总览

```
批次1 TD-19+TD-14（AI 测试地基）  →  批次2 TD-15（E2E）
  →  批次3 AI-DEP-1/2 + OPS-1（上线验证）
  →  批次4 GEO v1.7.0  →  批次5 选舰 v1.8.0
  →  批次6 FE-COV+E2E-EXT  →  批次7 P3 技术债串行
```

每个任务 = 独立 commit + 实跑验证命令确认输出。任何一步验证失败：先修复再继续；无法解决则停在当前任务，报告失败命令与完整输出，**不要跳过或标记完成**。
