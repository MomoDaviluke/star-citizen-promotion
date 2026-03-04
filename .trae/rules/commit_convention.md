# 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

## 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

## 类型 (type)

| 类型 | 描述 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复bug |
| `docs` | 文档更新 |
| `style` | 代码格式调整（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` | 构建系统或依赖更新 |
| `ci` | CI配置更新 |
| `chore` | 其他杂项 |
| `revert` | 回滚提交 |

## 范围 (scope)

可选的范围标识：

- `router` - 路由相关
- `components` - 组件相关
- `services` - 服务层
- `styles` - 样式相关
- `config` - 配置文件
- `ai` - AI服务相关

## 示例

```bash
feat: 添加用户登录功能
fix(router): 修复页面跳转动画卡顿问题
docs: 更新README部署说明
refactor(services): 重构AI服务队列逻辑
perf: 优化首屏加载性能
```
