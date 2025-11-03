/**
 * Error Handler Implementation
 *
 * A comprehensive error handling system for the Kilocode Analysis Engine
 * that provides error logging, reporting, recovery strategies, and
 * centralized error management.
 *
 * @author Kilocode Analysis Team
 * @version 1.0.0
 */

import { EventBus } from "./EventBus"
import {
	IErrorHandler,
	IErrorReporter,
	IErrorLogger,
	AnalysisError,
	ErrorDetails,
	ErrorContext,
	ErrorCategory,
	ErrorSeverity,
	ErrorHandlerConfig,
	ErrorRecoveryStrategy,
	ErrorFilter,
	ErrorStats,
	ErrorEvents,
	ErrorOccurredData,
	ErrorHandledData,
	ErrorRecoveredData,
	ErrorReportedData,
	RecoveryFailedData,
	ReportingFailedData,
	ErrorCodes,
	ErrorUtils,
} from "../types/errors"

/**
 * Console Error Logger Implementation
 */
class ConsoleErrorLogger implements IErrorLogger {
	private readonly _errors: AnalysisError[] = []
	private readonly _maxErrors: number

	constructor(maxErrors = 1000) {
		this._maxErrors = maxErrors
	}

	log(error: AnalysisError): void {
		this.logWithLevel(error, "error")
	}

	logWithLevel(error: AnalysisError, level: "debug" | "info" | "warn" | "error"): void {
		const timestamp = error.timestamp.toISOString()
		const prefix = `[${timestamp}] [${level.toUpperCase()}] [${error.code}]`

		switch (level) {
			case "debug":
				console.debug(`${prefix} ${error.message}`, error.details)
				break
			case "info":
				console.info(`${prefix} ${error.message}`)
				break
			case "warn":
				console.warn(`${prefix} ${error.message}`)
				break
			case "error":
				console.error(`${prefix} ${error.message}`, error)
				break
		}

		// Store error in memory
		this._errors.push(error)

		// Maintain max errors limit
		if (this._errors.length > this._maxErrors) {
			this._errors.shift()
		}
	}

	getErrors(filter?: ErrorFilter): AnalysisError[] {
		let errors = [...this._errors]

		if (!filter) return errors

		// Apply filters
		if (filter.severity) {
			const severities = Array.isArray(filter.severity) ? filter.severity : [filter.severity]
			errors = errors.filter((error) => severities.includes(error.severity))
		}

		if (filter.category) {
			const categories = Array.isArray(filter.category) ? filter.category : [filter.category]
			errors = errors.filter((error) => categories.includes(error.category))
		}

		if (filter.component) {
			const components = Array.isArray(filter.component) ? filter.component : [filter.component]
			errors = errors.filter((error) => error.context.component && components.includes(error.context.component))
		}

		if (filter.timeRange) {
			errors = errors.filter(
				(error) => error.timestamp >= filter.timeRange!.start && error.timestamp <= filter.timeRange!.end,
			)
		}

		if (filter.tags) {
			const tags = Array.isArray(filter.tags) ? filter.tags : [filter.tags]
			errors = errors.filter(
				(error) => error.details.tags && tags.some((tag) => error.details.tags!.includes(tag)),
			)
		}

		if (filter.recoverable !== undefined) {
			errors = errors.filter((error) => error.recoverable === filter.recoverable)
		}

		if (filter.reportable !== undefined) {
			errors = errors.filter((error) => error.reportable === filter.reportable)
		}

		// Apply limit
		if (filter.limit && filter.limit > 0) {
			errors = errors.slice(-filter.limit)
		}

		return errors
	}

	clear(): void {
		this._errors.length = 0
	}
}

/**
 * HTTP Error Reporter Implementation
 */
class HttpErrorReporter implements IErrorReporter {
	private readonly _endpoint: string
	private readonly _apiKey?: string
	private readonly _batchSize: number
	private readonly _batchTimeout: number
	private readonly _pendingErrors: AnalysisError[] = []
	private _batchTimer?: NodeJS.Timeout

	constructor(endpoint: string, apiKey?: string, batchSize = 10, batchTimeout = 5000) {
		this._endpoint = endpoint
		this._apiKey = apiKey
		this._batchSize = batchSize
		this._batchTimeout = batchTimeout
	}

	async report(error: AnalysisError): Promise<void> {
		this._pendingErrors.push(error)

		if (this._pendingErrors.length >= this._batchSize) {
			await this._flushBatch()
		} else if (!this._batchTimer) {
			this._batchTimer = setTimeout(() => this._flushBatch(), this._batchTimeout)
		}
	}

