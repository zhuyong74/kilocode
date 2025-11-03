/**
 * Analysis Session
 *
 * This module provides session management for analysis operations,
 * supporting concurrent analysis, progress tracking, state management,
 * and session recovery.
 */

import { EventEmitter } from "events"
import {
	AnalysisSession,
	SessionConfig,
	SessionMetadata,
	SessionState,
	SessionStatus,
	SessionPriority,
	SessionExecutionMode,
	SessionError,
	SessionWarning,
	SessionCheckpoint,
	SessionRecoveryInfo,
	SessionEvents,
	SessionProgress,
	SessionStatistics,
	ISessionManager,
	SessionManagerStatistics,
} from "../types/session"
import { AnalysisContext, AnalysisResult, AnalysisProgress, CancellationToken } from "../types/engine"
import { IAnalyzer } from "../analyzers/base/IAnalyzer"
import { EventBus } from "../../events/EventBus"
import { DIContainer } from "../../di/DIContainer"

/**
 * Internal session implementation
 */
class AnalysisSessionImpl extends EventEmitter implements AnalysisSession {
	private readonly _id: string
	private readonly _config: SessionConfig
	private readonly _metadata: SessionMetadata
	private readonly _eventBus: EventBus

	private _state: SessionState
	private _status: SessionStatus = SessionStatus.CREATED
	private _disposed = false

	// Analysis management
	private readonly _analyses = new Map<string, AnalysisExecution>()
	private _analysisCounter = 0

	// Progress tracking
	private _progress: SessionProgress = {
		sessionId: "",
		totalAnalyses: 0,
		completedAnalyses: 0,
		failedAnalyses: 0,
		progress: 0,
		currentAnalysis: null,
		startTime: new Date(),
		estimatedTimeRemaining: 0,
	}

	// Checkpoints for recovery
	private readonly _checkpoints: SessionCheckpoint[] = []
	private _lastCheckpointTime = new Date()

	constructor(id: string, config: SessionConfig, metadata: SessionMetadata, eventBus: EventBus) {
		super()
		this._id = id
		this._config = { ...config }
		this._metadata = { ...metadata }
		this._eventBus = eventBus

		this._state = {
			status: SessionStatus.CREATED,
			startTime: new Date(),
			analyses: [],
			errors: [],
			warnings: [],
			checkpoints: [],
			metadata: {},
		}

		this._progress.sessionId = id
		this._progress.startTime = this._state.startTime
	}

	/**
	 * Session ID
	 */
	get id(): string {
		return this._id
	}

	/**
	 * Session configuration
	 */
	get config(): SessionConfig {
		return { ...this._config }
	}

	/**
	 * Session metadata
	 */
	get metadata(): SessionMetadata {
		return { ...this._metadata }
	}

	/**
	 * Session state
	 */
	get state(): SessionState {
		return { ...this._state }
	}

	/**
	 * Session status
	 */
	get status(): SessionStatus {
		return this._status
	}

	/**
	 * Start the session
	 */
	async start(): Promise<void> {
		if (this._status !== SessionStatus.CREATED) {
			throw new Error(`Cannot start session in status: ${this._status}`)
		}

		try {
			this._status = SessionStatus.RUNNING
			this._state.status = SessionStatus.RUNNING
			this._state.startTime = new Date()
			this._progress.startTime = this._state.startTime

			// Create initial checkpoint
			await this.createCheckpoint("Session started")

			this.emit("started")
			this._eventBus.emit("session:started", { sessionId: this._id })
		} catch (error) {
			this._status = SessionStatus.ERROR
			this._state.status = SessionStatus.ERROR
			this.addError("SESSION_START_FAILED", "Failed to start session", error)
			throw error
		}
	}

