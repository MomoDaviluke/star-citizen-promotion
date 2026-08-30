# Star Citizen 推广站上线前评审报告

> **评审方式**: 全量自主实测（不依赖既有技术文档）
> **日期**: 2026-08-24
> **被测版本**: 根 package.json v1.5.0 / CHANGELOG 声称 v1.6.1（存在不一致，见 §1.7）

---

## 0. 结论速览

| 维度 | 实测结果 | 结论 |
|:--|:--|:--|
| 后端单测 | 47 suites / **478 全过**，`tsc --noEmit` exit 0 | ✅ 通过 |
| 后端覆盖率 | 门禁通过（branch 60/function 70），但多个核心服务 0% | ⚠️ 门禁名存实亡 |
| 前端单测 | 38 文件 / **334 全过** | ✅ 通过 |
| 前端构建 | `vite build` exit 0（807ms） | ✅ 通过 |
| 前端 typecheck | `tsc --noEmit -p jsconfig.json` exit 0 | ✅ 通过 |
| 前端 lint | **0 errors / 211 warnings** | ⚠️ 通过但有噪音 |
| E2E | chromium 项目 **45/45 过**（需手动配浏览器环境） | ⚠️ 有条件通过 |
| 依赖安全 | 后端 **1 个高危（js-yaml，runtime）**；前端 29 个（多为 dev） | ❌ 未达标 |
| 版本一致性 | package.json 1.5.0 vs CHANGELOG 1.6.1 | ❌ 未达标 |

**一句话**: 静态检查与单测绿灯，但 E2E 未真正打通后端、覆盖率门槛与版本管理存在问题、生产依赖含已知高危漏洞。**建议修复 §1.7 / §2.1 / §2.2 后再上线；E2E 层需补齐真实后端联调后才能作为发布门禁。**

---

## 1. 实测过程与逐项结果

### 1.1 后端单测 + TypeScript（✅）
- 命令: `npm test`（server/jest）、`npx tsc --noEmit`（server）
- 结果: `Test Suites: 47 passed; Tests: 478 passed`；`TSC_EXIT=0`

### 1.2 后端覆盖率（⚠️）
- 命令: `npm run test:coverage`（server），exit 0，branch 60%/function 70% 门禁满足
- 但覆盖率表暴露关键盲区（**均为 0%**）:

| 文件 | statements | 说明 |
|:--|:--|:--|
| `activityLogService.ts` | 0 | 行为日志服务 |
| `adminService.ts` | 0 | 管理服务 |
| `statsService.ts` | 0 | 统计服务 |
| `pgPool.ts` / `redisClient.ts` | 0 | PG 向量库 / Redis 连接 |
| `scripts/ingest.ts` / `pgMigrate.ts` | 0 | 数据摄取 / PG 迁移 |

结论: 门禁“通过”只是因为阈值低，**生成式 AI 向量库（pg/redis）与统计/活动日志链路完全没有测试覆盖**，而这些正是本项目卖点（AI 招募）。

