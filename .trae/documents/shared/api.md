# api.ts - API 配置和管理系统

## 模块概述

`api.ts` 是 Kilocode 项目中 API 管理的核心模块，负责处理各种 AI 模型提供商的配置、路由管理、令牌限制计算以及推理功能的控制。该模块为整个系统提供了统一的 API 接口和配置管理能力。

## 主要功能

### 1. API 处理器选项配置

- **提供商设置扩展**: 扩展基础提供商设置，添加处理器特定的开关

- **GPT-5 推理摘要**: 控制 GPT-5 响应 API 的推理摘要功能

- **Ollama 上下文配置**: 管理 Ollama 模型的上下文参数

### 2. 路由器和模型管理

- **路由器名称验证**: 验证和转换路由器名称

- **模型记录管理**: 管理不同提供商的模型信息

- **动态和本地提供商**: 支持动态和本地 AI 提供商

### 3. 推理功能控制

- **推理预算管理**: 控制模型的推理预算使用

- **推理努力配置**: 管理推理努力级别的启用和配置

- **混合推理模型**: 支持混合推理模型的特殊处理

### 4. 令牌限制计算

- **最大输出令牌**: 计算不同模型和格式的最大输出令牌数

- **上下文窗口管理**: 基于上下文窗口大小计算令牌限制

- **特殊模型处理**: 为特定模型（如 GPT-5、Claude）提供特殊处理

## 核心类型定义

### API 处理器选项

```typescript
export type ApiHandlerOptions = Omit<ProviderSettings, "apiProvider"> & {
	/**
	 * 当为 true 且使用 GPT-5 响应 API 时，包含 reasoning.summary: "auto"
	 * 以便 API 返回推理摘要（我们已经解析并展示它们）
	 * 默认为 true；设置为 false 以禁用摘要
	 */
	enableGpt5ReasoningSummary?: boolean

	/**
	 * Ollama 的 num_ctx 参数的可选覆盖
	 * 设置时，此值将在 Ollama 聊天请求中使用
	 * 未定义时，Ollama 将使用 Modelfile 中模型的默认 num_ctx
	 */
	ollamaNumCtx?: number
}
```

### 路由器类型

```typescript
export type RouterName = DynamicProvider | LocalProvider

export type ModelRecord = Record<string, ModelInfo>

export type RouterModels = Record<RouterName, ModelRecord>
```

### 获取模型选项

```typescript
export type GetModelsOptions = {
	[P in keyof typeof dynamicProviderExtras]: ({ provider: P } & (typeof dynamicProviderExtras)[P]) & CommonFetchParams
}[RouterName]
```

## 核心功能函数

### 1. 路由器名称管理

```typescript
// 验证路由器名称
export const isRouterName = (value: string): value is RouterName => isDynamicProvider(value) || isLocalProvider(value)

// 转换为路由器名称
export function toRouterName(value?: string): RouterName {
	if (value && isRouterName(value)) {
		return value
	}
	throw new Error(`Invalid router name: ${value}`)
}
```

### 2. 推理功能控制

```typescript
// 检查是否应使用推理预算
export const shouldUseReasoningBudget = ({
	model,
	settings,
}: {
	model: ModelInfo
	settings?: ProviderSettings
}): boolean => !!model.requiredReasoningBudget || (!!model.supportsReasoningBudget && !!settings?.enableReasoningEffort)

// 检查是否应使用推理努力
export const shouldUseReasoningEffort = ({
	model,
	settings,
}: {
	model: ModelInfo
	settings?: ProviderSettings
}): boolean => {
	// 如果 enableReasoningEffort 明确设置为 false，则禁用推理
	if (settings?.enableReasoningEffort === false) {
		return false
	}

	// 否则，在以下情况下使用推理：
	// 1. 模型支持推理努力且设置提供推理努力，或
	// 2. 模型本身具有 reasoningEffort 属性
	return (!!model.supportsReasoningEffort && !!settings?.reasoningEffort) || !!model.reasoningEffort
}
```

### 3. 最大令牌计算

