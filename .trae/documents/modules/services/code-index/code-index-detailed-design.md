# Kilocode Code-Index 服务详细设计文档

## 1. 文档概述

本文档详细描述了 Kilocode Code-Index 服务的内部设计实现，包括各个类和接口的详细设计、核心算法、数据结构、API 接口以及性能优化策略。

### 1.1 文档结构

- 核心类和接口设计
- 算法和处理流程
- 数据结构和存储设计
- API 接口规范
- 错误处理机制
- 性能优化策略
- 测试策略

## 2. 核心类和接口设计

### 2.1 CodeIndexManager 类

**类职责**：作为整个 Code-Index 服务的单例管理器，负责服务的生命周期管理和对外 API 提供。

```typescript
export class CodeIndexManager {
	// 单例实例管理
	private static instances = new Map<string, CodeIndexManager>()

	// 核心服务组件
	private _configManager: CodeIndexConfigManager | undefined
	private readonly _stateManager: CodeIndexStateManager
	private _serviceFactory: CodeIndexServiceFactory | undefined
	private _orchestrator: CodeIndexOrchestrator | undefined
	private _searchService: CodeIndexSearchService | undefined
	private _cacheManager: CacheManager | undefined

	// 错误恢复标志
	private _isRecoveringFromError = false
}
```

**核心方法设计**：

1. **getInstance(context, workspacePath)**

    - 实现单例模式，每个工作区对应一个实例
    - 支持多工作区环境
    - 自动获取活动编辑器的工作区路径

2. **initialize(contextProxy)**

    - 初始化配置管理器
    - 检查功能启用状态
    - 创建核心服务实例
    - 返回是否需要重启的标志

3. **startIndexing()**

    - 异步启动索引过程
    - 包含错误恢复逻辑
    - 不应该被 await，允许后台运行

4. **recoverFromError()**
    - 从错误状态恢复
    - 清理所有服务实例
    - 防止并发恢复操作

**设计特点**：

- 懒加载：按需初始化各个子服务
- 容错性：完善的错误处理和恢复机制
- 线程安全：防止并发操作导致的状态不一致

### 2.2 CodeIndexOrchestrator 类

**类职责**：协调索引流程的各个阶段，管理初始扫描和增量更新。

```typescript
export class CodeIndexOrchestrator {
	private _fileWatcherSubscriptions: vscode.Disposable[] = []
	private _isProcessing: boolean = false
	private _cancelRequested: boolean = false

	constructor(
		private readonly configManager: CodeIndexConfigManager,
		private readonly stateManager: CodeIndexStateManager,
		private readonly workspacePath: string,
		private readonly cacheManager: CacheManager,
		private readonly vectorStore: IVectorStore,
		private readonly scanner: DirectoryScanner,
		private readonly fileWatcher: IFileWatcher,
	) {}
}
```

**核心流程设计**：

1. **startIndexing() 流程**：

    ```
    检查工作区 → 验证配置 → 初始化向量存储 → 启动目录扫描 → 启动文件监控
    ```

2. **文件监控事件处理**：

    - `onDidStartBatchProcessing`：批处理开始
    - `onBatchProgressUpdate`：进度更新
    - `onDidFinishBatchProcessing`：批处理完成

3. **取消机制**：
    - 支持用户主动取消索引过程
    - 在关键检查点检查取消标志
    - 优雅地清理资源

### 2.3 ServiceFactory 类

**类职责**：根据配置创建各种服务实例，管理依赖注入。

```typescript
export class CodeIndexServiceFactory {
	constructor(
		private readonly configManager: CodeIndexConfigManager,
		private readonly workspacePath: string,
		private readonly cacheManager: CacheManager,
	) {}
}
```

**服务创建方法**：

1. **createEmbedder()**：

    ```typescript
    public createEmbedder(): IEmbedder {
        const config = this.configManager.getConfig()
        const provider = config.embedderProvider as EmbedderProvider

        switch (provider) {
            case "openai":
                return new OpenAiEmbedder({...config.openAiOptions})
            case "ollama":
                return new CodeIndexOllamaEmbedder({...config.ollamaOptions})
            // ... 其他提供商
        }
    }
    ```

2. **createVectorStore()**：

    - 计算向量维度
    - 验证配置完整性
    - 创建 Qdrant 客户端实例

