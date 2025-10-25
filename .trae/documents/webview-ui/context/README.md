# Context 上下文管理

## 概述

Context 模块负责 Webview-UI 的全局状态管理，使用 React Context API 提供跨组件的状态共享和管理。该模块确保应用状态的一致性和可预测性。

## 核心上下文

### ExtensionStateContext

**功能**: 管理与 VSCode 扩展的通信状态和全局应用状态

**主要状态**:

```typescript
interface ExtensionState {
	// 用户信息
	user: User | null

	// 聊天状态
	messages: Message[]
	currentTask: Task | null
	isLoading: boolean

	// 配置状态
	apiConfiguration: ApiConfig
	settings: UserSettings

	// UI 状态
	theme: "light" | "dark" | "auto"
	sidebarVisible: boolean

	// 扩展通信
	vscodeApi: VSCodeApi
}
```

**主要方法**:

```typescript
interface ExtensionStateContextValue {
	state: ExtensionState

	// 消息管理
	sendMessage: (message: string) => Promise<void>
	updateMessage: (id: string, updates: Partial<Message>) => void
	deleteMessage: (id: string) => void

	// 任务管理
	createTask: (config: TaskConfig) => Promise<Task>
	updateTask: (id: string, updates: Partial<Task>) => void

	// 配置管理
	updateSettings: (settings: Partial<UserSettings>) => void
	updateApiConfig: (config: Partial<ApiConfig>) => void

	// UI 控制
	setTheme: (theme: Theme) => void
	toggleSidebar: () => void
}
```

### TranslationContext

**功能**: 管理国际化和多语言支持

**主要功能**:

```typescript
interface TranslationContextValue {
	// 当前语言
	language: string

	// 翻译函数
	t: (key: string, options?: TranslationOptions) => string

	// 语言切换
	changeLanguage: (language: string) => Promise<void>

	// 可用语言列表
	availableLanguages: Language[]

	// 加载状态
	isLoading: boolean
}
```

## 状态管理模式

### 1. 状态结构设计

```typescript
// 扁平化状态结构
interface AppState {
	// 避免深层嵌套
	user: User | null
	messages: Message[]
	tasks: Task[]
	settings: Settings

	// UI 状态分离
	ui: {
		theme: Theme
		sidebarVisible: boolean
		modalOpen: boolean
	}
}
```

### 2. 状态更新模式

```typescript
// 使用 useReducer 管理复杂状态
const [state, dispatch] = useReducer(extensionReducer, initialState)

// 动作类型定义
type ExtensionAction =
	| { type: "SET_MESSAGES"; payload: Message[] }
	| { type: "ADD_MESSAGE"; payload: Message }
	| { type: "UPDATE_MESSAGE"; payload: { id: string; updates: Partial<Message> } }
	| { type: "SET_LOADING"; payload: boolean }
```

### 3. 副作用处理

```typescript
// 使用 useEffect 处理副作用
useEffect(() => {
	// VSCode 消息监听
	const handleMessage = (event: MessageEvent) => {
		const { type, payload } = event.data
		dispatch({ type, payload })
	}

	window.addEventListener("message", handleMessage)
	return () => window.removeEventListener("message", handleMessage)
}, [])
```

## VSCode 通信

### 1. 消息发送

```typescript
const sendToVSCode = useCallback(
	(command: string, data?: any) => {
		if (vscodeApi) {
			vscodeApi.postMessage({
				type: command,
				payload: data,
				timestamp: Date.now(),
			})
		}
	},
	[vscodeApi],
)
```

### 2. 消息接收

```typescript
const handleVSCodeMessage = useCallback((event: MessageEvent) => {
	const { type, payload } = event.data

	switch (type) {
		case "updateMessages":
			dispatch({ type: "SET_MESSAGES", payload })
			break

		case "updateSettings":
			dispatch({ type: "SET_SETTINGS", payload })
			break

		case "taskComplete":
			dispatch({ type: "COMPLETE_TASK", payload })
			break
	}
}, [])
```