```typescript
export const getModelMaxOutputTokens = ({
	modelId,
	model,
	settings,
	format,
}: {
	modelId: string
	model: ModelInfo
	settings?: ProviderSettings
	format?: "anthropic" | "openai" | "gemini" | "openrouter"
}): number | undefined => {
	// Claude Code 特定的最大输出令牌设置检查
	if (settings?.apiProvider === "claude-code") {
		return settings.claudeCodeMaxOutputTokens || CLAUDE_CODE_DEFAULT_MAX_OUTPUT_TOKENS
	}

	// 推理预算处理
	if (shouldUseReasoningBudget({ model, settings })) {
		return settings?.modelMaxTokens || DEFAULT_HYBRID_REASONING_MODEL_MAX_TOKENS
	}

	// Anthropic 上下文检查
	const isAnthropicContext =
		modelId.includes("claude") ||
		format === "anthropic" ||
		(format === "openrouter" && modelId.startsWith("anthropic/"))

	// Anthropic 上下文的令牌值确保
	if (isAnthropicContext && (!model.maxTokens || model.maxTokens === 0)) {
		return ANTHROPIC_DEFAULT_MAX_TOKENS
	}

	// 模型特定的令牌处理
	if (model.maxTokens) {
		const isGpt5Model = modelId.toLowerCase().includes("gpt-5")

		// GPT-5 模型绕过 20% 限制，使用完整配置的最大令牌
		if (isGpt5Model) {
			return model.maxTokens
		}

		// 其他模型限制为上下文窗口的 20%
		return Math.min(model.maxTokens, Math.ceil(model.contextWindow * 0.2))
	}

	// 默认回退
	return format ? undefined : ANTHROPIC_DEFAULT_MAX_TOKENS
}
```

## 提供商配置

### 动态提供商配置

```typescript
const dynamicProviderExtras = {
	gemini: {} as { apiKey?: string; baseUrl?: string },
	openrouter: {} as {},
	"vercel-ai-gateway": {} as {},
	huggingface: {} as {},
	litellm: {} as { apiKey: string; baseUrl: string },
	"kilocode-openrouter": {} as { kilocodeToken?: string; kilocodeOrganizationId?: string },
	deepinfra: {} as { apiKey?: string; baseUrl?: string },
	"io-intelligence": {} as { apiKey: string },
	requesty: {} as { apiKey?: string; baseUrl?: string },
	unbound: {} as { apiKey?: string },
	glama: {} as {},
	ollama: {} as { numCtx?: number },
	lmstudio: {} as {},
	ovhcloud: {} as { apiKey?: string },
	chutes: {} as { apiKey?: string },
} as const satisfies Record<RouterName, object>
```

## 常量定义

```typescript
// 推理模型相关常量
export const DEFAULT_HYBRID_REASONING_MODEL_MAX_TOKENS = 16_384
export const DEFAULT_HYBRID_REASONING_MODEL_THINKING_TOKENS = 8_192
export const GEMINI_25_PRO_MIN_THINKING_TOKENS = 128
```

## 使用示例

### 1. 基本 API 配置

```typescript
import { toRouterName, isRouterName, getModelMaxOutputTokens } from "../shared/api"

// 验证和转换路由器名称
try {
	const routerName = toRouterName("openrouter")
	console.log("Valid router:", routerName)
} catch (error) {
	console.error("Invalid router name:", error.message)
}

// 检查路由器名称有效性
if (isRouterName("gemini")) {
	console.log("Gemini is a valid router")
}
```

### 2. 令牌限制计算

```typescript
import { getModelMaxOutputTokens, shouldUseReasoningBudget } from "../shared/api"

// 计算模型的最大输出令牌
const maxTokens = getModelMaxOutputTokens({
	modelId: "claude-3-5-sonnet-20241022",
	model: {
		contextWindow: 200000,
		maxTokens: 8192,
		supportsReasoningBudget: false,
	},
	settings: {
		apiProvider: "anthropic",
		modelMaxTokens: 4096,
	},
	format: "anthropic",
})

console.log("Max output tokens:", maxTokens)
```

### 3. 推理功能控制

```typescript
import { shouldUseReasoningBudget, shouldUseReasoningEffort } from "../shared/api"

const model = {
	supportsReasoningBudget: true,
	requiredReasoningBudget: false,
}

const settings = {
	enableReasoningEffort: true,
	reasoningEffort: "medium",
}

// 检查是否应使用推理预算
const useReasoningBudget = shouldUseReasoningBudget({ model, settings })

// 检查是否应使用推理努力
const useReasoningEffort = shouldUseReasoningEffort({ model, settings })

console.log("Use reasoning budget:", useReasoningBudget)
console.log("Use reasoning effort:", useReasoningEffort)
```