3. **validateEmbedder()**：
    - 验证嵌入器配置
    - 测试 API 连接
    - 返回验证结果

### 2.4 ConfigManager 类

**类职责**：管理所有配置参数的加载、验证和变更检测。

```typescript
export class CodeIndexConfigManager {
	// 配置属性
	private codebaseIndexEnabled: boolean = true
	private embedderProvider: EmbedderProvider = "openai"
	private modelId?: string
	private modelDimension?: number
	private openAiOptions?: ApiHandlerOptions
	// ... 其他配置项
}
```

**核心功能**：

1. **配置加载**：

    ```typescript
    private _loadAndSetConfiguration(): void {
        const codebaseIndexConfig = this.contextProxy?.getGlobalState("codebaseIndexConfig")
        // 从存储中加载配置并更新实例变量
    }
    ```

2. **变更检测**：

    ```typescript
    public doesConfigChangeRequireRestart(previous: PreviousConfigSnapshot): boolean {
        // 检查关键配置是否发生变化
        // 返回是否需要重启服务
    }
    ```

3. **配置验证**：
    - 检查必需的配置项
    - 验证 API 密钥格式
    - 检查模型兼容性

### 2.5 SearchService 类

**类职责**：提供代码语义搜索功能。

```typescript
export class CodeIndexSearchService {
	constructor(
		private readonly configManager: CodeIndexConfigManager,
		private readonly stateManager: CodeIndexStateManager,
		private readonly embedder: IEmbedder,
		private readonly vectorStore: IVectorStore,
	) {}
}
```

**搜索实现**：

```typescript
public async searchIndex(query: string, directoryPrefix?: string): Promise<VectorStoreSearchResult[]> {
    // 1. 验证服务状态
    if (!this.configManager.isFeatureEnabled || !this.configManager.isFeatureConfigured) {
        throw new Error("Code index feature is disabled or not configured.")
    }

    // 2. 获取搜索参数
    const minScore = this.configManager.currentSearchMinScore
    const maxResults = this.configManager.currentSearchMaxResults

    // 3. 向量化查询
    const vector = await this.embedder.embed(query)

    // 4. 执行搜索
    const results = await this.vectorStore.search(vector, directoryPrefix, minScore, maxResults)

    return results
}
```

## 3. 核心算法和处理流程

### 3.1 代码解析算法

**CodeParser 类设计**：

```typescript
export class CodeParser implements ICodeParser {
	private loadedParsers: LanguageParser = {}
	private pendingLoads: Map<string, Promise<LanguageParser>> = new Map()
}
```

**解析流程**：

1. **文件类型检测**：

    ```typescript
    private isSupportedLanguage(extension: string): boolean {
        return scannerExtensions.includes(extension)
    }
    ```

2. **Tree-sitter 解析**：

    ```typescript
    const tree = language.parser.parse(content)
    const captures = tree ? language.query.captures(tree.rootNode) : []
    ```

3. **智能分块算法**：
    ```typescript
    // 检查节点大小
    if (currentNode.text.length >= MIN_BLOCK_CHARS) {
        if (currentNode.text.length > MAX_BLOCK_CHARS * MAX_CHARS_TOLERANCE_FACTOR) {
            // 递归处理子节点或按行分块
            if (currentNode.children.length > 0) {
                queue.push(...currentNode.children)
            } else {
                const chunkedBlocks = this._chunkLeafNodeByLines(currentNode, ...)
            }
        } else {
            // 创建代码块
            const block = this._createCodeBlock(currentNode, ...)
        }
    }
    ```

**分块策略**：

- **最小块大小**：50 字符（MIN_BLOCK_CHARS）
- **最大块大小**：1000 字符（MAX_BLOCK_CHARS）
- **容忍因子**：15%（MAX_CHARS_TOLERANCE_FACTOR）
- **语义完整性**：优先保持函数、类等语义单元的完整性

### 3.2 向量化处理算法

**嵌入器接口设计**：

```typescript
export interface IEmbedder {
	embed(text: string): Promise<number[]>
	embedBatch(texts: string[]): Promise<number[][]>
	validateConfiguration(): Promise<{ valid: boolean; error?: string }>
	readonly embedderInfo: EmbedderInfo
}
```

