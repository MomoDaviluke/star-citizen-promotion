<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版

本项目已安装 superpowers-zh 技能框架（7 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.Codex/skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **finishing-a-development-branch**: 当实现完成、所有测试通过、需要决定如何集成工作时使用——通过提供合并、PR 或清理等结构化选项来引导开发工作的收尾
- **requesting-code-review**: 完成任务、实现重要功能或合并前使用，用于验证工作成果是否符合要求
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前

## 如何使用

当任务匹配某个 skill 时，使用 `Skill` 工具加载对应 skill 并严格遵循其流程。绝不要用 Read 工具读取 SKILL.md 文件。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->

## 自动记忆更新机制

### 触发条件（满足任一即执行更新）

1. **会话结束前** — 用户说"继续"切换话题、会话即将结束、或完成一个完整任务
2. **架构决策** — 做出了影响项目结构的技术选型或设计决策
3. **重大变更** — 新增/删除文件、重构模块、修改 API 接口
4. **经验教训** — 发现 bug 根因、踩坑、或否决了某个方案
5. **进度里程碑** — 完成一个优先级任务（P0-P3）

### 更新流程

```
触发更新时，按以下顺序执行：

1. 读取 project_memory.md
2. 更新对应板块：
   - 完成任务 → 更新「当前进度」勾选状态
   - 架构决策 → 在「Architecture Decisions」表格新增一行
   - 文件变更 → 在「Change Log」表格新增一行
   - 踩坑/经验 → 在「Lessons Learned」新增条目
   - 删除代码 → 在「Deleted Dead Code」新增条目
3. 更新文件头的「最后更新」日期和「当前阶段」
4. 判断是否需要同步到全局记忆：
   - 新增的经验是否跨项目通用？ → 更新 user_profile.md「跨项目经验库」
   - 新增的技术栈？ → 更新 user_profile.md「技术栈」
   - 新项目？ → 更新 user_profile.md「项目索引」
5. 无需用户提醒，自动执行上述步骤
```

### 记忆文件结构

**project_memory.md** (项目级):
- 项目概况 | 当前进度 | Hard Constraints | Engineering Conventions
- Architecture Decisions (表格) | Deleted Dead Code
- Lessons Learned | Change Log (表格)

**user_profile.md** (全局级):
- 用户偏好 | 技术栈
- 跨项目经验库 (分类标签化: SEC/ARCH/QUAL/DES/DBG)
- 方法论 | 项目索引

### 原则
- 记忆更新是助手的职责，不需要用户提醒
- 每次更新必须写入文件，不能只在对话中口头总结
- 经验条目使用标签编号（如 SEC-01），便于跨项目检索匹配
- 过时的信息直接修改，不累积历史版本
