/**
 * Database Connection Pool
 *
 * This module provides a connection pool implementation for managing
 * database connections efficiently with support for connection reuse,
 * health monitoring, and automatic cleanup.
 */

import { EventEmitter } from "events"
import { DatabaseConfig, IDatabaseConnection, ConnectionStatus, PoolConfig } from "../../types/database"
import { IDatabaseDriver } from "../drivers/IDriver"

/**
 * Pool connection wrapper
 */
interface PoolConnection {
	/** Unique connection ID */
	id: string

	/** Actual database connection */
	connection: IDatabaseConnection

	/** Connection creation timestamp */
	createdAt: Date

	/** Last used timestamp */
	lastUsed: Date

	/** Number of times connection has been used */
	useCount: number

	/** Whether connection is currently in use */
	inUse: boolean

	/** Connection health status */
	isHealthy: boolean

	/** Last health check timestamp */
	lastHealthCheck: Date

	/** Connection tags for categorization */
	tags: Set<string>
}

/**
 * Pool statistics
 */
export interface PoolStatistics {
	/** Total connections in pool */
	totalConnections: number

	/** Active (in-use) connections */
	activeConnections: number

	/** Idle connections */
	idleConnections: number

	/** Unhealthy connections */
	unhealthyConnections: number

	/** Total connections created */
	totalCreated: number

	/** Total connections destroyed */
	totalDestroyed: number

	/** Total connection requests */
	totalRequests: number

	/** Failed connection requests */
	failedRequests: number

	/** Average connection age */
	averageAge: number

	/** Average connection usage */
	averageUsage: number

	/** Pool creation time */
	createdAt: Date

	/** Last activity timestamp */
	lastActivity: Date
}

/**
 * Pool events
 */
interface PoolEvents {
	/** Connection created */
	"connection-created": (connectionId: string) => void

	/** Connection acquired */
	"connection-acquired": (connectionId: string) => void

	/** Connection released */
	"connection-released": (connectionId: string) => void

	/** Connection destroyed */
	"connection-destroyed": (connectionId: string, reason: string) => void

	/** Connection health check failed */
	"connection-unhealthy": (connectionId: string, error: Error) => void

	/** Pool size changed */
	"pool-size-changed": (newSize: number, oldSize: number) => void

	/** Pool error */
	error: (error: Error, operation: string) => void

	/** Pool warning */
	warning: (message: string) => void
}

/**
 * Connection pool interface
 */
export interface IConnectionPool extends EventEmitter {
	/** Pool configuration */
	readonly config: PoolConfig

	/** Initialize the pool */
	initialize(): Promise<void>

	/** Acquire a connection from the pool */
	acquire(timeout?: number): Promise<IDatabaseConnection>

	/** Release a connection back to the pool */
	release(connection: IDatabaseConnection): Promise<void>

	/** Destroy a connection */
	destroy(connection: IDatabaseConnection, reason?: string): Promise<void>

	/** Check connection health */
	checkHealth(connection: IDatabaseConnection): Promise<boolean>

	/** Perform health check on all connections */
	performHealthCheck(): Promise<void>

	/** Clean up expired connections */
	cleanup(): Promise<void>

	/** Resize the pool */
	resize(newSize: number): Promise<void>

	/** Drain the pool (close all connections) */
	drain(): Promise<void>

	/** Get pool statistics */
	getStatistics(): PoolStatistics

	/** Check if pool is healthy */
	isHealthy(): boolean

	/** Dispose the pool */
	dispose(): Promise<void>
}

/**
 * Connection pool implementation
 */
export class ConnectionPool extends EventEmitter implements IConnectionPool {
	private readonly _driver: IDatabaseDriver
	private readonly _dbConfig: DatabaseConfig
	private readonly _connections = new Map<string, PoolConnection>()
	private readonly _waitingQueue: Array<{
		resolve: (connection: IDatabaseConnection) => void
		reject: (error: Error) => void
		timeout: NodeJS.Timeout
	}> = []

	private _initialized = false
	private _draining = false
	private _disposed = false
	private _connectionCounter = 0
	private _createdAt = new Date()
	private _lastActivity = new Date()

	// Statistics
	private _totalCreated = 0
	private _totalDestroyed = 0
	private _totalRequests = 0
	private _failedRequests = 0

	// Timers
	private _healthCheckTimer?: NodeJS.Timeout
	private _cleanupTimer?: NodeJS.Timeout