**批处理优化**：

```typescript
public async embedBatch(texts: string[]): Promise<number[][]> {
    const batchSize = this.getBatchSize()
    const results: number[][] = []

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize)
        const batchResults = await this.processBatch(batch)
        results.push(...batchResults)

        // 添加延迟以避免速率限制
        if (i + batchSize < texts.length) {
            await this.delay(this.getDelayMs())
        }
    }

    return results
}
```

### 3.3 增量更新算法

**FileWatcher 实现**：

```typescript
export class FileWatcher implements IFileWatcher {
	private _fileSystemWatcher?: vscode.FileSystemWatcher
	private _processingQueue: Map<string, FileChangeInfo> = new Map()
	private _batchTimer?: NodeJS.Timeout
}
```

**变更检测流程**：

1. **文件系统事件监听**：

    ```typescript
    this._fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
    	new vscode.RelativePattern(this.workspacePath, "**/*"),
    	false, // 不忽略创建
    	false, // 不忽略修改
    	false, // 不忽略删除
    )
    ```

2. **批处理队列管理**：

    ```typescript
    private _scheduleProcessing(filePath: string, changeType: FileChangeType): void {
        this._processingQueue.set(filePath, { changeType, timestamp: Date.now() })

        if (this._batchTimer) {
            clearTimeout(this._batchTimer)
        }

        this._batchTimer = setTimeout(() => {
            this._processBatch()
        }, this.batchDelayMs)
    }
    ```

3. **缓存一致性检查**：

    ```typescript
    private async _shouldProcessFile(filePath: string): Promise<boolean> {
        const currentHash = await this._calculateFileHash(filePath)
        const cachedHash = await this.cacheManager.getFileHash(filePath)

        return currentHash !== cachedHash
    }
    ```

### 3.4 搜索算法优化

**向量相似度搜索**：

```typescript
export class QdrantVectorStore implements IVectorStore {
	public async search(
		vector: number[],
		directoryPrefix?: string,
		minScore?: number,
		maxResults?: number,
	): Promise<VectorStoreSearchResult[]> {
		const searchParams = {
			vector,
			limit: maxResults || 10,
			score_threshold: minScore || 0.7,
			with_payload: true,
			with_vector: false,
		}

		// 添加目录过滤
		if (directoryPrefix) {
			searchParams.filter = {
				must: [
					{
						key: "filePath",
						match: { text: directoryPrefix },
					},
				],
			}
		}

		const response = await this.client.search(this.collectionName, searchParams)
		return this._formatSearchResults(response)
	}
}
```

## 4. 数据结构和存储设计

### 4.1 代码块数据结构

```typescript
export interface CodeBlock {
	id: string // 唯一标识符
	filePath: string // 文件路径
	content: string // 代码内容
	startLine: number // 起始行号
	endLine: number // 结束行号
	language: string // 编程语言
	identifier?: string // 函数/类名等标识符
	type: string // 代码块类型（function, class, etc.）
	hash: string // 内容哈希
	fileHash: string // 文件哈希
	metadata?: Record<string, any> // 额外元数据
}
```

### 4.2 向量存储结构

**Qdrant 集合设计**：

```typescript
interface QdrantPoint {
	id: string // 代码块 ID
	vector: number[] // 向量表示
	payload: {
		filePath: string // 文件路径
		content: string // 代码内容
		startLine: number // 起始行号
		endLine: number // 结束行号
		language: string // 编程语言
		identifier?: string // 标识符
		type: string // 代码块类型
		hash: string // 内容哈希
		fileHash: string // 文件哈希
		workspacePath: string // 工作区路径
		indexedAt: number // 索引时间戳
	}
}
```

**集合配置**：

```typescript
const collectionConfig = {
	vectors: {
		size: vectorDimension, // 向量维度
		distance: "Cosine", // 相似度计算方法
	},
	optimizers_config: {
		default_segment_number: 2, // 段数量
		max_segment_size: 20000, // 最大段大小
		memmap_threshold: 20000, // 内存映射阈值
		indexing_threshold: 20000, // 索引阈值
		flush_interval_sec: 5, // 刷新间隔
		max_optimization_threads: 2, // 优化线程数
	},
}
```

### 4.3 缓存数据结构

