/**
 * Analyzer Type Definitions
 *
 * This module defines the core types for analyzers in the analysis engine,
 * including analyzer interfaces, metadata, and execution context.
 */

import { EventEmitter } from "events"
import { AnalysisContext, AnalysisResult, CancellationToken } from "./engine"

/**
 * Analyzer types
 */
export enum AnalyzerType {
	/** Project structure analyzer */
	PROJECT_STRUCTURE = "project-structure",
	/** Dependency analyzer */
	DEPENDENCY = "dependency",
	/** Code quality analyzer */
	CODE_QUALITY = "code-quality",
	/** Security analyzer */
	SECURITY = "security",
	/** Performance analyzer */
	PERFORMANCE = "performance",
	/** Database structure analyzer */
	DATABASE_STRUCTURE = "database-structure",
	/** Database performance analyzer */
	DATABASE_PERFORMANCE = "database-performance",
	/** Database security analyzer */
	DATABASE_SECURITY = "database-security",
	/** Custom analyzer */
	CUSTOM = "custom",
}

/**
 * Analyzer execution mode
 */
export enum AnalyzerExecutionMode {
	/** Synchronous execution */
	SYNC = "sync",
	/** Asynchronous execution */
	ASYNC = "async",
	/** Streaming execution */
	STREAM = "stream",
	/** Batch execution */
	BATCH = "batch",
}

/**
 * Analyzer status
 */
export enum AnalyzerStatus {
	/** Analyzer is idle */
	IDLE = "idle",
	/** Analyzer is initializing */
	INITIALIZING = "initializing",
	/** Analyzer is running */
	RUNNING = "running",
	/** Analyzer is paused */
	PAUSED = "paused",
	/** Analyzer is completed */
	COMPLETED = "completed",
	/** Analyzer failed */
	FAILED = "failed",
	/** Analyzer was cancelled */
	CANCELLED = "cancelled",
}

/**
 * Analyzer capability flags
 */
export interface AnalyzerCapabilities {
	/** Supports incremental analysis */
	supportsIncremental: boolean

	/** Supports streaming results */
	supportsStreaming: boolean

	/** Supports cancellation */
	supportsCancellation: boolean

	/** Supports progress reporting */
	supportsProgress: boolean

	/** Supports caching */
	supportsCaching: boolean

	/** Supports parallel execution */
	supportsParallel: boolean

	/** Requires database connection */
	requiresDatabase: boolean

	/** Requires file system access */
	requiresFileSystem: boolean

	/** Requires network access */
	requiresNetwork: boolean
}

/**
 * Analyzer metadata
 */
export interface AnalyzerMetadata {
	/** Unique analyzer ID */
	id: string

	/** Analyzer name */
	name: string

	/** Analyzer description */
	description: string

	/** Analyzer version */
	version: string

	/** Analyzer author */
	author: string

	/** Analyzer type */
	type: AnalyzerType

	/** Analyzer execution mode */
	executionMode: AnalyzerExecutionMode

	/** Analyzer capabilities */
	capabilities: AnalyzerCapabilities

	/** Supported file extensions */
	supportedExtensions: string[]

	/** Supported project types */
	supportedProjectTypes: string[]

	/** Analyzer dependencies */
	dependencies: string[]

	/** Analyzer tags */
	tags: string[]

	/** Analyzer priority */
	priority: number

	/** Analyzer configuration schema */
	configSchema?: any

	/** Custom metadata */
	custom?: Record<string, any>
}

/**
 * Analyzer configuration
 */
export interface AnalyzerConfig {
	/** Enable analyzer */
	enabled: boolean

	/** Analyzer timeout in milliseconds */
	timeout?: number

	/** Maximum memory usage in bytes */
	maxMemory?: number

	/** Enable caching for this analyzer */
	enableCache?: boolean

	/** Cache TTL in milliseconds */
	cacheTtl?: number

	/** Enable progress reporting */
	enableProgress?: boolean

	/** Custom configuration */
	custom?: Record<string, any>
}

/**
 * Analyzer execution context
 */
export interface AnalyzerContext {
	/** Context ID */
	id: string

	/** Analyzer ID */
	analyzerId: string

	/** Analysis context */
	analysisContext: AnalysisContext

	/** Analyzer configuration */
	config: AnalyzerConfig

	/** Input data */
	input: any

	/** Shared data from previous analyzers */
	sharedData: Map<string, any>

	/** Cancellation token */
	cancellationToken: CancellationToken

	/** Progress reporter */
	progressReporter: ProgressReporter

	/** Logger */
	logger: AnalyzerLogger
}

/**
 * Progress reporter interface
 */
export interface ProgressReporter {
	/** Report progress */
	report(progress: AnalyzerProgress): void

	/** Report message */
	message(message: string): void

	/** Report error */
	error(error: string | Error): void

	/** Report warning */
	warning(warning: string): void
}

/**
 * Analyzer progress information
 */
export interface AnalyzerProgress {
	/** Progress percentage (0-100) */
	percentage: number

	/** Current operation */
	operation?: string

	/** Progress message */
	message?: string

	/** Processed items */
	processedItems?: number

	/** Total items */
	totalItems?: number

	/** Estimated time remaining in milliseconds */
	estimatedTimeRemaining?: number
}

/**
 * Analyzer logger interface
 */
export interface AnalyzerLogger {
	/** Log debug message */
	debug(message: string, ...args: any[]): void

	/** Log info message */
	info(message: string, ...args: any[]): void

	/** Log warning message */
	warn(message: string, ...args: any[]): void

	/** Log error message */
	error(message: string | Error, ...args: any[]): void

	/** Create child logger */
	child(context: Record<string, any>): AnalyzerLogger
}