	constructor(
		public readonly config: PoolConfig,
		driver: IDatabaseDriver,
		dbConfig: DatabaseConfig,
	) {
		super()
		this._driver = driver
		this._dbConfig = { ...dbConfig }

		// Validate configuration
		this.validateConfig()
	}

	/**
	 * Initialize the connection pool
	 */
	async initialize(): Promise<void> {
		if (this._initialized) {
			throw new Error("Connection pool is already initialized")
		}

		try {
			// Create minimum connections
			const createPromises: Promise<void>[] = []
			for (let i = 0; i < this.config.min; i++) {
				createPromises.push(this.createConnection())
			}

			await Promise.all(createPromises)

			// Start background tasks
			this.startHealthCheckTimer()
			this.startCleanupTimer()

			this._initialized = true
			this._lastActivity = new Date()
		} catch (error) {
			this.emit("error", error as Error, "initialize")
			throw error
		}
	}

	/**
	 * Acquire a connection from the pool
	 */
	async acquire(timeout: number = this.config.acquireTimeoutMillis): Promise<IDatabaseConnection> {
		if (this._disposed) {
			throw new Error("Connection pool has been disposed")
		}

		if (this._draining) {
			throw new Error("Connection pool is draining")
		}

		this._totalRequests++
		this._lastActivity = new Date()

		try {
			// Try to get an available connection
			const availableConnection = this.getAvailableConnection()
			if (availableConnection) {
				this.markConnectionInUse(availableConnection)
				this.emit("connection-acquired", availableConnection.id)
				return availableConnection.connection
			}

			// Try to create a new connection if under max limit
			if (this._connections.size < this.config.max) {
				const newConnection = await this.createConnection()
				this.markConnectionInUse(newConnection)
				this.emit("connection-acquired", newConnection.id)
				return newConnection.connection
			}

			// Wait for a connection to become available
			return await this.waitForConnection(timeout)
		} catch (error) {
			this._failedRequests++
			this.emit("error", error as Error, "acquire")
			throw error
		}
	}

	/**
	 * Release a connection back to the pool
	 */
	async release(connection: IDatabaseConnection): Promise<void> {
		const poolConnection = this.findPoolConnection(connection)
		if (!poolConnection) {
			throw new Error("Connection not found in pool")
		}

		try {
			// Mark connection as available
			poolConnection.inUse = false
			poolConnection.lastUsed = new Date()
			poolConnection.useCount++
			this._lastActivity = new Date()

			// Process waiting queue
			this.processWaitingQueue()

			this.emit("connection-released", poolConnection.id)
		} catch (error) {
			this.emit("error", error as Error, "release")
			throw error
		}
	}

	/**
	 * Destroy a connection
	 */
	async destroy(connection: IDatabaseConnection, reason: string = "manual"): Promise<void> {
		const poolConnection = this.findPoolConnection(connection)
		if (!poolConnection) {
			return // Connection not in pool
		}

		try {
			// Close the actual connection
			await this._driver.closeConnection(connection)

			// Remove from pool
			this._connections.delete(poolConnection.id)
			this._totalDestroyed++
			this._lastActivity = new Date()

			this.emit("connection-destroyed", poolConnection.id, reason)
			this.emit("pool-size-changed", this._connections.size, this._connections.size + 1)
		} catch (error) {
			this.emit("error", error as Error, "destroy")
			throw error
		}
	}

	/**
	 * Check connection health
	 */
	async checkHealth(connection: IDatabaseConnection): Promise<boolean> {
		const poolConnection = this.findPoolConnection(connection)
		if (!poolConnection) {
			return false
		}

		try {
			// Simple health check - try to execute a basic query
			const result = await this._driver.executeQuery(connection, "SELECT 1", [])
			const isHealthy = result.success && result.rows.length > 0

			poolConnection.isHealthy = isHealthy
			poolConnection.lastHealthCheck = new Date()

			if (!isHealthy) {
				this.emit("connection-unhealthy", poolConnection.id, new Error("Health check failed"))
			}

			return isHealthy
		} catch (error) {
			poolConnection.isHealthy = false
			poolConnection.lastHealthCheck = new Date()
			this.emit("connection-unhealthy", poolConnection.id, error as Error)
			return false
		}
	}

	/**
	 * Perform health check on all connections
	 */
	async performHealthCheck(): Promise<void> {
		const healthCheckPromises: Promise<void>[] = []

		for (const poolConnection of this._connections.values()) {
			if (!poolConnection.inUse) {
				healthCheckPromises.push(
					this.checkHealth(poolConnection.connection)
						.then((isHealthy) => {
							if (!isHealthy) {
								return this.destroy(poolConnection.connection, "health-check-failed")
							}
						})
						.catch((error) => {
							this.emit("error", error, "health-check")
						}),
				)
			}
		}

		await Promise.all(healthCheckPromises)
	}

