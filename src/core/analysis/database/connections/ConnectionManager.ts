/**
 * Database Connection Manager
 *
 * This module provides a high-level connection manager that orchestrates
 * multiple connection pools, handles connection routing, and provides
 * unified access to database connections across different databases.
 */

import { EventEmitter } from "events"
import { DatabaseConfig, DatabaseType, IDatabaseConnection, PoolConfig } from "../../types/database"
import { IDatabaseDriver } from "../drivers/IDriver"
import { IDatabaseDriverRegistry } from "../drivers/DriverRegistry"
import { IConnectionPool, ConnectionPool, PoolStatistics } from "./ConnectionPool"

/**
 * Connection pool entry
 */
interface PoolEntry {
	/** Pool instance */
	pool: IConnectionPool

	/** Database configuration */
	config: DatabaseConfig

	/** Driver instance */
	driver: IDatabaseDriver

	/** Pool creation timestamp */
	createdAt: Date

	/** Pool tags for categorization */
	tags: Set<string>

	/** Whether pool is enabled */
	enabled: boolean
}

/**
 * Connection lease
 */
interface ConnectionLease {
	/** Lease ID */
	id: string

	/** Database connection */
	connection: IDatabaseConnection

	/** Source pool ID */
	poolId: string

	/** Lease creation timestamp */
	createdAt: Date

	/** Last activity timestamp */
	lastActivity: Date

	/** Lease tags */
	tags: Set<string>

	/** Auto-release timeout */
	autoReleaseTimeout?: NodeJS.Timeout
}

/**
 * Manager statistics
 */
export interface ManagerStatistics {
	/** Total pools managed */
	totalPools: number

	/** Active pools */
	activePools: number

	/** Total connections across all pools */
	totalConnections: number

	/** Active leases */
	activeLeases: number

	/** Total leases created */
	totalLeases: number

	/** Failed lease requests */
	failedLeases: number

	/** Pools by database type */
	poolsByType: Map<DatabaseType, number>

	/** Manager creation time */
	createdAt: Date

	/** Last activity timestamp */
	lastActivity: Date
}

/**
 * Manager events
 */
interface ManagerEvents {
	/** Pool created */
	"pool-created": (poolId: string, config: DatabaseConfig) => void

	/** Pool destroyed */
	"pool-destroyed": (poolId: string, reason: string) => void

	/** Connection leased */
	"connection-leased": (leaseId: string, poolId: string) => void

	/** Connection released */
	"connection-released": (leaseId: string, poolId: string) => void

	/** Manager error */
	error: (error: Error, operation: string) => void

	/** Manager warning */
	warning: (message: string) => void
}

/**
 * Connection manager interface
 */
export interface IConnectionManager extends EventEmitter {
	/** Initialize the manager */
	initialize(): Promise<void>

	/** Create a connection pool */
	createPool(poolId: string, config: DatabaseConfig, poolConfig?: Partial<PoolConfig>): Promise<void>

	/** Destroy a connection pool */
	destroyPool(poolId: string, reason?: string): Promise<void>

	/** Get a connection lease */
	lease(poolId: string, timeout?: number, autoReleaseMs?: number): Promise<ConnectionLease>

	/** Release a connection lease */
	release(leaseId: string): Promise<void>

	/** Get connection by lease ID */
	getConnection(leaseId: string): IDatabaseConnection | undefined

	/** List all pools */
	listPools(): string[]

	/** Get pool statistics */
	getPoolStatistics(poolId: string): PoolStatistics | undefined

	/** Get manager statistics */
	getStatistics(): ManagerStatistics

	/** Check if pool exists */
	hasPool(poolId: string): boolean

	/** Check if pool is healthy */
	isPoolHealthy(poolId: string): boolean

	/** Enable pool */
	enablePool(poolId: string): void

	/** Disable pool */
	disablePool(poolId: string): void

	/** Perform health check on all pools */
	performHealthCheck(): Promise<void>

	/** Clean up expired leases and connections */
	cleanup(): Promise<void>

	/** Dispose the manager */
	dispose(): Promise<void>
}

/**
 * Connection manager implementation
 */
export class ConnectionManager extends EventEmitter implements IConnectionManager {
	private readonly _driverRegistry: IDatabaseDriverRegistry
	private readonly _pools = new Map<string, PoolEntry>()
	private readonly _leases = new Map<string, ConnectionLease>()
	private readonly _defaultPoolConfig: PoolConfig

	private _initialized = false
	private _disposed = false
	private _leaseCounter = 0
	private _createdAt = new Date()
	private _lastActivity = new Date()

	// Statistics
	private _totalLeases = 0
	private _failedLeases = 0

	// Timers
	private _healthCheckTimer?: NodeJS.Timeout
	private _cleanupTimer?: NodeJS.Timeout

	constructor(driverRegistry: IDatabaseDriverRegistry, defaultPoolConfig?: Partial<PoolConfig>) {
		super()
		this._driverRegistry = driverRegistry
		this._defaultPoolConfig = {
			min: 2,
			max: 10,
			acquireTimeoutMillis: 30000,
			idleTimeoutMillis: 300000,
			testOnBorrow: true,
			testOnReturn: false,
			testOnIdle: true,
			timeBetweenEvictionRunsMillis: 60000,
			numTestsPerEvictionRun: 3,
			...defaultPoolConfig,
		}
	}

