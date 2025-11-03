/**
 * Analysis Session Type Definitions
 *
 * This module defines the core types for analysis sessions,
 * including session management, state tracking, and lifecycle events.
 */

import { EventEmitter } from "events"
import { AnalysisContext, AnalysisResult, CancellationToken } from "./engine"
import { AnalyzerProgress } from "./analyzer"

/**
 * Session status
 */
export enum SessionStatus {
	/** Session is created but not started */
	CREATED = "created",
	/** Session is initializing */
	INITIALIZING = "initializing",
	/** Session is active and running */
	ACTIVE = "active",
	/** Session is paused */
	PAUSED = "paused",
	/** Session is completed successfully */
	COMPLETED = "completed",
	/** Session failed with errors */
	FAILED = "failed",
	/** Session was cancelled */
	CANCELLED = "cancelled",
	/** Session timed out */
	TIMEOUT = "timeout",
	/** Session is being cleaned up */
	DISPOSING = "disposing",
	/** Session is disposed */
	DISPOSED = "disposed",
}

/**
 * Session priority levels
 */
export enum SessionPriority {
	LOW = 0,
	NORMAL = 1,
	HIGH = 2,
	CRITICAL = 3,
}

/**
 * Session execution mode
 */
export enum SessionExecutionMode {
	/** Execute analyzers sequentially */
	SEQUENTIAL = "sequential",
	/** Execute analyzers in parallel */
	PARALLEL = "parallel",
	/** Execute analyzers in pipeline */
	PIPELINE = "pipeline",
	/** Adaptive execution based on dependencies */
	ADAPTIVE = "adaptive",
}

/**
 * Session configuration
 */
export interface SessionConfig {
	/** Session timeout in milliseconds */
	timeout: number

	/** Maximum concurrent analyzers */
	maxConcurrency: number

	/** Session execution mode */
	executionMode: SessionExecutionMode

	/** Session priority */
	priority: SessionPriority

	/** Enable session persistence */
	enablePersistence: boolean

	/** Enable progress tracking */
	enableProgress: boolean

	/** Enable result caching */
	enableCache: boolean

	/** Enable detailed logging */
	enableVerboseLogging: boolean

	/** Auto-cleanup on completion */
	autoCleanup: boolean

	/** Cleanup delay in milliseconds */
	cleanupDelay: number

	/** Custom configuration */
	custom?: Record<string, any>
}

/**
 * Session metadata
 */
export interface SessionMetadata {
	/** Session ID */
	id: string

	/** Session name */
	name: string

	/** Session description */
	description?: string

	/** Session tags */
	tags: string[]

	/** Session owner */
	owner?: string

	/** Session creation time */
	createdAt: Date

	/** Session start time */
	startedAt?: Date

	/** Session completion time */
	completedAt?: Date

	/** Session duration in milliseconds */
	duration?: number

	/** Custom metadata */
	custom?: Record<string, any>
}

/**
 * Session state
 */
export interface SessionState {
	/** Current status */
	status: SessionStatus

	/** Current analyzer being executed */
	currentAnalyzer?: string

	/** Completed analyzers */
	completedAnalyzers: string[]

	/** Failed analyzers */
	failedAnalyzers: string[]

	/** Cancelled analyzers */
	cancelledAnalyzers: string[]

	/** Total analyzers to execute */
	totalAnalyzers: number

	/** Session progress percentage (0-100) */
	progress: number

	/** Current operation */
	currentOperation?: string

	/** Estimated time remaining in milliseconds */
	estimatedTimeRemaining?: number

	/** Session errors */
	errors: SessionError[]

	/** Session warnings */
	warnings: SessionWarning[]

	/** Last update time */
	lastUpdated: Date
}

/**
 * Session error
 */
export interface SessionError {
	/** Error ID */
	id: string

	/** Error code */
	code: string

	/** Error message */
	message: string

	/** Error details */
	details?: string

	/** Error source */
	source: string

	/** Error stack trace */
	stack?: string

	/** Error timestamp */
	timestamp: Date

	/** Error severity */
	severity: "low" | "medium" | "high" | "critical"

	/** Related analyzer */
	analyzerId?: string
}

/**
 * Session warning
 */
export interface SessionWarning {
	/** Warning ID */
	id: string

	/** Warning code */
	code: string

	/** Warning message */
	message: string

	/** Warning details */
	details?: string

	/** Warning source */
	source: string

	/** Warning timestamp */
	timestamp: Date

	/** Warning severity */
	severity: "info" | "low" | "medium" | "high"

	/** Related analyzer */
	analyzerId?: string
}

/**
 * Session checkpoint
 */
export interface SessionCheckpoint {
	/** Checkpoint ID */
	id: string

	/** Checkpoint timestamp */
	timestamp: Date

	/** Session state at checkpoint */
	state: SessionState

	/** Completed results at checkpoint */
	results: Map<string, AnalysisResult>

	/** Checkpoint metadata */
	metadata: Record<string, any>
}

/**
 * Session recovery information
 */
export interface SessionRecoveryInfo {
	/** Session ID */
	sessionId: string

	/** Recovery timestamp */
	timestamp: Date

	/** Last checkpoint */
	lastCheckpoint: SessionCheckpoint

	/** Recovery strategy */
	strategy: "restart" | "resume" | "skip-failed"

	/** Recovery metadata */
	metadata: Record<string, any>
}

/**
 * Session events
 */
export interface SessionEvents {
	/** Session status changed */
	"status-changed": (status: SessionStatus, previousStatus: SessionStatus) => void

	/** Session started */
	started: (session: AnalysisSession) => void

	/** Session paused */
	paused: (session: AnalysisSession) => void

	/** Session resumed */
	resumed: (session: AnalysisSession) => void

