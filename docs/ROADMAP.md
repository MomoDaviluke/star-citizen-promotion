# 项目优化路线图

> **项目**: Star Citizen 战队宣传网站
> **创建日期**: 2026-05-31
> **最后更新**: 2026-08-27
> **版本**: v1.6.2 → v1.8.0 路径规划（v1.5 AI 集成已交付；2026-08-24 SEO 基础已交付）
> **约束**: 单人开发，所有任务串行执行
> **原则**: 先补最短的板，再加固地基，最后做架构升级；AI 集成已成为当前主线

---

## 当前状态

| 维度 | 现状 | 目标 | 差距 |
|:---|:---|:---|:---|
| 后端测试通过 | 498 个 / 100%（2026-08-26 实测） | 100% | ✅ |
| 后端语句覆盖率 | 75.35%（整体，实测）/ AI 模块 88.94% | ≥ 70%（整体） | ✅ 已达成 |
| AI Phase 0 基础设施 | LLM Provider + pgvector RAG + Redis 缓存 | 完成 | ✅ |
| AI Phase 1 招募官 | 对话式 RAG + SSE 流式 + 画像预填 | 验收 8 项 | ✅ 全过 |
| AI 前端组件测试 | 0（useAiRecruiter + 5 组件未测） | ≥ 80% | 待补（TD-14） |
| 前端语句覆盖率（实测） | 50.3%（2026-08-26 实测） | ≥ 49%（门禁已生效） | ✅ TD-17 已修 |
| E2E spec | 6 个（含 real-backend 真实往返） | ≥ 5 | ✅ TD-18 已修 |
| SEO 基础 | sitemap / robots / 预渲染 / OG-canonical | 完成 | ✅ 2026-08-24 交付 |
| 高危安全漏洞 | 0 | 0 | ✅ |
| 日志轮转 | winston-daily-rotate-file | 自动轮转 | ✅ |
| 数据库备份 | Docker 每日备份 | 自动备份 | ✅（恢复流程待演练 OPS-1） |
| TypeScript | 仅后端 | 保持现状 | 前端暂不迁移 |
| 版本号 | package.json 1.6.2 | 1.6.2 | ✅ 已同步（2026-08-24） |

---

## 执行路线

```
紧急: 代码审查修复（4 P0 + 11 P1）            ✅ 已完成
第一阶段: 后端 0% 模块补测试（覆盖率 75.35%）      ✅ 已完成
第二阶段: 运维地基（日志轮转/备份/SSL）            ✅ 已完成（恢复演练待做 OPS-1）
第三阶段: 前端测试加固（~2 周）                  🚧 部分完成（50.3%，E2E 6 spec）
第四阶段: 安全架构（API v1/Cookie/TD-20）        ✅ 已完成（2026-08-10）
AI 主线（2026-08 起）:
  ├── Phase 0: LLM 适配层 + RAG 基建            ✅ 已完成（2026-08-03）
  ├── Phase 1: AI 招募官 Agent                  ✅ 已完成（2026-08-03）
  ├── Phase 2: GEO 生成式 AI 搜索优化           📋 待启动（~3 天）
  └── Phase 3: AI 飞船推荐                      📋 待启动（~1 周）
```

---

## 已完成阶段归档（2026-08-27 精简）

| 阶段 | 目标 | 结果 |
|:---|:---|:---|
| 紧急阶段 | 代码审查修复（2026-06-08 发现 4 P0 + 11 P1） | 全部修复；DDL 重复项遗留为 TODO P1-16 |
| 第一阶段 | 后端覆盖率 63.86% → 70%+ | 75.35%（2026-08-05 实测）；websocket(17)/metrics(10)/swagger(8) 全覆盖 |
| 第二阶段 | 日志轮转 + 数据库备份 + SSL | winston-daily-rotate-file（20MB/14d）、backup 容器（每日 3 点/留 30 天）、certbot 自动续期全部就绪；**恢复流程未演练（OPS-1）** |
| 第四阶段 | API v1 收口 + httpOnly Cookie JWT + TD-20 分层 | 2026-08-10 交付；localStorage 无 token，E2E 认证链路通过 |

**备份恢复命令**（OPS-1 演练时使用）：

```bash
gunzip < backups/backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker-compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME"
```

> 各阶段完整计划与实现细节已随文档精简移除，git 历史可查。

---

## 第三阶段: 前端测试加固（🚧 部分完成）

**目标**: 前端覆盖率 50.3% → 70%+
**策略**: 单人开发调为 70% 够用；UI 纯渲染测试 ROI 低，优先 Service/Store/Router 逻辑测试。

| 模块 | 测试重点 | 预计 |
|:---|:---|:---|
| Service 层 | `calendarService.js` / `fleetService.js` API 调用、错误处理 | 1~2 天 |
| Store + Router | auth/calendar/fleet 状态流转、路由守卫 | 2~3 天 |
| 核心 View | Home/Members/Projects/Contact 渲染与交互 | 3~4 天 |
| E2E 扩展 | `fleet.spec.js` / `admin.spec.js` | 2 天 |

