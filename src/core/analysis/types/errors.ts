/**
 * Error Handling Type Definitions
 *
 * Defines all types and interfaces for the error handling system
 * used in the Kilocode Analysis Engine.
 *
 * @author Kilocode Analysis Team
 * @version 1.0.0
 */

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
 * Error categories
 */
export enum ErrorCategory {
	SYSTEM = "system",
	ANALYSIS = "analysis",
	DATABASE = "database",
	NETWORK = "network",
	VALIDATION = "validation",
	CONFIGURATION = "configuration",
	SECURITY = "security",
	PERFORMANCE = "performance",
	USER_INPUT = "user_input",
	EXTERNAL_API = "external_api",
}

/**
 * Error context information
 */
export interface ErrorContext {
	/** Component or module where error occurred */
	component?: string

	/** Operation being performed when error occurred */
	operation?: string

	/** User ID if applicable */
	userId?: string

	/** Session ID if applicable */
	sessionId?: string

	/** Request ID for tracing */
	requestId?: string

	/** File path if applicable */
	filePath?: string

	/** Line number if applicable */
	lineNumber?: number

	/** Column number if applicable */
	columnNumber?: number

	/** Additional metadata */
	metadata?: Record<string, any>

	/** Stack trace */
	stackTrace?: string

	/** Timestamp when error occurred */
	timestamp: Date
}

/**
 * Error details interface
 */
export interface ErrorDetails {
	/** Error code */
	code: string

	/** Error message */
	message: string

	/** Error severity */
	severity: ErrorSeverity

	/** Error category */
	category: ErrorCategory

	/** Error context */
	context: ErrorContext

	/** Original error if this is a wrapped error */
	originalError?: Error

	/** Suggested actions to resolve the error */
	suggestions?: string[]

	/** Whether this error is recoverable */
	recoverable: boolean

	/** Whether this error should be reported */
	reportable: boolean

	/** Tags for categorization */
	tags?: string[]
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
	/** Whether to enable error logging */
	enableLogging?: boolean

	/** Whether to enable error reporting */
	enableReporting?: boolean

	/** Whether to enable error recovery */
	enableRecovery?: boolean

	/** Maximum number of retry attempts */
	maxRetries?: number

	/** Retry delay in milliseconds */
	retryDelay?: number

	/** Whether to include stack traces */
	includeStackTrace?: boolean

	/** Log level for errors */
	logLevel?: "debug" | "info" | "warn" | "error"

	/** Whether to sanitize sensitive data */
	sanitizeSensitiveData?: boolean

	/** Patterns to match sensitive data */
	sensitiveDataPatterns?: RegExp[]

	/** Error reporting endpoint */
	reportingEndpoint?: string

	/** Error reporting API key */
	reportingApiKey?: string

	/** Whether to enable debug mode */
	debug?: boolean
}

/**
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
	/** Strategy name */
	name: string

	/** Whether this strategy can handle the error */
	canHandle: (error: AnalysisError) => boolean

	/** Attempt to recover from the error */
	recover: (error: AnalysisError) => Promise<boolean>

	/** Priority of this strategy (higher = more priority) */
	priority: number

	/** Maximum number of attempts */
	maxAttempts?: number
}

/**
 * Error reporter interface
 */
export interface IErrorReporter {
	/** Report an error */
	report(error: AnalysisError): Promise<void>

	/** Batch report multiple errors */
	reportBatch(errors: AnalysisError[]): Promise<void>

	/** Check if reporter is available */
	isAvailable(): boolean
}

/**
 * Error logger interface
 */
export interface IErrorLogger {
	/** Log an error */
	log(error: AnalysisError): void

	/** Log error with custom level */
	logWithLevel(error: AnalysisError, level: "debug" | "info" | "warn" | "error"): void

	/** Get logged errors */
	getErrors(filter?: ErrorFilter): AnalysisError[]

	/** Clear logged errors */
	clear(): void
}

/**
 * Error filter for querying
 */
export interface ErrorFilter {
	/** Filter by severity */
	severity?: ErrorSeverity | ErrorSeverity[]

	/** Filter by category */
	category?: ErrorCategory | ErrorCategory[]

	/** Filter by component */
	component?: string | string[]

	/** Filter by time range */
	timeRange?: {
		start: Date
		end: Date
	}

	/** Filter by tags */
	tags?: string | string[]

	/** Filter by recoverable status */
	recoverable?: boolean

	/** Filter by reportable status */
	reportable?: boolean

	/** Maximum number of results */
	limit?: number
}

/**
 * Main Error Handler interface
 */
export interface IErrorHandler {
	/**
	 * Handle an error
	 */
	handle(error: Error | AnalysisError, context?: Partial<ErrorContext>): Promise<void>

	/**
	 * Create a new analysis error
	 */
	createError(
		code: string,
		message: string,
		category: ErrorCategory,
		severity?: ErrorSeverity,
		context?: Partial<ErrorContext>,
	): AnalysisError

