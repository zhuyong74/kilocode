# Task 模块技术文档

## 1. 模块概述

Task 模块是 Kilocode 的核心任务管理系统，负责管理任务的完整生命周期，包括任务创建、执行、暂停、恢复、完成和清理。该模块提供了强大的任务编排能力，支持父子任务关系、任务栈管理、状态持久化等高级功能。

### 1.1 主要功能

- **任务生命周期管理**：完整的任务创建到销毁流程
- **任务栈管理**：支持多任务并发和任务切换
- **父子任务关系**：支持任务分解和子任务管理
- **状态持久化**：任务状态的保存和恢复
- **自动批准机制**：智能的用户交互和自动化处理
- **错误处理和恢复**：完善的异常处理和任务恢复机制

### 1.2 核心组件

- `Task`: 核心任务类，管理单个任务的完整生命周期
- `AutoApprovalHandler`: 自动批准处理器
- `TaskTypes`: 任务相关的类型定义
- 任务事件系统：基于 EventEmitter 的事件驱动架构

## 2. 核心类和接口

### 2.1 Task 类

Task 类是整个任务系统的核心，继承自 EventEmitter，提供完整的任务管理功能。

```typescript
export class Task extends EventEmitter {
	// 任务标识
	public readonly taskId: string
	public readonly instanceId: string

	// 任务状态
	public abort: boolean = false
	public idleAsk: boolean = false
	public resumableAsk: boolean = false
	public interactiveAsk: boolean = false
	public isPaused: boolean = false

	// 任务配置
	private _taskMode: Mode | undefined
	public taskModeReady: Promise<void>

	// 任务关系
	public parentTask?: Task
	public childTasks: Set<Task> = new Set()

	// 消息和历史
	public clineMessages: ClineMessage[] = []
	public apiConversationHistory: Anthropic.MessageParam[] = []

	constructor(options: TaskOptions) {
		// 初始化任务
	}
}
```

### 2.2 TaskOptions 接口

```typescript
interface TaskOptions {
	provider: ClineProvider
	apiConfiguration: ApiConfiguration
	task?: string
	images?: string[]
	historyItem?: HistoryItem
	startTask?: boolean
	context: vscode.ExtensionContext
	parentTask?: Task
	mode?: string
}
```

### 2.3 AutoApprovalHandler 类

```typescript
export class AutoApprovalHandler {
	private task: Task
	private approvalRules: ApprovalRule[]

	constructor(task: Task) {
		this.task = task
		this.approvalRules = []
	}

	async shouldAutoApprove(toolUse: ToolUse): Promise<boolean> {
		// 自动批准逻辑
	}
}
```

## 3. 任务生命周期管理

### 3.1 任务创建

```typescript
// 静态创建方法
static create(options: TaskOptions): [Task, Promise<void>] {
    const task = new Task(options)
    const taskPromise = task.startTask ? task.start() : Promise.resolve()
    return [task, taskPromise]
}

// 实例创建
constructor(options: TaskOptions) {
    super()

    this.taskId = options.historyItem?.id || crypto.randomUUID()
    this.instanceId = crypto.randomUUID()

    // 初始化任务模式
    this.initializeTaskMode(options.mode)

    // 设置父子关系
    if (options.parentTask) {
        this.parentTask = options.parentTask
        options.parentTask.childTasks.add(this)
    }

    // 初始化其他组件
    this.setupComponents()
}
```

### 3.2 任务启动

```typescript
async startTask(): Promise<void> {
    try {
        this.emit("TaskStarted")

        // 等待模式初始化完成
        await this.taskModeReady

        // 开始任务执行循环
        await this.executeTaskLoop()

    } catch (error) {
        this.handleTaskError(error)
    }
}
```

### 3.3 任务执行循环

```typescript
private async executeTaskLoop(): Promise<void> {
    while (!this.abort) {
        try {
            // 检查任务状态
            if (this.isPaused) {
                await this.waitForResume()
                continue
            }

            // 处理用户消息
            if (this.hasUserMessage()) {
                await this.processUserMessage()
            }

            // 执行 API 请求
            const response = await this.attemptApiRequest()

            // 处理 AI 响应
            await this.presentAssistantMessage()

            // 检查任务完成条件
            if (this.isTaskComplete()) {
                break
            }

        } catch (error) {
            await this.handleExecutionError(error)
        }
    }
}
```

### 3.4 任务暂停和恢复

