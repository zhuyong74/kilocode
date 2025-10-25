# Hooks 自定义钩子

## 概述

Hooks 模块提供了一系列自定义 React Hooks，用于封装复杂的业务逻辑、状态管理和副作用处理。这些钩子提高了代码的可复用性和可测试性。

## 核心 Hooks

### useAutoApprovalState

**功能**: 管理自动批准功能的状态

```typescript
interface AutoApprovalState {
	isEnabled: boolean
	remainingRequests: number
	maxRequests: number
	resetTime: Date | null
}

const useAutoApprovalState = () => {
	const [state, setState] = useState<AutoApprovalState>(initialState)

	const enable = useCallback((maxRequests: number) => {
		setState((prev) => ({
			...prev,
			isEnabled: true,
			maxRequests,
			remainingRequests: maxRequests,
			resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后重置
		}))
	}, [])

	const disable = useCallback(() => {
		setState((prev) => ({ ...prev, isEnabled: false }))
	}, [])

	const consumeRequest = useCallback(() => {
		setState((prev) => ({
			...prev,
			remainingRequests: Math.max(0, prev.remainingRequests - 1),
		}))
	}, [])

	return { state, enable, disable, consumeRequest }
}
```

### useAutoApprovalToggles

**功能**: 管理不同类型操作的自动批准开关

```typescript
interface AutoApprovalToggles {
	fileOperations: boolean
	commandExecution: boolean
	apiCalls: boolean
	browserActions: boolean
}

const useAutoApprovalToggles = () => {
	const [toggles, setToggles] = useState<AutoApprovalToggles>({
		fileOperations: false,
		commandExecution: false,
		apiCalls: false,
		browserActions: false,
	})

	const updateToggle = useCallback((key: keyof AutoApprovalToggles, value: boolean) => {
		setToggles((prev) => ({ ...prev, [key]: value }))
	}, [])

	const resetAll = useCallback(() => {
		setToggles({
			fileOperations: false,
			commandExecution: false,
			apiCalls: false,
			browserActions: false,
		})
	}, [])

	return { toggles, updateToggle, resetAll }
}
```

### useCloudUpsell

**功能**: 管理云服务升级提示逻辑

```typescript
interface CloudUpsellState {
	shouldShow: boolean
	dismissedAt: Date | null
	showCount: number
	lastShownAt: Date | null
}

const useCloudUpsell = () => {
	const [state, setState] = useState<CloudUpsellState>(loadFromStorage())
	const { user, usage } = useExtensionState()

	// 判断是否应该显示升级提示
	const shouldShowUpsell = useMemo(() => {
		if (!user || user.plan !== "free") return false
		if (state.dismissedAt && isWithin24Hours(state.dismissedAt)) return false
		if (usage.requestsThisMonth >= FREE_TIER_LIMIT) return true
		if (usage.tokensThisMonth >= FREE_TOKEN_LIMIT) return true
		return false
	}, [user, usage, state.dismissedAt])

	const showUpsell = useCallback(() => {
		setState((prev) => ({
			...prev,
			shouldShow: true,
			showCount: prev.showCount + 1,
			lastShownAt: new Date(),
		}))
	}, [])

	const dismissUpsell = useCallback((duration: "session" | "24h" | "permanent") => {
		const dismissedAt = duration === "permanent" ? new Date() : null
		setState((prev) => ({
			...prev,
			shouldShow: false,
			dismissedAt,
		}))
	}, [])

	return { shouldShowUpsell, showUpsell, dismissUpsell }
}
```

### useEscapeKey

**功能**: 处理 ESC 键按下事件

```typescript
const useEscapeKey = (callback: () => void, enabled: boolean = true) => {
	useEffect(() => {
		if (!enabled) return

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault()
				callback()
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [callback, enabled])
}
```

### useKeybindings

**功能**: 管理全局键盘快捷键

