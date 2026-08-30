# Apifox 探索测试 · 快速上手

> 目的：用 **Apifox**（中文）对**真实环境**（不是 mock）做一次接口探索，学会"点接口、看返回、判断对错"——这是企业接口测试的基本功。
> 配套真实环境：`npm run test:integration -- --keep`（起好后后端在 `http://localhost:3101`）。

## 1. 前置（一次性）

1. 起真实环境（保留）：`npm run test:integration -- --keep`，等输出 "真实集成测试全部通过" 且提示保留环境。
2. 打开 Apifox → 登录 → **新建项目**（如 "SC 探索"，选「基础项目」）。
3. 项目内 **导入数据** → 类型选 **Postman** → 选 `docs/postman/star-citizen-exploration.postman_collection.json`。
4. 若提示环境变量：Apifox 左「环境管理」新建环境，加 `baseUrl = http://localhost:3101` 并选中生效。

## 2. 怎么操作（每个请求三步）

1. 点开请求（在 `①/②/③` 分组下）→ 点右上 **发送**。
2. 看三个东西：**状态码**、**响应体**、**耗时**（看快不快/有无可疑）。
3. 对照下表"预期"，判断 **通过 / 不通过**；不通过就把实际状态码+响应记下来。

## 3. 分组与预期

### ① 存活 / 连通
| 请求 | 预期 |
|:--|:--|
| GET /health | 200，body 含 `database: true`（连通 DB） |
| GET /health/live | 200 |
| GET /health/ready | 200 |

### ② 公开读接口
| 请求 | 预期 |
|:--|:--|
| GET /api/v1/stats | 200，`success: true`，有 `stats` + `summary` |
| GET /api/v1/fleet /pilots /members /projects /events | 200 且 `success: true` |

### ③ 探索 / 边界 / 乱输入（重点，练的就是这个）
| 请求 | 预期 | 你要体会的点 |
|:--|:--|:--|
| POST applications 空 body | **400** + 校验错误 | 空输入被拦，而不是 500 |
| POST applications 缺 name | **400**，提示"姓名不能为空" | 校验是分字段的 |
| POST applications email 非法 | **400**，提示邮箱无效 | 校验规则 |
| POST applications 正常 | **201**，返回 `id` | 校验通过 → 写库 |
| GET events?limit=2000 | 200，`limit` 被钳到上限（非 2000） | 分页边界被保护 |
| GET events?page=0 | 200，`page` 被修正为 1 | 边界被保护 |
| GET 未认证 admin | **401/403**（不是 500） | 权限拦截 |
| GET 未知路由 | **404** | 明确的路由不存在 |
| POST analytics 合法事件 | **204** | 埋点通道通 |
| POST analytics 白名单外事件 | **400** | 白名单校验 |
| POST 注册 正常 | 201 | 写库成功 |
| POST 注册 重复邮箱 | **409/400** | 唯一冲突被拦 |
| POST 注册 弱密码 | **400** | 强度校验 |

## 4. 这张表教你的"方法论"

- **先连通后功能**：①→② 证明服务+DB正常，③ 才是有意义的功能验证。
- **正例 + 反例成对**：正常提交(201) vs 缺字段/非法/重复——每个输入维度都要测"合法 + 非法"两端。
- **边界值必测**：`limit=2000`、`page=0` 就是典型边界，很多 bug 藏在这里。
- **状态码是第一语言**：2xx 成功 / 4xx 客户端问题(校验·权限·404) / 5xx 服务端故障。出现 **500** 是企业最忌讳的（不应有）。

## 5. 收尾

- 探索完清理环境：`docker compose -f docker-compose.test.yml down -v`
- 若发现 `500` 或"预期 4xx 却返回 5xx/2xx"的异常，就是真 bug——记下来可交给开发（这正是"探索测试找出细节问题"的价值）。

> 提示：每次改 body 字段名/值再发送，看响应变化，就是"探索"的本质——它帮你反推出接口到底约束了什么。