```typescript
// 暂停任务
pauseTask(): void {
    this.isPaused = true
    this.emit("TaskPaused")

    // 暂停所有子任务
    for (const childTask of this.childTasks) {
        childTask.pauseTask()
    }
}

// 恢复任务
resumeTask(): void {
    this.isPaused = false
    this.emit("TaskUnpaused")

    // 恢复所有子任务
    for (const childTask of this.childTasks) {
        childTask.resumeTask()
    }
}
```

### 3.5 任务终止

```typescript
async abortTask(forced: boolean = false): Promise<void> {
    this.abort = true
    this.emit("TaskAborted")

    // 终止所有子任务
    const childAbortPromises = Array.from(this.childTasks).map(child =>
        child.abortTask(forced)
    )
    await Promise.all(childAbortPromises)

    // 清理资源
    await this.cleanup()
}
```

## 4. 任务状态管理

### 4.1 任务状态类型

```typescript
enum TaskState {
	CREATED = "created",
	RUNNING = "running",
	PAUSED = "paused",
	WAITING = "waiting",
	COMPLETED = "completed",
	ABORTED = "aborted",
	ERROR = "error",
}
```

### 4.2 状态转换

```typescript
private transitionToState(newState: TaskState): void {
    const oldState = this.currentState
    this.currentState = newState

    this.emit("StateChanged", {
        from: oldState,
        to: newState,
        timestamp: Date.now()
    })

    // 执行状态特定的逻辑
    this.handleStateTransition(oldState, newState)
}
```

### 4.3 状态持久化

```typescript
async saveTaskState(): Promise<void> {
    const taskState = {
        taskId: this.taskId,
        instanceId: this.instanceId,
        state: this.currentState,
        messages: this.clineMessages,
        apiHistory: this.apiConversationHistory,
        metadata: this.getTaskMetadata(),
        timestamp: Date.now()
    }

    await this.provider.saveTaskState(taskState)
}

async loadTaskState(taskId: string): Promise<void> {
    const savedState = await this.provider.loadTaskState(taskId)
    if (savedState) {
        this.restoreFromState(savedState)
    }
}
```

## 5. 父子任务管理

### 5.1 子任务创建

```typescript
async createChildTask(options: ChildTaskOptions): Promise<Task> {
    const childOptions: TaskOptions = {
        ...options,
        parentTask: this,
        provider: this.provider,
        apiConfiguration: this.apiConfiguration,
        context: this.context
    }

    const [childTask, childPromise] = Task.create(childOptions)

    // 添加到子任务集合
    this.childTasks.add(childTask)

    // 监听子任务事件
    this.setupChildTaskListeners(childTask)

    return childTask
}
```

### 5.2 子任务事件处理

```typescript
private setupChildTaskListeners(childTask: Task): void {
    childTask.on("TaskCompleted", () => {
        this.handleChildTaskCompleted(childTask)
    })

    childTask.on("TaskAborted", () => {
        this.handleChildTaskAborted(childTask)
    })

    childTask.on("TaskError", (error) => {
        this.handleChildTaskError(childTask, error)
    })
}
```

### 5.3 任务栈管理

```typescript
class TaskStack {
	private tasks: Task[] = []
	private activeTask: Task | null = null

	push(task: Task): void {
		this.tasks.push(task)
		this.setActiveTask(task)
	}

	pop(): Task | null {
		const task = this.tasks.pop()
		this.activeTask = this.tasks[this.tasks.length - 1] || null
		return task || null
	}

	getActiveTask(): Task | null {
		return this.activeTask
	}

	switchToTask(taskId: string): boolean {
		const task = this.tasks.find((t) => t.taskId === taskId)
		if (task) {
			this.setActiveTask(task)
			return true
		}
		return false
	}
}
```

## 6. 自动批准机制

### 6.1 AutoApprovalHandler 实现