	/**
	 * Wrap an existing error
	 */
	wrapError(
		originalError: Error,
		code: string,
		message?: string,
		category?: ErrorCategory,
		context?: Partial<ErrorContext>,
	): AnalysisError

	/**
	 * Register an error recovery strategy
	 */
	registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void

	/**
	 * Unregister an error recovery strategy
	 */
	unregisterRecoveryStrategy(name: string): boolean

	/**
	 * Set error reporter
	 */
	setReporter(reporter: IErrorReporter): void

	/**
	 * Set error logger
	 */
	setLogger(logger: IErrorLogger): void

	/**
	 * Get error statistics
	 */
	getStats(): ErrorStats

	/**
	 * Get recent errors
	 */
	getRecentErrors(filter?: ErrorFilter): AnalysisError[]

	/**
	 * Clear error history
	 */
	clearHistory(): void

	/**
	 * Dispose of the error handler
	 */
	dispose(): void
}

/**
 * Error statistics
 */
export interface ErrorStats {
	/** Total number of errors handled */
	totalErrors: number

	/** Errors by severity */
	bySeverity: Record<ErrorSeverity, number>

	/** Errors by category */
	byCategory: Record<ErrorCategory, number>

	/** Errors by component */
	byComponent: Record<string, number>

	/** Number of recovered errors */
	recoveredErrors: number

	/** Number of reported errors */
	reportedErrors: number

	/** Average errors per hour */
	averagePerHour: number

	/** Most common error codes */
	commonErrorCodes: Array<{ code: string; count: number }>
}

/**
 * Main Analysis Error class
 */
export class AnalysisError extends Error {
	public readonly details: ErrorDetails
	public readonly id: string
	public readonly timestamp: Date
	private _handled = false
	private _recovered = false
	private _reported = false

	constructor(details: ErrorDetails) {
		super(details.message)

		this.name = "AnalysisError"
		this.details = details
		this.id = this._generateId()
		this.timestamp = details.context.timestamp

		// Capture stack trace
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, AnalysisError)
		}

		// Store stack trace in context
		this.details.context.stackTrace = this.stack
	}

	/**
	 * Get error code
	 */
	get code(): string {
		return this.details.code
	}

	/**
	 * Get error severity
	 */
	get severity(): ErrorSeverity {
		return this.details.severity
	}

	/**
	 * Get error category
	 */
	get category(): ErrorCategory {
		return this.details.category
	}

	/**
	 * Get error context
	 */
	get context(): ErrorContext {
		return this.details.context
	}

	/**
	 * Whether this error is recoverable
	 */
	get recoverable(): boolean {
		return this.details.recoverable
	}

	/**
	 * Whether this error should be reported
	 */
	get reportable(): boolean {
		return this.details.reportable
	}

	/**
	 * Whether this error has been handled
	 */
	get handled(): boolean {
		return this._handled
	}

	/**
	 * Whether this error has been recovered
	 */
	get recovered(): boolean {
		return this._recovered
	}

	/**
	 * Whether this error has been reported
	 */
	get reported(): boolean {
		return this._reported
	}

	/**
	 * Mark error as handled
	 */
	markHandled(): void {
		this._handled = true
	}

	/**
	 * Mark error as recovered
	 */
	markRecovered(): void {
		this._recovered = true
	}

	/**
	 * Mark error as reported
	 */
	markReported(): void {
		this._reported = true
	}

	/**
	 * Get error as JSON
	 */
	toJSON(): object {
		return {
			id: this.id,
			name: this.name,
			message: this.message,
			details: this.details,
			timestamp: this.timestamp,
			handled: this._handled,
			recovered: this._recovered,
			reported: this._reported,
		}
	}

	/**
	 * Get error as string
	 */
	toString(): string {
		return `[${this.details.code}] ${this.message} (${this.details.category}/${this.details.severity})`
	}

	/**
	 * Generate unique error ID
	 */
	private _generateId(): string {
		return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}
}

/**
 * Error events
 */
export const ErrorEvents = {
	ERROR_OCCURRED: "error.occurred",
	ERROR_HANDLED: "error.handled",
	ERROR_RECOVERED: "error.recovered",
	ERROR_REPORTED: "error.reported",
	RECOVERY_FAILED: "error.recovery.failed",
	REPORTING_FAILED: "error.reporting.failed",
} as const

/**
 * Error event data types
 */
export interface ErrorOccurredData {
	error: AnalysisError
	context: ErrorContext
}

export interface ErrorHandledData {
	error: AnalysisError
	handlingTime: number
}

export interface ErrorRecoveredData {
	error: AnalysisError
	strategy: string
	attempts: number
}

export interface ErrorReportedData {
	error: AnalysisError
	reportingTime: number
}

export interface RecoveryFailedData {
	error: AnalysisError
	strategy: string
	attempts: number
	reason: string
}

export interface ReportingFailedData {
	error: AnalysisError
	reason: string
}

/**
 * Built-in error codes
 */
