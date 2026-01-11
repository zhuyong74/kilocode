import delay from "delay"
import * as vscode from "vscode"

import { ClineProvider } from "../../core/webview/ClineProvider"
import { McpHub } from "./McpHub"
import type { McpServer, McpTool } from "../../shared/mcp"

type FetchedTask = {
	id: string
	title?: string
	description?: string
	workspacePath?: string
}

export class TaskAutoFetcher {
	private readonly provider: ClineProvider
	private readonly hub: McpHub | undefined
	private readonly processed = new Set<string>()
	private running = false
	private intervalMs = 15000

	constructor(provider: ClineProvider) {
		this.provider = provider
		this.hub = provider.getMcpHub?.()
	}

	public start(options?: { intervalMs?: number }) {
		if (this.running) return
		if (options?.intervalMs) this.intervalMs = Math.max(3000, options.intervalMs)

		const enabled = process.env.KILOCODE_AUTO_FETCH_TASKS === "1"
		if (!enabled) return

		this.running = true
		this.loop().catch((err) => {
			console.error("[TaskAutoFetcher] loop error", err)
			this.running = false
		})
	}

	public stop() {
		this.running = false
	}

	private async loop() {
		while (this.running) {
			try {
				await this.fetchOnce()
			} catch (error) {
				console.error("[TaskAutoFetcher] fetchOnce error", error)
			}
			await delay(this.intervalMs)
		}
	}

	private hasTaskTools(server: McpServer) {
		const tools = server.tools || []
		const names = new Set<string>(tools.map((t: McpTool) => t.name))
		return names.has("tasks/next") && names.has("tasks/claim")
	}

	private parseTaskFromToolResponse(toolResult: any): FetchedTask | null {
		try {
			const blocks = toolResult?.content || []
			const texts: string[] = blocks
				.filter((b: any) => b?.type === "text" && typeof b.text === "string")
				.map((b: any) => b.text)
			const merged = texts.join("\n")
			const obj = JSON.parse(merged)
			return {
				id: obj?.task?.id ?? obj?.id,
				title: obj?.task?.title ?? obj?.title,
				description: obj?.task?.description ?? obj?.description,
				workspacePath: obj?.task?.workspacePath ?? obj?.workspacePath,
			}
		} catch {
			return null
		}
	}

	private async fetchOnce() {
		if (!this.hub) return
		const servers = this.hub.getServers()
		for (const server of servers) {
			if (server.disabled) continue
			if (!this.hasTaskTools(server)) continue

			try {
				const next = await this.hub.callTool(server.name, "tasks/next")
				const parsed = this.parseTaskFromToolResponse(next)
				if (!parsed || !parsed.id) continue
				if (this.processed.has(parsed.id)) continue

				// claim
				await this.hub.callTool(server.name, "tasks/claim", { id: parsed.id })

				// create task text
				const textParts = [parsed.title, parsed.description].filter(Boolean)
				const text = textParts.join("\n\n") || `Task ${parsed.id}`

				// workspace handling: do not auto switch; warn if mismatch
				const currentWorkspace = this.provider.cwd
				if (parsed.workspacePath && parsed.workspacePath !== currentWorkspace) {
					vscode.window.showInformationMessage(
						`MCP 任务工作区为 ${parsed.workspacePath}，当前为 ${currentWorkspace}。请切换到任务对应工作区后继续。`,
					)
				}

				const task = await this.provider.createTask(text, undefined, undefined, {
					workspacePath: currentWorkspace,
				})
				await this.provider.postMessageToWebview({ type: "action", action: "chatButtonClicked" })

				// mark in-progress on server
				await this.hub.callTool(server.name, "tasks/update", {
					id: parsed.id,
					patch: { status: "in_progress" },
				})

				// basic telemetry placeholder via output channel
				try {
					const channel = vscode.window.createOutputChannel("Kilocode MCP Tasks")
					channel.appendLine(`[AutoFetcher] claimed ${parsed.id} and created task ${task.taskId}`)
				} catch {}

				this.processed.add(parsed.id)
			} catch (error) {
				console.error("[TaskAutoFetcher] server cycle error", error)
			}
		}
	}
}