```typescript
export class AutoApprovalHandler {
	private task: Task
	private rules: ApprovalRule[] = []
	private userPreferences: UserPreferences

	constructor(task: Task) {
		this.task = task
		this.loadApprovalRules()
		this.loadUserPreferences()
	}

	async shouldAutoApprove(toolUse: ToolUse): Promise<boolean> {
		// 检查工具类型
		if (this.isAlwaysApproveType(toolUse.name)) {
			return true
		}

		// 检查用户规则
		for (const rule of this.rules) {
			if (await this.matchesRule(toolUse, rule)) {
				return rule.action === "approve"
			}
		}

		// 检查风险级别
		const riskLevel = await this.assessRisk(toolUse)
		return riskLevel <= this.userPreferences.autoApproveThreshold
	}

	private async assessRisk(toolUse: ToolUse): Promise<number> {
		// 风险评估逻辑
		let risk = 0

		// 基于工具类型的基础风险
		risk += this.getBaseRisk(toolUse.name)

		// 基于参数的风险
		risk += await this.getParameterRisk(toolUse.params)

		// 基于上下文的风险
		risk += await this.getContextualRisk(toolUse)

		return Math.min(risk, 100) // 限制在 0-100 范围内
	}
}
```

### 6.2 批准规则定义

```typescript
interface ApprovalRule {
	id: string
	name: string
	condition: RuleCondition
	action: "approve" | "deny" | "ask"
	priority: number
	enabled: boolean
}

interface RuleCondition {
	toolName?: string | string[]
	parameterMatches?: ParameterMatch[]
	filePatterns?: string[]
	riskThreshold?: number
	contextConditions?: ContextCondition[]
}
```

## 7. 错误处理和恢复

### 7.1 错误类型定义

```typescript
enum TaskErrorType {
	API_ERROR = "api_error",
	TOOL_ERROR = "tool_error",
	VALIDATION_ERROR = "validation_error",
	TIMEOUT_ERROR = "timeout_error",
	RESOURCE_ERROR = "resource_error",
	USER_ABORT = "user_abort",
}

class TaskError extends Error {
	constructor(
		public type: TaskErrorType,
		message: string,
		public recoverable: boolean = true,
		public context?: any,
	) {
		super(message)
	}
}
```

### 7.2 错误处理策略

```typescript
async handleTaskError(error: TaskError): Promise<void> {
    this.emit("TaskError", error)

    // 记录错误
    this.logError(error)

    // 尝试恢复
    if (error.recoverable) {
        const recovered = await this.attemptRecovery(error)
        if (recovered) {
            return
        }
    }

    // 无法恢复，终止任务
    await this.abortTask(true)
}

private async attemptRecovery(error: TaskError): Promise<boolean> {
    switch (error.type) {
        case TaskErrorType.API_ERROR:
            return await this.recoverFromApiError(error)
        case TaskErrorType.TOOL_ERROR:
            return await this.recoverFromToolError(error)
        case TaskErrorType.TIMEOUT_ERROR:
            return await this.recoverFromTimeout(error)
        default:
            return false
    }
}
```

### 7.3 任务恢复机制

```typescript
async recoverTask(taskId: string): Promise<Task | null> {
    try {
        // 加载任务状态
        const savedState = await this.loadTaskState(taskId)
        if (!savedState) {
            return null
        }

        // 重建任务对象
        const task = await this.reconstructTask(savedState)

        // 恢复任务状态
        await task.restoreState(savedState)

        // 重新启动任务
        await task.resume()

        return task

    } catch (error) {
        console.error("任务恢复失败:", error)
        return null
    }
}
```

## 8. 事件系统

### 8.1 任务事件类型

```typescript
interface TaskEvents {
	TaskStarted: () => void
	TaskCompleted: (result: TaskResult) => void
	TaskAborted: (reason?: string) => void
	TaskPaused: () => void
	TaskUnpaused: () => void
	TaskError: (error: TaskError) => void
	StateChanged: (change: StateChange) => void
	MessageReceived: (message: ClineMessage) => void
	ToolExecuted: (tool: ToolExecution) => void
	UserInteractionRequired: (interaction: UserInteraction) => void
}
```

### 8.2 事件监听和处理

```typescript
// 注册事件监听器
task.on("TaskStarted", () => {
	console.log("任务已启动")
})

task.on("TaskError", (error) => {
	console.error("任务错误:", error)
	// 处理错误逻辑
})

task.on("ToolExecuted", (execution) => {
	console.log(`工具 ${execution.toolName} 执行完成`)
	// 更新 UI 或记录日志
})
```

## 9. 性能优化

### 9.1 内存管理

