/**
 * Analysis Engine
 *
 * This module provides the core analysis engine that orchestrates
 * analyzer execution, manages analysis sessions, and coordinates
 * with caching and database systems.
 */

import { EventEmitter } from "events"
import {
	AnalysisEngineConfig,
	AnalysisContext,
	AnalysisResult,
	AnalysisProgress,
	AnalysisMode,
	EngineStatus,
	AnalysisPriority,
	CancellationToken,
	PerformanceMetrics,
	EngineStatistics,
	IAnalysisEngine,
} from "../types/engine"
import { IAnalyzer, IAnalyzerRegistry } from "../analyzers/base/IAnalyzer"
import { AnalyzerMetadata, AnalyzerType } from "../types/analyzer"
import { IAnalysisCache } from "../types/cache"
import { IDatabaseEngine } from "../types/database"
import { EventBus } from "../../events/EventBus"
import { DIContainer } from "../../di/DIContainer"

/**
 * Analysis task
 */
interface AnalysisTask {
	/** Task ID */
	id: string

	/** Analysis context */
	context: AnalysisContext

	/** Selected analyzers */
	analyzers: AnalyzerMetadata[]

	/** Task priority */
	priority: AnalysisPriority

	/** Cancellation token */
	cancellationToken: CancellationToken

	/** Task creation timestamp */
	createdAt: Date

	/** Task start timestamp */
	startedAt?: Date

	/** Task completion timestamp */
	completedAt?: Date

	/** Task result */
	result?: AnalysisResult

	/** Task error */
	error?: Error

	/** Progress callback */
	onProgress?: (progress: AnalysisProgress) => void
}

/**
 * Analysis engine implementation
 */
export class AnalysisEngine extends EventEmitter implements IAnalysisEngine {
	private readonly _analyzerRegistry: IAnalyzerRegistry
	private readonly _cache?: IAnalysisCache
	private readonly _databaseEngine?: IDatabaseEngine
	private readonly _eventBus: EventBus
	private readonly _container: DIContainer

	private _status: EngineStatus = EngineStatus.STOPPED
	private _config: AnalysisEngineConfig
	private _initialized = false
	private _disposed = false

	// Task management
	private readonly _activeTasks = new Map<string, AnalysisTask>()
	private readonly _taskQueue: AnalysisTask[] = []
	private _taskCounter = 0
	private _maxConcurrentTasks: number

	// Statistics
	private _statistics: EngineStatistics = {
		totalAnalyses: 0,
		successfulAnalyses: 0,
		failedAnalyses: 0,
		cancelledAnalyses: 0,
		averageExecutionTime: 0,
		totalExecutionTime: 0,
		cacheHitRate: 0,
		activeAnalyzers: 0,
		queuedTasks: 0,
		activeTasks: 0,
		peakConcurrency: 0,
		engineUptime: 0,
		lastAnalysisTime: new Date(),
		createdAt: new Date(),
	}

	// Performance tracking
	private _performanceMetrics: PerformanceMetrics = {
		cpuUsage: 0,
		memoryUsage: 0,
		diskUsage: 0,
		networkUsage: 0,
		cacheHitRate: 0,
		averageResponseTime: 0,
		throughput: 0,
		errorRate: 0,
		timestamp: new Date(),
	}

	constructor(config: AnalysisEngineConfig, container: DIContainer) {
		super()
		this._config = { ...config }
		this._container = container
		this._maxConcurrentTasks = config.maxConcurrentAnalyses || 5

		// Get dependencies from container
		this._analyzerRegistry = container.resolve<IAnalyzerRegistry>("analyzerRegistry")
		this._cache = container.tryResolve<IAnalysisCache>("analysisCache")
		this._databaseEngine = container.tryResolve<IDatabaseEngine>("databaseEngine")
		this._eventBus = container.resolve<EventBus>("eventBus")

		// Set up event handlers
		this.setupEventHandlers()
	}

	/**
	 * Get engine configuration
	 */
	get config(): AnalysisEngineConfig {
		return { ...this._config }
	}

	/**
	 * Get engine status
	 */
	get status(): EngineStatus {
		return this._status
	}