**CacheManager 设计**：

```typescript
export class CacheManager {
    private readonly cacheFilePath: string
    private _cache: Map<string, CacheEntry> = new Map()

    interface CacheEntry {
        fileHash: string         // 文件哈希
        blockHashes: string[]    // 代码块哈希列表
        lastModified: number     // 最后修改时间
        indexedAt: number        // 索引时间
        blockCount: number       // 代码块数量
    }
}
```

**缓存策略**：

- **写入策略**：写回（Write-back）
- **失效策略**：基于文件哈希的自动失效
- **持久化**：JSON 格式存储到本地文件
- **内存管理**：LRU 淘汰策略

## 5. API 接口设计

### 5.1 对外 API 接口

**CodeIndexManager 公共接口**：

```typescript
export interface ICodeIndexManager {
	// 生命周期管理
	initialize(contextProxy: ContextProxy): Promise<{ requiresRestart: boolean }>
	startIndexing(): Promise<void>
	stopWatcher(): void
	dispose(): void

	// 搜索功能
	searchIndex(query: string, directoryPrefix?: string): Promise<VectorStoreSearchResult[]>

	// 状态查询
	getCurrentStatus(): IndexingStatus
	get state(): IndexingState
	get isFeatureEnabled(): boolean
	get isFeatureConfigured(): boolean

	// 数据管理
	clearIndexData(): Promise<void>
	recoverFromError(): Promise<void>

	// 配置管理
	handleSettingsChange(): Promise<void>

	// 事件监听
	onProgressUpdate: vscode.Event<ProgressUpdateEvent>
}
```

### 5.2 内部服务接口

**嵌入器接口**：

```typescript
export interface IEmbedder {
	embed(text: string): Promise<number[]>
	embedBatch(texts: string[]): Promise<number[][]>
	validateConfiguration(): Promise<ValidationResult>
	readonly embedderInfo: EmbedderInfo
}
```

**向量存储接口**：

```typescript
export interface IVectorStore {
	initialize(): Promise<boolean>
	upsert(points: PointStruct[]): Promise<void>
	search(
		vector: number[],
		directoryPrefix?: string,
		minScore?: number,
		maxResults?: number,
	): Promise<VectorStoreSearchResult[]>
	deleteByFilePath(filePath: string): Promise<void>
	clearCollection(): Promise<void>
	deleteCollection(): Promise<void>
	collectionExists(): Promise<boolean>
}
```

### 5.3 事件接口设计

**进度更新事件**：

```typescript
interface ProgressUpdateEvent {
	systemStatus: IndexingState
	fileStatuses: Record<string, string>
	message?: string
	progress?: {
		processedFiles?: number
		totalFiles?: number
		processedBlocks?: number
		totalBlocks?: number
		currentFile?: string
	}
}
```

**文件监控事件**：

```typescript
interface FileWatcherEvents {
	onDidStartBatchProcessing: vscode.Event<string[]>
	onBatchProgressUpdate: vscode.Event<BatchProgressInfo>
	onDidFinishBatchProcessing: vscode.Event<BatchProcessingSummary>
}
```

## 6. 错误处理和异常机制

### 6.1 错误分类体系

**错误类型定义**：

```typescript
enum CodeIndexErrorType {
	CONFIGURATION_ERROR = "configuration_error",
	NETWORK_ERROR = "network_error",
	STORAGE_ERROR = "storage_error",
	PARSING_ERROR = "parsing_error",
	VALIDATION_ERROR = "validation_error",
	RATE_LIMIT_ERROR = "rate_limit_error",
	UNKNOWN_ERROR = "unknown_error",
}
```

**错误处理策略**：

1. **配置错误**：

    ```typescript
    private handleConfigurationError(error: Error): void {
        this.stateManager.setSystemState("Error", `Configuration error: ${error.message}`)
        // 不自动重试，需要用户修复配置
    }
    ```

2. **网络错误**：

    ```typescript
    private async handleNetworkError(error: Error, retryCount: number = 0): Promise<void> {
        if (retryCount < this.maxRetries) {
            await this.delay(this.getBackoffDelay(retryCount))
            return this.retryOperation(retryCount + 1)
        } else {
            this.stateManager.setSystemState("Error", `Network error: ${error.message}`)
        }
    }
    ```