	/**
	 * Add analysis to session
	 */
	async addAnalysis(
		context: AnalysisContext,
		analyzer: IAnalyzer,
		options?: {
			priority?: SessionPriority
			onProgress?: (progress: AnalysisProgress) => void
		},
	): Promise<string> {
		if (this._status !== SessionStatus.RUNNING) {
			throw new Error(`Cannot add analysis to session in status: ${this._status}`)
		}

		const analysisId = `${this._id}_analysis_${++this._analysisCounter}`

		const execution: AnalysisExecution = {
			id: analysisId,
			context: { ...context },
			analyzer,
			priority: options?.priority || SessionPriority.NORMAL,
			status: "pending",
			createdAt: new Date(),
			onProgress: options?.onProgress,
		}

		this._analyses.set(analysisId, execution)
		this._state.analyses.push({
			id: analysisId,
			context: execution.context,
			analyzerId: analyzer.metadata.id,
			status: "pending",
			createdAt: execution.createdAt,
		})

		this._progress.totalAnalyses++
		this.updateProgress()

		this.emit("analysis-added", analysisId, context)
		this._eventBus.emit("session:analysis-added", {
			sessionId: this._id,
			analysisId,
			context,
		})

		return analysisId
	}

	/**
	 * Execute analysis
	 */
	async executeAnalysis(analysisId: string): Promise<AnalysisResult> {
		const execution = this._analyses.get(analysisId)
		if (!execution) {
			throw new Error(`Analysis ${analysisId} not found`)
		}

		if (execution.status !== "pending") {
			throw new Error(`Analysis ${analysisId} is not in pending status`)
		}

		try {
			execution.status = "running"
			execution.startedAt = new Date()

			// Update session state
			const stateAnalysis = this._state.analyses.find((a) => a.id === analysisId)
			if (stateAnalysis) {
				stateAnalysis.status = "running"
				stateAnalysis.startedAt = execution.startedAt
			}

			this._progress.currentAnalysis = {
				id: analysisId,
				name: execution.analyzer.metadata.name,
				progress: 0,
			}
			this.updateProgress()

			this.emit("analysis-started", analysisId)
			this._eventBus.emit("session:analysis-started", {
				sessionId: this._id,
				analysisId,
			})

			// Create cancellation token
			const cancellationToken: CancellationToken = {
				isCancelled: false,
				cancel: () => {
					cancellationToken.isCancelled = true
				},
			}
			execution.cancellationToken = cancellationToken

			// Set up progress tracking
			const progressHandler = (progress: AnalysisProgress) => {
				if (this._progress.currentAnalysis) {
					this._progress.currentAnalysis.progress = progress.progress
				}
				this.updateProgress()
				execution.onProgress?.(progress)
			}

			// Execute the analysis
			const result = await execution.analyzer.analyze(execution.context, cancellationToken, progressHandler)

			execution.status = "completed"
			execution.completedAt = new Date()
			execution.result = result

			// Update session state
			if (stateAnalysis) {
				stateAnalysis.status = "completed"
				stateAnalysis.completedAt = execution.completedAt
				stateAnalysis.result = result
			}

			this._progress.completedAnalyses++
			this._progress.currentAnalysis = null
			this.updateProgress()

			// Create checkpoint for completed analysis
			await this.createCheckpoint(`Analysis ${analysisId} completed`)

			this.emit("analysis-completed", analysisId, result)
			this._eventBus.emit("session:analysis-completed", {
				sessionId: this._id,
				analysisId,
				result,
			})

			return result
		} catch (error) {
			execution.status = "failed"
			execution.completedAt = new Date()
			execution.error = error as Error

			// Update session state
			const stateAnalysis = this._state.analyses.find((a) => a.id === analysisId)
			if (stateAnalysis) {
				stateAnalysis.status = "failed"
				stateAnalysis.completedAt = execution.completedAt
				stateAnalysis.error = execution.error
			}

			this._progress.failedAnalyses++
			this._progress.currentAnalysis = null
			this.updateProgress()

			this.addError("ANALYSIS_FAILED", `Analysis ${analysisId} failed`, error)

			this.emit("analysis-failed", analysisId, error)
			this._eventBus.emit("session:analysis-failed", {
				sessionId: this._id,
				analysisId,
				error,
			})

			throw error
		}
	}

	/**
	 * Cancel analysis
	 */
	async cancelAnalysis(analysisId: string): Promise<void> {
		const execution = this._analyses.get(analysisId)
		if (!execution) {
			throw new Error(`Analysis ${analysisId} not found`)
		}

		if (execution.status === "running" && execution.cancellationToken) {
			execution.cancellationToken.cancel()
			execution.status = "cancelled"
			execution.completedAt = new Date()

			// Update session state
			const stateAnalysis = this._state.analyses.find((a) => a.id === analysisId)
			if (stateAnalysis) {
				stateAnalysis.status = "cancelled"
				stateAnalysis.completedAt = execution.completedAt
			}

			this._progress.currentAnalysis = null
			this.updateProgress()

			this.emit("analysis-cancelled", analysisId)
			this._eventBus.emit("session:analysis-cancelled", {
				sessionId: this._id,
				analysisId,
			})
		}
	}