	/**
	 * Initialize the connection manager
	 */
	async initialize(): Promise<void> {
		if (this._initialized) {
			throw new Error("Connection manager is already initialized")
		}

		try {
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
	 * Create a connection pool
	 */
	async createPool(poolId: string, config: DatabaseConfig, poolConfig?: Partial<PoolConfig>): Promise<void> {
		if (this._disposed) {
			throw new Error("Connection manager has been disposed")
		}

		if (this._pools.has(poolId)) {
			throw new Error(`Pool with ID '${poolId}' already exists`)
		}

		try {
			// Find appropriate driver
			const driver = this._driverRegistry.findBestDriver(config.type)
			if (!driver) {
				throw new Error(`No driver found for database type: ${config.type}`)
			}

			// Validate configuration
			const validation = await driver.validate(config)
			if (!validation.isValid) {
				throw new Error(`Database configuration validation failed: ${validation.errors.join(", ")}`)
			}

			// Create pool configuration
			const finalPoolConfig: PoolConfig = {
				...this._defaultPoolConfig,
				...poolConfig,
			}

			// Create connection pool
			const pool = new ConnectionPool(finalPoolConfig, driver, config)

			// Set up pool event handlers
			this.setupPoolEventHandlers(pool, poolId)

			// Initialize the pool
			await pool.initialize()

			// Create pool entry
			const poolEntry: PoolEntry = {
				pool,
				config: { ...config },
				driver,
				createdAt: new Date(),
				tags: new Set(),
				enabled: true,
			}

			this._pools.set(poolId, poolEntry)
			this._lastActivity = new Date()

			this.emit("pool-created", poolId, config)
		} catch (error) {
			this.emit("error", error as Error, "createPool")
			throw error
		}
	}

	/**
	 * Destroy a connection pool
	 */
	async destroyPool(poolId: string, reason: string = "manual"): Promise<void> {
		const poolEntry = this._pools.get(poolId)
		if (!poolEntry) {
			throw new Error(`Pool with ID '${poolId}' does not exist`)
		}

		try {
			// Release all leases for this pool
			const poolLeases = Array.from(this._leases.entries()).filter(([, lease]) => lease.poolId === poolId)

			for (const [leaseId] of poolLeases) {
				await this.release(leaseId)
			}

			// Dispose the pool
			await poolEntry.pool.dispose()

			// Remove from pools
			this._pools.delete(poolId)
			this._lastActivity = new Date()

			this.emit("pool-destroyed", poolId, reason)
		} catch (error) {
			this.emit("error", error as Error, "destroyPool")
			throw error
		}
	}

	/**
	 * Get a connection lease
	 */
	async lease(poolId: string, timeout?: number, autoReleaseMs?: number): Promise<ConnectionLease> {
		if (this._disposed) {
			throw new Error("Connection manager has been disposed")
		}

		const poolEntry = this._pools.get(poolId)
		if (!poolEntry) {
			throw new Error(`Pool with ID '${poolId}' does not exist`)
		}

		if (!poolEntry.enabled) {
			throw new Error(`Pool with ID '${poolId}' is disabled`)
		}

		this._totalLeases++
		this._lastActivity = new Date()

		try {
			// Acquire connection from pool
			const connection = await poolEntry.pool.acquire(timeout)

			// Create lease
			const leaseId = `lease_${++this._leaseCounter}`
			const lease: ConnectionLease = {
				id: leaseId,
				connection,
				poolId,
				createdAt: new Date(),
				lastActivity: new Date(),
				tags: new Set(),
			}

			// Set up auto-release if specified
			if (autoReleaseMs && autoReleaseMs > 0) {
				lease.autoReleaseTimeout = setTimeout(() => {
					this.release(leaseId).catch((error) => {
						this.emit("error", error, "auto-release")
					})
				}, autoReleaseMs)
			}

			this._leases.set(leaseId, lease)
			this.emit("connection-leased", leaseId, poolId)

			return lease
		} catch (error) {
			this._failedLeases++
			this.emit("error", error as Error, "lease")
			throw error
		}
	}

	/**
	 * Release a connection lease
	 */
	async release(leaseId: string): Promise<void> {
		const lease = this._leases.get(leaseId)
		if (!lease) {
			throw new Error(`Lease with ID '${leaseId}' does not exist`)
		}

		try {
			const poolEntry = this._pools.get(lease.poolId)
			if (poolEntry) {
				await poolEntry.pool.release(lease.connection)
			}

			// Clear auto-release timeout
			if (lease.autoReleaseTimeout) {
				clearTimeout(lease.autoReleaseTimeout)
			}

			// Remove lease
			this._leases.delete(leaseId)
			this._lastActivity = new Date()

			this.emit("connection-released", leaseId, lease.poolId)
		} catch (error) {
			this.emit("error", error as Error, "release")
			throw error
		}
	}

	/**
	 * Get connection by lease ID
	 */
	getConnection(leaseId: string): IDatabaseConnection | undefined {
		const lease = this._leases.get(leaseId)
		if (lease) {
			lease.lastActivity = new Date()
			return lease.connection
		}
		return undefined
	}

	/**
	 * List all pools
	 */
	listPools(): string[] {
		return Array.from(this._pools.keys())
	}

	/**
	 * Get pool statistics
	 */
	getPoolStatistics(poolId: string): PoolStatistics | undefined {
		const poolEntry = this._pools.get(poolId)
		return poolEntry?.pool.getStatistics()
	}

	/**
	 * Get manager statistics
	 */
	getStatistics(): ManagerStatistics {
		const poolEntries = Array.from(this._pools.values())
		const activePools = poolEntries.filter((entry) => entry.enabled).length

		let totalConnections = 0
		const poolsByType = new Map<DatabaseType, number>()

		for (const entry of poolEntries) {
			const stats = entry.pool.getStatistics()
			totalConnections += stats.totalConnections

			const typeCount = poolsByType.get(entry.config.type) || 0
			poolsByType.set(entry.config.type, typeCount + 1)
		}

		return {
			totalPools: poolEntries.length,
			activePools,
			totalConnections,
			activeLeases: this._leases.size,
			totalLeases: this._totalLeases,
			failedLeases: this._failedLeases,
			poolsByType,
			createdAt: this._createdAt,
			lastActivity: this._lastActivity,
		}
	}

	/**
	 * Check if pool exists
	 */
	hasPool(poolId: string): boolean {
		return this._pools.has(poolId)
	}

	/**
	 * Check if pool is healthy
	 */
	isPoolHealthy(poolId: string): boolean {
		const poolEntry = this._pools.get(poolId)
		return poolEntry?.pool.isHealthy() ?? false
	}

	/**
	 * Enable pool
	 */
	enablePool(poolId: string): void {
		const poolEntry = this._pools.get(poolId)
		if (poolEntry) {
			poolEntry.enabled = true
			this._lastActivity = new Date()
		}
	}

	/**
	 * Disable pool
	 */
	disablePool(poolId: string): void {
		const poolEntry = this._pools.get(poolId)
		if (poolEntry) {
			poolEntry.enabled = false
			this._lastActivity = new Date()
		}
	}

	/**
	 * Perform health check on all pools
	 */
	async performHealthCheck(): Promise<void> {
		const healthCheckPromises: Promise<void>[] = []

		for (const [poolId, poolEntry] of this._pools) {
			if (poolEntry.enabled) {
				healthCheckPromises.push(
					poolEntry.pool.performHealthCheck().catch((error) => {
						this.emit("error", error, `health-check-${poolId}`)
					}),
				)
			}
		}

		await Promise.all(healthCheckPromises)
	}

	/**
	 * Clean up expired leases and connections
	 */
	async cleanup(): Promise<void> {
		const now = new Date()
		const expiredLeases: string[] = []

		// Find expired leases (leases inactive for more than 1 hour)
		for (const [leaseId, lease] of this._leases) {
			const inactiveTime = now.getTime() - lease.lastActivity.getTime()
			if (inactiveTime > 3600000) {
				// 1 hour
				expiredLeases.push(leaseId)
			}
		}

		// Release expired leases
		const releasePromises = expiredLeases.map((leaseId) =>
			this.release(leaseId).catch((error) => {
				this.emit("error", error, "cleanup-lease")
			}),
		)

		// Clean up pools
		const poolCleanupPromises = Array.from(this._pools.values()).map((poolEntry) =>
			poolEntry.pool.cleanup().catch((error) => {
				this.emit("error", error, "cleanup-pool")
			}),
		)

		await Promise.all([...releasePromises, ...poolCleanupPromises])
	}

	/**
	 * Dispose the manager
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

			// Release all leases
			const releasePromises = Array.from(this._leases.keys()).map((leaseId) => this.release(leaseId))
			await Promise.all(releasePromises)

			// Destroy all pools
			const destroyPromises = Array.from(this._pools.keys()).map((poolId) => this.destroyPool(poolId, "dispose"))
			await Promise.all(destroyPromises)
		} catch (error) {
			this.emit("error", error as Error, "dispose")
			throw error
		}
	}

	/**
	 * Set up event handlers for a pool
	 */
	private setupPoolEventHandlers(pool: IConnectionPool, poolId: string): void {
		pool.on("error", (error, operation) => {
			this.emit("error", error, `pool-${poolId}-${operation}`)
		})

		pool.on("warning", (message) => {
			this.emit("warning", `Pool ${poolId}: ${message}`)
		})
	}

	/**
	 * Start health check timer
	 */
	private startHealthCheckTimer(): void {
		this._healthCheckTimer = setInterval(() => {
			this.performHealthCheck().catch((error) => {
				this.emit("error", error, "health-check-timer")
			})
		}, 300000) // 5 minutes
	}

	/**
	 * Start cleanup timer
	 */
	private startCleanupTimer(): void {
		this._cleanupTimer = setInterval(() => {
			this.cleanup().catch((error) => {
				this.emit("error", error, "cleanup-timer")
			})
		}, 600000) // 10 minutes
	}
}
