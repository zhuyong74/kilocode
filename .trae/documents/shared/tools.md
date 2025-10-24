# tools.ts - 工具定义和管理系统

## 模块概述

`tools.ts` 是 Kilocode 项目中工具系统的核心模块，负责定义、管理和组织所有可用的工具。该模块提供了完整的工具类型定义、工具分组配置、权限管理和工具使用接口。

## 主要功能

### 1. 工具类型定义

- **ToolUse 接口**: 定义工具使用的基本结构
- **工具参数类型**: 定义所有工具可用的参数类型
- **具体工具接口**: 为每个工具定义专门的 TypeScript 接口

### 2. 工具分组管理

- **工具组配置**: 将相关工具组织到逻辑组中
- **权限控制**: 管理不同模式下工具的可用性
- **显示名称**: 提供用户友好的工具名称

### 3. 工具参数系统

- **参数验证**: 确保工具参数的类型安全
- **可选参数**: 支持部分参数的灵活使用
- **参数约束**: 为特定工具定义必需和可选参数

## 核心类型定义

### 基础类型

```typescript
// 工具响应类型
export type ToolResponse = string | Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam>

// 工具使用基础接口
export interface ToolUse {
	type: "tool_use"
	name: ToolName
	params: Partial<Record<ToolParamName, string>>
	partial: boolean
}

// 工具参数名称
export const toolParamNames = [
	"command",
	"path",
	"content",
	"line_count",
	"regex",
	"file_pattern",
	"recursive",
	"action",
	"url",
	"coordinate",
	"text",
	"server_name",
	"tool_name",
	"arguments",
	"uri",
	"question",
	"result",
	"diff",
	"mode_slug",
	"reason",
	// ... 更多参数
] as const
```

### 具体工具接口

```typescript
// 命令执行工具
export interface ExecuteCommandToolUse extends ToolUse {
	name: "execute_command"
	params: Partial<Pick<Record<ToolParamName, string>, "command" | "cwd">>
}

// 文件读取工具
export interface ReadFileToolUse extends ToolUse {
	name: "read_file"
	params: Partial<Pick<Record<ToolParamName, string>, "args" | "path" | "start_line" | "end_line">>
}

// 文件写入工具
export interface WriteToFileToolUse extends ToolUse {
	name: "write_to_file"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "content" | "line_count">>
}

// 新任务创建工具
export interface NewTaskToolUse extends ToolUse {
	name: "new_task"
	params: Partial<Pick<Record<ToolParamName, string>, "mode" | "message" | "todos">>
}
```

## 工具分组系统

### 工具组配置

```typescript
export const TOOL_GROUPS: Record<ToolGroup, ToolGroupConfig> = {
	read: {
		tools: [
			"read_file",
			"fetch_instructions",
			"search_files",
			"list_files",
			"list_code_definition_names",
			"codebase_search",
		],
	},
	edit: {
		tools: [
			"apply_diff",
			"edit_file",
			"write_to_file",
			"insert_content",
			"search_and_replace",
			"new_rule",
			"generate_image",
		],
	},
	browser: {
		tools: ["browser_action"],
	},
	command: {
		tools: ["execute_command"],
	},
	mcp: {
		tools: ["use_mcp_tool", "access_mcp_resource"],
	},
	modes: {
		tools: ["switch_mode", "new_task"],
		alwaysAvailable: true,
	},
}
```

### 始终可用工具

```typescript
export const ALWAYS_AVAILABLE_TOOLS: ToolName[] = [
	"ask_followup_question",
	"attempt_completion",
	"switch_mode",
	"new_task",
	"report_bug",
	"condense",
	"update_todo_list",
	"run_slash_command",
] as const
```

## 工具显示名称

```typescript
export const TOOL_DISPLAY_NAMES: Record<ToolName, string> = {
	execute_command: "run commands",
	read_file: "read files",
	write_to_file: "write files",
	apply_diff: "apply changes",
	search_files: "search files",
	list_files: "list files",
	browser_action: "use a browser",
	ask_followup_question: "ask questions",
	attempt_completion: "complete tasks",
	switch_mode: "switch modes",
	new_task: "create new task",
	// ... 更多工具显示名称
}
```

## 使用示例

### 1. 创建工具使用实例

