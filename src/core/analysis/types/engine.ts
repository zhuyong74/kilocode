/**
 * Analysis Engine Types
 *
 * This module defines the core types for the analysis engine,
 * including configuration, context, results, and engine interfaces.
 */

import { AnalyzerType } from "./analyzer"

/**
 * Analysis engine configuration
 */
export interface AnalysisEngineConfig {
	/** Maximum number of concurrent analyses */
	maxConcurrentAnalyses?: number

	/** Analysis timeout in milliseconds */
	analysisTimeout?: number

	/** Enable parallel execution of analyzers */
	parallelExecution?: boolean

	/** Enable result caching */
	enableCaching?: boolean

	/** Cache configuration */
	cacheConfig?: {
		maxSize?: number
		ttl?: number
		persistToDisk?: boolean
	}

	/** Performance monitoring configuration */
	performanceMonitoring?: {
		enabled?: boolean
		interval?: number
		metricsRetention?: number
	}

	/** Logging configuration */
	logging?: {
		level?: "debug" | "info" | "warn" | "error"
		enableFileLogging?: boolean
		logDirectory?: string
	}
}

/**
 * Analysis context
 */
export interface AnalysisContext {
	/** Target to analyze */
	target: AnalysisTarget

	/** Analysis options */
	options?: AnalysisOptions

	/** Additional metadata */
	metadata?: Record<string, any>

	/** User context */
	user?: {
		id: string
		permissions?: string[]
	}

	/** Session context */
	session?: {
		id: string
		startTime: Date
	}
}

/**
 * Analysis target
 */
export interface AnalysisTarget {
	/** Target type */
	type: AnalysisTargetType

	/** Target identifier */
	id: string

	/** Target path or location */
	path?: string

	/** Target content or data */
	content?: any

	/** Target metadata */
	metadata?: Record<string, any>
}

/**
 * Analysis target types
 */
export enum AnalysisTargetType {
	FILE = "file",
	DIRECTORY = "directory",
	DATABASE = "database",
	URL = "url",
	MEMORY = "memory",
	STREAM = "stream",
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
	/** Analysis depth */
	depth?: number

	/** Include patterns */
	include?: string[]

	/** Exclude patterns */
	exclude?: string[]

	/** Analysis mode */
	mode?: AnalysisMode

	/** Output format */
	outputFormat?: AnalysisOutputFormat

	/** Custom parameters */
	parameters?: Record<string, any>
}

/**
 * Analysis modes
 */
export enum AnalysisMode {
	QUICK = "quick",
	STANDARD = "standard",
	DEEP = "deep",
	CUSTOM = "custom",
	FORCE_REFRESH = "force_refresh",
}

/**
 * Analysis output formats
 */
export enum AnalysisOutputFormat {
	JSON = "json",
	XML = "xml",
	HTML = "html",
	TEXT = "text",
	BINARY = "binary",
}

/**
 * Analysis result
 */
export interface AnalysisResult {
	/** Analysis success status */
	success: boolean

	/** Analysis data */
	data: any

	/** Result metadata */
	metadata: AnalysisResultMetadata

	/** Analysis errors */
	errors?: AnalysisError[]

	/** Analysis warnings */
	warnings?: AnalysisWarning[]

	/** Performance metrics */
	performance?: PerformanceMetrics
}

/**
 * Analysis result metadata
 */
export interface AnalysisResultMetadata {
	/** Analysis ID */
	analysisId: string

	/** Analysis timestamp */
	timestamp: Date

	/** Analysis duration in milliseconds */
	duration: number

	/** Analyzer ID */
	analyzerId: string

	/** Analyzer version */
	version: string

	/** Result size in bytes */
	size?: number

	/** Result checksum */
	checksum?: string
}

/**
 * Analysis error
 */
export interface AnalysisError {
	/** Error code */
	code: string

	/** Error message */
	message: string

	/** Error details */
	details?: any

	/** Error location */
	location?: {
		file?: string
		line?: number
		column?: number
	}

	/** Error severity */
	severity: ErrorSeverity

	/** Error timestamp */
	timestamp: Date
}

/**
 * Analysis warning
 */
export interface AnalysisWarning {
	/** Warning code */
	code: string

	/** Warning message */
	message: string

	/** Warning details */
	details?: any

	/** Warning location */
	location?: {
		file?: string
		line?: number
		column?: number
	}

	/** Warning timestamp */
	timestamp: Date
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}

/**
 * Analysis progress
 */
export interface AnalysisProgress {
	/** Task ID */
	taskId: string

	/** Completion status */
	completed: boolean

	/** Progress percentage (0-100) */
	progress: number

	/** Current step description */
	currentStep: string

	/** Total number of steps */
	totalSteps: number

	/** Start time */
	startTime: Date

	/** Estimated time remaining in milliseconds */
	estimatedTimeRemaining: number

	/** Additional progress data */
	data?: any
}

/**
 * Analysis priority levels
 */
export enum AnalysisPriority {
	LOW = 1,
	NORMAL = 2,
	HIGH = 3,
	URGENT = 4,
	CRITICAL = 5,
}