3. **存储错误**：
    ```typescript
    private handleStorageError(error: Error): void {
        console.error("Vector store error:", error)
        this.stateManager.setSystemState("Error", `Storage error: ${error.message}`)
        // 尝试重新连接
        this.scheduleReconnection()
    }
    ```

### 6.2 重试机制设计

**指数退避算法**：

```typescript
private getBackoffDelay(retryCount: number): number {
    const baseDelay = 1000 // 1秒
    const maxDelay = 30000 // 30秒
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay)

    // 添加随机抖动
    const jitter = Math.random() * 0.1 * delay
    return delay + jitter
}
```

**重试条件判断**：

```typescript
private shouldRetry(error: Error): boolean {
    // 网络错误可以重试
    if (error.message.includes("ECONNREFUSED") ||
        error.message.includes("timeout")) {
        return true
    }

    // 速率限制错误可以重试
    if (error.message.includes("rate limit")) {
        return true
    }

    // 配置错误不重试
    if (error.message.includes("API key") ||
        error.message.includes("configuration")) {
        return false
    }

    return false
}
```

### 6.3 错误恢复机制

**自动恢复流程**：

```typescript
public async recoverFromError(): Promise<void> {
    if (this._isRecoveringFromError) {
        return // 防止并发恢复
    }

    this._isRecoveringFromError = true

    try {
        // 1. 清理错误状态
        this._stateManager.setSystemState("Standby", "")

        // 2. 重置服务实例
        this._configManager = undefined
        this._serviceFactory = undefined
        this._orchestrator = undefined
        this._searchService = undefined

        // 3. 清理资源
        if (this._fileWatcherSubscriptions) {
            this._fileWatcherSubscriptions.forEach(sub => sub.dispose())
            this._fileWatcherSubscriptions = []
        }

    } finally {
        this._isRecoveringFromError = false
    }
}
```

## 7. 性能优化策略

### 7.1 批处理优化

**动态批处理大小**：

```typescript
private calculateOptimalBatchSize(contentLength: number, apiLatency: number): number {
    const baseBatchSize = 10
    const maxBatchSize = 50

    // 根据内容长度调整
    let batchSize = Math.max(1, Math.floor(baseBatchSize * (1000 / contentLength)))

    // 根据 API 延迟调整
    if (apiLatency > 2000) { // 高延迟时增大批次
        batchSize = Math.min(maxBatchSize, batchSize * 2)
    }

    return Math.min(maxBatchSize, Math.max(1, batchSize))
}
```

**批处理队列管理**：

```typescript
export class BatchProcessor<T> {
	private queue: T[] = []
	private processing = false
	private readonly batchSize: number
	private readonly batchDelay: number

	public async add(item: T): Promise<void> {
		this.queue.push(item)

		if (!this.processing) {
			this.scheduleProcessing()
		}
	}

	private scheduleProcessing(): void {
		setTimeout(() => {
			this.processBatch()
		}, this.batchDelay)
	}
}
```

### 7.2 内存优化

**流式处理大文件**：

```typescript
private async parseFileStream(filePath: string): Promise<CodeBlock[]> {
    const stream = createReadStream(filePath, { encoding: 'utf8' })
    const chunks: string[] = []
    let buffer = ''

    return new Promise((resolve, reject) => {
        stream.on('data', (chunk: string) => {
            buffer += chunk

            // 按行分割处理
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // 保留最后不完整的行

            // 处理完整的行
            this.processLines(lines)
        })

        stream.on('end', () => {
            if (buffer) {
                this.processLines([buffer])
            }
            resolve(this.getResults())
        })

        stream.on('error', reject)
    })
}
```

**内存使用监控**：

```typescript
private monitorMemoryUsage(): void {
    const memUsage = process.memoryUsage()
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024

    if (heapUsedMB > this.memoryThreshold) {
        console.warn(`High memory usage detected: ${heapUsedMB.toFixed(2)}MB`)

        // 触发垃圾回收
        if (global.gc) {
            global.gc()
        }

        // 清理缓存
        this.clearNonEssentialCache()
    }
}
```

### 7.3 网络优化

**连接池管理**：

