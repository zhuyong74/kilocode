/**
 * Base Analyzer Abstract Class
 *
 * This module provides a base implementation for analyzers with common functionality
 * including lifecycle management, event handling, statistics tracking, and error handling.
 */

import { EventEmitter } from "events"
import {
	AnalyzerMetadata,
	AnalyzerConfig,
	AnalyzerContext,
	AnalyzerStatus,
	AnalyzerValidationResult,
	AnalyzerStatistics,
	AnalyzerProgress,
	ProgressReporter,
	AnalyzerLogger,
} from "../../types/analyzer"
import { AnalysisContext, AnalysisResult, AnalysisResultStatus } from "../../types/engine"
import { IAnalyzer } from "./IAnalyzer"

/**
 * Base analyzer abstract class providing common functionality
 */
export abstract class BaseAnalyzer extends EventEmitter implements IAnalyzer {
	protected _metadata: AnalyzerMetadata
	protected _config: AnalyzerConfig
	protected _status: AnalyzerStatus = AnalyzerStatus.IDLE
	protected _statistics: AnalyzerStatistics
	protected _logger?: AnalyzerLogger
	protected _startTime?: Date
	protected _endTime?: Date
	protected _cancellationRequested = false
	protected _cancellationReason?: string
	protected _isPaused = false
	protected _currentContext?: AnalyzerContext

	constructor(metadata: AnalyzerMetadata, config: AnalyzerConfig) {
		super()
		this._metadata = { ...metadata }
		this._config = { ...config }
		this._statistics = this.initializeStatistics()
	}

	/**
	 * Get analyzer metadata
	 */
	get metadata(): AnalyzerMetadata {
		return { ...this._metadata }
	}

	/**
	 * Get analyzer status
	 */
	get status(): AnalyzerStatus {
		return this._status
	}

	/**
	 * Get analyzer configuration
	 */
	get config(): AnalyzerConfig {
		return { ...this._config }
	}

	/**
	 * Get analyzer statistics
	 */
	get statistics(): AnalyzerStatistics {
		return { ...this._statistics }
	}