### 第三阶段验收标准

- [ ] 前端估算覆盖率 ≥ 70%
- [ ] Service/Store/Router 逻辑测试全部通过
- [ ] E2E 7 个 spec 全部通过
- [ ] 所有现有测试无回归

---

## AI 集成阶段（2026-08-03 起，当前主线）

**目标**: 一次基础设施投入，多消费端复用（招募官 / GEO / 智能推荐），兼顾简历展示 + 上线产品价值。

**架构决策**: 方案 A「基础设施先行」——Phase 0 建共享 RAG 基础设施，Phase 1~3 作为消费端复用。设计决策见 ARCHITECTURE.md AD-07 ~ AD-12。

### Phase 0: LLM 适配层 + RAG 基础设施（✅ 2026-08-03）

LLMProvider 接口（chat/chatStream/embed）+ Provider 三件套（OpenAI 兼容豆包/DeepSeek + Anthropic + 工厂降级链）+ RAG 引擎（Embedder/Retriever/Ingester/PromptBuilder）+ LlmService（Redis 缓存 24h）/ RagService + PostgreSQL(pgvector)/Redis 服务 + `ai:ingest`/`ai:migrate` 脚本 + `/api/v1/ai/health|retrieve` 路由。

### Phase 1: AI 招募官 Agent（✅ 2026-08-03，验收 8 项全过）

后端 SessionStore（Redis）+ ProfileEngine + RecruiterService + SSE 路由（限流 10 次/分/IP）；前端 useAiRecruiter + 5 全息终端组件；首页终端入口 + Join.vue `?ai_profile=` 画像预填。AI 模块覆盖 88.94%。

### Phase 2: GEO 生成式 AI 搜索优化（📋 待启动，~3 天）

| # | 动作 | 交付 |
|:--|:--|:--|
| 1 | `public/llms.txt` | AI 爬虫友好的公会信息声明 |
| 2 | `robots.txt` 放行 AI 爬虫 | 显式允许 GPTBot / ClaudeBot / Bytespider |
| 3 | Schema.org JSON-LD | Organization / VideoGame / Event / FAQPage 注入关键页面 |
| 4 | FAQ 内容入库 | 复用 Phase 0 知识库，同时服务 RAG 与 GEO |
| 5 | 知识图谱 JSON-LD | `/api/v1/geo/graph` 动态生成 |
| 6 | 站长平台提交 | 豆包 / DeepSeek / Bing Webmaster |

> 前提已满足：SEO 基础（sitemap/robots/预渲染/OG-canonical）已于 2026-08-24 交付。

### Phase 3: AI 飞船推荐（📋 待启动，~1 周）

选舰助手: 3-5 问题 → 画像向量 → pgvector 检索 ships → 规则过滤 → LLM 流式推荐理由（`POST /api/v1/ai/recommend/ships`）。动态首页个性化已砍（RICE 0.10）。

### AI 阶段质量门禁

| 指标 | 目标 | 状态 |
|:---|:---|:---|
| 后端 AI 模块覆盖率 | ≥ 80% | ✅ 88.94% |
| 前端 AI 组件测试 | ≥ 80% | ⚠️ 未补（TD-14） |
| AI E2E spec | 1 个 | ⚠️ 未做（TD-15） |

---

## 第五阶段: 按需推进

以下任务**不急于现在做**，等业务需要或用户量起来后再启动。

| 任务 | 触发条件 | 工作量 |
|:---|:---|:---|
| 软删除机制（核心表 `deleted_at` + Service 过滤） | 用户误删反馈 / 数据审计需要 | 2~3 天 |
| 前端性能优化（Bundle 分析 / WebP / 字体子集化） | 用户量起来后 Lighthouse 需优化 | 3~5 天 |
| 前端 TypeScript 迁移 | 代码量增长到维护困难 / 第二开发者加入 | 2~3 周 |
| i18n 国际化 | 面向国际玩家 | 1~2 周 |
| Grafana 监控仪表盘 | 生产部署后需要可视化监控（Prometheus 指标已就绪） | 1~2 天 |

---

## 总览

| 阶段 | 内容 | 状态 |
|:---|:---|:---|
| 紧急阶段 + 第一/二/四阶段 | 审查修复 / 补测 / 运维 / 安全架构 | ✅ 全部交付 |
| 第三阶段 | 前端测试加固 + E2E 扩展 | 🚧 部分（覆盖率 50.3%，E2E 6/7 spec） |
| AI Phase 0 / Phase 1 | RAG 基建 + 招募官 Agent | ✅ 已交付（2026-08-03） |
| AI Phase 2 | GEO 生成式 AI 搜索优化 | 📋 待启动 |
| AI Phase 3 | AI 飞船推荐（精简版） | 📋 待启动 |
| 第五阶段 | 按需推进 | — |

