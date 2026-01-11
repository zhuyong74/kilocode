# 本地 stdio MCP 任务服务参考实现（示意）

## 说明

- 使用 Node.js 启动一个符合 MCP 协议的 stdio 服务器
- 暴露 `tools/list`、`resources/list`、`tools/call` 等端点
- 提供 `tasks/*` 工具与 `task://{id}` 资源

## 伪代码（示例）

```js
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server"

const tasks = [{ id: "t_1", title: "修复登录", description: "...", workspacePath: "d:/zyhome_work/kilocode" }]
const leases = new Map()

const server = new Server({ name: "task-broker", version: "0.1.0" })

server.on("tools/list", () => ({
	tools: [
		{ name: "tasks/list" },
		{ name: "tasks/next" },
		{ name: "tasks/claim" },
		{ name: "tasks/update" },
		{ name: "tasks/complete" },
	],
}))

server.on("resources/list", () => ({ resources: [] }))

server.on("tools/call", ({ name, arguments: args }) => {
	if (name === "tasks/next") {
		const t = tasks.find((t) => !leases.has(t.id)) || null
		return { content: [{ type: "text", text: JSON.stringify({ task: t }) }] }
	}
	if (name === "tasks/claim") {
		const id = args?.id
		const leaseId = `lease_${Date.now()}`
		leases.set(id, { leaseId, expiresAt: Date.now() + 60000 })
		return { content: [{ type: "text", text: JSON.stringify({ leaseId }) }] }
	}
	if (name === "tasks/update") {
		return { content: [{ type: "text", text: JSON.stringify({ ok: true }) }] }
	}
	if (name === "tasks/complete") {
		return { content: [{ type: "text", text: JSON.stringify({ ok: true }) }] }
	}
	return { content: [{ type: "text", text: JSON.stringify({ error: { code: "unknown_tool" } }) }] }
})

server.startStdio()
```

## 安装与配置

- 将脚本编译或直接运行，配置到 `mcpSettings.json`：

```json
{
	"mcpServers": {
		"task-broker": {
			"type": "stdio",
			"command": "node",
			"args": ["/path/to/task-broker.js"],
			"timeout": 60,
			"alwaysAllow": ["tasks/next", "tasks/claim", "tasks/update", "tasks/complete"]
		}
	}
}
```

## 注意

- 返回内容使用 `content` 数组，文本块中承载 JSON 字符串，便于 Kilocode 解析
- 生产环境请加入鉴权、幂等与错误码
