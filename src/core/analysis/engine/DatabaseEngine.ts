/**
 * Database Engine
 *
 * This module provides a comprehensive database engine framework
 * that supports multiple database drivers, connection pooling,
 * query execution, and database analysis operations.
 */

import { EventEmitter } from "events"
import {
	IDatabaseEngine,
	DatabaseEngineStatistics,
	DatabaseConfig,
	IDatabaseConnection,
	QueryResult,
	QueryMetadata,
	DatabaseSchema,
	TableInfo,
	DatabaseStatistics,
	IDatabaseDriver,
	IDatabaseDriverRegistry,
	IConnectionPool,
	ConnectionFactory,
	DatabaseType,
	ConnectionStatus,
} from "../types/database"
import { EventBus } from "../../events/EventBus"
import { DIContainer } from "../../di/DIContainer"

/**
 * Database engine configuration
 */
export interface DatabaseEngineConfig {
	/** Default database configuration */
	defaultDatabase?: DatabaseConfig

	/** Connection pool settings */
	poolConfig?: {
		minConnections?: number
		maxConnections?: number
		acquireTimeoutMillis?: number
		idleTimeoutMillis?: number
	}

	/** Query execution settings */
	queryConfig?: {
		defaultTimeout?: number
		maxRetries?: number
		retryDelay?: number
	}

	/** Monitoring settings */
	monitoring?: {
		enabled?: boolean
		metricsInterval?: number
		slowQueryThreshold?: number
	}

	/** Cache settings */
	caching?: {
		enabled?: boolean
		schemaCacheTtl?: number
		queryCacheTtl?: number
	}
}

/**
 * Database connection wrapper
 */
interface DatabaseConnectionWrapper {
	/** Connection instance */
	connection: IDatabaseConnection

	/** Connection metadata */
	metadata: {
		id: string
		databaseId: string
		createdAt: Date
		lastUsedAt: Date
		queryCount: number
		isActive: boolean
	}

	/** Connection pool reference */
	pool?: IConnectionPool
}

/**
 * Query execution context
 */
interface QueryExecutionContext {
	/** Query ID */
	id: string

	/** SQL query */
	sql: string

	/** Query parameters */
	parameters?: any[]

	/** Connection ID */
	connectionId: string

	/** Database ID */
	databaseId: string

	/** Execution start time */
	startTime: Date

	/** Query timeout */
	timeout?: number

	/** Retry count */
	retryCount: number
}

/**
 * Database engine implementation
 */
export class DatabaseEngine extends EventEmitter implements IDatabaseEngine {
	private readonly _config: DatabaseEngineConfig
	private readonly _driverRegistry: IDatabaseDriverRegistry
	private readonly _eventBus: EventBus
	private readonly _container: DIContainer

	private _initialized = false
	private _disposed = false

	// Database management
	private readonly _databases = new Map<string, DatabaseConfig>()
	private readonly _connections = new Map<string, DatabaseConnectionWrapper>()
	private readonly _connectionPools = new Map<string, IConnectionPool>()
	private _connectionCounter = 0
	private _queryCounter = 0

	// Schema cache
	private readonly _schemaCache = new Map<string, { schema: DatabaseSchema; cachedAt: Date }>()

	// Statistics
	private _statistics: DatabaseEngineStatistics = {
		totalDatabases: 0,
		activeConnections: 0,
		totalQueries: 0,
		successfulQueries: 0,
		failedQueries: 0,
		averageQueryTime: 0,
		totalQueryTime: 0,
		slowQueries: 0,
		connectionPoolHits: 0,
		connectionPoolMisses: 0,
		schemaCacheHits: 0,
		schemaCacheMisses: 0,
		createdAt: new Date(),
	}

	// Monitoring
	private _monitoringTimer?: NodeJS.Timeout

	constructor(config: DatabaseEngineConfig, container: DIContainer) {
		super()
		this._config = { ...config }
		this._container = container
		this._eventBus = container.resolve<EventBus>("eventBus")
		this._driverRegistry = container.resolve<IDatabaseDriverRegistry>("databaseDriverRegistry")

		this.setupEventHandlers()
	}

	/**
	 * Get engine configuration
	 */
	get config(): DatabaseEngineConfig {
		return { ...this._config }
	}

	/**
	 * Check if engine is initialized
	 */
	get isInitialized(): boolean {
		return this._initialized
	}