	/**
	 * Initialize the analyzer
	 */
	async initialize(config: AnalyzerConfig): Promise<void> {
		try {
			this.setStatus(AnalyzerStatus.INITIALIZING)

			// Validate configuration
			const validation = await this.validate(config)
			if (!validation.isValid) {
				throw new Error(`Invalid configuration: ${validation.errors.join(", ")}`)
			}

			this._config = { ...config }

			// Perform custom initialization
			await this.onInitialize()

			this.setStatus(AnalyzerStatus.IDLE)
			this.emit("initialized", this)
		} catch (error) {
			this.setStatus(AnalyzerStatus.FAILED)
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Validate analyzer configuration
	 */
	async validate(config: AnalyzerConfig): Promise<AnalyzerValidationResult> {
		const result: AnalyzerValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
		}

		// Basic validation
		if (config.timeout !== undefined && config.timeout <= 0) {
			result.errors.push("Timeout must be greater than 0")
		}

		if (config.maxMemory !== undefined && config.maxMemory <= 0) {
			result.errors.push("Max memory must be greater than 0")
		}

		if (config.cacheTtl !== undefined && config.cacheTtl < 0) {
			result.errors.push("Cache TTL must be non-negative")
		}

		// Custom validation
		const customValidation = await this.onValidate(config)
		result.errors.push(...customValidation.errors)
		result.warnings.push(...customValidation.warnings)

		result.isValid = result.errors.length === 0
		return result
	}

	/**
	 * Check if analyzer can handle the given context
	 */
	async canHandle(context: AnalysisContext): Promise<boolean> {
		try {
			// Check supported file extensions
			if (this._metadata.supportedExtensions.length > 0) {
				// Implementation would check file extensions in project
				// This is a simplified check
				return true
			}

			// Check supported project types
			if (this._metadata.supportedProjectTypes.length > 0) {
				// Implementation would check project type
				// This is a simplified check
				return true
			}

			// Custom can handle logic
			return await this.onCanHandle(context)
		} catch (error) {
			this._logger?.error("Error checking if analyzer can handle context", error)
			return false
		}
	}

	/**
	 * Analyze the given context
	 */
	async analyze(context: AnalyzerContext): Promise<AnalysisResult> {
		try {
			this._currentContext = context
			this._logger = context.logger
			this._cancellationRequested = false
			this._cancellationReason = undefined
			this._isPaused = false

			this.setStatus(AnalyzerStatus.RUNNING)
			this._startTime = new Date()

			this.emit("analysis-started", context)
			this._statistics.totalExecutions++

			// Check cancellation before starting
			this.checkCancellation()

			// Perform the actual analysis
			const result = await this.performAnalysis(context)

			this._endTime = new Date()
			const executionTime = this._endTime.getTime() - this._startTime.getTime()

			// Update statistics
			this.updateStatistics(executionTime, true)

			this.setStatus(AnalyzerStatus.COMPLETED)
			this.emit("analysis-completed", result)

			return result
		} catch (error) {
			this._endTime = new Date()
			const executionTime = this._startTime ? this._endTime.getTime() - this._startTime.getTime() : 0

			this.updateStatistics(executionTime, false)

			if (this._cancellationRequested) {
				this.setStatus(AnalyzerStatus.CANCELLED)
				this.emit("analysis-cancelled", this._cancellationReason)
			} else {
				this.setStatus(AnalyzerStatus.FAILED)
				this.emit("analysis-failed", error, context)
			}

			throw error
		} finally {
			this._currentContext = undefined
			this._logger = undefined
		}
	}

	/**
	 * Cancel the current analysis
	 */
	async cancel(reason?: string): Promise<void> {
		if (this._status !== AnalyzerStatus.RUNNING) {
			return
		}

		this._cancellationRequested = true
		this._cancellationReason = reason

		// Perform custom cancellation logic
		await this.onCancel(reason)

		this.setStatus(AnalyzerStatus.CANCELLED)
		this.emit("cancelled", reason)
	}

	/**
	 * Pause the current analysis
	 */
	async pause(): Promise<void> {
		if (this._status !== AnalyzerStatus.RUNNING) {
			return
		}

		this._isPaused = true

		// Perform custom pause logic
		await this.onPause()

		this.setStatus(AnalyzerStatus.PAUSED)
		this.emit("paused")
	}

	/**
	 * Resume the paused analysis
	 */
	async resume(): Promise<void> {
		if (this._status !== AnalyzerStatus.PAUSED) {
			return
		}

		this._isPaused = false

		// Perform custom resume logic
		await this.onResume()

		this.setStatus(AnalyzerStatus.RUNNING)
		this.emit("resumed")
	}

	/**
	 * Get analyzer statistics
	 */
	getStatistics(): AnalyzerStatistics {
		return { ...this._statistics }
	}

	/**
	 * Reset analyzer statistics
	 */
	resetStatistics(): void {
		this._statistics = this.initializeStatistics()
		this.emit("statistics-reset")
	}

	/**
	 * Dispose the analyzer
	 */
	async dispose(): Promise<void> {
		try {
			// Cancel any running analysis
			if (this._status === AnalyzerStatus.RUNNING) {
				await this.cancel("Analyzer is being disposed")
			}

			// Perform custom disposal logic
			await this.onDispose()

			this.setStatus(AnalyzerStatus.IDLE)
			this.removeAllListeners()
			this.emit("disposed")
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Abstract method for performing the actual analysis
	 */
	protected abstract performAnalysis(context: AnalyzerContext): Promise<AnalysisResult>

	/**
	 * Custom initialization logic (override in subclasses)
	 */
	protected async onInitialize(): Promise<void> {
		// Default implementation does nothing
	}

	/**
	 * Custom validation logic (override in subclasses)
	 */
	protected async onValidate(config: AnalyzerConfig): Promise<AnalyzerValidationResult> {
		return {
			isValid: true,
			errors: [],
			warnings: [],
		}
	}

	/**
	 * Custom can handle logic (override in subclasses)
	 */
	protected async onCanHandle(context: AnalysisContext): Promise<boolean> {
		return true
	}

	/**
	 * Custom cancellation logic (override in subclasses)
	 */
	protected async onCancel(reason?: string): Promise<void> {
		// Default implementation does nothing
	}

	/**
	 * Custom pause logic (override in subclasses)
	 */
	protected async onPause(): Promise<void> {
		// Default implementation does nothing
	}

	/**
	 * Custom resume logic (override in subclasses)
	 */
	protected async onResume(): Promise<void> {
		// Default implementation does nothing
	}

	/**
	 * Custom disposal logic (override in subclasses)
	 */
	protected async onDispose(): Promise<void> {
		// Default implementation does nothing
	}

	/**
	 * Set analyzer status and emit event
	 */
	protected setStatus(status: AnalyzerStatus): void {
		const previousStatus = this._status
		this._status = status
		this.emit("status-changed", status, previousStatus)
	}

	/**
	 * Check if cancellation was requested and throw if so
	 */
	protected checkCancellation(): void {
		if (this._cancellationRequested) {
			throw new Error(`Analysis cancelled: ${this._cancellationReason || "No reason provided"}`)
		}
	}

	/**
	 * Check if analysis is paused and wait if so
	 */
	protected async checkPause(): Promise<void> {
		while (this._isPaused && !this._cancellationRequested) {
			await new Promise((resolve) => setTimeout(resolve, 100))
		}
		this.checkCancellation()
	}

	/**
	 * Report progress to the progress reporter
	 */
	protected reportProgress(progress: AnalyzerProgress): void {
		if (this._currentContext?.progressReporter) {
			this._currentContext.progressReporter.report(progress)
		}
		this.emit("progress-updated", progress)
	}

	/**
	 * Log message using the context logger
	 */
	protected log(level: "debug" | "info" | "warn" | "error", message: string, ...args: any[]): void {
		if (this._logger) {
			this._logger[level](message, ...args)
		}
	}

	/**
	 * Create a successful analysis result
	 */
	protected createSuccessResult(data: any, metadata?: any): AnalysisResult {
		return {
			id: this.generateResultId(),
			contextId: this._currentContext?.id || "",
			analyzerId: this._metadata.id,
			status: AnalysisResultStatus.SUCCESS,
			data,
			metadata: {
				version: this._metadata.version,
				format: "json",
				size: JSON.stringify(data).length,
				checksum: this.generateChecksum(data),
				...metadata,
			},
			errors: [],
			warnings: [],
			metrics: this.getCurrentMetrics(),
			timestamp: new Date(),
		}
	}

	/**
	 * Create an error analysis result
	 */
	protected createErrorResult(error: Error, data?: any): AnalysisResult {
		return {
			id: this.generateResultId(),
			contextId: this._currentContext?.id || "",
			analyzerId: this._metadata.id,
			status: AnalysisResultStatus.ERROR,
			data: data || null,
			metadata: {
				version: this._metadata.version,
				format: "json",
				size: 0,
				checksum: "",
			},
			errors: [
				{
					code: "ANALYSIS_ERROR",
					message: error.message,
					details: error.stack,
					source: this._metadata.id,
					stack: error.stack,
					timestamp: new Date(),
					severity: "high" as const,
				},
			],
			warnings: [],
			metrics: this.getCurrentMetrics(),
			timestamp: new Date(),
		}
	}

	/**
	 * Initialize statistics object
	 */
	private initializeStatistics(): AnalyzerStatistics {
		return {
			analyzerId: this._metadata.id,
			totalExecutions: 0,
			successfulExecutions: 0,
			failedExecutions: 0,
			averageExecutionTime: 0,
			totalExecutionTime: 0,
			averageMemoryUsage: 0,
			peakMemoryUsage: 0,
			cacheHitRate: 0,
		}
	}

	/**
	 * Update statistics after analysis
	 */
	private updateStatistics(executionTime: number, success: boolean): void {
		if (success) {
			this._statistics.successfulExecutions++
		} else {
			this._statistics.failedExecutions++
		}

		this._statistics.totalExecutionTime += executionTime
		this._statistics.averageExecutionTime = this._statistics.totalExecutionTime / this._statistics.totalExecutions

		this._statistics.lastExecutionTime = new Date()
		this._statistics.lastExecutionDuration = executionTime

		// Update memory usage (simplified)
		const currentMemory = process.memoryUsage().heapUsed
		this._statistics.peakMemoryUsage = Math.max(this._statistics.peakMemoryUsage, currentMemory)
		this._statistics.averageMemoryUsage = (this._statistics.averageMemoryUsage + currentMemory) / 2
	}

	/**
	 * Get current performance metrics
	 */
	private getCurrentMetrics() {
		const executionTime = this._startTime && this._endTime ? this._endTime.getTime() - this._startTime.getTime() : 0

		return {
			executionTime,
			memoryUsage: process.memoryUsage().heapUsed,
			cpuUsage: 0, // Would need actual CPU monitoring
			ioOperations: 0,
			networkRequests: 0,
			cacheHits: 0,
			cacheMisses: 0,
		}
	}

	/**
	 * Generate unique result ID
	 */
	private generateResultId(): string {
		return `${this._metadata.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * Generate checksum for data
	 */
	private generateChecksum(data: any): string {
		// Simple checksum implementation
		const str = JSON.stringify(data)
		let hash = 0
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i)
			hash = (hash << 5) - hash + char
			hash = hash & hash // Convert to 32-bit integer
		}
		return hash.toString(16)
	}
}