/**
 * Analyzer validation result
 */
export interface AnalyzerValidationResult {
	/** Validation status */
	isValid: boolean

	/** Validation errors */
	errors: string[]

	/** Validation warnings */
	warnings: string[]

	/** Validation details */
	details?: Record<string, any>
}

/**
 * Analyzer events
 */
export interface AnalyzerEvents {
	/** Analyzer status changed */
	"status-changed": (status: AnalyzerStatus, previousStatus: AnalyzerStatus) => void

	/** Analysis started */
	"analysis-started": (context: AnalyzerContext) => void

	/** Analysis progress updated */
	"progress-updated": (progress: AnalyzerProgress) => void

	/** Analysis completed */
	"analysis-completed": (result: AnalysisResult) => void

	/** Analysis failed */
	"analysis-failed": (error: Error, context: AnalyzerContext) => void

	/** Data streamed */
	"data-streamed": (data: any) => void

	/** Analyzer error occurred */
	error: (error: Error) => void
}

/**
 * Base analyzer interface
 */
export interface IAnalyzer extends EventEmitter {
	/** Analyzer metadata */
	readonly metadata: AnalyzerMetadata

	/** Analyzer status */
	readonly status: AnalyzerStatus

	/** Analyzer configuration */
	readonly config: AnalyzerConfig

	/** Initialize the analyzer */
	initialize(config: AnalyzerConfig): Promise<void>

	/** Validate analyzer configuration */
	validate(config: AnalyzerConfig): Promise<AnalyzerValidationResult>

	/** Check if analyzer can handle the given context */
	canHandle(context: AnalysisContext): Promise<boolean>

	/** Analyze the given context */
	analyze(context: AnalyzerContext): Promise<AnalysisResult>

	/** Cancel analysis */
	cancel(reason?: string): Promise<void>

	/** Pause analysis */
	pause(): Promise<void>

	/** Resume analysis */
	resume(): Promise<void>

	/** Get analyzer statistics */
	getStatistics(): AnalyzerStatistics

	/** Dispose the analyzer */
	dispose(): Promise<void>
}

/**
 * Streaming analyzer interface
 */
export interface IStreamingAnalyzer extends IAnalyzer {
	/** Start streaming analysis */
	startStream(context: AnalyzerContext): AsyncIterable<any>

	/** Stop streaming analysis */
	stopStream(): Promise<void>
}

/**
 * Incremental analyzer interface
 */
export interface IIncrementalAnalyzer extends IAnalyzer {
	/** Get incremental analysis key */
	getIncrementalKey(context: AnalysisContext): string

	/** Check if incremental analysis is possible */
	canUseIncremental(context: AnalysisContext, lastKey: string): Promise<boolean>

	/** Perform incremental analysis */
	analyzeIncremental(context: AnalyzerContext, lastResult: AnalysisResult): Promise<AnalysisResult>
}

/**
 * Analyzer statistics
 */
export interface AnalyzerStatistics {
	/** Total executions */
	totalExecutions: number

	/** Successful executions */
	successfulExecutions: number

	/** Failed executions */
	failedExecutions: number

	/** Average execution time in milliseconds */
	averageExecutionTime: number

	/** Total execution time in milliseconds */
	totalExecutionTime: number

	/** Average memory usage in bytes */
	averageMemoryUsage: number

	/** Peak memory usage in bytes */
	peakMemoryUsage: number

	/** Last execution time */
	lastExecutionTime?: Date

	/** Last execution duration */
	lastExecutionDuration?: number

	/** Cache hit rate */
	cacheHitRate: number

	/** Custom statistics */
	custom?: Record<string, number>
}

/**
 * Analyzer registry interface
 */
export interface IAnalyzerRegistry {
	/** Register an analyzer */
	register(analyzer: IAnalyzer, metadata: AnalyzerMetadata): Promise<void>

	/** Unregister an analyzer */
	unregister(analyzerId: string): Promise<void>

	/** Get analyzer by ID */
	get(analyzerId: string): IAnalyzer | undefined

	/** Get analyzer metadata */
	getMetadata(analyzerId: string): AnalyzerMetadata | undefined

	/** List all analyzers */
	list(): AnalyzerMetadata[]

	/** Find analyzers by type */
	findByType(type: AnalyzerType): AnalyzerMetadata[]

	/** Find analyzers by capability */
	findByCapability(capability: keyof AnalyzerCapabilities): AnalyzerMetadata[]

	/** Find analyzers that can handle context */
	findCompatible(context: AnalysisContext): Promise<AnalyzerMetadata[]>

	/** Validate analyzer */
	validate(analyzer: IAnalyzer): Promise<AnalyzerValidationResult>

	/** Clear all analyzers */
	clear(): Promise<void>
}

/**
 * Analyzer factory interface
 */
export interface IAnalyzerFactory {
	/** Create analyzer instance */
	create(metadata: AnalyzerMetadata, config: AnalyzerConfig): Promise<IAnalyzer>

	/** Get supported analyzer types */
	getSupportedTypes(): AnalyzerType[]

	/** Validate analyzer metadata */
	validateMetadata(metadata: AnalyzerMetadata): AnalyzerValidationResult
}

/**
 * Analyzer loader interface
 */
export interface IAnalyzerLoader {
	/** Load analyzer from path */
	load(path: string): Promise<IAnalyzer>

	/** Load analyzer from module */
	loadFromModule(moduleName: string): Promise<IAnalyzer>

	/** Unload analyzer */
	unload(analyzerId: string): Promise<void>

	/** Get loaded analyzers */
	getLoaded(): string[]

	/** Reload analyzer */
	reload(analyzerId: string): Promise<void>
}