	/**
	 * Clean up expired connections
	 */
	async cleanup(): Promise<void> {
		const now = new Date()
		const expiredConnections: PoolConnection[] = []

		for (const poolConnection of this._connections.values()) {
			if (poolConnection.inUse) continue

			const age = now.getTime() - poolConnection.lastUsed.getTime()
			const isExpired = age > this.config.idleTimeoutMillis
			const isOverMin = this._connections.size > this.config.min

			if (isExpired && isOverMin) {
				expiredConnections.push(poolConnection)
			}
		}

		// Destroy expired connections
		const destroyPromises = expiredConnections.map((conn) => this.destroy(conn.connection, "expired"))

		await Promise.all(destroyPromises)
	}

	/**
	 * Resize the pool
	 */
	async resize(newSize: number): Promise<void> {
		if (newSize < this.config.min || newSize > this.config.max) {
			throw new Error(`New size ${newSize} is outside allowed range [${this.config.min}, ${this.config.max}]`)
		}

		const currentSize = this._connections.size

		if (newSize > currentSize) {
			// Create additional connections
			const createPromises: Promise<void>[] = []
			for (let i = currentSize; i < newSize; i++) {
				createPromises.push(this.createConnection())
			}
			await Promise.all(createPromises)
		} else if (newSize < currentSize) {
			// Remove excess connections
			const connectionsToRemove = Array.from(this._connections.values())
				.filter((conn) => !conn.inUse)
				.slice(0, currentSize - newSize)

			const destroyPromises = connectionsToRemove.map((conn) => this.destroy(conn.connection, "resize"))
			await Promise.all(destroyPromises)
		}

		this.emit("pool-size-changed", this._connections.size, currentSize)
	}

	/**
	 * Drain the pool (close all connections)
	 */
	async drain(): Promise<void> {
		this._draining = true

		try {
			// Reject all waiting requests
			while (this._waitingQueue.length > 0) {
				const waiter = this._waitingQueue.shift()!
				clearTimeout(waiter.timeout)
				waiter.reject(new Error("Pool is draining"))
			}

			// Wait for active connections to be released or timeout
			const drainTimeout = 30000 // 30 seconds
			const startTime = Date.now()

			while (this.getActiveConnectionCount() > 0 && Date.now() - startTime < drainTimeout) {
				await new Promise((resolve) => setTimeout(resolve, 100))
			}

			// Force close all connections
			const destroyPromises = Array.from(this._connections.values()).map((conn) =>
				this.destroy(conn.connection, "drain"),
			)

			await Promise.all(destroyPromises)
		} finally {
			this._draining = false
		}
	}

	/**
	 * Get pool statistics
	 */
	getStatistics(): PoolStatistics {
		const connections = Array.from(this._connections.values())
		const now = new Date()

		const activeConnections = connections.filter((conn) => conn.inUse).length
		const idleConnections = connections.filter((conn) => !conn.inUse).length
		const unhealthyConnections = connections.filter((conn) => !conn.isHealthy).length

		const totalAge = connections.reduce((sum, conn) => sum + (now.getTime() - conn.createdAt.getTime()), 0)
		const averageAge = connections.length > 0 ? totalAge / connections.length : 0

		const totalUsage = connections.reduce((sum, conn) => sum + conn.useCount, 0)
		const averageUsage = connections.length > 0 ? totalUsage / connections.length : 0

		return {
			totalConnections: connections.length,
			activeConnections,
			idleConnections,
			unhealthyConnections,
			totalCreated: this._totalCreated,
			totalDestroyed: this._totalDestroyed,
			totalRequests: this._totalRequests,
			failedRequests: this._failedRequests,
			averageAge,
			averageUsage,
			createdAt: this._createdAt,
			lastActivity: this._lastActivity,
		}
	}

	/**
	 * Check if pool is healthy
	 */
	isHealthy(): boolean {
		const stats = this.getStatistics()
		const healthyConnections = stats.totalConnections - stats.unhealthyConnections
		const healthRatio = stats.totalConnections > 0 ? healthyConnections / stats.totalConnections : 1

		return healthRatio >= 0.8 && stats.totalConnections >= this.config.min
	}

