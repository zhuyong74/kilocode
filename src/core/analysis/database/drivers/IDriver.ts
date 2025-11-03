/**
 * Database Driver Interface
 *
 * This module defines the interface for database drivers that provide
 * database-specific implementations for connection, query execution,
 * and schema analysis.
 */

import { EventEmitter } from "events"
import {
	DatabaseType,
	DatabaseConfig,
	IDatabaseConnection,
	QueryResult,
	DatabaseSchema,
	DatabaseStatistics,
} from "../../types/database"

/**
 * Driver capabilities
 */
export interface DriverCapabilities {
	/** Supports transactions */
	supportsTransactions: boolean

	/** Supports prepared statements */
	supportsPreparedStatements: boolean

	/** Supports connection pooling */
	supportsConnectionPooling: boolean

	/** Supports SSL connections */
	supportsSSL: boolean

	/** Supports streaming results */
	supportsStreaming: boolean

	/** Supports bulk operations */
	supportsBulkOperations: boolean

	/** Supports schema introspection */
	supportsSchemaIntrospection: boolean

	/** Supports query plan analysis */
	supportsQueryPlanAnalysis: boolean

	/** Supports real-time monitoring */
	supportsRealTimeMonitoring: boolean

	/** Maximum connections supported */
	maxConnections: number

	/** Supported SQL features */
	sqlFeatures: string[]
}

/**
 * Driver metadata
 */
export interface DriverMetadata {
	/** Driver unique identifier */
	id: string

	/** Driver name */
	name: string

	/** Driver version */
	version: string

	/** Database type */
	databaseType: DatabaseType

	/** Driver description */
	description: string

	/** Driver author */
	author: string

	/** Driver capabilities */
	capabilities: DriverCapabilities

	/** Supported database versions */
	supportedVersions: string[]

	/** Driver tags */
	tags: string[]

	/** Driver creation date */
	createdAt: Date

	/** Driver last update */
	updatedAt: Date
}

/**
 * Driver configuration
 */
export interface DriverConfig {
	/** Driver-specific options */
	options: Record<string, any>

	/** Connection timeout in milliseconds */
	connectionTimeout: number

	/** Query timeout in milliseconds */
	queryTimeout: number

	/** Maximum retry attempts */
	maxRetries: number

	/** Retry delay in milliseconds */
	retryDelay: number

	/** Enable debug logging */
	debug: boolean

	/** Custom type mappings */
	typeMappings: Record<string, string>
}

/**
 * Driver validation result
 */
export interface DriverValidationResult {
	/** Whether driver is valid */
	isValid: boolean

	/** Validation errors */
	errors: string[]

	/** Validation warnings */
	warnings: string[]

	/** Validation timestamp */
	validatedAt: Date
}

/**
 * Driver statistics
 */
export interface DriverStatistics {
	/** Total connections created */
	totalConnections: number

	/** Active connections */
	activeConnections: number

	/** Total queries executed */
	totalQueries: number

	/** Failed queries */
	failedQueries: number

	/** Average query time */
	averageQueryTime: number

	/** Total errors */
	totalErrors: number

	/** Driver uptime */
	uptime: number

	/** Last activity timestamp */
	lastActivity: Date
}

/**
 * Driver events
 */
export interface DriverEvents {
	/** Connection created */
	"connection-created": (connection: IDatabaseConnection) => void

	/** Connection closed */
	"connection-closed": (connectionId: string) => void

	/** Query executed */
	"query-executed": (query: string, duration: number) => void

	/** Query failed */
	"query-failed": (query: string, error: Error) => void

	/** Driver error */
	error: (error: Error) => void

	/** Driver warning */
	warning: (message: string) => void

	/** Statistics updated */
	"statistics-updated": (stats: DriverStatistics) => void
}

/**
 * Database driver interface
 */
export interface IDatabaseDriver extends EventEmitter {
	/** Driver metadata */
	readonly metadata: DriverMetadata

	/** Driver configuration */
	readonly config: DriverConfig

	/** Driver capabilities */
	readonly capabilities: DriverCapabilities

	/** Initialize the driver */
	initialize(config: DriverConfig): Promise<void>