---

## 版本规划

| 版本 | 关键交付 | 状态 |
|:---|:---|:---|
| v1.4.0 | 后端补测、日志轮转、备份、SSL | ✅ 2026-07 |
| v1.5.0 | AI Phase 0 + Phase 1（招募官 Agent） | ✅ 2026-08-03 |
| v1.5.1 / v1.5.2 | 依赖漏洞 / 安全架构收口 | ✅ 2026-08-06 ~ 10 |
| v1.6.0 | 转化埋点 + 第四阶段安全架构 | ✅ 2026-08-10 |
| v1.6.1 | 技术债快修 TD-7/11/12 | ✅ 2026-08-10 |
| v1.6.2（当前） | 上线前评审修复（js-yaml/门禁/版本/E2E） | ✅ 2026-08-24 |
| v1.6.x 收尾 | 覆盖加固（+17 单测）/ E2E 真实链路 / 端口收紧 | ✅ 2026-08-26 |
| v1.7.0 | AI Phase 2: GEO 搜索优化 | 📋 计划中 |
| v1.8.0 | AI Phase 3 精简版: 选舰助手 | 📋 计划中 |
| 遗留 | CSS 变量迁移②③④、TD-8/9/10、P1-16 DDL 抽取 | ⚠️ 未完成（见 [TECH_ARCHIVE_2026-08-26 §6/§7](reports/TECH_ARCHIVE_2026-08-26.md)） |

---

## 2026-08-05 审核后方向重排（RICE 评分）

> 依据：产品目标 = 简历展示 + 招募转化/流量入口；单人开发、串行执行。由 PM（许清楚）+ 架构师（高见远）+ QA（严过关）联合产出。**原「Phase 2 GEO → Phase 3 飞船推荐」直接顺序被否决**：GEO 全套是播种性工作、确定性低（SPA 无预渲染时 AI 爬虫只见空壳）；且无转化埋点时一切功能都是盲打。

### RICE 评分表

| 方向 | Reach | Impact | Confidence | Effort | RICE | 判定 |
|:---|:---|:---|:---|:---|:---|:---|
| 安全底线（httpOnly Cookie + API v1 收口） | 高 | 高 | 100% | 3 天 | 3.33 | 先做 |
| 转化埋点（申请漏斗） | 中 | 高 | 80% | 3 天 | 3.20 | 先做 |
| 技术债快修（TD-12 ICS 转义等） | 低 | 中 | 100% | 2 天 | 1.50 | 快做 |
| SEO 基础（sitemap/canonical/预渲染检查） | 中 | 中 | 60% | 3 天 | 0.90 | 做 |
| 选舰助手（AI Phase 3 精简） | 中 | 中 | 50% | 1 周 | 0.40 | 做 |
| GEO 全套（llms.txt/JSON-LD/知识图谱） | 低 | 中 | 30% | 3 天 | 0.17 | 缓 |
| 动态首页个性化 | 低 | 低 | 40% | 1 周 | 0.10 | 砍 |

### 建议执行顺序

1. **✅ 安全底线（2026-08-10）**：TD-24 依赖漏洞 → httpOnly Cookie JWT → /api/v1 前缀收口 → TD-20 admin 分层
2. **✅ 转化埋点（2026-08-10，v1.6.0）**：`/api/v1/analytics` + 6 处接入，8 事件白名单，默认开启（TD-21）
3. **✅ 技术债快修（2026-08-10，v1.6.1）**：TD-12 ICS 转义 → TD-11 knexfile 工厂 → TD-7 冗余 SELECT
4. **✅ SEO 基础（2026-08-24）**：sitemap.xml / robots / 预渲染 / OG-canonical —— GEO 全套的前提已落地
5. **AI 质量补测 ← 当前步骤（~2 天）**：TD-14 AI 组件单测 + TD-15 E2E + TD-19 Home.vue 隔离
6. **选舰助手（AI Phase 3 精简版，~1 周）**

### 被否决/缓办项

| 项 | 处理 | 理由 |
|:---|:---|:---|
| GEO 全套（llms.txt/JSON-LD/知识图谱） | 缓办 | 播种性、确定性低；SEO 基础已落地，可择机启动 |
| 动态首页个性化 | 砍掉 | RICE 最低（0.10），单人开发投入不划算 |
| 前端覆盖率 ≥70% | 目标先 50% 再逐步上调 | 单人开发 UI 组件纯渲染测试 ROI 低；TD-17 门禁已生效 |
| E2E 7 spec | 先质量后数量 | 恒真断言已修（TD-18），real-backend 已补，再扩 fleet/admin |

---

## 一句话总结

**安全底线 → 埋点 → 技术债快修 → SEO 基础均已交付。当前步骤：AI 质量补测（TD-14/15/19）→ 选舰助手 → GEO。** TypeScript 迁移、i18n、软删除等大工程等业务需要再启动，不要提前投资。