export const ErrorCodes = {
	// System errors
	SYSTEM_INITIALIZATION_FAILED: "SYS_001",
	SYSTEM_SHUTDOWN_FAILED: "SYS_002",
	MEMORY_LIMIT_EXCEEDED: "SYS_003",
	TIMEOUT_EXCEEDED: "SYS_004",

	// Analysis errors
	ANALYSIS_FAILED: "ANA_001",
	ANALYSIS_TIMEOUT: "ANA_002",
	ANALYSIS_INVALID_INPUT: "ANA_003",
	ANALYSIS_UNSUPPORTED_FORMAT: "ANA_004",

	// Database errors
	DATABASE_CONNECTION_FAILED: "DB_001",
	DATABASE_QUERY_FAILED: "DB_002",
	DATABASE_SCHEMA_INVALID: "DB_003",
	DATABASE_TIMEOUT: "DB_004",

	// Network errors
	NETWORK_CONNECTION_FAILED: "NET_001",
	NETWORK_TIMEOUT: "NET_002",
	NETWORK_UNAUTHORIZED: "NET_003",
	NETWORK_NOT_FOUND: "NET_004",

	// Validation errors
	VALIDATION_FAILED: "VAL_001",
	VALIDATION_REQUIRED_FIELD: "VAL_002",
	VALIDATION_INVALID_FORMAT: "VAL_003",
	VALIDATION_OUT_OF_RANGE: "VAL_004",

	// Configuration errors
	CONFIG_LOAD_FAILED: "CFG_001",
	CONFIG_VALIDATION_FAILED: "CFG_002",
	CONFIG_MISSING_REQUIRED: "CFG_003",
	CONFIG_INVALID_VALUE: "CFG_004",

	// Security errors
	SECURITY_ACCESS_DENIED: "SEC_001",
	SECURITY_AUTHENTICATION_FAILED: "SEC_002",
	SECURITY_AUTHORIZATION_FAILED: "SEC_003",
	SECURITY_INVALID_TOKEN: "SEC_004",

	// Performance errors
	PERFORMANCE_DEGRADED: "PERF_001",
	PERFORMANCE_MEMORY_HIGH: "PERF_002",
	PERFORMANCE_CPU_HIGH: "PERF_003",
	PERFORMANCE_DISK_FULL: "PERF_004",
} as const

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
	/**
	 * Check if error is an AnalysisError
	 */
	static isAnalysisError(error: any): error is AnalysisError {
		return error instanceof AnalysisError
	}

	/**
	 * Extract error message from any error type
	 */
	static getErrorMessage(error: any): string {
		if (typeof error === "string") return error
		if (error instanceof Error) return error.message
		if (error && typeof error.message === "string") return error.message
		return "Unknown error"
	}

	/**
	 * Extract stack trace from error
	 */
	static getStackTrace(error: any): string | undefined {
		if (error instanceof Error) return error.stack
		if (error && typeof error.stack === "string") return error.stack
		return undefined
	}

	/**
	 * Sanitize error data for logging/reporting
	 */
	static sanitizeError(error: AnalysisError, patterns: RegExp[] = []): AnalysisError {
		const sanitizedDetails = { ...error.details }

		// Sanitize message
		sanitizedDetails.message = ErrorUtils.sanitizeString(error.message, patterns)

		// Sanitize context metadata
		if (sanitizedDetails.context.metadata) {
			sanitizedDetails.context.metadata = ErrorUtils.sanitizeObject(sanitizedDetails.context.metadata, patterns)
		}

		return new AnalysisError(sanitizedDetails)
	}

	/**
	 * Sanitize string data
	 */
	static sanitizeString(str: string, patterns: RegExp[]): string {
		let sanitized = str

		for (const pattern of patterns) {
			sanitized = sanitized.replace(pattern, "[REDACTED]")
		}

		return sanitized
	}

	/**
	 * Sanitize object data
	 */
	static sanitizeObject(obj: Record<string, any>, patterns: RegExp[]): Record<string, any> {
		const sanitized: Record<string, any> = {}

		for (const [key, value] of Object.entries(obj)) {
			if (typeof value === "string") {
				sanitized[key] = ErrorUtils.sanitizeString(value, patterns)
			} else if (typeof value === "object" && value !== null) {
				sanitized[key] = ErrorUtils.sanitizeObject(value, patterns)
			} else {
				sanitized[key] = value
			}
		}

		return sanitized
	}

	/**
	 * Create error context from current execution
	 */
	static createContext(overrides: Partial<ErrorContext> = {}): ErrorContext {
		const stack = new Error().stack
		const stackLines = stack?.split("\n") || []

		// Try to extract file and line info from stack
		let filePath: string | undefined
		let lineNumber: number | undefined

		for (const line of stackLines) {
			const match = line.match(/at .* \((.+):(\d+):\d+\)/)
			if (match) {
				filePath = match[1]
				lineNumber = parseInt(match[2], 10)
				break
			}
		}

		return {
			timestamp: new Date(),
			stackTrace: stack,
			filePath,
			lineNumber,
			...overrides,
		}
	}
}