/**
 * Engine status
 */
export enum EngineStatus {
	STOPPED = "stopped",
	INITIALIZING = "initializing",
	RUNNING = "running",
	PAUSED = "paused",
	STOPPING = "stopping",
	ERROR = "error",
}

/**
 * Cancellation token
 */
export interface CancellationToken {
	/** Whether the operation is cancelled */
	isCancelled: boolean

	/** Cancel the operation */
	cancel(): void

	/** Register cancellation callback */
	onCancelled?: (callback: () => void) => void
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
	/** CPU usage percentage */
	cpuUsage: number

	/** Memory usage in bytes */
	memoryUsage: number

	/** Disk usage in bytes */
	diskUsage: number

	/** Network usage in bytes */
	networkUsage: number

	/** Cache hit rate percentage */
	cacheHitRate: number

	/** Average response time in milliseconds */
	averageResponseTime: number

	/** Throughput (operations per second) */
	throughput: number

	/** Error rate percentage */
	errorRate: number

	/** Metrics timestamp */
	timestamp: Date
}

/**
 * Engine statistics
 */
export interface EngineStatistics {
	/** Total number of analyses performed */
	totalAnalyses: number

	/** Number of successful analyses */
	successfulAnalyses: number

	/** Number of failed analyses */
	failedAnalyses: number

	/** Number of cancelled analyses */
	cancelledAnalyses: number

	/** Average execution time in milliseconds */
	averageExecutionTime: number

	/** Total execution time in milliseconds */
	totalExecutionTime: number

	/** Cache hit rate percentage */
	cacheHitRate: number

	/** Number of active analyzers */
	activeAnalyzers: number

	/** Number of queued tasks */
	queuedTasks: number

	/** Number of active tasks */
	activeTasks: number

	/** Peak concurrency reached */
	peakConcurrency: number

	/** Engine uptime in milliseconds */
	engineUptime: number

	/** Last analysis time */
	lastAnalysisTime: Date

	/** Engine creation time */
	createdAt: Date
}

/**
 * Analysis engine interface
 */
export interface IAnalysisEngine {
	/** Engine configuration */
	readonly config: AnalysisEngineConfig

	/** Engine status */
	readonly status: EngineStatus

	/**
	 * Initialize the engine
	 */
	initialize(): Promise<void>

	/**
	 * Analyze with the given context
	 */
	analyze(
		context: AnalysisContext,
		options?: {
			analyzers?: string[]
			priority?: AnalysisPriority
			mode?: AnalysisMode
			onProgress?: (progress: AnalysisProgress) => void
		},
	): Promise<AnalysisResult>

	/**
	 * Cancel analysis by ID
	 */
	cancel(analysisId: string): Promise<void>

	/**
	 * Pause the engine
	 */
	pause(): Promise<void>

	/**
	 * Resume the engine
	 */
	resume(): Promise<void>

	/**
	 * Get engine statistics
	 */
	getStatistics(): EngineStatistics

	/**
	 * Get performance metrics
	 */
	getPerformanceMetrics(): PerformanceMetrics

	/**
	 * Dispose the engine
	 */
	dispose(): Promise<void>
}

/**
 * Analysis engine factory
 */
export interface IAnalysisEngineFactory {
	/**
	 * Create an analysis engine
	 */
	create(config: AnalysisEngineConfig): Promise<IAnalysisEngine>

	/**
	 * Get supported engine types
	 */
	getSupportedTypes(): string[]

	/**
	 * Validate engine configuration
	 */
	validateConfig(config: AnalysisEngineConfig): boolean
}

/**
 * Analysis engine registry
 */
export interface IAnalysisEngineRegistry {
	/**
	 * Register an engine
	 */
	register(id: string, engine: IAnalysisEngine): void

	/**
	 * Unregister an engine
	 */
	unregister(id: string): void

	/**
	 * Get an engine by ID
	 */
	get(id: string): IAnalysisEngine | undefined

	/**
	 * List all registered engines
	 */
	list(): string[]

	/**
	 * Get the default engine
	 */
	getDefault(): IAnalysisEngine | undefined

	/**
	 * Set the default engine
	 */
	setDefault(id: string): void
}

/**
 * Type guards
 */
export function isAnalysisResult(obj: any): obj is AnalysisResult {
	return (
		obj &&
		typeof obj === "object" &&
		typeof obj.success === "boolean" &&
		obj.metadata &&
		typeof obj.metadata === "object"
	)
}

export function isAnalysisError(obj: any): obj is AnalysisError {
	return (
		obj &&
		typeof obj === "object" &&
		typeof obj.code === "string" &&
		typeof obj.message === "string" &&
		Object.values(ErrorSeverity).includes(obj.severity)
	)
}

export function isAnalysisContext(obj: any): obj is AnalysisContext {
	return (
		obj &&
		typeof obj === "object" &&
		obj.target &&
		typeof obj.target === "object" &&
		Object.values(AnalysisTargetType).includes(obj.target.type)
	)
}
