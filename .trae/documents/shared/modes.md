# modes.ts - 模式管理系统

## 模块概述

`modes.ts` 是 Kilocode 项目中模式管理系统的核心模块，负责管理不同的工作模式、工具权限控制、文件访问限制以及模式配置的动态加载和验证。该模块为整个系统提供了灵活的模式切换和权限管理机制。

## 主要功能

### 1. 模式配置管理

- **内置模式**: 管理系统预定义的工作模式
- **自定义模式**: 支持用户自定义模式配置
- **模式覆盖**: 允许自定义模式覆盖内置模式
- **默认模式**: 提供系统默认模式设置

### 2. 工具权限控制

- **工具组管理**: 基于工具组的权限分配
- **工具验证**: 验证特定模式下工具的可用性
- **实验功能**: 管理实验性工具的启用状态
- **文件限制**: 基于正则表达式的文件访问控制

### 3. 动态配置加载

- **VSCode 集成**: 与 VSCode 扩展状态集成
- **提示覆盖**: 支持自定义提示和说明
- **上下文感知**: 基于工作目录的配置加载

## 核心类型和常量

### 基础类型定义

```typescript
export type Mode = string

// 工具组条目类型
export type GroupEntry = ToolGroup | [ToolGroup, GroupOptions]

// 默认模式配置
export const defaultModeSlug = "code" // kilocode_change: 设置默认为 code 模式

// 编辑操作参数
const EDIT_OPERATION_PARAMS = ["diff", "content", "operations", "search", "replace", "args", "line"] as const
```

### 文件限制错误类

```typescript
export class FileRestrictionError extends Error {
	constructor(mode: string, pattern: string, description: string | undefined, filePath: string, tool?: string) {
		const toolInfo = tool ? `Tool '${tool}' in mode '${mode}'` : `This mode (${mode})`
		super(
			`${toolInfo} can only edit files matching pattern: ${pattern}${description ? ` (${description})` : ""}. Got: ${filePath}`,
		)
		this.name = "FileRestrictionError"
	}
}
```

## 核心功能函数

### 1. 模式查找和管理

```typescript
// 根据 slug 获取模式配置
export function getModeBySlug(slug: string, customModes?: ModeConfig[]): ModeConfig | undefined

// 获取模式配置（带错误处理）
export function getModeConfig(slug: string, customModes?: ModeConfig[]): ModeConfig

// 获取所有可用模式
export function getAllModes(customModes?: ModeConfig[]): ModeConfig[]

// 检查是否为自定义模式
export function isCustomMode(slug: string, customModes?: ModeConfig[]): boolean
```

### 2. 工具组和权限管理

```typescript
// 提取工具组名称
export function getGroupName(group: GroupEntry): ToolGroup

// 获取工具组选项
function getGroupOptions(group: GroupEntry): GroupOptions | undefined

// 获取模式的所有工具
export function getToolsForMode(groups: readonly GroupEntry[]): string[]

// 检查文件是否匹配正则表达式
export function doesFileMatchRegex(filePath: string, pattern: string): boolean
```

### 3. 工具权限验证

```typescript
export function isToolAllowedForMode(
	tool: string,
	modeSlug: string,
	customModes: ModeConfig[],
	toolRequirements?: Record<string, boolean>,
	toolParams?: Record<string, any>,
	experiments?: Record<string, boolean>,
): boolean
```

## 使用示例

### 1. 基本模式管理

```typescript
import { getModeBySlug, getAllModes, defaultModeSlug } from "../shared/modes"

// 获取默认模式
const defaultMode = getModeBySlug(defaultModeSlug)

// 获取特定模式
const codeMode = getModeBySlug("code")

// 获取所有模式（包括自定义模式）
const customModes = [
	/* 自定义模式配置 */
]
const allModes = getAllModes(customModes)

// 检查是否为自定义模式
const isCustom = isCustomMode("my-custom-mode", customModes)
```

### 2. 工具权限检查

```typescript
import { isToolAllowedForMode, FileRestrictionError } from "../shared/modes"

try {
	// 检查工具是否允许在特定模式下使用
	const isAllowed = isToolAllowedForMode(
		"write_to_file",
		"code",
		customModes,
		{ write_to_file: true },
		{ path: "src/main.ts", content: 'console.log("hello")' },
		{ morphFastApply: true },
	)

	if (isAllowed) {
		// 执行工具操作
		console.log("Tool is allowed")
	}
} catch (error) {
	if (error instanceof FileRestrictionError) {
		console.error("File access restricted:", error.message)
	}
}
```

### 3. 模式选择和配置

```typescript
import { getModeSelection, getFullModeDetails } from "../shared/modes"

// 获取模式选择信息
const modeSelection = getModeSelection("code", promptComponent, customModes)
console.log(modeSelection.roleDefinition)
console.log(modeSelection.baseInstructions)

// 获取完整模式详情
const fullMode = await getFullModeDetails("code", customModes, customModePrompts, {
	cwd: "/project/path",
	globalCustomInstructions: "Use TypeScript",
	language: "zh-CN",
})
```