```typescript
export class HttpConnectionPool {
	private connections: Map<string, http.Agent> = new Map()
	private readonly maxConnections = 10
	private readonly keepAlive = true

	public getAgent(baseUrl: string): http.Agent {
		if (!this.connections.has(baseUrl)) {
			const agent = new http.Agent({
				keepAlive: this.keepAlive,
				maxSockets: this.maxConnections,
				timeout: 30000,
			})
			this.connections.set(baseUrl, agent)
		}

		return this.connections.get(baseUrl)!
	}
}
```

**请求去重**：

```typescript
export class RequestDeduplicator {
	private pendingRequests: Map<string, Promise<any>> = new Map()

	public async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
		if (this.pendingRequests.has(key)) {
			return this.pendingRequests.get(key) as Promise<T>
		}

		const promise = requestFn().finally(() => {
			this.pendingRequests.delete(key)
		})

		this.pendingRequests.set(key, promise)
		return promise
	}
}
```

### 7.4 缓存优化策略

**多级缓存架构**：

```typescript
export class MultiLevelCache {
	private l1Cache: Map<string, any> = new Map() // 内存缓存
	private l2Cache: LRUCache<string, any> // LRU 缓存
	private l3Cache: FileCache // 文件缓存

	public async get(key: string): Promise<any> {
		// L1: 内存缓存
		if (this.l1Cache.has(key)) {
			return this.l1Cache.get(key)
		}

		// L2: LRU 缓存
		if (this.l2Cache.has(key)) {
			const value = this.l2Cache.get(key)
			this.l1Cache.set(key, value)
			return value
		}

		// L3: 文件缓存
		const value = await this.l3Cache.get(key)
		if (value !== null) {
			this.l2Cache.set(key, value)
			this.l1Cache.set(key, value)
			return value
		}

		return null
	}
}
```

## 8. 测试策略

### 8.1 单元测试设计

**测试覆盖范围**：

- 核心类的公共方法
- 错误处理逻辑
- 配置验证逻辑
- 算法正确性

**测试示例**：

```typescript
describe("CodeIndexManager", () => {
	let manager: CodeIndexManager
	let mockContext: vscode.ExtensionContext

	beforeEach(() => {
		mockContext = createMockContext()
		manager = CodeIndexManager.getInstance(mockContext, "/test/workspace")
	})

	describe("initialize", () => {
		it("should initialize successfully with valid config", async () => {
			const mockContextProxy = createMockContextProxy({
				codebaseIndexEnabled: true,
				embedderProvider: "openai",
			})

			const result = await manager.initialize(mockContextProxy)

			expect(result.requiresRestart).toBe(false)
			expect(manager.isInitialized).toBe(true)
		})

		it("should handle missing configuration gracefully", async () => {
			const mockContextProxy = createMockContextProxy({})

			const result = await manager.initialize(mockContextProxy)

			expect(manager.isFeatureConfigured).toBe(false)
		})
	})
})
```

### 8.2 集成测试策略

**测试环境设置**：

```typescript
describe("Code Index Integration Tests", () => {
	let testWorkspace: string
	let qdrantContainer: TestContainer

	beforeAll(async () => {
		// 启动测试用的 Qdrant 容器
		qdrantContainer = await startQdrantContainer()

		// 创建测试工作区
		testWorkspace = await createTestWorkspace()
	})

	afterAll(async () => {
		await qdrantContainer.stop()
		await cleanupTestWorkspace(testWorkspace)
	})
})
```

### 8.3 性能测试

**基准测试**：

```typescript
describe("Performance Benchmarks", () => {
	it("should index 1000 files within 5 minutes", async () => {
		const startTime = Date.now()

		await manager.startIndexing()
		await waitForIndexingComplete()

		const duration = Date.now() - startTime
		expect(duration).toBeLessThan(5 * 60 * 1000) // 5分钟
	})

	it("should handle search queries under 100ms", async () => {
		const queries = generateTestQueries(100)

		for (const query of queries) {
			const startTime = Date.now()
			await manager.searchIndex(query)
			const duration = Date.now() - startTime

			expect(duration).toBeLessThan(100)
		}
	})
})
```

## 9. 部署和运维指南

### 9.1 依赖环境配置

**Qdrant 部署**：

