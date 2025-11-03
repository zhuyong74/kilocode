/**
 * Event System Type Definitions
 *
 * Defines all types and interfaces for the event-driven architecture
 * used in the Kilocode Analysis Engine.
 *
 * @author Kilocode Analysis Team
 * @version 1.0.0
 */

/**
 * Event priority levels for subscription ordering
 */
export enum EventPriority {
	CRITICAL = 1000,
	HIGH = 800,
	NORMAL = 500,
	LOW = 200,
	BACKGROUND = 100,
}

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (data: T, metadata: EventMetadata) => void | Promise<void>

/**
 * Event subscription information
 */
export interface EventSubscription {
	/** Unique subscription identifier */
	id: string

	/** Name of the event being subscribed to */
	eventName: string

	/** Event handler function */
	handler: EventHandler<any>

	/** Priority level for this subscription */
	priority: EventPriority

	/** When this subscription was created */
	createdAt: Date

	/** Optional subscription metadata */
	metadata?: Record<string, any>
}

/**
 * Event metadata attached to each event
 */
export interface EventMetadata {
	/** Name of the event */
	eventName: string

	/** When the event was published */
	timestamp: Date

	/** Whether this event was published asynchronously */
	async: boolean

	/** Optional source identifier */
	source?: string

	/** Optional correlation ID for tracking related events */
	correlationId?: string

	/** Optional additional metadata */
	metadata?: Record<string, any>
}

/**
 * Configuration for EventBus
 */
export interface EventBusConfig {
	/** Maximum number of listeners per event (default: 100) */
	maxListeners?: number

	/** Whether to maintain event history (default: true) */
	enableHistory?: boolean

	/** Maximum number of events to keep in history (default: 1000) */
	historySize?: number

	/** Whether to enable debug logging (default: false) */
	debug?: boolean
}

/**
 * Main EventBus interface
 */
export interface IEventBus {
	/**
	 * Subscribe to an event
	 */
	subscribe<T = any>(eventName: string, handler: EventHandler<T>, priority?: EventPriority): EventSubscription

	/**
	 * Unsubscribe from an event
	 */
	unsubscribe(subscription: EventSubscription): boolean

	/**
	 * Publish an event synchronously
	 */
	publish<T = any>(eventName: string, data: T, metadata?: Partial<EventMetadata>): void

	/**
	 * Publish an event asynchronously
	 */
	publishAsync<T = any>(eventName: string, data: T, metadata?: Partial<EventMetadata>): Promise<void>

	/**
	 * Get all subscriptions for an event
	 */
	getSubscriptions(eventName: string): EventSubscription[]

	/**
	 * Get event history
	 */
	getEventHistory(): EventMetadata[]

	/**
	 * Clear event history
	 */
	clearHistory(): void

	/**
	 * Get all registered event names
	 */
	getEventNames(): string[]

	/**
	 * Check if there are subscriptions for an event
	 */
	hasSubscriptions(eventName: string): boolean

	/**
	 * Remove all subscriptions for an event
	 */
	removeAllSubscriptions(eventName: string): boolean

	/**
	 * Dispose of the event bus
	 */
	dispose(): void
}

/**
 * Standard event names used throughout the analysis system
 */
export const AnalysisEvents = {
	// Analysis lifecycle events
	ANALYSIS_STARTED: "analysis.started",
	ANALYSIS_COMPLETED: "analysis.completed",
	ANALYSIS_FAILED: "analysis.failed",
	ANALYSIS_PROGRESS: "analysis.progress",

	// Project events
	PROJECT_LOADED: "project.loaded",
	PROJECT_CHANGED: "project.changed",
	PROJECT_CLOSED: "project.closed",

	// File events
	FILE_ANALYZED: "file.analyzed",
	FILE_CHANGED: "file.changed",
	FILE_ADDED: "file.added",
	FILE_REMOVED: "file.removed",

	// Dependency events
	DEPENDENCY_FOUND: "dependency.found",
	DEPENDENCY_UPDATED: "dependency.updated",
	DEPENDENCY_CONFLICT: "dependency.conflict",

	// Quality events
	QUALITY_ISSUE_FOUND: "quality.issue.found",
	QUALITY_SCORE_UPDATED: "quality.score.updated",

	// Database events
	DATABASE_CONNECTED: "database.connected",
	DATABASE_ANALYZED: "database.analyzed",
	DATABASE_SCHEMA_CHANGED: "database.schema.changed",

	// Configuration events
	CONFIG_LOADED: "config.loaded",
	CONFIG_CHANGED: "config.changed",
	CONFIG_VALIDATED: "config.validated",

	// Error events
	ERROR_OCCURRED: "error.occurred",
	WARNING_ISSUED: "warning.issued",

	// System events
	SYSTEM_READY: "system.ready",
	SYSTEM_SHUTDOWN: "system.shutdown",
} as const

/**
 * Type for analysis event names
 */
export type AnalysisEventName = (typeof AnalysisEvents)[keyof typeof AnalysisEvents]

/**
 * Event data types for specific events
 */
export interface AnalysisStartedData {
	projectPath: string
	analysisType: string[]
	timestamp: Date
}

export interface AnalysisCompletedData {
	projectPath: string
	analysisType: string[]
	duration: number
	results: any
}

export interface AnalysisFailedData {
	projectPath: string
	analysisType: string[]
	error: Error
	duration: number
}

export interface AnalysisProgressData {
	projectPath: string
	analysisType: string
	progress: number // 0-100
	currentStep: string
	totalSteps: number
	currentStepIndex: number
}

export interface ProjectLoadedData {
	projectPath: string
	projectType: string
	metadata: Record<string, any>
}

export interface FileAnalyzedData {
	filePath: string
	fileType: string
	analysisResults: any
	duration: number
}

export interface DependencyFoundData {
	projectPath: string
	dependency: {
		name: string
		version: string
		type: "direct" | "transitive"
		source: string
	}
}

export interface QualityIssueFoundData {
	filePath: string
	issue: {
		type: string
		severity: "error" | "warning" | "info"
		message: string
		line?: number
		column?: number
	}
}

export interface DatabaseAnalyzedData {
	connectionId: string
	databaseType: string
	schema: any
	analysisResults: any
	duration: number
}

/**
 * Event data type mapping
 */
export interface EventDataMap {
	[AnalysisEvents.ANALYSIS_STARTED]: AnalysisStartedData
	[AnalysisEvents.ANALYSIS_COMPLETED]: AnalysisCompletedData
	[AnalysisEvents.ANALYSIS_FAILED]: AnalysisFailedData
	[AnalysisEvents.ANALYSIS_PROGRESS]: AnalysisProgressData
	[AnalysisEvents.PROJECT_LOADED]: ProjectLoadedData
	[AnalysisEvents.FILE_ANALYZED]: FileAnalyzedData
	[AnalysisEvents.DEPENDENCY_FOUND]: DependencyFoundData
	[AnalysisEvents.QUALITY_ISSUE_FOUND]: QualityIssueFoundData
	[AnalysisEvents.DATABASE_ANALYZED]: DatabaseAnalyzedData
}

/**
 * Typed event handler for specific events
 */
export type TypedEventHandler<K extends keyof EventDataMap> = EventHandler<EventDataMap[K]>

/**
 * Error event data
 */
export interface ErrorEventData {
	error: Error
	context?: string
	metadata?: Record<string, any>
}