	/**
	 * Dispose the pool
	 */
	async dispose(): Promise<void> {
		if (this._disposed) {
			return
		}

		this._disposed = true

		try {
			// Stop timers
			if (this._healthCheckTimer) {
				clearInterval(this._healthCheckTimer)
			}
			if (this._cleanupTimer) {
				clearInterval(this._cleanupTimer)
			}

			// Drain the pool
			await this.drain()
		} catch (error) {
			this.emit("error", error as Error, "dispose")
			throw error
		}
	}

	/**
	 * Create a new connection
	 */
	private async createConnection(): Promise<PoolConnection> {
		const connectionId = `conn_${++this._connectionCounter}`

		try {
			const connection = await this._driver.createConnection(this._dbConfig)

			const poolConnection: PoolConnection = {
				id: connectionId,
				connection,
				createdAt: new Date(),
				lastUsed: new Date(),
				useCount: 0,
				inUse: false,
				isHealthy: true,
				lastHealthCheck: new Date(),
				tags: new Set(),
			}

			this._connections.set(connectionId, poolConnection)
			this._totalCreated++

			this.emit("connection-created", connectionId)
			this.emit("pool-size-changed", this._connections.size, this._connections.size - 1)

			return poolConnection
		} catch (error) {
			this.emit("error", error as Error, "create-connection")
			throw error
		}
	}

	/**
	 * Get an available connection
	 */
	private getAvailableConnection(): PoolConnection | undefined {
		for (const connection of this._connections.values()) {
			if (!connection.inUse && connection.isHealthy) {
				return connection
			}
		}
		return undefined
	}

	/**
	 * Mark connection as in use
	 */
	private markConnectionInUse(poolConnection: PoolConnection): void {
		poolConnection.inUse = true
		poolConnection.lastUsed = new Date()
	}

	/**
	 * Find pool connection by database connection
	 */
	private findPoolConnection(connection: IDatabaseConnection): PoolConnection | undefined {
		for (const poolConnection of this._connections.values()) {
			if (poolConnection.connection === connection) {
				return poolConnection
			}
		}
		return undefined
	}

	/**
	 * Wait for a connection to become available
	 */
	private async waitForConnection(timeout: number): Promise<IDatabaseConnection> {
		return new Promise<IDatabaseConnection>((resolve, reject) => {
			const timeoutHandle = setTimeout(() => {
				const index = this._waitingQueue.findIndex((w) => w.resolve === resolve)
				if (index >= 0) {
					this._waitingQueue.splice(index, 1)
				}
				reject(new Error(`Connection acquisition timeout after ${timeout}ms`))
			}, timeout)

			this._waitingQueue.push({
				resolve,
				reject,
				timeout: timeoutHandle,
			})
		})
	}

	/**
	 * Process waiting queue
	 */
	private processWaitingQueue(): void {
		while (this._waitingQueue.length > 0) {
			const availableConnection = this.getAvailableConnection()
			if (!availableConnection) {
				break
			}

			const waiter = this._waitingQueue.shift()!
			clearTimeout(waiter.timeout)

			this.markConnectionInUse(availableConnection)
			this.emit("connection-acquired", availableConnection.id)
			waiter.resolve(availableConnection.connection)
		}
	}

	/**
	 * Get active connection count
	 */
	private getActiveConnectionCount(): number {
		return Array.from(this._connections.values()).filter((conn) => conn.inUse).length
	}

	/**
	 * Start health check timer
	 */
	private startHealthCheckTimer(): void {
		if (this.config.testOnIdle) {
			this._healthCheckTimer = setInterval(() => {
				this.performHealthCheck().catch((error) => {
					this.emit("error", error, "health-check-timer")
				})
			}, this.config.timeBetweenEvictionRunsMillis)
		}
	}

	/**
	 * Start cleanup timer
	 */
	private startCleanupTimer(): void {
		this._cleanupTimer = setInterval(() => {
			this.cleanup().catch((error) => {
				this.emit("error", error, "cleanup-timer")
			})
		}, this.config.timeBetweenEvictionRunsMillis)
	}

	/**
	 * Validate pool configuration
	 */
	private validateConfig(): void {
		if (this.config.min < 0) {
			throw new Error("Minimum pool size cannot be negative")
		}

		if (this.config.max < this.config.min) {
			throw new Error("Maximum pool size cannot be less than minimum")
		}

		if (this.config.acquireTimeoutMillis <= 0) {
			throw new Error("Acquire timeout must be positive")
		}

		if (this.config.idleTimeoutMillis <= 0) {
			throw new Error("Idle timeout must be positive")
		}
	}
}