	async reportBatch(errors: AnalysisError[]): Promise<void> {
		if (errors.length === 0) return

		try {
			const payload = {
				errors: errors.map((error) => error.toJSON()),
				timestamp: new Date().toISOString(),
				source: "kilocode-analysis-engine",
			}

			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			}

			if (this._apiKey) {
				headers["Authorization"] = `Bearer ${this._apiKey}`
			}

			const response = await fetch(this._endpoint, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			})

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`)
			}

			// Mark errors as reported
			for (const error of errors) {
				error.markReported()
			}
		} catch (error) {
			console.warn("Failed to report errors:", error)
			throw error
		}
	}

	isAvailable(): boolean {
		return !!this._endpoint
	}

	private async _flushBatch(): Promise<void> {
		if (this._batchTimer) {
			clearTimeout(this._batchTimer)
			this._batchTimer = undefined
		}

		if (this._pendingErrors.length === 0) return

		const errors = this._pendingErrors.splice(0)

		try {
			await this.reportBatch(errors)
		} catch (error) {
			// Re-add errors to pending if reporting failed
			this._pendingErrors.unshift(...errors)
			throw error
		}
	}
}

/**
 * Built-in Recovery Strategies
 */
const DefaultRecoveryStrategies: ErrorRecoveryStrategy[] = [
	{
		name: "retry",
		priority: 100,
		maxAttempts: 3,
		canHandle: (error) => error.category === ErrorCategory.NETWORK || error.category === ErrorCategory.DATABASE,
		recover: async (error) => {
			// Simple retry strategy - would be implemented based on specific error types
			await new Promise((resolve) => setTimeout(resolve, 1000))
			return false // Simplified - would contain actual retry logic
		},
	},
	{
		name: "fallback",
		priority: 50,
		canHandle: (error) => error.category === ErrorCategory.ANALYSIS,
		recover: async (error) => {
			// Fallback strategy - use alternative analysis method
			return false // Simplified - would contain actual fallback logic
		},
	},
	{
		name: "graceful-degradation",
		priority: 25,
		canHandle: (error) => error.severity !== ErrorSeverity.CRITICAL,
		recover: async (error) => {
			// Graceful degradation - continue with reduced functionality
			return true // Assume we can always gracefully degrade
		},
	},
]

/**
 * Main Error Handler Implementation
 */
export class ErrorHandler implements IErrorHandler {
	private readonly _config: Required<ErrorHandlerConfig>
	private readonly _eventBus: EventBus
	private readonly _recoveryStrategies = new Map<string, ErrorRecoveryStrategy>()
	private readonly _handledErrors: AnalysisError[] = []
	private readonly _stats: ErrorStats
	private _logger?: IErrorLogger
	private _reporter?: IErrorReporter
	private _disposed = false

	constructor(config: ErrorHandlerConfig = {}, eventBus?: EventBus) {
		this._config = {
			enableLogging: config.enableLogging ?? true,
			enableReporting: config.enableReporting ?? false,
			enableRecovery: config.enableRecovery ?? true,
			maxRetries: config.maxRetries ?? 3,
			retryDelay: config.retryDelay ?? 1000,
			includeStackTrace: config.includeStackTrace ?? true,
			logLevel: config.logLevel ?? "error",
			sanitizeSensitiveData: config.sanitizeSensitiveData ?? true,
			sensitiveDataPatterns: config.sensitiveDataPatterns ?? [
				/password[=:]\s*[^\s]+/gi,
				/token[=:]\s*[^\s]+/gi,
				/key[=:]\s*[^\s]+/gi,
				/secret[=:]\s*[^\s]+/gi,
			],
			reportingEndpoint: config.reportingEndpoint,
			reportingApiKey: config.reportingApiKey,
			debug: config.debug ?? false,
		}

		this._eventBus = eventBus || new EventBus()

		// Initialize stats
		this._stats = {
			totalErrors: 0,
			bySeverity: {
				[ErrorSeverity.LOW]: 0,
				[ErrorSeverity.MEDIUM]: 0,
				[ErrorSeverity.HIGH]: 0,
				[ErrorSeverity.CRITICAL]: 0,
			},
			byCategory: {
				[ErrorCategory.SYSTEM]: 0,
				[ErrorCategory.ANALYSIS]: 0,
				[ErrorCategory.DATABASE]: 0,
				[ErrorCategory.NETWORK]: 0,
				[ErrorCategory.VALIDATION]: 0,
				[ErrorCategory.CONFIGURATION]: 0,
				[ErrorCategory.SECURITY]: 0,
				[ErrorCategory.PERFORMANCE]: 0,
				[ErrorCategory.USER_INPUT]: 0,
				[ErrorCategory.EXTERNAL_API]: 0,
			},
			byComponent: {},
			recoveredErrors: 0,
			reportedErrors: 0,
			averagePerHour: 0,
			commonErrorCodes: [],
		}

		// Set up default logger
		if (this._config.enableLogging) {
			this._logger = new ConsoleErrorLogger()
		}

		// Set up default reporter
		if (this._config.enableReporting && this._config.reportingEndpoint) {
			this._reporter = new HttpErrorReporter(this._config.reportingEndpoint, this._config.reportingApiKey)
		}

		// Register default recovery strategies
		if (this._config.enableRecovery) {
			for (const strategy of DefaultRecoveryStrategies) {
				this.registerRecoveryStrategy(strategy)
			}
		}

		if (this._config.debug) {
			console.debug("[ErrorHandler] Error handler initialized")
		}
	}

	/**
	 * Handle an error
	 */
	async handle(error: Error | AnalysisError, context?: Partial<ErrorContext>): Promise<void> {
		this._ensureNotDisposed()

		const startTime = performance.now()
		let analysisError: AnalysisError

		// Convert to AnalysisError if needed
		if (ErrorUtils.isAnalysisError(error)) {
			analysisError = error

			// Merge additional context if provided
			if (context) {
				analysisError.details.context = {
					...analysisError.details.context,
					...context,
				}
			}
		} else {
			// Create new AnalysisError from regular Error
			analysisError = this.wrapError(
				error,
				ErrorCodes.SYSTEM_INITIALIZATION_FAILED,
				error.message,
				ErrorCategory.SYSTEM,
				context,
			)
		}

		// Mark as handled
		analysisError.markHandled()

		// Update statistics
		this._updateStats(analysisError)

		// Store in handled errors
		this._handledErrors.push(analysisError)

		// Emit error occurred event
		this._eventBus.emit(ErrorEvents.ERROR_OCCURRED, {
			error: analysisError,
			context: analysisError.context,
		} as ErrorOccurredData)

		try {
			// Sanitize error if needed
			const errorToProcess = this._config.sanitizeSensitiveData
				? ErrorUtils.sanitizeError(analysisError, this._config.sensitiveDataPatterns)
				: analysisError

			// Log error
			if (this._config.enableLogging && this._logger) {
				this._logger.logWithLevel(errorToProcess, this._config.logLevel)
			}

			// Attempt recovery
			if (this._config.enableRecovery && analysisError.recoverable) {
				const recovered = await this._attemptRecovery(analysisError)
				if (recovered) {
					analysisError.markRecovered()
					this._stats.recoveredErrors++
				}
			}

			// Report error
			if (this._config.enableReporting && this._reporter && analysisError.reportable) {
				try {
					await this._reporter.report(errorToProcess)
					analysisError.markReported()
					this._stats.reportedErrors++

					this._eventBus.emit(ErrorEvents.ERROR_REPORTED, {
						error: analysisError,
						reportingTime: performance.now() - startTime,
					} as ErrorReportedData)
				} catch (reportingError) {
					this._eventBus.emit(ErrorEvents.REPORTING_FAILED, {
						error: analysisError,
						reason: ErrorUtils.getErrorMessage(reportingError),
					} as ReportingFailedData)

					if (this._config.debug) {
						console.warn("[ErrorHandler] Failed to report error:", reportingError)
					}
				}
			}

			const handlingTime = performance.now() - startTime

			// Emit error handled event
			this._eventBus.emit(ErrorEvents.ERROR_HANDLED, {
				error: analysisError,
				handlingTime,
			} as ErrorHandledData)

			if (this._config.debug) {
				console.debug(`[ErrorHandler] Handled error ${analysisError.code} in ${handlingTime.toFixed(2)}ms`)
			}
		} catch (handlingError) {
			console.error("[ErrorHandler] Error occurred while handling error:", handlingError)

			// Create a new error for the handling failure
			const handlingFailureError = this.createError(
				ErrorCodes.SYSTEM_INITIALIZATION_FAILED,
				`Failed to handle error: ${ErrorUtils.getErrorMessage(handlingError)}`,
				ErrorCategory.SYSTEM,
				ErrorSeverity.HIGH,
				{ component: "ErrorHandler", operation: "handle" },
			)

			// Emit error occurred event for handling failure
			this._eventBus.emit(ErrorEvents.ERROR_OCCURRED, {
				error: handlingFailureError,
				context: handlingFailureError.context,
			} as ErrorOccurredData)
		}
	}

	/**
	 * Create a new analysis error
	 */
	createError(
		code: string,
		message: string,
		category: ErrorCategory,
		severity: ErrorSeverity = ErrorSeverity.MEDIUM,
		context?: Partial<ErrorContext>,
	): AnalysisError {
		const errorContext = ErrorUtils.createContext(context)

		const details: ErrorDetails = {
			code,
			message,
			severity,
			category,
			context: errorContext,
			recoverable: severity !== ErrorSeverity.CRITICAL,
			reportable: severity >= ErrorSeverity.MEDIUM,
			suggestions: this._generateSuggestions(code, category),
		}

		return new AnalysisError(details)
	}

	/**
	 * Wrap an existing error
	 */
	wrapError(
		originalError: Error,
		code: string,
		message?: string,
		category: ErrorCategory = ErrorCategory.SYSTEM,
		context?: Partial<ErrorContext>,
	): AnalysisError {
		const errorMessage = message || ErrorUtils.getErrorMessage(originalError)
		const errorContext = ErrorUtils.createContext(context)

		const details: ErrorDetails = {
			code,
			message: errorMessage,
			severity: this._inferSeverity(originalError, category),
			category,
			context: errorContext,
			originalError,
			recoverable: category !== ErrorCategory.SECURITY,
			reportable: true,
			suggestions: this._generateSuggestions(code, category),
		}

		return new AnalysisError(details)
	}

	/**
	 * Register an error recovery strategy
	 */
	registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
		this._ensureNotDisposed()
		this._recoveryStrategies.set(strategy.name, strategy)

		if (this._config.debug) {
			console.debug(`[ErrorHandler] Registered recovery strategy: ${strategy.name}`)
		}
	}

	/**
	 * Unregister an error recovery strategy
	 */
	unregisterRecoveryStrategy(name: string): boolean {
		this._ensureNotDisposed()
		const removed = this._recoveryStrategies.delete(name)

		if (removed && this._config.debug) {
			console.debug(`[ErrorHandler] Unregistered recovery strategy: ${name}`)
		}

		return removed
	}

	/**
	 * Set error reporter
	 */
	setReporter(reporter: IErrorReporter): void {
		this._ensureNotDisposed()
		this._reporter = reporter

		if (this._config.debug) {
			console.debug("[ErrorHandler] Error reporter set")
		}
	}

	/**
	 * Set error logger
	 */
	setLogger(logger: IErrorLogger): void {
		this._ensureNotDisposed()
		this._logger = logger

		if (this._config.debug) {
			console.debug("[ErrorHandler] Error logger set")
		}
	}

	/**
	 * Get error statistics
	 */
	getStats(): ErrorStats {
		// Calculate average errors per hour
		const now = new Date()
		const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
		const recentErrors = this._handledErrors.filter((error) => error.timestamp >= oneHourAgo)
		this._stats.averagePerHour = recentErrors.length

		// Calculate common error codes
		const errorCodeCounts = new Map<string, number>()
		for (const error of this._handledErrors) {
			const count = errorCodeCounts.get(error.code) || 0
			errorCodeCounts.set(error.code, count + 1)
		}

		this._stats.commonErrorCodes = Array.from(errorCodeCounts.entries())
			.map(([code, count]) => ({ code, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10)

		return { ...this._stats }
	}

	/**
	 * Get recent errors
	 */
	getRecentErrors(filter?: ErrorFilter): AnalysisError[] {
		if (this._logger) {
			return this._logger.getErrors(filter)
		}

		// Fallback to handled errors
		let errors = [...this._handledErrors]

		if (filter) {
			// Apply basic filtering (simplified version)
			if (filter.limit && filter.limit > 0) {
				errors = errors.slice(-filter.limit)
			}
		}

		return errors
	}

	/**
	 * Clear error history
	 */
	clearHistory(): void {
		this._ensureNotDisposed()

		this._handledErrors.length = 0

		if (this._logger) {
			this._logger.clear()
		}

		// Reset stats
		this._stats.totalErrors = 0
		this._stats.recoveredErrors = 0
		this._stats.reportedErrors = 0

		for (const severity of Object.values(ErrorSeverity)) {
			this._stats.bySeverity[severity] = 0
		}

		for (const category of Object.values(ErrorCategory)) {
			this._stats.byCategory[category] = 0
		}

		this._stats.byComponent = {}
		this._stats.commonErrorCodes = []

		if (this._config.debug) {
			console.debug("[ErrorHandler] Error history cleared")
		}
	}

	/**
	 * Dispose of the error handler
	 */
	dispose(): void {
		if (this._disposed) return

		this.clearHistory()
		this._recoveryStrategies.clear()
		this._disposed = true

		if (this._config.debug) {
			console.debug("[ErrorHandler] Error handler disposed")
		}
	}

	/**
	 * Attempt error recovery
	 */
	private async _attemptRecovery(error: AnalysisError): Promise<boolean> {
		const strategies = Array.from(this._recoveryStrategies.values())
			.filter((strategy) => strategy.canHandle(error))
			.sort((a, b) => b.priority - a.priority)

		for (const strategy of strategies) {
			const maxAttempts = strategy.maxAttempts || this._config.maxRetries

			for (let attempt = 1; attempt <= maxAttempts; attempt++) {
				try {
					if (this._config.debug) {
						console.debug(
							`[ErrorHandler] Attempting recovery with ${strategy.name} (attempt ${attempt}/${maxAttempts})`,
						)
					}

					const recovered = await strategy.recover(error)

					if (recovered) {
						this._eventBus.emit(ErrorEvents.ERROR_RECOVERED, {
							error,
							strategy: strategy.name,
							attempts: attempt,
						} as ErrorRecoveredData)

						if (this._config.debug) {
							console.debug(`[ErrorHandler] Successfully recovered error with ${strategy.name}`)
						}

						return true
					}
				} catch (recoveryError) {
					if (this._config.debug) {
						console.warn(`[ErrorHandler] Recovery attempt ${attempt} failed:`, recoveryError)
					}

					if (attempt === maxAttempts) {
						this._eventBus.emit(ErrorEvents.RECOVERY_FAILED, {
							error,
							strategy: strategy.name,
							attempts: attempt,
							reason: ErrorUtils.getErrorMessage(recoveryError),
						} as RecoveryFailedData)
					}
				}

				// Wait before next attempt
				if (attempt < maxAttempts) {
					await new Promise((resolve) => setTimeout(resolve, this._config.retryDelay))
				}
			}
		}

		return false
	}

	/**
	 * Update error statistics
	 */
	private _updateStats(error: AnalysisError): void {
		this._stats.totalErrors++
		this._stats.bySeverity[error.severity]++
		this._stats.byCategory[error.category]++

		if (error.context.component) {
			const count = this._stats.byComponent[error.context.component] || 0
			this._stats.byComponent[error.context.component] = count + 1
		}
	}

	/**
	 * Infer error severity from original error
	 */
	private _inferSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
		// Simple heuristics for inferring severity
		if (category === ErrorCategory.SECURITY) return ErrorSeverity.CRITICAL
		if (category === ErrorCategory.SYSTEM) return ErrorSeverity.HIGH
		if (category === ErrorCategory.DATABASE) return ErrorSeverity.HIGH
		if (category === ErrorCategory.NETWORK) return ErrorSeverity.MEDIUM
		if (category === ErrorCategory.VALIDATION) return ErrorSeverity.LOW

		return ErrorSeverity.MEDIUM
	}

	/**
	 * Generate error suggestions
	 */
	private _generateSuggestions(code: string, category: ErrorCategory): string[] {
		const suggestions: string[] = []

		switch (category) {
			case ErrorCategory.NETWORK:
				suggestions.push("Check network connectivity")
				suggestions.push("Verify endpoint URL")
				suggestions.push("Check firewall settings")
				break

			case ErrorCategory.DATABASE:
				suggestions.push("Verify database connection")
				suggestions.push("Check database credentials")
				suggestions.push("Ensure database is running")
				break

			case ErrorCategory.CONFIGURATION:
				suggestions.push("Check configuration file syntax")
				suggestions.push("Verify required configuration values")
				suggestions.push("Check file permissions")
				break

			case ErrorCategory.VALIDATION:
				suggestions.push("Check input format")
				suggestions.push("Verify required fields")
				suggestions.push("Check value ranges")
				break

			default:
				suggestions.push("Check logs for more details")
				suggestions.push("Retry the operation")
				break
		}

		return suggestions
	}

	/**
	 * Ensure handler is not disposed
	 */
	private _ensureNotDisposed(): void {
		if (this._disposed) {
			throw new Error("Error handler has been disposed")
		}
	}

	/**
	 * Get error handler configuration
	 */
	get config(): Readonly<Required<ErrorHandlerConfig>> {
		return { ...this._config }
	}

	/**
	 * Check if error handler is disposed
	 */
	get isDisposed(): boolean {
		return this._disposed
	}
}