```typescript
class TaskMemoryManager {
	private maxHistorySize: number = 1000
	private compressionThreshold: number = 500

	async optimizeMemory(task: Task): Promise<void> {
		// 压缩历史消息
		if (task.clineMessages.length > this.compressionThreshold) {
			await this.compressHistory(task)
		}

		// 清理不需要的资源
		await this.cleanupResources(task)

		// 优化子任务内存
		for (const childTask of task.childTasks) {
			await this.optimizeMemory(childTask)
		}
	}

	private async compressHistory(task: Task): Promise<void> {
		const oldMessages = task.clineMessages.slice(0, -this.maxHistorySize)
		const compressedSummary = await this.createSummary(oldMessages)

		task.clineMessages = [compressedSummary, ...task.clineMessages.slice(-this.maxHistorySize)]
	}
}
```

### 9.2 并发控制

```typescript
class TaskConcurrencyManager {
	private maxConcurrentTasks: number = 5
	private activeTasks: Set<Task> = new Set()
	private taskQueue: Task[] = []

	async executeTask(task: Task): Promise<void> {
		if (this.activeTasks.size >= this.maxConcurrentTasks) {
			await this.queueTask(task)
		} else {
			await this.startTask(task)
		}
	}

	private async startTask(task: Task): Promise<void> {
		this.activeTasks.add(task)

		try {
			await task.start()
		} finally {
			this.activeTasks.delete(task)
			await this.processQueue()
		}
	}
}
```

## 10. 测试和调试

### 10.1 单元测试示例

```typescript
describe("Task", () => {
	let mockProvider: ClineProvider
	let mockApiConfig: ApiConfiguration

	beforeEach(() => {
		mockProvider = createMockProvider()
		mockApiConfig = createMockApiConfig()
	})

	it("应该正确创建任务", () => {
		const task = new Task({
			provider: mockProvider,
			apiConfiguration: mockApiConfig,
			task: "测试任务",
			context: mockExtensionContext,
		})

		expect(task.taskId).toBeDefined()
		expect(task.instanceId).toBeDefined()
		expect(task.abort).toBe(false)
	})

	it("应该正确处理子任务", async () => {
		const parentTask = new Task({
			provider: mockProvider,
			apiConfiguration: mockApiConfig,
			task: "父任务",
			context: mockExtensionContext,
		})

		const childTask = await parentTask.createChildTask({
			task: "子任务",
		})

		expect(childTask.parentTask).toBe(parentTask)
		expect(parentTask.childTasks.has(childTask)).toBe(true)
	})
})
```

### 10.2 调试工具

```typescript
class TaskDebugger {
	private task: Task
	private debugLog: DebugEntry[] = []

	constructor(task: Task) {
		this.task = task
		this.setupDebugListeners()
	}

	private setupDebugListeners(): void {
		this.task.on("StateChanged", (change) => {
			this.log("state_change", change)
		})

		this.task.on("ToolExecuted", (execution) => {
			this.log("tool_execution", execution)
		})

		this.task.on("TaskError", (error) => {
			this.log("error", error)
		})
	}

	getDebugInfo(): TaskDebugInfo {
		return {
			taskId: this.task.taskId,
			currentState: this.task.currentState,
			messageCount: this.task.clineMessages.length,
			childTaskCount: this.task.childTasks.size,
			debugLog: this.debugLog,
		}
	}
}
```

## 11. 最佳实践

### 11.1 任务设计原则

- **单一职责**：每个任务应该有明确的单一目标
- **可恢复性**：任务应该支持中断和恢复
- **错误处理**：完善的错误处理和恢复机制
- **资源管理**：及时清理不需要的资源
- **状态一致性**：保持任务状态的一致性

### 11.2 性能优化建议

- **内存控制**：定期清理历史消息和不需要的数据
- **并发限制**：合理控制并发任务数量
- **异步处理**：使用异步操作避免阻塞
- **缓存策略**：合理使用缓存提高性能

### 11.3 安全考虑

- **权限控制**：严格控制任务的操作权限
- **输入验证**：验证所有用户输入和 API 响应
- **敏感信息**：保护敏感信息不被泄露
- **资源限制**：防止资源滥用和 DoS 攻击

## 12. 依赖关系

### 12.1 内部依赖

- `../webview/ClineProvider`: 提供商接口
- `../assistant-message/*`: 消息处理
- `../tools/*`: 工具执行
- `../../shared/*`: 共享类型和工具

### 12.2 外部依赖

- `@roo-code/types`: 类型定义
- `@roo-code/telemetry`: 遥测服务
- `@anthropic-ai/sdk`: Anthropic API
- `vscode`: VS Code 扩展 API
