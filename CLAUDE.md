<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版（已精简）

本项目安装 superpowers-zh 技能框架，2026-08-05 项目筛查后保留 5 个核心 skills，剔除 15 个不适用项（说明见 AGENTS.md）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.trae/skills.backup/` 目录（备份存档），每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行

## 如何使用

当任务匹配某个 skill 时，读取 `.trae/skills.backup/<skill-name>/SKILL.md` 并严格遵循其流程。不要用 Read 工具直接读取 SKILL.md 文件，按需通过 Skill 工具加载。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->