```typescript
import type { ExecuteCommandToolUse, ReadFileToolUse } from "../shared/tools"

// 创建命令执行工具使用
const commandTool: ExecuteCommandToolUse = {
	type: "tool_use",
	name: "execute_command",
	params: {
		command: "npm install",
		cwd: "/project/path",
	},
	partial: false,
}

// 创建文件读取工具使用
const readTool: ReadFileToolUse = {
	type: "tool_use",
	name: "read_file",
	params: {
		path: "src/main.ts",
		start_line: "1",
		end_line: "50",
	},
	partial: false,
}
```

### 2. 工具组管理

```typescript
import { TOOL_GROUPS, ALWAYS_AVAILABLE_TOOLS } from "../shared/tools"

// 获取编辑工具组
const editTools = TOOL_GROUPS.edit.tools

// 检查工具是否始终可用
const isAlwaysAvailable = ALWAYS_AVAILABLE_TOOLS.includes("ask_followup_question")

// 获取所有工具组
const allGroups = Object.keys(TOOL_GROUPS)
```

### 3. 工具显示名称

```typescript
import { TOOL_DISPLAY_NAMES } from "../shared/tools"

// 获取工具的显示名称
const displayName = TOOL_DISPLAY_NAMES["execute_command"] // "run commands"

// 生成工具列表
const toolList = Object.entries(TOOL_DISPLAY_NAMES).map(([tool, name]) => ({
	id: tool,
	label: name,
}))
```

## 技术实现细节

### 1. 类型安全

- 使用 TypeScript 的严格类型检查
- 通过 `Partial<Pick<>>` 实现灵活的参数约束
- 使用 `const assertions` 确保类型推断的准确性

### 2. 参数系统

- 统一的参数名称定义避免重复
- 类型安全的参数映射
- 支持必需和可选参数的混合使用

### 3. 扩展性设计

- 模块化的工具组织结构
- 易于添加新工具和工具组
- 向后兼容的接口设计

### 4. 差异应用系统

```typescript
export interface DiffStrategy {
	getName(): string
	getToolDescription(args: { cwd: string; toolOptions?: { [key: string]: string } }): string
	applyDiff(
		originalContent: string,
		diffContent: string | DiffItem[],
		startLine?: number,
		endLine?: number,
	): Promise<DiffResult>
	getProgressStatus?(toolUse: ToolUse, result?: any): ToolProgressStatus
}
```

## 依赖关系

### 外部依赖

- `@anthropic-ai/sdk`: Anthropic AI SDK 类型
- `@roo-code/types`: 项目核心类型定义

### 内部依赖

- 与 `modes.ts` 协作进行工具权限管理
- 与具体工具实现模块的接口契约

## 扩展指南

### 添加新工具

1. **定义工具参数**

```typescript
// 在 toolParamNames 中添加新参数
export const toolParamNames = [
	// ... 现有参数
	"new_param_name",
] as const
```

2. **创建工具接口**

```typescript
export interface NewToolUse extends ToolUse {
	name: "new_tool"
	params: Partial<Pick<Record<ToolParamName, string>, "new_param_name" | "path">>
}
```

3. **添加显示名称**

```typescript
export const TOOL_DISPLAY_NAMES: Record<ToolName, string> = {
	// ... 现有工具
	new_tool: "new tool description",
}
```

4. **分配到工具组**

```typescript
export const TOOL_GROUPS: Record<ToolGroup, ToolGroupConfig> = {
	// ... 现有组
	custom_group: {
		tools: ["new_tool"],
	},
}
```

### 添加新工具组

```typescript
export const TOOL_GROUPS: Record<ToolGroup, ToolGroupConfig> = {
	// ... 现有组
	new_group: {
		tools: ["tool1", "tool2"],
		alwaysAvailable: false, // 可选配置
	},
}
```

## 注意事项

1. **类型安全**: 确保所有新工具都有完整的 TypeScript 类型定义
2. **向后兼容**: 修改现有工具接口时要考虑兼容性
3. **参数验证**: 新工具的参数应该有适当的验证逻辑
4. **文档更新**: 添加新工具时及时更新相关文档
5. **测试覆盖**: 确保新工具有相应的单元测试

## 性能考虑

1. **类型推断**: 使用 `const assertions` 优化类型推断性能
2. **内存使用**: 避免在工具定义中创建大型对象
3. **查找效率**: 使用 Record 类型提供 O(1) 的查找性能
4. **延迟加载**: 考虑对大型工具组实现延迟加载

这个工具管理系统为 Kilocode 提供了强大而灵活的工具基础架构，支持项目的持续发展和功能扩展。
