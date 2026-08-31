# MCP 客户端接入指南

> 本项目的 MCP Server 通过 `POST /api/v1/mcp` 以 Streamable HTTP 风格对外提供 JSON-RPC 2.0 接口，
> 可以被 Claude Desktop、Cursor、Windsurf 等支持 MCP 的客户端直接接入，
> 让通用 AI 客户端具备查询本站实时数据（舰队/活动/统计）的能力。

---

## 一、服务端信息

| 项目 | 值 |
|:-----|:-----|
| 端点 | `POST /api/v1/mcp` |
| 协议 | JSON-RPC 2.0（MCP 2024-11-05 规范核心子集） |
| 方法 | `initialize` / `notifications/initialized` / `ping` / `tools/list` / `tools/call` |
| 限流 | 30 次/分钟/IP |
| 认证 | 当前公开只读（无需 Token） |

### 内置工具

| 工具名 | 用途 | 参数 |
|:-------|:-----|:-----|
| `query_fleet` | 查询舰队舰船列表 | `category?: string`（类别筛选）、`limit?: number`（默认 5，最大 20） |
| `get_fleet_stats` | 舰队统计（总数/价值/分布） | 无 |
| `query_events` | 查询未来 N 天活动 | `days?: number`（默认 14，最大 60）、`limit?: number`（默认 5，最大 20） |

---

## 二、Claude Desktop 接入

Claude Desktop 支持通过 **Streamable HTTP** 直接连接远程 MCP Server（较新版本）。
编辑配置文件（`claude_desktop_config.json`，位置见 Claude 设置 → Developer）：

```json
{
  "mcpServers": {
    "stellar-nexus": {
      "type": "http",
      "url": "http://localhost:3001/api/v1/mcp"
    }
  }
}
```

> 版本较旧的 Claude Desktop 仅支持 stdio 传输，可用 `mcp-remote` 桥接：
>
> ```json
> {
>   "mcpServers": {
>     "stellar-nexus": {
>       "command": "npx",
>       "args": ["-y", "mcp-remote", "http://localhost:3001/api/v1/mcp"]
>     }
>   }
> }
> ```

重启 Claude Desktop 后，对话框左下角会出现工具图标，即可对它说：
"帮我查一下这个战队的舰队里有哪些船"——Claude 会自动调用 `query_fleet`。

## 三、Cursor 接入

Cursor（v0.46+）支持 HTTP MCP。打开 `Settings → MCP → Add new MCP Server`：

```json
{
  "mcpServers": {
    "stellar-nexus": {
      "url": "http://localhost:3001/api/v1/mcp"
    }
  }
}
```

添加后在 Chat 面板启用该 Server，`@stellar-nexus` 即可让对话调用本站工具。

## 四、通用 HTTP 调试（curl）

**1. initialize 握手：**

```bash
curl -X POST http://localhost:3001/api/v1/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": { "listChanged": false } },
    "serverInfo": { "name": "stellar-nexus-mcp", "version": "1.0.0" }
  }
}
```

**2. 工具发现：**

```bash
curl -X POST http://localhost:3001/api/v1/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

**3. 工具调用：**

```bash
curl -X POST http://localhost:3001/api/v1/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"query_fleet","arguments":{"category":"fighter","limit":3}}}'
```

**4. 未知工具（错误协议演示）：**

```bash
curl -X POST http://localhost:3001/api/v1/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"not_exist"}}'
```

返回 `-32602` 与可用工具列表：

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "error": {
    "code": -32602,
    "message": "未知工具: not_exist",
    "data": { "available": ["query_fleet", "get_fleet_stats", "query_events"] }
  }
}
```

---

## 五、协议约定（实现细节）

- **双层错误模型**：方法级错误走 JSON-RPC `error`（`-32600` 请求非法 / `-32601` 未知方法 / `-32602` 参数非法 / `-32603` 内部错误）；工具执行级错误走 `result.isError = true`（符合 MCP 规范，LLM 可读可解释）
- **生产部署**：URL 中的 `localhost:3001` 替换为实际域名（如 `https://your-domain.com/api/v1/mcp`），由 nginx 反代到后端
- **内部 Agent**：站内 AI 招募官的 Agent 循环走进程内 `InProcessTransport`，不经过此 HTTP 端点（零网络开销）

## 六、服务端实现索引

| 文件 | 职责 |
|:-----|:-----|
| `server/src/mcp/types.ts` | JSON-RPC 2.0 + MCP 类型与错误码 |
| `server/src/mcp/tools.ts` | 工具注册表（deps 注入 Service 层） |
| `server/src/mcp/mcpServer.ts` | JSON-RPC 分发器（initialize/tools/*） |
| `server/src/mcp/mcpClient.ts` | MCP 客户端（Transport 抽象 + 进程内传输） |
| `server/src/routes/mcp.ts` | HTTP 端点（限流 30/min/IP） |
| `server/src/services/ai/mcpAgentService.ts` | 站内 Agent 循环（ReAct） |
