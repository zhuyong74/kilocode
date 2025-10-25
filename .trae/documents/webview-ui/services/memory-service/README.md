# MemoryService 内存监控服务

## 模块概述

MemoryService是一个专门用于监控webview内存使用情况的服务类。它通过定期收集JavaScript堆内存数据，并通过遥测系统上报这些指标，帮助开发团队监控应用性能和检测潜在的内存泄漏问题。

## 核心功能

### 1. 内存数据收集

- 收集JavaScript堆内存使用量（usedJSHeapSize）
- 收集JavaScript堆内存总量（totalJSHeapSize）
- 自动转换字节为MB单位，便于阅读

### 2. 定期监控

- 默认每10分钟收集一次内存数据
- 可配置的监控间隔
- 自动启动和停止机制

### 3. 遥测上报

- 集成TelemetryClient进行数据上报
- 采用1%采样率减少性能影响
- 结构化的遥测数据格式

## 类结构和API

### 主要类：MemoryService

```typescript
export class MemoryService {
	private intervalId: number | null = null
	private readonly intervalMs: number = 10 * 60 * 1000 // 10分钟
	private readonly sampledTelemetryCapture: Function

	public start(): void
	public stop(): void
	private reportMemoryUsage(): void
	private bytesToMegabytes(bytes: number): number
}
```

### 接口定义

```typescript
interface PerformanceMemory {
	usedJSHeapSize?: number // 已使用的JS堆内存大小（字节）
	totalJSHeapSize?: number // JS堆内存总大小（字节）
}
```

## 详细API文档

### 公共方法

#### start(): void

启动内存监控服务。

**功能**:

- 立即执行一次内存使用情况报告
- 设置定时器，按配置间隔定期报告
- 防止重复启动（幂等性）

**使用示例**:

```typescript
const memoryService = new MemoryService()
memoryService.start()
```

#### stop(): void

停止内存监控服务。

**功能**:

- 清除定时器
- 重置内部状态
- 释放相关资源

**使用示例**:

```typescript
memoryService.stop()
```

### 私有方法

#### reportMemoryUsage(): void

收集并报告当前内存使用情况。

**实现逻辑**:

1. 从Performance API获取内存信息
2. 转换字节为MB单位
3. 通过采样遥测客户端上报数据

#### bytesToMegabytes(bytes: number): number

将字节转换为MB单位，保留两位小数。

**参数**:

- `bytes`: 字节数

**返回值**:

- 转换后的MB数值（保留两位小数）

## 内存管理策略

### 1. 数据采集策略

- **非侵入式**: 使用浏览器原生Performance API
- **轻量级**: 最小化内存占用和CPU使用
- **精确性**: 直接获取JavaScript堆内存数据

### 2. 采样策略

- **采样率**: 1%（0.01）
- **目的**: 减少遥测数据量，降低性能影响
- **实现**: 使用`createSampledFunction`包装遥测调用

### 3. 定时策略

- **间隔**: 10分钟（600,000ms）
- **考虑**: 平衡监控精度和性能影响
- **可配置**: 通过修改`intervalMs`调整

## 使用示例

### 基本使用

```typescript
import { MemoryService } from "./services/MemoryService"

// 创建服务实例
const memoryService = new MemoryService()

// 启动监控
memoryService.start()

// 在应用关闭时停止监控
window.addEventListener("beforeunload", () => {
	memoryService.stop()
})
```

### 集成到应用生命周期

```typescript
class Application {
	private memoryService: MemoryService

	constructor() {
		this.memoryService = new MemoryService()
	}

	async initialize() {
		// 应用初始化完成后启动内存监控
		this.memoryService.start()
	}

	async destroy() {
		// 应用销毁时停止监控
		this.memoryService.stop()
	}
}
```

## 遥测数据格式

### 事件类型

- **事件名**: `TelemetryEventName.WEBVIEW_MEMORY_USAGE`
- **数据结构**:

```typescript
{
    heapUsedMb: number,    // 已使用堆内存（MB）
    heapTotalMb: number    // 总堆内存（MB）
}
```

### 数据示例

```json
{
	"event": "WEBVIEW_MEMORY_USAGE",
	"data": {
		"heapUsedMb": 45.67,
		"heapTotalMb": 128.0
	},
	"timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 性能考虑

### 1. 性能影响最小化

- **采样率控制**: 仅1%的调用会实际发送遥测数据
- **异步处理**: 不阻塞主线程执行
- **轻量级操作**: 内存数据获取开销极小

### 2. 内存使用优化

- **无状态设计**: 除定时器ID外无额外状态存储
- **及时清理**: stop()方法确保资源释放
- **避免泄漏**: 正确管理定时器生命周期

### 3. 错误处理

- **容错性**: 内存API不可用时使用默认值0
- **静默失败**: 不影响应用主要功能
- **日志记录**: 通过遥测系统记录异常情况

## 依赖关系

### 外部依赖

1. **TelemetryClient**: 遥测数据上报

    - 路径: `../utils/TelemetryClient`
    - 用途: 发送内存使用数据

2. **@roo-code/types**: 类型定义

    - 用途: `TelemetryEventName`枚举

3. **sampling utils**: 采样功能
    - 路径: `../utils/sampling`
    - 用途: 创建采样函数

### 浏览器API依赖

- **Performance API**: 获取内存信息
- **Window API**: 定时器管理

## 最佳实践

### 1. 生命周期管理

```typescript
// 推荐：在应用启动时启动服务
memoryService.start()

// 推荐：在页面卸载时停止服务
window.addEventListener("beforeunload", () => {
	memoryService.stop()
})
```

### 2. 错误处理

```typescript
// 服务本身已包含错误处理，无需额外try-catch
memoryService.start() // 安全调用
```

### 3. 配置调整

```typescript
// 如需调整监控间隔，可以继承并重写
class CustomMemoryService extends MemoryService {
	protected readonly intervalMs = 5 * 60 * 1000 // 5分钟
}
```

## 监控和调试

### 1. 监控指标

- 内存使用趋势
- 内存泄漏检测
- 性能基线建立

### 2. 调试信息

- 遥测数据可在开发者工具中查看
- 采样率可临时调整用于调试
- 定时器状态可通过`intervalId`检查

## 扩展建议

### 1. 功能扩展

- 添加内存使用阈值告警
- 支持自定义采样率配置
- 增加内存使用历史记录

### 2. 性能优化

- 实现内存使用预测
- 添加内存清理建议
- 集成垃圾回收监控