```typescript
interface Keybinding {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  callback: () => void
  description: string
}

const useKeybindings = (bindings: Keybinding[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const binding = bindings.find(b =>
        b.key === event.key &&
        !!b.ctrlKey === event.ctrlKey &&
        !!b.shiftKey === event.shiftKey &&
        !!b.altKey === event.altKey &&
        !!b.metaKey === event.metaKey
      )

      if (binding) {
        event.preventDefault()
        binding.callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [bindings])

  return { bindings }
}

// 使用示例
const ChatView = () => {
  const keybindings: Keybinding[] = [
    {
      key: 'Enter',
      ctrlKey: true,
      callback: () => sendMessage(),
      description: 'Send message'
    },
    {
      key: 'k',
      ctrlKey: true,
      callback: () => clearChat(),
      description: 'Clear chat'
    }
  ]

  useKeybindings(keybindings)

  return <div>...</div>
}
```

## 工具类 Hooks

### useDebounce

**功能**: 防抖处理

```typescript
const useDebounce = <T>(value: T, delay: number): T => {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => clearTimeout(handler)
	}, [value, delay])

	return debouncedValue
}
```

### useLocalStorage

**功能**: 本地存储状态管理

```typescript
const useLocalStorage = <T>(key: string, initialValue: T) => {
	const [storedValue, setStoredValue] = useState<T>(() => {
		try {
			const item = window.localStorage.getItem(key)
			return item ? JSON.parse(item) : initialValue
		} catch (error) {
			console.warn(`Error reading localStorage key "${key}":`, error)
			return initialValue
		}
	})

	const setValue = useCallback(
		(value: T | ((val: T) => T)) => {
			try {
				const valueToStore = value instanceof Function ? value(storedValue) : value
				setStoredValue(valueToStore)
				window.localStorage.setItem(key, JSON.stringify(valueToStore))
			} catch (error) {
				console.warn(`Error setting localStorage key "${key}":`, error)
			}
		},
		[key, storedValue],
	)

	return [storedValue, setValue] as const
}
```

### useAsync

**功能**: 异步操作状态管理

```typescript
interface AsyncState<T> {
	data: T | null
	loading: boolean
	error: Error | null
}

const useAsync = <T>(asyncFunction: () => Promise<T>, deps: any[] = []) => {
	const [state, setState] = useState<AsyncState<T>>({
		data: null,
		loading: true,
		error: null,
	})

	useEffect(() => {
		let cancelled = false

		setState({ data: null, loading: true, error: null })

		asyncFunction()
			.then((data) => {
				if (!cancelled) {
					setState({ data, loading: false, error: null })
				}
			})
			.catch((error) => {
				if (!cancelled) {
					setState({ data: null, loading: false, error })
				}
			})

		return () => {
			cancelled = true
		}
	}, deps)

	return state
}
```

## 业务逻辑 Hooks

### useTaskManagement

**功能**: 任务管理逻辑

```typescript
const useTaskManagement = () => {
	const { state, dispatch } = useExtensionState()

	const createTask = useCallback(
		async (config: TaskConfig) => {
			dispatch({ type: "SET_LOADING", payload: true })

			try {
				const task = await api.createTask(config)
				dispatch({ type: "ADD_TASK", payload: task })
				return task
			} catch (error) {
				dispatch({ type: "SET_ERROR", payload: error })
				throw error
			} finally {
				dispatch({ type: "SET_LOADING", payload: false })
			}
		},
		[dispatch],
	)

	const updateTask = useCallback(
		async (id: string, updates: Partial<Task>) => {
			try {
				const updatedTask = await api.updateTask(id, updates)
				dispatch({ type: "UPDATE_TASK", payload: { id, updates: updatedTask } })
			} catch (error) {
				dispatch({ type: "SET_ERROR", payload: error })
			}
		},
		[dispatch],
	)

	const deleteTask = useCallback(
		async (id: string) => {
			try {
				await api.deleteTask(id)
				dispatch({ type: "DELETE_TASK", payload: id })
			} catch (error) {
				dispatch({ type: "SET_ERROR", payload: error })
			}
		},
		[dispatch],
	)

	return {
		tasks: state.tasks,
		currentTask: state.currentTask,
		createTask,
		updateTask,
		deleteTask,
	}
}
```