```yaml
# docker-compose.yml
version: "3.8"
services:
    qdrant:
        image: qdrant/qdrant:latest
        ports:
            - "6333:6333"
        volumes:
            - qdrant_data:/qdrant/storage
        environment:
            - QDRANT__SERVICE__HTTP_PORT=6333
            - QDRANT__SERVICE__GRPC_PORT=6334

volumes:
    qdrant_data:
```

**环境变量配置**：

```bash
# 开发环境
export QDRANT_URL=http://localhost:6333
export OPENAI_API_KEY=your_openai_key

# 生产环境
export QDRANT_URL=https://your-qdrant-instance.com
export QDRANT_API_KEY=your_qdrant_key
```

### 9.2 监控和日志

**性能监控指标**：

```typescript
interface PerformanceMetrics {
	indexingDuration: number // 索引构建时间
	searchLatency: number // 搜索延迟
	cacheHitRate: number // 缓存命中率
	errorRate: number // 错误率
	memoryUsage: number // 内存使用量
	vectorStoreSize: number // 向量存储大小
}
```

**日志配置**：

```typescript
const logger = createLogger({
	level: process.env.LOG_LEVEL || "info",
	format: combine(timestamp(), errors({ stack: true }), json()),
	transports: [
		new transports.File({ filename: "code-index-error.log", level: "error" }),
		new transports.File({ filename: "code-index-combined.log" }),
	],
})
```

### 9.3 故障排除指南

**常见问题诊断**：

1. **索引构建失败**：

    ```bash
    # 检查 Qdrant 连接
    curl http://localhost:6333/collections

    # 检查 API 密钥
    echo $OPENAI_API_KEY

    # 查看错误日志
    tail -f ~/.vscode/extensions/kilocode/logs/code-index-error.log
    ```

2. **搜索结果不准确**：

    ```typescript
    // 检查向量维度匹配
    const collectionInfo = await vectorStore.getCollectionInfo()
    console.log("Vector dimension:", collectionInfo.config.params.vectors.size)

    // 检查索引数据量
    const stats = await vectorStore.getCollectionStats()
    console.log("Indexed points:", stats.points_count)
    ```

3. **性能问题排查**：
    ```typescript
    // 监控内存使用
    setInterval(() => {
    	const memUsage = process.memoryUsage()
    	console.log("Memory usage:", {
    		rss: Math.round(memUsage.rss / 1024 / 1024) + "MB",
    		heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + "MB",
    	})
    }, 10000)
    ```

## 10. 安全性和合规性

### 10.1 数据安全

**敏感信息处理**：

```typescript
export class SecureConfigManager {
	private async storeApiKey(key: string, value: string): Promise<void> {
		// 使用 VSCode SecretStorage API
		await this.context.secrets.store(key, value)
	}

	private sanitizeForLogging(data: any): any {
		const sanitized = { ...data }

		// 移除敏感字段
		const sensitiveFields = ["apiKey", "password", "token", "secret"]
		sensitiveFields.forEach((field) => {
			if (sanitized[field]) {
				sanitized[field] = "***"
			}
		})

		return sanitized
	}
}
```

### 10.2 隐私保护

**本地优先策略**：

```typescript
export class PrivacyController {
	public isLocalOnlyMode(): boolean {
		return this.configManager.embedderProvider === "ollama" && this.configManager.qdrantUrl.includes("localhost")
	}

	public async validateDataTransfer(operation: string): Promise<boolean> {
		if (this.isLocalOnlyMode()) {
			return true // 本地操作无需验证
		}

		// 检查用户同意
		return await this.getUserConsent(operation)
	}
}
```

## 11. 未来优化方向

### 11.1 算法优化

**增量学习**：

- 基于用户反馈的搜索结果优化
- 动态调整向量权重
- 个性化搜索排序

**多模态支持**：

- 代码 + 注释的联合向量化
- 图像和文档的多模态索引
- 跨语言代码理解

### 11.2 架构演进

**分布式架构**：

- 支持多节点的向量存储
- 负载均衡和故障转移
- 跨工作区的索引共享

**云原生支持**：

- Kubernetes 部署支持
- 微服务架构拆分
- 弹性伸缩能力

这份详细设计文档涵盖了 Code-Index 服务的所有核心技术细节，为开发、测试、部署和维护提供了全面的技术指导。