	/**
	 * Pause the session
	 */
	async pause(): Promise<void> {
		if (this._status !== SessionStatus.RUNNING) {
			throw new Error(`Cannot pause session in status: ${this._status}`)
		}

		this._status = SessionStatus.PAUSED
		this._state.status = SessionStatus.PAUSED

		// Cancel all running analyses
		for (const execution of this._analyses.values()) {
			if (execution.status === "running" && execution.cancellationToken) {
				execution.cancellationToken.cancel()
			}
		}

		await this.createCheckpoint("Session paused")

		this.emit("paused")
		this._eventBus.emit("session:paused", { sessionId: this._id })
	}

	/**
	 * Resume the session
	 */
	async resume(): Promise<void> {
		if (this._status !== SessionStatus.PAUSED) {
			throw new Error(`Cannot resume session in status: ${this._status}`)
		}

		this._status = SessionStatus.RUNNING
		this._state.status = SessionStatus.RUNNING

		await this.createCheckpoint("Session resumed")

		this.emit("resumed")
		this._eventBus.emit("session:resumed", { sessionId: this._id })
	}

	/**
	 * Complete the session
	 */
	async complete(): Promise<void> {
		if (this._status !== SessionStatus.RUNNING && this._status !== SessionStatus.PAUSED) {
			throw new Error(`Cannot complete session in status: ${this._status}`)
		}

		this._status = SessionStatus.COMPLETED
		this._state.status = SessionStatus.COMPLETED
		this._state.endTime = new Date()

		await this.createCheckpoint("Session completed")

		this.emit("completed")
		this._eventBus.emit("session:completed", { sessionId: this._id })
	}

	/**
	 * Get session progress
	 */
	getProgress(): SessionProgress {
		return { ...this._progress }
	}

	/**
	 * Get session statistics
	 */
	getStatistics(): SessionStatistics {
		const now = new Date()
		const duration = now.getTime() - this._state.startTime.getTime()

		return {
			sessionId: this._id,
			totalAnalyses: this._progress.totalAnalyses,
			completedAnalyses: this._progress.completedAnalyses,
			failedAnalyses: this._progress.failedAnalyses,
			cancelledAnalyses: this.getCancelledAnalysesCount(),
			totalDuration: duration,
			averageAnalysisTime: this.getAverageAnalysisTime(),
			errorCount: this._state.errors.length,
			warningCount: this._state.warnings.length,
			checkpointCount: this._checkpoints.length,
			createdAt: this._metadata.createdAt,
			startedAt: this._state.startTime,
			completedAt: this._state.endTime,
		}
	}

	/**
	 * Create recovery info
	 */
	createRecoveryInfo(): SessionRecoveryInfo {
		return {
			sessionId: this._id,
			config: this._config,
			metadata: this._metadata,
			state: this._state,
			checkpoints: [...this._checkpoints],
			createdAt: new Date(),
		}
	}