	/**
	 * Initialize the database engine
	 */
	async initialize(): Promise<void> {
		if (this._initialized) {
			throw new Error("Database engine is already initialized")
		}

		try {
			// Validate configuration
			this.validateConfiguration()

			// Initialize default database if configured
			if (this._config.defaultDatabase) {
				await this.registerDatabase("default", this._config.defaultDatabase)
			}

			// Start monitoring if enabled
			if (this._config.monitoring?.enabled) {
				this.startMonitoring()
			}

			this._initialized = true
			this._statistics.createdAt = new Date()

			this.emit("initialized")
			this._eventBus.emit("database-engine:initialized")
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Register a database
	 */
	async registerDatabase(id: string, config: DatabaseConfig): Promise<void> {
		if (!this._initialized) {
			throw new Error("Database engine is not initialized")
		}

		try {
			// Validate database configuration
			this.validateDatabaseConfig(config)

			// Get appropriate driver
			const driver = this._driverRegistry.get(config.type)
			if (!driver) {
				throw new Error(`No driver found for database type: ${config.type}`)
			}

			// Test connection
			await this.testDatabaseConnection(config, driver)

			// Create connection pool if configured
			if (this._config.poolConfig) {
				const pool = await this.createConnectionPool(id, config, driver)
				this._connectionPools.set(id, pool)
			}

			this._databases.set(id, config)
			this._statistics.totalDatabases++

			this.emit("database-registered", id, config)
			this._eventBus.emit("database-engine:database-registered", { id, config })
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Unregister a database
	 */
	async unregisterDatabase(id: string): Promise<boolean> {
		const config = this._databases.get(id)
		if (!config) {
			return false
		}

		try {
			// Close all connections for this database
			await this.closeAllConnections(id)

			// Dispose connection pool
			const pool = this._connectionPools.get(id)
			if (pool) {
				await pool.dispose()
				this._connectionPools.delete(id)
			}

			// Clear schema cache
			this.clearSchemaCache(id)

			this._databases.delete(id)
			this._statistics.totalDatabases--

			this.emit("database-unregistered", id)
			this._eventBus.emit("database-engine:database-unregistered", { id })

			return true
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Get database connection
	 */
	async getConnection(databaseId: string): Promise<IDatabaseConnection> {
		if (!this._initialized) {
			throw new Error("Database engine is not initialized")
		}

		const config = this._databases.get(databaseId)
		if (!config) {
			throw new Error(`Database ${databaseId} is not registered`)
		}

		try {
			// Try to get connection from pool first
			const pool = this._connectionPools.get(databaseId)
			if (pool) {
				const connection = await pool.acquire()
				this._statistics.connectionPoolHits++

				// Wrap connection
				const wrapper = this.wrapConnection(connection, databaseId, pool)
				this._connections.set(wrapper.metadata.id, wrapper)

				return wrapper.connection
			}

			// Create new connection
			this._statistics.connectionPoolMisses++
			const driver = this._driverRegistry.get(config.type)
			if (!driver) {
				throw new Error(`No driver found for database type: ${config.type}`)
			}

			const connection = await driver.connect(config)
			const wrapper = this.wrapConnection(connection, databaseId)
			this._connections.set(wrapper.metadata.id, wrapper)

			this._statistics.activeConnections++

			this.emit("connection-created", wrapper.metadata.id, databaseId)
			this._eventBus.emit("database-engine:connection-created", {
				connectionId: wrapper.metadata.id,
				databaseId,
			})

			return wrapper.connection
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Release database connection
	 */
	async releaseConnection(connection: IDatabaseConnection): Promise<void> {
		const wrapper = this.findConnectionWrapper(connection)
		if (!wrapper) {
			return
		}

		try {
			if (wrapper.pool) {
				// Return to pool
				await wrapper.pool.release(connection)
			} else {
				// Close direct connection
				await connection.close()
				this._statistics.activeConnections--
			}

			this._connections.delete(wrapper.metadata.id)

			this.emit("connection-released", wrapper.metadata.id, wrapper.metadata.databaseId)
			this._eventBus.emit("database-engine:connection-released", {
				connectionId: wrapper.metadata.id,
				databaseId: wrapper.metadata.databaseId,
			})
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Execute query
	 */
	async executeQuery(
		databaseId: string,
		sql: string,
		parameters?: any[],
		options?: {
			timeout?: number
			maxRetries?: number
		},
	): Promise<QueryResult> {
		if (!this._initialized) {
			throw new Error("Database engine is not initialized")
		}

		const queryId = `query_${++this._queryCounter}`
		const startTime = Date.now()

		const context: QueryExecutionContext = {
			id: queryId,
			sql,
			parameters,
			connectionId: "",
			databaseId,
			startTime: new Date(),
			timeout: options?.timeout || this._config.queryConfig?.defaultTimeout,
			retryCount: 0,
		}

		try {
			// Get connection
			const connection = await this.getConnection(databaseId)
			const wrapper = this.findConnectionWrapper(connection)
			if (wrapper) {
				context.connectionId = wrapper.metadata.id
				wrapper.metadata.lastUsedAt = new Date()
				wrapper.metadata.queryCount++
			}

			// Execute query with retries
			const maxRetries = options?.maxRetries || this._config.queryConfig?.maxRetries || 0
			let result: QueryResult

			while (context.retryCount <= maxRetries) {
				try {
					result = await this.executeQueryInternal(connection, context)
					break
				} catch (error) {
					context.retryCount++

					if (context.retryCount > maxRetries) {
						throw error
					}

					// Wait before retry
					const retryDelay = this._config.queryConfig?.retryDelay || 1000
					await new Promise((resolve) => setTimeout(resolve, retryDelay))
				}
			}

			// Release connection
			await this.releaseConnection(connection)

			// Update statistics
			const executionTime = Date.now() - startTime
			this._statistics.totalQueries++
			this._statistics.successfulQueries++
			this._statistics.totalQueryTime += executionTime
			this._statistics.averageQueryTime = this._statistics.totalQueryTime / this._statistics.totalQueries

			// Check for slow query
			const slowQueryThreshold = this._config.monitoring?.slowQueryThreshold || 5000
			if (executionTime > slowQueryThreshold) {
				this._statistics.slowQueries++
				this.emit("slow-query", queryId, sql, executionTime)
			}

			this.emit("query-executed", queryId, sql, executionTime)
			this._eventBus.emit("database-engine:query-executed", {
				queryId,
				sql,
				executionTime,
				databaseId,
			})

			return result!
		} catch (error) {
			this._statistics.totalQueries++
			this._statistics.failedQueries++

			this.emit("query-failed", queryId, sql, error)
			this._eventBus.emit("database-engine:query-failed", {
				queryId,
				sql,
				error,
				databaseId,
			})

			throw error
		}
	}

	/**
	 * Get database schema
	 */
	async getSchema(databaseId: string, forceRefresh = false): Promise<DatabaseSchema> {
		if (!this._initialized) {
			throw new Error("Database engine is not initialized")
		}

		// Check cache first
		if (!forceRefresh && this._config.caching?.enabled) {
			const cached = this._schemaCache.get(databaseId)
			if (cached) {
				const ttl = this._config.caching.schemaCacheTtl || 300000 // 5 minutes
				const age = Date.now() - cached.cachedAt.getTime()

				if (age < ttl) {
					this._statistics.schemaCacheHits++
					return cached.schema
				}
			}
		}

		this._statistics.schemaCacheMisses++

		try {
			const connection = await this.getConnection(databaseId)
			const schema = await connection.getSchema()

			await this.releaseConnection(connection)

			// Cache the schema
			if (this._config.caching?.enabled) {
				this._schemaCache.set(databaseId, {
					schema,
					cachedAt: new Date(),
				})
			}

			return schema
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Get database statistics
	 */
	async getDatabaseStatistics(databaseId: string): Promise<DatabaseStatistics> {
		if (!this._initialized) {
			throw new Error("Database engine is not initialized")
		}

		try {
			const connection = await this.getConnection(databaseId)
			const stats = await connection.getStatistics()

			await this.releaseConnection(connection)

			return stats
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Get engine statistics
	 */
	getStatistics(): DatabaseEngineStatistics {
		return { ...this._statistics }
	}

	/**
	 * Dispose the database engine
	 */
	async dispose(): Promise<void> {
		if (this._disposed) {
			return
		}

		try {
			// Stop monitoring
			if (this._monitoringTimer) {
				clearInterval(this._monitoringTimer)
				this._monitoringTimer = undefined
			}

			// Close all connections
			for (const databaseId of this._databases.keys()) {
				await this.closeAllConnections(databaseId)
			}

			// Dispose all connection pools
			for (const pool of this._connectionPools.values()) {
				await pool.dispose()
			}

			// Clear caches
			this._schemaCache.clear()
			this._databases.clear()
			this._connections.clear()
			this._connectionPools.clear()

			this._disposed = true

			this.emit("disposed")
			this._eventBus.emit("database-engine:disposed")
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Execute query internally
	 */
	private async executeQueryInternal(
		connection: IDatabaseConnection,
		context: QueryExecutionContext,
	): Promise<QueryResult> {
		const metadata: QueryMetadata = {
			queryId: context.id,
			sql: context.sql,
			parameters: context.parameters,
			startTime: context.startTime,
			retryCount: context.retryCount,
		}

		if (context.timeout) {
			return await Promise.race([
				connection.execute(context.sql, context.parameters, metadata),
				new Promise<never>((_, reject) => {
					setTimeout(() => {
						reject(new Error(`Query timeout after ${context.timeout}ms`))
					}, context.timeout)
				}),
			])
		} else {
			return await connection.execute(context.sql, context.parameters, metadata)
		}
	}

	/**
	 * Test database connection
	 */
	private async testDatabaseConnection(config: DatabaseConfig, driver: IDatabaseDriver): Promise<void> {
		const connection = await driver.connect(config)

		try {
			// Test with a simple query
			await connection.execute("SELECT 1")
		} finally {
			await connection.close()
		}
	}

	/**
	 * Create connection pool
	 */
	private async createConnectionPool(
		databaseId: string,
		config: DatabaseConfig,
		driver: IDatabaseDriver,
	): Promise<IConnectionPool> {
		const factory: ConnectionFactory = async () => {
			return await driver.connect(config)
		}

		const poolConfig = {
			min: this._config.poolConfig?.minConnections || 2,
			max: this._config.poolConfig?.maxConnections || 10,
			acquireTimeoutMillis: this._config.poolConfig?.acquireTimeoutMillis || 30000,
			idleTimeoutMillis: this._config.poolConfig?.idleTimeoutMillis || 300000,
		}

		// Get connection pool implementation from container
		const ConnectionPoolClass =
			this._container.resolve<new (factory: ConnectionFactory, config: any) => IConnectionPool>("ConnectionPool")
		return new ConnectionPoolClass(factory, poolConfig)
	}

	/**
	 * Wrap connection with metadata
	 */
	private wrapConnection(
		connection: IDatabaseConnection,
		databaseId: string,
		pool?: IConnectionPool,
	): DatabaseConnectionWrapper {
		const connectionId = `conn_${++this._connectionCounter}`

		return {
			connection,
			metadata: {
				id: connectionId,
				databaseId,
				createdAt: new Date(),
				lastUsedAt: new Date(),
				queryCount: 0,
				isActive: true,
			},
			pool,
		}
	}

	/**
	 * Find connection wrapper by connection instance
	 */
	private findConnectionWrapper(connection: IDatabaseConnection): DatabaseConnectionWrapper | undefined {
		for (const wrapper of this._connections.values()) {
			if (wrapper.connection === connection) {
				return wrapper
			}
		}
		return undefined
	}

	/**
	 * Close all connections for a database
	 */
	private async closeAllConnections(databaseId: string): Promise<void> {
		const connectionsToClose: string[] = []

		for (const [id, wrapper] of this._connections) {
			if (wrapper.metadata.databaseId === databaseId) {
				connectionsToClose.push(id)
			}
		}

		for (const connectionId of connectionsToClose) {
			const wrapper = this._connections.get(connectionId)
			if (wrapper) {
				try {
					if (!wrapper.pool) {
						await wrapper.connection.close()
						this._statistics.activeConnections--
					}
					this._connections.delete(connectionId)
				} catch (error) {
					this.emit("error", error)
				}
			}
		}
	}

	/**
	 * Clear schema cache for a database
	 */
	private clearSchemaCache(databaseId: string): void {
		this._schemaCache.delete(databaseId)
	}

	/**
	 * Validate configuration
	 */
	private validateConfiguration(): void {
		if (this._config.poolConfig) {
			const { minConnections, maxConnections } = this._config.poolConfig
			if (minConnections && maxConnections && minConnections > maxConnections) {
				throw new Error("minConnections cannot be greater than maxConnections")
			}
		}

		if (this._config.queryConfig) {
			const { defaultTimeout, maxRetries } = this._config.queryConfig
			if (defaultTimeout && defaultTimeout < 1000) {
				throw new Error("defaultTimeout must be at least 1000ms")
			}
			if (maxRetries && maxRetries < 0) {
				throw new Error("maxRetries cannot be negative")
			}
		}
	}

	/**
	 * Validate database configuration
	 */
	private validateDatabaseConfig(config: DatabaseConfig): void {
		if (!config.host || !config.port || !config.database) {
			throw new Error("Database configuration must include host, port, and database")
		}

		if (!Object.values(DatabaseType).includes(config.type)) {
			throw new Error(`Unsupported database type: ${config.type}`)
		}
	}

	/**
	 * Set up event handlers
	 */
	private setupEventHandlers(): void {
		// Handle driver registry events
		this._driverRegistry.on("driver-registered", (driverId) => {
			this.emit("driver-available", driverId)
		})

		this._driverRegistry.on("driver-unregistered", (driverId) => {
			this.emit("driver-unavailable", driverId)
		})
	}

	/**
	 * Start monitoring
	 */
	private startMonitoring(): void {
		const interval = this._config.monitoring?.metricsInterval || 60000 // 1 minute

		this._monitoringTimer = setInterval(() => {
			this.collectMetrics()
		}, interval)
	}

	/**
	 * Collect performance metrics
	 */
	private collectMetrics(): void {
		// Update active connections count
		this._statistics.activeConnections = Array.from(this._connections.values()).filter(
			(wrapper) => wrapper.metadata.isActive,
		).length

		// Emit metrics event
		this.emit("metrics-collected", this._statistics)
		this._eventBus.emit("database-engine:metrics", { statistics: this._statistics })
	}
}