### 4. API 处理器选项配置

```typescript
import type { ApiHandlerOptions } from "../shared/api"

const apiOptions: ApiHandlerOptions = {
	// 基础提供商设置
	apiKey: "your-api-key",
	baseUrl: "https://api.example.com",

	// 处理器特定选项
	enableGpt5ReasoningSummary: true,
	ollamaNumCtx: 4096,

	// 推理相关设置
	enableReasoningEffort: true,
	reasoningEffort: "high",
	modelMaxTokens: 8192,
}
```

## 技术实现细节

### 1. 类型安全保证

模块使用 TypeScript 的高级类型特性确保类型安全：

```typescript
// 使用 satisfies 确保动态提供商配置的完整性
const dynamicProviderExtras = {
	// ... 配置
} as const satisfies Record<RouterName, object>

// 使用映射类型生成联合类型
export type GetModelsOptions = {
	[P in keyof typeof dynamicProviderExtras]: ({ provider: P } & (typeof dynamicProviderExtras)[P]) & CommonFetchParams
}[RouterName]
```

### 2. 特殊模型处理

```typescript
// GPT-5 模型的特殊处理
const isGpt5Model = modelId.toLowerCase().includes("gpt-5")
if (isGpt5Model) {
	return model.maxTokens // 绕过 20% 限制
}

// Anthropic 上下文的特殊处理
const isAnthropicContext =
	modelId.includes("claude") ||
	format === "anthropic" ||
	(format === "openrouter" && modelId.startsWith("anthropic/"))
```

### 3. 推理功能的条件逻辑

```typescript
// 复杂的推理努力判断逻辑
export const shouldUseReasoningEffort = ({ model, settings }) => {
	if (settings?.enableReasoningEffort === false) {
		return false
	}

	return (!!model.supportsReasoningEffort && !!settings?.reasoningEffort) || !!model.reasoningEffort
}
```

## 依赖关系

### 外部依赖

- `@roo-code/types`: 项目核心类型定义

    - `ModelInfo`, `ProviderSettings`

    - `DynamicProvider`, `LocalProvider`

    - `ANTHROPIC_DEFAULT_MAX_TOKENS`, `CLAUDE_CODE_DEFAULT_MAX_OUTPUT_TOKENS`

    - `isDynamicProvider`, `isLocalProvider`

### 内部依赖

- 与其他 API 处理模块的接口契约

- 与配置管理系统的集成

## 扩展指南

### 添加新的 AI 提供商

1. **更新类型定义**

```typescript
// 在 @roo-code/types 中添加新的提供商类型
type NewProvider = "new-provider"
```

1. **添加提供商配置**

```typescript
const dynamicProviderExtras = {
	// ... 现有提供商
	"new-provider": {} as { apiKey: string; customParam?: string },
}
```

1. **实现特殊处理逻辑**

```typescript
// 在相关函数中添加新提供商的特殊处理
if (settings?.apiProvider === "new-provider") {
	// 新提供商的特殊逻辑
}
```

### 添加新的推理功能

```typescript
// 添加新的推理相关函数
export const shouldUseNewReasoningFeature = ({
	model,
	settings,
}: {
	model: ModelInfo
	settings?: ProviderSettings
}): boolean => {
	// 新推理功能的判断逻辑
	return !!model.supportsNewFeature && !!settings?.enableNewFeature
}
```

## 注意事项

1. **API 密钥安全**: 确保 API 密钥的安全存储和传输
2. **令牌限制**: 正确计算令牌限制以避免 API 调用失败
3. **提供商兼容性**: 不同提供商的 API 格式可能有差异
4. **错误处理**: 适当处理网络错误和 API 限制
5. **性能优化**: 缓存模型信息以减少重复计算

## 性能优化

1. **缓存机制**: 对频繁访问的模型信息进行缓存
2. **延迟计算**: 按需计算令牌限制
3. **批量处理**: 对多个模型的配置进行批量处理
4. **内存管理**: 避免在配置对象中存储大量数据

这个 API 管理系统为 Kilocode 提供了强大而灵活的 AI 模型集成能力，支持多种提供商和复杂的配置需求。