### 3. 状态同步

```typescript
// 状态变更时同步到 VSCode
useEffect(() => {
	sendToVSCode("stateChanged", {
		messages: state.messages,
		currentTask: state.currentTask,
		settings: state.settings,
	})
}, [state.messages, state.currentTask, state.settings])
```

## 性能优化

### 1. Context 分割

```typescript
// 按功能分割 Context，避免不必要的重渲染
const UserContext = createContext<UserContextValue>()
const MessagesContext = createContext<MessagesContextValue>()
const SettingsContext = createContext<SettingsContextValue>()
```

### 2. 选择性订阅

```typescript
// 只订阅需要的状态片段
const useMessages = () => {
	const context = useContext(ExtensionStateContext)
	return useMemo(
		() => ({
			messages: context.state.messages,
			sendMessage: context.sendMessage,
		}),
		[context.state.messages, context.sendMessage],
	)
}
```

### 3. 记忆化优化

```typescript
// 记忆化 Context 值
const contextValue = useMemo(
	() => ({
		state,
		sendMessage,
		updateMessage,
		deleteMessage,
	}),
	[state, sendMessage, updateMessage, deleteMessage],
)
```

## 错误处理

### 1. 错误边界

```typescript
interface ErrorState {
	hasError: boolean
	error: Error | null
	errorInfo: ErrorInfo | null
}

const ErrorBoundaryContext = createContext<ErrorState>({
	hasError: false,
	error: null,
	errorInfo: null,
})
```

### 2. 异步错误处理

```typescript
const handleAsyncError = useCallback(async (asyncFn: () => Promise<void>) => {
	try {
		await asyncFn()
	} catch (error) {
		dispatch({
			type: "SET_ERROR",
			payload: {
				message: error.message,
				stack: error.stack,
				timestamp: Date.now(),
			},
		})
	}
}, [])
```

### 3. 错误恢复

```typescript
const recoverFromError = useCallback(() => {
	dispatch({ type: "CLEAR_ERROR" })
	// 重置到安全状态
	dispatch({ type: "RESET_TO_SAFE_STATE" })
}, [])
```

## 测试策略

### 1. Context 测试

```typescript
const renderWithContext = (component: ReactElement, initialState?: Partial<ExtensionState>) => {
  const TestProvider = ({ children }: { children: ReactNode }) => (
    <ExtensionStateProvider initialState={initialState}>
      {children}
    </ExtensionStateProvider>
  )

  return render(component, { wrapper: TestProvider })
}
```

### 2. 状态更新测试

```typescript
test("updates message correctly", () => {
	const { result } = renderHook(() => useExtensionState(), {
		wrapper: ExtensionStateProvider,
	})

	act(() => {
		result.current.updateMessage("msg-1", { text: "Updated text" })
	})

	expect(result.current.state.messages[0].text).toBe("Updated text")
})
```

### 3. 副作用测试

```typescript
test('handles VSCode messages', () => {
  renderWithContext(<TestComponent />)

  // 模拟 VSCode 消息
  act(() => {
    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'updateMessages', payload: mockMessages }
    }))
  })

  expect(screen.getByText(mockMessages[0].text)).toBeInTheDocument()
})
```

## 最佳实践

### 1. Context 设计

- 按功能域分割 Context
- 避免过度嵌套的状态结构
- 提供合理的默认值
- 使用 TypeScript 严格类型

### 2. 性能优化

- 使用 useMemo 缓存 Context 值
- 实现选择性状态订阅
- 避免在 render 中创建新对象
- 合理使用 useCallback

### 3. 错误处理

- 实现全局错误边界
- 提供错误恢复机制
- 记录错误信息用于调试
- 优雅降级处理

### 4. 测试覆盖

- 测试状态更新逻辑
- 验证副作用处理
- 模拟异步操作
- 确保错误处理正确
