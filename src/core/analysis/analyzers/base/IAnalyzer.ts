/**
 * Base Analyzer Interface
 *
 * This module defines the core analyzer interface that all analyzers must implement.
 * It provides the contract for analyzer lifecycle, execution, and event handling.
 */

import { EventEmitter } from "events"
import {
	AnalyzerMetadata,
	AnalyzerConfig,
	AnalyzerContext,
	AnalyzerStatus,
	AnalyzerValidationResult,
	AnalyzerStatistics,
	AnalyzerEvents,
	IAnalyzer as IAnalyzerInterface,
	IStreamingAnalyzer,
	IIncrementalAnalyzer,
} from "../../types/analyzer"
import { AnalysisContext, AnalysisResult } from "../../types/engine"

/**
 * Base analyzer interface implementation
 *
 * This interface defines the core contract that all analyzers must implement.
 * It includes lifecycle management, validation, execution, and event handling.
 */
export interface IAnalyzer extends EventEmitter {
	/**
	 * Analyzer metadata containing information about the analyzer
	 */
	readonly metadata: AnalyzerMetadata

	/**
	 * Current analyzer status
	 */
	readonly status: AnalyzerStatus

	/**
	 * Analyzer configuration
	 */
	readonly config: AnalyzerConfig

	/**
	 * Analyzer statistics
	 */
	readonly statistics: AnalyzerStatistics

	/**
	 * Initialize the analyzer with configuration
	 *
	 * @param config - Analyzer configuration
	 * @returns Promise that resolves when initialization is complete
	 */
	initialize(config: AnalyzerConfig): Promise<void>

	/**
	 * Validate analyzer configuration
	 *
	 * @param config - Configuration to validate
	 * @returns Promise that resolves to validation result
	 */
	validate(config: AnalyzerConfig): Promise<AnalyzerValidationResult>

	/**
	 * Check if analyzer can handle the given analysis context
	 *
	 * @param context - Analysis context to check
	 * @returns Promise that resolves to true if analyzer can handle the context
	 */
	canHandle(context: AnalysisContext): Promise<boolean>

	/**
	 * Analyze the given context and return results
	 *
	 * @param context - Analyzer context containing input data and configuration
	 * @returns Promise that resolves to analysis result
	 */
	analyze(context: AnalyzerContext): Promise<AnalysisResult>

	/**
	 * Cancel the current analysis operation
	 *
	 * @param reason - Optional reason for cancellation
	 * @returns Promise that resolves when cancellation is complete
	 */
	cancel(reason?: string): Promise<void>

	/**
	 * Pause the current analysis operation
	 *
	 * @returns Promise that resolves when analysis is paused
	 */
	pause(): Promise<void>

	/**
	 * Resume the paused analysis operation
	 *
	 * @returns Promise that resolves when analysis is resumed
	 */
	resume(): Promise<void>

	/**
	 * Get analyzer execution statistics
	 *
	 * @returns Current analyzer statistics
	 */
	getStatistics(): AnalyzerStatistics

	/**
	 * Reset analyzer statistics
	 */
	resetStatistics(): void

	/**
	 * Dispose the analyzer and clean up resources
	 *
	 * @returns Promise that resolves when disposal is complete
	 */
	dispose(): Promise<void>
}

/**
 * Streaming analyzer interface for analyzers that support streaming results
 */
export interface IStreamingAnalyzer extends IAnalyzer {
	/**
	 * Start streaming analysis and return an async iterable of results
	 *
	 * @param context - Analyzer context
	 * @returns Async iterable of streaming results
	 */
	startStream(context: AnalyzerContext): AsyncIterable<any>

	/**
	 * Stop the streaming analysis
	 *
	 * @returns Promise that resolves when streaming is stopped
	 */
	stopStream(): Promise<void>

	/**
	 * Check if streaming is currently active
	 */
	readonly isStreaming: boolean
}

/**
 * Incremental analyzer interface for analyzers that support incremental analysis
 */