### useMessageHandling

**功能**: 消息处理逻辑

```typescript
const useMessageHandling = () => {
	const { state, dispatch } = useExtensionState()

	const sendMessage = useCallback(
		async (content: string, attachments?: File[]) => {
			const message: Message = {
				id: generateId(),
				content,
				attachments,
				timestamp: new Date(),
				status: "sending",
			}

			dispatch({ type: "ADD_MESSAGE", payload: message })

			try {
				const response = await api.sendMessage(message)
				dispatch({
					type: "UPDATE_MESSAGE",
					payload: {
						id: message.id,
						updates: { status: "sent", response },
					},
				})
			} catch (error) {
				dispatch({
					type: "UPDATE_MESSAGE",
					payload: {
						id: message.id,
						updates: { status: "error", error },
					},
				})
			}
		},
		[dispatch],
	)

	const editMessage = useCallback(
		async (id: string, newContent: string) => {
			try {
				await api.editMessage(id, newContent)
				dispatch({
					type: "UPDATE_MESSAGE",
					payload: {
						id,
						updates: { content: newContent, edited: true },
					},
				})
			} catch (error) {
				dispatch({ type: "SET_ERROR", payload: error })
			}
		},
		[dispatch],
	)

	return {
		messages: state.messages,
		sendMessage,
		editMessage,
	}
}
```

## 测试策略

### 1. Hook 测试

```typescript
import { renderHook, act } from "@testing-library/react"

test("useAutoApprovalState enables and disables correctly", () => {
	const { result } = renderHook(() => useAutoApprovalState())

	expect(result.current.state.isEnabled).toBe(false)

	act(() => {
		result.current.enable(5)
	})

	expect(result.current.state.isEnabled).toBe(true)
	expect(result.current.state.maxRequests).toBe(5)

	act(() => {
		result.current.disable()
	})

	expect(result.current.state.isEnabled).toBe(false)
})
```

### 2. 异步 Hook 测试

```typescript
test("useAsync handles async operations", async () => {
	const mockAsyncFn = jest.fn().mockResolvedValue("test data")

	const { result, waitForNextUpdate } = renderHook(() => useAsync(mockAsyncFn))

	expect(result.current.loading).toBe(true)
	expect(result.current.data).toBe(null)

	await waitForNextUpdate()

	expect(result.current.loading).toBe(false)
	expect(result.current.data).toBe("test data")
	expect(result.current.error).toBe(null)
})
```

### 3. 副作用测试

```typescript
test("useKeybindings handles keyboard events", () => {
	const mockCallback = jest.fn()
	const bindings = [{ key: "Enter", ctrlKey: true, callback: mockCallback, description: "Test" }]

	renderHook(() => useKeybindings(bindings))

	fireEvent.keyDown(document, { key: "Enter", ctrlKey: true })

	expect(mockCallback).toHaveBeenCalledTimes(1)
})
```

## 最佳实践

### 1. Hook 设计

- 单一职责原则
- 提供清晰的 API
- 使用 TypeScript 严格类型
- 合理的默认值和错误处理

### 2. 性能优化

- 使用 useCallback 缓存函数
- 使用 useMemo 缓存计算结果
- 避免不必要的依赖项
- 合理使用 useEffect 清理函数

### 3. 错误处理

- 提供错误状态
- 实现错误边界
- 记录错误信息
- 优雅降级处理

### 4. 测试覆盖

- 测试 Hook 的核心逻辑
- 验证副作用处理
- 模拟异步操作
- 确保清理函数正确执行