### 1.3 前端单测 + 覆盖率（⚠️）
- 命令: `npm run test:coverage`（根），exit 0
- 覆盖率门槛见 [vitest.config.js](file:///c:/Users/Administrator/Desktop/star-citizen-promotion/vitest.config.js#L36-L41): `lines/functions/branches/statements: 8`
- 阈值 **8%** 形同虚设（未达到“保护过任何代码”的意义）
- 实际某些关键视图覆盖率过低: `Join.vue` 38% / `Register.vue` 36% / `Login.vue` 44%，admin 各页分支覆盖率多 <15%

### 1.4 前端构建 + typecheck（✅）
- `npm run build`: exit 0（built in 807ms）。PWA precache 86 entries（16.5MB）
- 构建告警: `[INEFFECTIVE_DYNAMIC_IMPORT] usePwa.js` 同时被动态/静态导入，代码分割失效（低优先级）
- `npm run typecheck`: `TYPECHECK_EXIT=0`

### 1.5 前端 lint（⚠️）
- `npm run lint`: **0 errors / 211 warnings**，exit 0
- 典型噪音: 大量 `no-unused-vars`（HudCorner.vue、StarMapGrid.vue、About.vue 等未用 props/import）、`no-console`（scripts）

### 1.6 E2E（⚠️ 有条件通过）
- 裸跑 `npm run test:e2e` → **45 全挂**，根因:
  ```
  Executable doesn't exist at ...\chromium_headless_shell-1208\chrome-headless-shell.exe
  ```
  本地仅缓存 `chromium_headless_shell-1228`，与 playwright@1.58.2 期望的 1208 版本不符。
  [playwright.config.js](file:///c:/Users/Administrator/Desktop/star-citizen-promotion/playwright.config.js#L12-L37) 的缓存回退只匹配完整 `chromium-<n>`，不覆盖 headless shell 启动路径。
- 设 `PLAYWRIGHT_CHROMIUM_PATH` + `--project=chromium` 后 → **45/45 过**（2.4m）
- **关键问题**: E2E 运行 `vite preview`（production 模式）→ `loadEnv('production')` 读到 `.env.production` 的 `VITE_BACKEND_URL=https://api.yourdomain.com`（占位域名，绑定的还是 sucura.net 证书）→ 页面所有 `/api/v1/*`（如 auth/me、events、stats、analytics）代理请求全部 `ERR_TLS_CERT_ALTNAME_INVALID` 失败。
  45 个用例之所以“过”，是因为它们断言的是 **UI 渲染 / 布局 / 导航 / 走 page.route 假接口 / 静态降级数据**，**没有一条验证真实后端链路**。

结论: E2E 当前是“**前端 UI 冒烟 + 本地浏览器环境手动依赖**”，不能作为后端已联调的发布门禁。

### 1.7 依赖安全与版本（❌）
- **后端** audio: 1 个高危
  ```
  js-yaml 4.0.0 - 4.3.0  High  CVE-2026-59870 (GHSA-5p4m-2wfm-xmqj)
  ```
  `js-yaml` 位于 `swagger-jsdoc@6.3.0` → swagger-parser 依赖链，而 swagger-jsdoc 在 server **runtime dependencies**（[package.json L60](file:///c:/Users/Administrator/Desktop/star-citizen-promotion/server/package.json#L60)）。Dockerfile 生产阶段 `npm ci --omit=dev` 会保留它 → **高危漏洞进入生产镜像**。
- **前端** audio: 29 个（19 moderate / 10 high），如 `undici`（CSP 相关）、`uuid`/`hyperid`（经 dev 依赖 autocannon）。前端生产 dependencies（vue/pinia/router/gsap 等）本身未见高危拉入链，但 dev 链污染严重。
- **版本不一致**（❌）:
  - `package.json` `version: "1.5.0"`（根 + server）
  - `CHANGELOG.md` 头注 `当前版本 v1.6.1`，最近条目为 [1.6.1]（TD-7/11/12）
  - → 发布产物版本号与变更记录脱节，`npm version`/自动生成 tag 会误标

---

## 2. 必须修复项（上线阻塞）

| # | 问题 | 证据 | 修复建议 |
|:--|:--|:--|:--|
| **2.1** | 后端生产镜像含高危 js-yaml (CVE-2026-59870) | §1.7 | 升级 swagger-jsdoc 或改用 `@apidevtools/swagger-parser` 安全版本 / 覆盖 js-yaml 到已修复版本；若 swagger 仅开发用，改入 devDependencies 并从生产 `npm ci --omit=dev` 移除到验证实际不进镜像 |
| **2.2** | 版本号不一致：package.json 1.5.0 vs CHANGELOG 1.6.1 | §1.7 | 统一：`npm version 1.6.1` 提升根+server,确保与 CHANGELOG 对齐，并补一条 changelog 记录本次评审修复 |
| **2.3** | E2E 无法联调真实后端（占位域名 + 全部 /api 失败） | §1.6 | E2E webServer 显式指定 `VITE_BACKEND_URL=http://localhost:3001`（注入 env 覆盖 .env.production），并在 compose 里起真实后端；至少保证含一条**端到端真实 API 往返断言** |
| **2.4** | 前端覆盖率门槛 8% 无约束力 | [vitest.config.js L36-41](file:///c:/Users/Administrator/Desktop/star-citizen-promotion/vitest.config.js#L36-L41) | 提升到有意义的阈值（如 lines≥60、branches≥40），否则 allow-listing |
| **2.5** | 后端核心服务 0% 覆盖（pg/redis/AI 摄取/统计/活动日志） | §1.2 | 至少为 pgPool、redisClient、ingest、statsService 补冒烟测试，明确哪些允许豁免 |

---

## 3. 建议修复项

| # | 问题 | 建议 |
|:--|:--|:--|
| 3.1 | E2E `npm run test:e2e` 裸跑必挂（headless shell 版本漂移） | 本地回退逻辑补 headless shell 探测；或文档注明必备的浏览器安装前置；CI 用 `npx playwright install --with-deps` |
| 3.2 | apply.spec.js 两个用例断言过弱 | [`填写完整表单应能提交`](file:///c:/Users/Administrator/Desktop/star-citizen-promotion/e2e/apply.spec.js#L18-L36) 提交后**无任何成功断言**（仅 waitForTimeout）；“空表单验证”仅断言 URL 含 /join。应断言成功面板/跳转或后端错误消息可见 |
| 3.3 | lint 211 条 warning 噪音 | 清掉未用 props/import（HudCorner、StarMapGrid、About 等），或对 `no-console`/`no-unused-vars` 按目录降级、纳入脚手架 |
| 3.4 | 前端 dev 依赖链 29 个漏洞 | `npm audit fix`（保留非 breaking 的），undici（Vite 链）等在 devDependency 加 override 升级 |
| 3.5 | `usePwa.js` 动态/静态双导入，分割失效 | 统一为静态 import，或在 main.js 移除动态导入 |
| 3.6 | 关键视图（Login/Register/Join、admin）覆盖不足 40% | 补认证与申请主流程的关键分支用例 |

---

## 4. 留给开发的接口建议

- **依赖门禁**: 将 `npm audit --audit-level=high` 接入 CI，阻止新高危依赖合入（有脚本 `security:audit`，但需进 workflow gate）。
- **覆盖率门禁**: 前端门槛升到合理值，后端补齐核心链路后维持 branch 60/function 70。
- **E2E 数据层**: 建立一套可重复的本地后端环境（compose up + migrate）供 E2E 联调，替代对静态降级数据的依赖；并为“申请提交/状态查询”补真实往返断言。

---

*注: 本文档完全基于 2026-08-24 实测输出（各命令退出码与断言见正文），不含对既有技术报告的转述。*