export interface IIncrementalAnalyzer extends IAnalyzer {
	/**
	 * Get the incremental analysis key for the given context
	 *
	 * @param context - Analysis context
	 * @returns Incremental key string
	 */
	getIncrementalKey(context: AnalysisContext): string

	/**
	 * Check if incremental analysis can be used with the given context and last key
	 *
	 * @param context - Analysis context
	 * @param lastKey - Last incremental key
	 * @returns Promise that resolves to true if incremental analysis is possible
	 */
	canUseIncremental(context: AnalysisContext, lastKey: string): Promise<boolean>

	/**
	 * Perform incremental analysis using the last result
	 *
	 * @param context - Analyzer context
	 * @param lastResult - Last analysis result
	 * @returns Promise that resolves to incremental analysis result
	 */
	analyzeIncremental(context: AnalyzerContext, lastResult: AnalysisResult): Promise<AnalysisResult>

	/**
	 * Get the last incremental result for the given key
	 *
	 * @param key - Incremental key
	 * @returns Last analysis result or undefined
	 */
	getLastResult(key: string): AnalysisResult | undefined

	/**
	 * Clear incremental cache for the given key or all keys
	 *
	 * @param key - Optional key to clear, if not provided clears all
	 */
	clearIncrementalCache(key?: string): void
}

/**
 * Batch analyzer interface for analyzers that support batch processing
 */
export interface IBatchAnalyzer extends IAnalyzer {
	/**
	 * Analyze multiple contexts in batch
	 *
	 * @param contexts - Array of analyzer contexts
	 * @returns Promise that resolves to array of analysis results
	 */
	analyzeBatch(contexts: AnalyzerContext[]): Promise<AnalysisResult[]>

	/**
	 * Get optimal batch size for this analyzer
	 *
	 * @returns Optimal batch size
	 */
	getOptimalBatchSize(): number

	/**
	 * Check if batch processing is more efficient than individual processing
	 *
	 * @param contextCount - Number of contexts to process
	 * @returns True if batch processing is recommended
	 */
	shouldUseBatch(contextCount: number): boolean
}

/**
 * Configurable analyzer interface for analyzers with dynamic configuration
 */
export interface IConfigurableAnalyzer extends IAnalyzer {
	/**
	 * Update analyzer configuration at runtime
	 *
	 * @param config - New configuration
	 * @returns Promise that resolves when configuration is updated
	 */
	updateConfig(config: Partial<AnalyzerConfig>): Promise<void>

	/**
	 * Get current configuration
	 *
	 * @returns Current analyzer configuration
	 */
	getConfig(): AnalyzerConfig

	/**
	 * Get configuration schema for validation
	 *
	 * @returns Configuration schema
	 */
	getConfigSchema(): any

	/**
	 * Validate configuration against schema
	 *
	 * @param config - Configuration to validate
	 * @returns Validation result
	 */
	validateConfig(config: AnalyzerConfig): AnalyzerValidationResult
}

/**
 * Cacheable analyzer interface for analyzers that support result caching
 */
export interface ICacheableAnalyzer extends IAnalyzer {
	/**
	 * Generate cache key for the given context
	 *
	 * @param context - Analysis context
	 * @returns Cache key string
	 */
	generateCacheKey(context: AnalysisContext): string

	/**
	 * Check if result can be cached
	 *
	 * @param result - Analysis result
	 * @returns True if result can be cached
	 */
	canCache(result: AnalysisResult): boolean

	/**
	 * Get cache TTL for this analyzer
	 *
	 * @returns Cache TTL in milliseconds
	 */
	getCacheTtl(): number

	/**
	 * Invalidate cache for the given key or pattern
	 *
	 * @param keyOrPattern - Cache key or pattern to invalidate
	 */
	invalidateCache(keyOrPattern: string): void
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

	/** Supports result caching */
	supportsCaching: boolean

	/** Supports parallel execution */
	supportsParallel: boolean

	/** Supports batch processing */
	supportsBatch: boolean

	/** Requires database connection */
	requiresDatabase: boolean