	/**
	 * Initialize the analysis engine
	 */
	async initialize(): Promise<void> {
		if (this._initialized) {
			throw new Error("Analysis engine is already initialized")
		}

		try {
			this._status = EngineStatus.INITIALIZING

			// Validate configuration
			this.validateConfiguration()

			// Initialize cache if available and not already initialized
			if (this._cache && !this._cache.isInitialized) {
				await this._cache.initialize()
			}

			// Initialize database engine if available
			if (this._databaseEngine && !this._databaseEngine.isInitialized) {
				await this._databaseEngine.initialize()
			}

			// Start performance monitoring
			this.startPerformanceMonitoring()

			this._initialized = true
			this._status = EngineStatus.RUNNING
			this._statistics.createdAt = new Date()

			this.emit("initialized")
			this._eventBus.emit("analysis-engine:initialized", { engineId: "main" })
		} catch (error) {
			this._status = EngineStatus.ERROR
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Analyze with the given context
	 */
	async analyze(
		context: AnalysisContext,
		options?: {
			analyzers?: string[]
			priority?: AnalysisPriority
			mode?: AnalysisMode
			onProgress?: (progress: AnalysisProgress) => void
		},
	): Promise<AnalysisResult> {
		if (!this._initialized || this._status !== EngineStatus.RUNNING) {
			throw new Error("Analysis engine is not running")
		}

		// Create cancellation token
		const cancellationToken: CancellationToken = {
			isCancelled: false,
			cancel: () => {
				cancellationToken.isCancelled = true
			},
		}

		// Check cache first
		if (this._cache && options?.mode !== AnalysisMode.FORCE_REFRESH) {
			const cachedResult = await this._cache.get(context)
			if (cachedResult) {
				this._statistics.totalAnalyses++
				this.updateCacheHitRate(true)
				return cachedResult
			}
		}

		// Find compatible analyzers
		const availableAnalyzers = await this._analyzerRegistry.findCompatible(context)
		let selectedAnalyzers = availableAnalyzers

		// Filter by specified analyzers if provided
		if (options?.analyzers) {
			selectedAnalyzers = availableAnalyzers.filter((analyzer) => options.analyzers!.includes(analyzer.id))
		}

		if (selectedAnalyzers.length === 0) {
			throw new Error("No compatible analyzers found for the given context")
		}

		// Create analysis task
		const task: AnalysisTask = {
			id: `task_${++this._taskCounter}`,
			context: { ...context },
			analyzers: selectedAnalyzers,
			priority: options?.priority || AnalysisPriority.NORMAL,
			cancellationToken,
			createdAt: new Date(),
			onProgress: options?.onProgress,
		}

		// Execute the task
		return await this.executeTask(task)
	}

	/**
	 * Cancel analysis by ID
	 */
	async cancel(analysisId: string): Promise<void> {
		const task = this._activeTasks.get(analysisId)
		if (task) {
			task.cancellationToken.cancel()
			this._statistics.cancelledAnalyses++
			this.emit("analysis-cancelled", analysisId)
		}
	}

	/**
	 * Pause the engine
	 */
	async pause(): Promise<void> {
		if (this._status === EngineStatus.RUNNING) {
			this._status = EngineStatus.PAUSED
			this.emit("paused")
			this._eventBus.emit("analysis-engine:paused", { engineId: "main" })
		}
	}

	/**
	 * Resume the engine
	 */
	async resume(): Promise<void> {
		if (this._status === EngineStatus.PAUSED) {
			this._status = EngineStatus.RUNNING
			this.processTaskQueue()
			this.emit("resumed")
			this._eventBus.emit("analysis-engine:resumed", { engineId: "main" })
		}
	}

	/**
	 * Get engine statistics
	 */
	getStatistics(): EngineStatistics {
		const now = new Date()
		const uptime = now.getTime() - this._statistics.createdAt.getTime()

		return {
			...this._statistics,
			queuedTasks: this._taskQueue.length,
			activeTasks: this._activeTasks.size,
			engineUptime: uptime,
		}
	}

	/**
	 * Get performance metrics
	 */
	getPerformanceMetrics(): PerformanceMetrics {
		return { ...this._performanceMetrics }
	}

	/**
	 * Dispose the engine
	 */
	async dispose(): Promise<void> {
		if (this._disposed) {
			return
		}

		try {
			this._status = EngineStatus.STOPPING

			// Cancel all active tasks
			for (const task of this._activeTasks.values()) {
				task.cancellationToken.cancel()
			}

			// Wait for tasks to complete or timeout
			const timeout = 30000 // 30 seconds
			const startTime = Date.now()

			while (this._activeTasks.size > 0 && Date.now() - startTime < timeout) {
				await new Promise((resolve) => setTimeout(resolve, 100))
			}

			// Dispose cache if available
			if (this._cache) {
				await this._cache.dispose()
			}

			// Dispose database engine if available
			if (this._databaseEngine) {
				await this._databaseEngine.dispose()
			}

			this._disposed = true
			this._status = EngineStatus.STOPPED

			this.emit("disposed")
			this._eventBus.emit("analysis-engine:disposed", { engineId: "main" })
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Execute an analysis task
	 */
	private async executeTask(task: AnalysisTask): Promise<AnalysisResult> {
		// Check if we can execute immediately or need to queue
		if (this._activeTasks.size >= this._maxConcurrentTasks) {
			return await this.queueTask(task)
		}

		return await this.runTask(task)
	}

	/**
	 * Queue a task for later execution
	 */
	private async queueTask(task: AnalysisTask): Promise<AnalysisResult> {
		return new Promise<AnalysisResult>((resolve, reject) => {
			// Insert task in priority order
			const insertIndex = this._taskQueue.findIndex((queuedTask) => queuedTask.priority < task.priority)

			if (insertIndex === -1) {
				this._taskQueue.push(task)
			} else {
				this._taskQueue.splice(insertIndex, 0, task)
			}

			// Set up completion handlers
			const originalOnProgress = task.onProgress
			task.onProgress = (progress) => {
				originalOnProgress?.(progress)
				if (progress.completed) {
					if (task.result) {
						resolve(task.result)
					} else if (task.error) {
						reject(task.error)
					}
				}
			}

			this.emit("task-queued", task.id)
		})
	}

	/**
	 * Run a task immediately
	 */
	private async runTask(task: AnalysisTask): Promise<AnalysisResult> {
		task.startedAt = new Date()
		this._activeTasks.set(task.id, task)

		// Update peak concurrency
		if (this._activeTasks.size > this._statistics.peakConcurrency) {
			this._statistics.peakConcurrency = this._activeTasks.size
		}

		try {
			this.emit("analysis-started", task.id, task.context)
			this._eventBus.emit("analysis:started", { taskId: task.id, context: task.context })

			// Execute analyzers in sequence or parallel based on configuration
			const results: AnalysisResult[] = []

			if (this._config.parallelExecution) {
				results.push(...(await this.executeAnalyzersParallel(task)))
			} else {
				results.push(...(await this.executeAnalyzersSequential(task)))
			}

			// Combine results
			const combinedResult = this.combineResults(results, task.context)
			task.result = combinedResult
			task.completedAt = new Date()

			// Cache the result
			if (this._cache) {
				await this._cache.set(task.context, combinedResult)
			}

			// Update statistics
			this._statistics.totalAnalyses++
			this._statistics.successfulAnalyses++
			this.updateExecutionTime(task)
			this.updateCacheHitRate(false)

			this.emit("analysis-completed", task.id, combinedResult)
			this._eventBus.emit("analysis:completed", { taskId: task.id, result: combinedResult })

			return combinedResult
		} catch (error) {
			task.error = error as Error
			task.completedAt = new Date()

			this._statistics.totalAnalyses++
			this._statistics.failedAnalyses++

			this.emit("analysis-failed", task.id, error)
			this._eventBus.emit("analysis:failed", { taskId: task.id, error })

			throw error
		} finally {
			this._activeTasks.delete(task.id)
			task.onProgress?.({
				taskId: task.id,
				completed: true,
				progress: 100,
				currentStep: "Completed",
				totalSteps: 1,
				startTime: task.startedAt!,
				estimatedTimeRemaining: 0,
			})

			// Process next task in queue
			this.processTaskQueue()
		}
	}

	/**
	 * Execute analyzers in parallel
	 */
	private async executeAnalyzersParallel(task: AnalysisTask): Promise<AnalysisResult[]> {
		const promises = task.analyzers.map(async (analyzerMeta) => {
			if (task.cancellationToken.isCancelled) {
				throw new Error("Analysis was cancelled")
			}

			const analyzer = this._analyzerRegistry.get(analyzerMeta.id)
			if (!analyzer) {
				throw new Error(`Analyzer ${analyzerMeta.id} not found`)
			}

			return await analyzer.analyze(task.context, task.cancellationToken)
		})

		return await Promise.all(promises)
	}

	/**
	 * Execute analyzers sequentially
	 */
	private async executeAnalyzersSequential(task: AnalysisTask): Promise<AnalysisResult[]> {
		const results: AnalysisResult[] = []

		for (let i = 0; i < task.analyzers.length; i++) {
			if (task.cancellationToken.isCancelled) {
				throw new Error("Analysis was cancelled")
			}

			const analyzerMeta = task.analyzers[i]
			const analyzer = this._analyzerRegistry.get(analyzerMeta.id)
			if (!analyzer) {
				throw new Error(`Analyzer ${analyzerMeta.id} not found`)
			}

			// Report progress
			task.onProgress?.({
				taskId: task.id,
				completed: false,
				progress: (i / task.analyzers.length) * 100,
				currentStep: `Executing ${analyzerMeta.name}`,
				totalSteps: task.analyzers.length,
				startTime: task.startedAt!,
				estimatedTimeRemaining: 0, // TODO: Calculate based on previous executions
			})

			const result = await analyzer.analyze(task.context, task.cancellationToken)
			results.push(result)
		}

		return results
	}

	/**
	 * Combine multiple analysis results
	 */
	private combineResults(results: AnalysisResult[], context: AnalysisContext): AnalysisResult {
		const combinedResult: AnalysisResult = {
			success: results.every((r) => r.success),
			data: {},
			metadata: {
				analysisId: `combined_${Date.now()}`,
				timestamp: new Date(),
				duration: 0,
				analyzerId: "combined",
				version: "1.0.0",
			},
			errors: [],
			warnings: [],
		}

		// Combine data from all results
		for (const result of results) {
			if (result.data) {
				Object.assign(combinedResult.data, result.data)
			}

			if (result.errors) {
				combinedResult.errors.push(...result.errors)
			}

			if (result.warnings) {
				combinedResult.warnings.push(...result.warnings)
			}
		}

		// Calculate total duration
		const totalDuration = results.reduce((sum, r) => sum + (r.metadata.duration || 0), 0)
		combinedResult.metadata.duration = totalDuration

		return combinedResult
	}

	/**
	 * Process the task queue
	 */
	private processTaskQueue(): void {
		while (this._taskQueue.length > 0 && this._activeTasks.size < this._maxConcurrentTasks) {
			if (this._status !== EngineStatus.RUNNING) {
				break
			}

			const task = this._taskQueue.shift()!
			this.runTask(task).catch((error) => {
				this.emit("error", error)
			})
		}
	}

	/**
	 * Update execution time statistics
	 */
	private updateExecutionTime(task: AnalysisTask): void {
		if (task.startedAt && task.completedAt) {
			const executionTime = task.completedAt.getTime() - task.startedAt.getTime()
			this._statistics.totalExecutionTime += executionTime
			this._statistics.averageExecutionTime = this._statistics.totalExecutionTime / this._statistics.totalAnalyses
			this._statistics.lastAnalysisTime = task.completedAt
		}
	}

	/**
	 * Update cache hit rate
	 */
	private updateCacheHitRate(isHit: boolean): void {
		// Simple moving average for cache hit rate
		const weight = 0.1
		const hitValue = isHit ? 1 : 0
		this._statistics.cacheHitRate = (1 - weight) * this._statistics.cacheHitRate + weight * hitValue
	}

	/**
	 * Validate engine configuration
	 */
	private validateConfiguration(): void {
		if (!this._config.maxConcurrentAnalyses || this._config.maxConcurrentAnalyses < 1) {
			throw new Error("maxConcurrentAnalyses must be at least 1")
		}

		if (this._config.analysisTimeout && this._config.analysisTimeout < 1000) {
			throw new Error("analysisTimeout must be at least 1000ms")
		}
	}

	/**
	 * Set up event handlers
	 */
	private setupEventHandlers(): void {
		// Handle analyzer registry events
		this._analyzerRegistry.on("analyzer-registered", (analyzerId) => {
			this._statistics.activeAnalyzers = this._analyzerRegistry.list().length
		})

		this._analyzerRegistry.on("analyzer-unregistered", (analyzerId) => {
			this._statistics.activeAnalyzers = this._analyzerRegistry.list().length
		})
	}

	/**
	 * Start performance monitoring
	 */
	private startPerformanceMonitoring(): void {
		setInterval(() => {
			this.updatePerformanceMetrics()
		}, 30000) // Update every 30 seconds
	}

	/**
	 * Update performance metrics
	 */
	private updatePerformanceMetrics(): void {
		// Update basic metrics
		this._performanceMetrics.timestamp = new Date()
		this._performanceMetrics.cacheHitRate = this._statistics.cacheHitRate
		this._performanceMetrics.averageResponseTime = this._statistics.averageExecutionTime
		this._performanceMetrics.throughput =
			this._statistics.successfulAnalyses / (this._statistics.engineUptime / 1000 / 60) // analyses per minute
		this._performanceMetrics.errorRate =
			this._statistics.failedAnalyses / Math.max(this._statistics.totalAnalyses, 1)

		// TODO: Implement system resource monitoring
		// This would require platform-specific implementations
		this._performanceMetrics.cpuUsage = 0
		this._performanceMetrics.memoryUsage = 0
		this._performanceMetrics.diskUsage = 0
		this._performanceMetrics.networkUsage = 0
	}
}