### 4. VSCode 集成

```typescript
import { getAllModesWithPrompts } from "../shared/modes"

// 在 VSCode 扩展中获取所有模式
async function loadModes(context: vscode.ExtensionContext) {
	const modesWithPrompts = await getAllModesWithPrompts(context)
	return modesWithPrompts
}
```

## 技术实现细节

### 1. 文件访问控制

模式系统支持基于正则表达式的文件访问控制：

```typescript
// 检查编辑操作的文件限制
if (groupName === "edit" && options.fileRegex) {
	const filePath = toolParams?.path
	const isEditOperation = EDIT_OPERATION_PARAMS.some((param) => toolParams?.[param])

	if (filePath && isEditOperation && !doesFileMatchRegex(filePath, options.fileRegex)) {
		throw new FileRestrictionError(mode.name, options.fileRegex, options.description, filePath, tool)
	}
}
```

### 2. XML 参数解析

支持从 XML 格式的参数中提取文件路径进行验证：

```typescript
// 从 XML args 参数中提取文件路径
if (toolParams?.args && typeof toolParams.args === "string") {
	const filePathMatches = toolParams.args.match(/<path>([^<]+)<\/path>/g)
	if (filePathMatches) {
		for (const match of filePathMatches) {
			const pathMatch = match.match(/<path>([^<]+)<\/path>/)
			if (pathMatch && pathMatch[1]) {
				const extractedPath = pathMatch[1].trim()
				if (extractedPath && !extractedPath.includes("<") && !extractedPath.includes(">")) {
					if (!doesFileMatchRegex(extractedPath, options.fileRegex)) {
						throw new FileRestrictionError(
							mode.name,
							options.fileRegex,
							options.description,
							extractedPath,
							tool,
						)
					}
				}
			}
		}
	}
}
```

### 3. 自定义指令集成

```typescript
// 加载和合并自定义指令
let fullCustomInstructions = baseCustomInstructions
if (options?.cwd) {
	fullCustomInstructions = await addCustomInstructions(
		baseCustomInstructions,
		options.globalCustomInstructions || "",
		options.cwd,
		modeSlug,
		{ language: options.language },
	)
}
```

## 依赖关系

### 外部依赖

- `vscode`: VSCode 扩展 API
- `@roo-code/types`: 项目类型定义

### 内部依赖

- `../core/prompts/sections/custom-instructions`: 自定义指令处理
- `./experiments`: 实验功能管理
- `./tools`: 工具组配置

## 配置示例

### 模式配置结构

```typescript
const exampleMode: ModeConfig = {
	slug: "custom-mode",
	name: "Custom Development Mode",
	description: "A custom mode for specific development tasks",
	roleDefinition: "You are a specialized development assistant",
	whenToUse: "Use this mode for custom development tasks",
	customInstructions: "Follow specific coding guidelines",
	groups: [
		"read",
		"edit",
		["edit", { fileRegex: "\\.(ts|js|tsx|jsx)$", description: "TypeScript/JavaScript files only" }],
		"command",
	],
}
```

### 工具组选项

```typescript
interface GroupOptions {
	fileRegex?: string // 文件访问限制正则表达式
	description?: string // 限制描述
}
```

## 扩展指南

### 添加新模式

1. **定义模式配置**

```typescript
const newMode: ModeConfig = {
	slug: "new-mode",
	name: "New Mode",
	description: "Description of the new mode",
	roleDefinition: "Role definition for AI",
	groups: ["read", "edit"],
}
```

2. **注册到系统**

```typescript
// 通过自定义模式系统添加
const customModes = [...existingCustomModes, newMode]
```

### 添加文件限制

```typescript
// 在模式配置中添加文件限制
groups: [
	[
		"edit",
		{
			fileRegex: "\\.(py|pyx)$",
			description: "Python files only",
		},
	],
]
```

### 扩展工具权限

```typescript
// 在 isToolAllowedForMode 函数中添加新的权限逻辑
if (tool === "new_tool") {
	// 自定义权限检查逻辑
	return checkCustomPermission(modeSlug, toolParams)
}
```

## 注意事项

1. **文件路径验证**: 确保正则表达式的正确性，避免安全漏洞
2. **错误处理**: 适当处理 FileRestrictionError，提供用户友好的错误信息
3. **性能考虑**: 正则表达式匹配可能影响性能，考虑缓存机制
4. **向后兼容**: 修改模式配置时要考虑现有配置的兼容性
5. **安全性**: 文件访问限制是安全功能，不应被轻易绕过

## 性能优化

1. **缓存机制**: 对频繁访问的模式配置进行缓存
2. **延迟加载**: 按需加载自定义指令和配置
3. **正则表达式优化**: 使用高效的正则表达式模式
4. **批量验证**: 对多文件操作进行批量权限验证

这个模式管理系统为 Kilocode 提供了强大而灵活的工作模式管理能力，支持细粒度的权限控制和动态配置。