	/** Validate driver configuration */
	validate(config: DatabaseConfig): Promise<DriverValidationResult>

	/** Test connection to database */
	testConnection(config: DatabaseConfig): Promise<boolean>

	/** Create a new database connection */
	createConnection(config: DatabaseConfig): Promise<IDatabaseConnection>

	/** Close a database connection */
	closeConnection(connection: IDatabaseConnection): Promise<void>

	/** Execute a query */
	executeQuery(connection: IDatabaseConnection, query: string, params?: any[]): Promise<QueryResult>

	/** Execute multiple queries in a transaction */
	executeTransaction(connection: IDatabaseConnection, queries: string[]): Promise<QueryResult[]>

	/** Get database schema information */
	getSchema(connection: IDatabaseConnection, schemaName?: string): Promise<DatabaseSchema>

	/** Get database statistics */
	getStatistics(connection: IDatabaseConnection): Promise<DatabaseStatistics>

	/** Get driver statistics */
	getDriverStatistics(): DriverStatistics

	/** Check if driver supports a feature */
	supportsFeature(feature: string): boolean

	/** Get supported SQL dialects */
	getSupportedDialects(): string[]

	/** Parse connection string */
	parseConnectionString(connectionString: string): DatabaseConfig

	/** Build connection string */
	buildConnectionString(config: DatabaseConfig): string

	/** Dispose driver resources */
	dispose(): Promise<void>
}

/**
 * Streaming query result interface
 */
export interface IStreamingQueryResult extends AsyncIterable<any> {
	/** Query metadata */
	readonly metadata: QueryResult["metadata"]

	/** Cancel the streaming query */
	cancel(): Promise<void>

	/** Pause the stream */
	pause(): void

	/** Resume the stream */
	resume(): void

	/** Check if stream is paused */
	isPaused(): boolean

	/** Check if stream is cancelled */
	isCancelled(): boolean
}

/**
 * Streaming database driver interface
 */
export interface IStreamingDatabaseDriver extends IDatabaseDriver {
	/** Execute a streaming query */
	executeStreamingQuery(
		connection: IDatabaseConnection,
		query: string,
		params?: any[],
	): Promise<IStreamingQueryResult>

	/** Check if streaming is supported */
	supportsStreaming(): boolean
}

/**
 * Bulk operations interface
 */
export interface IBulkDatabaseDriver extends IDatabaseDriver {
	/** Execute bulk insert */
	bulkInsert(
		connection: IDatabaseConnection,
		table: string,
		data: any[],
		options?: BulkInsertOptions,
	): Promise<QueryResult>

	/** Execute bulk update */
	bulkUpdate(
		connection: IDatabaseConnection,
		table: string,
		data: any[],
		options?: BulkUpdateOptions,
	): Promise<QueryResult>

	/** Execute bulk delete */
	bulkDelete(
		connection: IDatabaseConnection,
		table: string,
		conditions: any[],
		options?: BulkDeleteOptions,
	): Promise<QueryResult>
}

/**
 * Bulk operation options
 */
export interface BulkInsertOptions {
	/** Batch size for bulk operations */
	batchSize?: number

	/** Ignore duplicate key errors */
	ignoreDuplicates?: boolean

	/** Update on duplicate key */
	updateOnDuplicate?: boolean

	/** Columns to update on duplicate */
	updateColumns?: string[]
}

export interface BulkUpdateOptions {
	/** Batch size for bulk operations */
	batchSize?: number

	/** Where clause for updates */
	whereClause?: string
}

export interface BulkDeleteOptions {
	/** Batch size for bulk operations */
	batchSize?: number

	/** Soft delete instead of hard delete */
	softDelete?: boolean
}

/**
 * Type guards for driver interfaces
 */
export function isStreamingDriver(driver: IDatabaseDriver): driver is IStreamingDatabaseDriver {
	return "executeStreamingQuery" in driver && typeof driver.executeStreamingQuery === "function"
}

export function isBulkDriver(driver: IDatabaseDriver): driver is IBulkDatabaseDriver {
	return "bulkInsert" in driver && typeof driver.bulkInsert === "function"
}