	/**
	 * Dispose the session
	 */
	async dispose(): Promise<void> {
		if (this._disposed) {
			return
		}

		try {
			// Cancel all running analyses
			for (const execution of this._analyses.values()) {
				if (execution.status === "running" && execution.cancellationToken) {
					execution.cancellationToken.cancel()
				}
			}

			this._status = SessionStatus.DISPOSED
			this._state.status = SessionStatus.DISPOSED
			this._disposed = true

			this.emit("disposed")
			this._eventBus.emit("session:disposed", { sessionId: this._id })
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Create checkpoint
	 */
	private async createCheckpoint(description: string): Promise<void> {
		const checkpoint: SessionCheckpoint = {
			id: `checkpoint_${this._checkpoints.length + 1}`,
			sessionId: this._id,
			timestamp: new Date(),
			description,
			state: { ...this._state },
			metadata: {
				analysisCount: this._analyses.size,
				completedCount: this._progress.completedAnalyses,
				failedCount: this._progress.failedAnalyses,
			},
		}

		this._checkpoints.push(checkpoint)
		this._state.checkpoints.push(checkpoint)
		this._lastCheckpointTime = checkpoint.timestamp

		// Limit checkpoint history
		const maxCheckpoints = this._config.maxCheckpoints || 50
		if (this._checkpoints.length > maxCheckpoints) {
			this._checkpoints.splice(0, this._checkpoints.length - maxCheckpoints)
			this._state.checkpoints.splice(0, this._state.checkpoints.length - maxCheckpoints)
		}
	}

	/**
	 * Add error to session
	 */
	private addError(code: string, message: string, details?: any): void {
		const error: SessionError = {
			code,
			message,
			details,
			timestamp: new Date(),
			sessionId: this._id,
		}

		this._state.errors.push(error)

		this.emit("error", error)
		this._eventBus.emit("session:error", { sessionId: this._id, error })
	}

	/**
	 * Update progress
	 */
	private updateProgress(): void {
		const total = this._progress.totalAnalyses
		const completed = this._progress.completedAnalyses + this._progress.failedAnalyses

		this._progress.progress = total > 0 ? (completed / total) * 100 : 0

		// Estimate remaining time
		if (completed > 0 && this._progress.progress < 100) {
			const elapsed = new Date().getTime() - this._progress.startTime.getTime()
			const avgTimePerAnalysis = elapsed / completed
			const remaining = total - completed
			this._progress.estimatedTimeRemaining = remaining * avgTimePerAnalysis
		} else {
			this._progress.estimatedTimeRemaining = 0
		}

		this.emit("progress", this._progress)
		this._eventBus.emit("session:progress", {
			sessionId: this._id,
			progress: this._progress,
		})
	}

	/**
	 * Get cancelled analyses count
	 */
	private getCancelledAnalysesCount(): number {
		return Array.from(this._analyses.values()).filter((execution) => execution.status === "cancelled").length
	}

	/**
	 * Get average analysis time
	 */
	private getAverageAnalysisTime(): number {
		const completedAnalyses = Array.from(this._analyses.values()).filter(
			(execution) => execution.status === "completed" && execution.startedAt && execution.completedAt,
		)

		if (completedAnalyses.length === 0) {
			return 0
		}

		const totalTime = completedAnalyses.reduce((sum, execution) => {
			const duration = execution.completedAt!.getTime() - execution.startedAt!.getTime()
			return sum + duration
		}, 0)

		return totalTime / completedAnalyses.length
	}
}

/**
 * Analysis execution tracking
 */
interface AnalysisExecution {
	id: string
	context: AnalysisContext
	analyzer: IAnalyzer
	priority: SessionPriority
	status: "pending" | "running" | "completed" | "failed" | "cancelled"
	createdAt: Date
	startedAt?: Date
	completedAt?: Date
	result?: AnalysisResult
	error?: Error
	cancellationToken?: CancellationToken
	onProgress?: (progress: AnalysisProgress) => void
}

/**
 * Session manager implementation
 */
export class SessionManager extends EventEmitter implements ISessionManager {
	private readonly _eventBus: EventBus
	private readonly _container: DIContainer

	private readonly _sessions = new Map<string, AnalysisSessionImpl>()
	private _sessionCounter = 0
	private _disposed = false

	// Statistics
	private _statistics: SessionManagerStatistics = {
		totalSessions: 0,
		activeSessions: 0,
		completedSessions: 0,
		failedSessions: 0,
		averageSessionDuration: 0,
		totalSessionTime: 0,
		peakConcurrentSessions: 0,
		createdAt: new Date(),
	}

	constructor(container: DIContainer) {
		super()
		this._container = container
		this._eventBus = container.resolve<EventBus>("eventBus")

		this.setupEventHandlers()
	}

	/**
	 * Create a new analysis session
	 */
	async createSession(config: SessionConfig, metadata?: Partial<SessionMetadata>): Promise<AnalysisSession> {
		if (this._disposed) {
			throw new Error("Session manager is disposed")
		}

		const sessionId = `session_${++this._sessionCounter}`

		const sessionMetadata: SessionMetadata = {
			name: metadata?.name || `Analysis Session ${this._sessionCounter}`,
			description: metadata?.description || "",
			tags: metadata?.tags || [],
			createdBy: metadata?.createdBy || "system",
			createdAt: new Date(),
			...metadata,
		}

		const session = new AnalysisSessionImpl(sessionId, config, sessionMetadata, this._eventBus)

		this._sessions.set(sessionId, session)
		this._statistics.totalSessions++
		this._statistics.activeSessions++

		// Update peak concurrency
		if (this._statistics.activeSessions > this._statistics.peakConcurrentSessions) {
			this._statistics.peakConcurrentSessions = this._statistics.activeSessions
		}

		// Set up session event handlers
		this.setupSessionEventHandlers(session)

		this.emit("session-created", sessionId, session)
		this._eventBus.emit("session-manager:session-created", { sessionId, session })

		return session
	}

	/**
	 * Get session by ID
	 */
	getSession(sessionId: string): AnalysisSession | undefined {
		return this._sessions.get(sessionId)
	}

	/**
	 * List all sessions
	 */
	listSessions(): AnalysisSession[] {
		return Array.from(this._sessions.values())
	}

	/**
	 * Get active sessions
	 */
	getActiveSessions(): AnalysisSession[] {
		return Array.from(this._sessions.values()).filter((session) => session.status === SessionStatus.RUNNING)
	}

	/**
	 * Recover session from recovery info
	 */
	async recoverSession(recoveryInfo: SessionRecoveryInfo): Promise<AnalysisSession> {
		if (this._disposed) {
			throw new Error("Session manager is disposed")
		}

		const session = new AnalysisSessionImpl(
			recoveryInfo.sessionId,
			recoveryInfo.config,
			recoveryInfo.metadata,
			this._eventBus,
		)

		// Restore session state
		;(session as any)._state = { ...recoveryInfo.state }
		;(session as any)._checkpoints.push(...recoveryInfo.checkpoints)

		this._sessions.set(recoveryInfo.sessionId, session)
		this._statistics.activeSessions++

		this.setupSessionEventHandlers(session)

		this.emit("session-recovered", recoveryInfo.sessionId, session)
		this._eventBus.emit("session-manager:session-recovered", {
			sessionId: recoveryInfo.sessionId,
			session,
		})

		return session
	}

	/**
	 * Remove session
	 */
	async removeSession(sessionId: string): Promise<boolean> {
		const session = this._sessions.get(sessionId)
		if (!session) {
			return false
		}

		// Dispose the session
		await session.dispose()

		// Remove from registry
		this._sessions.delete(sessionId)
		this._statistics.activeSessions--

		this.emit("session-removed", sessionId)
		this._eventBus.emit("session-manager:session-removed", { sessionId })

		return true
	}

	/**
	 * Get manager statistics
	 */
	getStatistics(): SessionManagerStatistics {
		return { ...this._statistics }
	}

	/**
	 * Dispose the session manager
	 */
	async dispose(): Promise<void> {
		if (this._disposed) {
			return
		}

		try {
			// Dispose all sessions
			const disposalPromises = Array.from(this._sessions.values()).map((session) => session.dispose())

			await Promise.all(disposalPromises)

			this._sessions.clear()
			this._disposed = true

			this.emit("disposed")
			this._eventBus.emit("session-manager:disposed")
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Set up event handlers
	 */
	private setupEventHandlers(): void {
		// Handle global events if needed
	}

	/**
	 * Set up session event handlers
	 */
	private setupSessionEventHandlers(session: AnalysisSessionImpl): void {
		session.on("completed", () => {
			this._statistics.activeSessions--
			this._statistics.completedSessions++
			this.updateAverageSessionDuration(session)
		})

		session.on("error", () => {
			this._statistics.activeSessions--
			this._statistics.failedSessions++
			this.updateAverageSessionDuration(session)
		})

		session.on("disposed", () => {
			if (session.status === SessionStatus.RUNNING || session.status === SessionStatus.PAUSED) {
				this._statistics.activeSessions--
			}
		})
	}

	/**
	 * Update average session duration
	 */
	private updateAverageSessionDuration(session: AnalysisSessionImpl): void {
		const stats = session.getStatistics()
		this._statistics.totalSessionTime += stats.totalDuration

		const completedSessions = this._statistics.completedSessions + this._statistics.failedSessions
		if (completedSessions > 0) {
			this._statistics.averageSessionDuration = this._statistics.totalSessionTime / completedSessions
		}
	}
}