	/** Session completed */
	completed: (session: AnalysisSession, results: Map<string, AnalysisResult>) => void

	/** Session failed */
	failed: (session: AnalysisSession, error: SessionError) => void

	/** Session cancelled */
	cancelled: (session: AnalysisSession, reason?: string) => void

	/** Session progress updated */
	"progress-updated": (progress: SessionProgress) => void

	/** Analyzer started */
	"analyzer-started": (analyzerId: string, context: AnalysisContext) => void

	/** Analyzer completed */
	"analyzer-completed": (analyzerId: string, result: AnalysisResult) => void

	/** Analyzer failed */
	"analyzer-failed": (analyzerId: string, error: SessionError) => void

	/** Analyzer progress updated */
	"analyzer-progress": (analyzerId: string, progress: AnalyzerProgress) => void

	/** Session checkpoint created */
	"checkpoint-created": (checkpoint: SessionCheckpoint) => void

	/** Session error occurred */
	error: (error: SessionError) => void

	/** Session warning occurred */
	warning: (warning: SessionWarning) => void
}

/**
 * Session progress information
 */
export interface SessionProgress {
	/** Session ID */
	sessionId: string

	/** Overall progress percentage (0-100) */
	percentage: number

	/** Current analyzer */
	currentAnalyzer?: string

	/** Current operation */
	currentOperation?: string

	/** Progress message */
	message?: string

	/** Completed analyzers count */
	completedAnalyzers: number

	/** Total analyzers count */
	totalAnalyzers: number

	/** Estimated time remaining in milliseconds */
	estimatedTimeRemaining?: number

	/** Elapsed time in milliseconds */
	elapsedTime: number

	/** Analyzer progress details */
	analyzerProgress?: Map<string, AnalyzerProgress>
}

/**
 * Analysis session interface
 */
export interface AnalysisSession extends EventEmitter {
	/** Session metadata */
	readonly metadata: SessionMetadata

	/** Session configuration */
	readonly config: SessionConfig

	/** Session state */
	readonly state: SessionState

	/** Analysis context */
	readonly context: AnalysisContext

	/** Session results */
	readonly results: Map<string, AnalysisResult>

	/** Cancellation token */
	readonly cancellationToken: CancellationToken

	/** Initialize the session */
	initialize(): Promise<void>

	/** Start the session */
	start(): Promise<void>

	/** Pause the session */
	pause(): Promise<void>

	/** Resume the session */
	resume(): Promise<void>

	/** Cancel the session */
	cancel(reason?: string): Promise<void>

	/** Add analyzer to session */
	addAnalyzer(analyzerId: string): void

	/** Remove analyzer from session */
	removeAnalyzer(analyzerId: string): void

	/** Get session progress */
	getProgress(): SessionProgress

	/** Get analyzer result */
	getResult(analyzerId: string): AnalysisResult | undefined

	/** Get all results */
	getAllResults(): Map<string, AnalysisResult>

	/** Create checkpoint */
	createCheckpoint(): Promise<SessionCheckpoint>

	/** Restore from checkpoint */
	restoreFromCheckpoint(checkpoint: SessionCheckpoint): Promise<void>

	/** Get session statistics */
	getStatistics(): SessionStatistics

	/** Dispose the session */
	dispose(): Promise<void>
}

/**
 * Session statistics
 */
export interface SessionStatistics {
	/** Session ID */
	sessionId: string

	/** Total execution time in milliseconds */
	totalExecutionTime: number

	/** Average analyzer execution time */
	averageAnalyzerTime: number

	/** Total analyzers executed */
	totalAnalyzers: number

	/** Successful analyzers */
	successfulAnalyzers: number

	/** Failed analyzers */
	failedAnalyzers: number

	/** Cancelled analyzers */
	cancelledAnalyzers: number

	/** Memory usage statistics */
	memoryUsage: {
		peak: number
		average: number
		current: number
	}

	/** Cache statistics */
	cacheStatistics: {
		hits: number
		misses: number
		hitRate: number
	}

	/** Error statistics */
	errorStatistics: {
		total: number
		byType: Map<string, number>
		bySeverity: Map<string, number>
	}

	/** Custom statistics */
	custom?: Record<string, number>
}

/**
 * Session manager interface
 */
export interface ISessionManager {
	/** Create a new session */
	create(context: AnalysisContext, config: SessionConfig): Promise<AnalysisSession>

	/** Get session by ID */
	get(sessionId: string): AnalysisSession | undefined

	/** List all sessions */
	list(): AnalysisSession[]

	/** List active sessions */
	listActive(): AnalysisSession[]

	/** Start session */
	start(sessionId: string): Promise<void>

	/** Pause session */
	pause(sessionId: string): Promise<void>

	/** Resume session */
	resume(sessionId: string): Promise<void>

	/** Cancel session */
	cancel(sessionId: string, reason?: string): Promise<void>

	/** Remove session */
	remove(sessionId: string): Promise<void>

	/** Clear completed sessions */
	clearCompleted(): Promise<void>

	/** Get session statistics */
	getStatistics(sessionId: string): SessionStatistics | undefined

	/** Get manager statistics */
	getManagerStatistics(): SessionManagerStatistics
}

/**
 * Session manager statistics
 */
export interface SessionManagerStatistics {
	/** Total sessions created */
	totalSessions: number

	/** Active sessions count */
	activeSessions: number

	/** Completed sessions count */
	completedSessions: number

	/** Failed sessions count */
	failedSessions: number

	/** Cancelled sessions count */
	cancelledSessions: number

	/** Average session duration */
	averageSessionDuration: number

	/** Total execution time */
	totalExecutionTime: number

	/** Memory usage */
	memoryUsage: {
		current: number
		peak: number
	}
}