	/** Requires file system access */
	requiresFileSystem: boolean

	/** Requires network access */
	requiresNetwork: boolean

	/** Supports configuration updates */
	supportsConfigUpdate: boolean

	/** Supports pause/resume */
	supportsPauseResume: boolean
}

/**
 * Analyzer factory interface for creating analyzer instances
 */
export interface IAnalyzerFactory {
	/**
	 * Create analyzer instance from metadata and configuration
	 *
	 * @param metadata - Analyzer metadata
	 * @param config - Analyzer configuration
	 * @returns Promise that resolves to analyzer instance
	 */
	create(metadata: AnalyzerMetadata, config: AnalyzerConfig): Promise<IAnalyzer>

	/**
	 * Get supported analyzer types
	 *
	 * @returns Array of supported analyzer types
	 */
	getSupportedTypes(): string[]

	/**
	 * Validate analyzer metadata
	 *
	 * @param metadata - Metadata to validate
	 * @returns Validation result
	 */
	validateMetadata(metadata: AnalyzerMetadata): AnalyzerValidationResult

	/**
	 * Get default configuration for analyzer type
	 *
	 * @param type - Analyzer type
	 * @returns Default configuration
	 */
	getDefaultConfig(type: string): AnalyzerConfig
}

/**
 * Analyzer loader interface for loading analyzers from external sources
 */
export interface IAnalyzerLoader {
	/**
	 * Load analyzer from file path
	 *
	 * @param path - Path to analyzer file
	 * @returns Promise that resolves to analyzer instance
	 */
	load(path: string): Promise<IAnalyzer>

	/**
	 * Load analyzer from module name
	 *
	 * @param moduleName - Module name to load
	 * @returns Promise that resolves to analyzer instance
	 */
	loadFromModule(moduleName: string): Promise<IAnalyzer>

	/**
	 * Unload analyzer by ID
	 *
	 * @param analyzerId - Analyzer ID to unload
	 * @returns Promise that resolves when analyzer is unloaded
	 */
	unload(analyzerId: string): Promise<void>

	/**
	 * Get list of loaded analyzer IDs
	 *
	 * @returns Array of loaded analyzer IDs
	 */
	getLoaded(): string[]

	/**
	 * Reload analyzer by ID
	 *
	 * @param analyzerId - Analyzer ID to reload
	 * @returns Promise that resolves when analyzer is reloaded
	 */
	reload(analyzerId: string): Promise<void>

	/**
	 * Check if analyzer is loaded
	 *
	 * @param analyzerId - Analyzer ID to check
	 * @returns True if analyzer is loaded
	 */
	isLoaded(analyzerId: string): boolean
}

/**
 * Type guard functions for analyzer interfaces
 */

/**
 * Check if analyzer supports streaming
 */
export function isStreamingAnalyzer(analyzer: IAnalyzer): analyzer is IStreamingAnalyzer {
	return "startStream" in analyzer && "stopStream" in analyzer
}

/**
 * Check if analyzer supports incremental analysis
 */
export function isIncrementalAnalyzer(analyzer: IAnalyzer): analyzer is IIncrementalAnalyzer {
	return "getIncrementalKey" in analyzer && "analyzeIncremental" in analyzer
}

/**
 * Check if analyzer supports batch processing
 */
export function isBatchAnalyzer(analyzer: IAnalyzer): analyzer is IBatchAnalyzer {
	return "analyzeBatch" in analyzer && "getOptimalBatchSize" in analyzer
}

/**
 * Check if analyzer is configurable
 */
export function isConfigurableAnalyzer(analyzer: IAnalyzer): analyzer is IConfigurableAnalyzer {
	return "updateConfig" in analyzer && "getConfigSchema" in analyzer
}

/**
 * Check if analyzer supports caching
 */
export function isCacheableAnalyzer(analyzer: IAnalyzer): analyzer is ICacheableAnalyzer {
	return "generateCacheKey" in analyzer && "canCache" in analyzer
}
