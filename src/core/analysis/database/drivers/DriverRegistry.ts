/**
 * Database Driver Registry
 *
 * This module provides a registry for managing database drivers,
 * including registration, discovery, validation, and lifecycle management.
 */

import { EventEmitter } from "events"
import { DatabaseType, DatabaseConfig } from "../../types/database"
import {
	IDatabaseDriver,
	IStreamingDatabaseDriver,
	IBulkDatabaseDriver,
	DriverMetadata,
	DriverConfig,
	DriverValidationResult,
	DriverStatistics,
	isStreamingDriver,
	isBulkDriver,
} from "./IDriver"

/**
 * Registry entry for a driver
 */
interface DriverRegistryEntry {
	/** Driver instance */
	driver: IDatabaseDriver

	/** Driver metadata */
	metadata: DriverMetadata

	/** Registration timestamp */
	registeredAt: Date

	/** Whether driver is enabled */
	enabled: boolean

	/** Registration source */
	source: "builtin" | "plugin" | "external"

	/** Driver priority (higher = preferred) */
	priority: number

	/** Driver tags for categorization */
	tags: string[]
}

/**
 * Registry events
 */
interface RegistryEvents {
	/** Driver registered */
	"driver-registered": (driverId: string, metadata: DriverMetadata) => void

	/** Driver unregistered */
	"driver-unregistered": (driverId: string, metadata: DriverMetadata) => void

	/** Driver enabled */
	"driver-enabled": (driverId: string) => void

	/** Driver disabled */
	"driver-disabled": (driverId: string) => void

	/** Registry cleared */
	"registry-cleared": () => void

	/** Registry error */
	error: (error: Error, operation: string) => void
}

/**
 * Driver registry interface
 */
export interface IDatabaseDriverRegistry extends EventEmitter {
	/** Register a driver */
	register(driver: IDatabaseDriver, priority?: number, source?: string): Promise<void>

	/** Unregister a driver */
	unregister(driverId: string): Promise<void>

	/** Get driver by ID */
	get(driverId: string): IDatabaseDriver | undefined

	/** Get driver metadata */
	getMetadata(driverId: string): DriverMetadata | undefined

	/** List all drivers */
	list(): DriverMetadata[]

	/** Find drivers by database type */
	findByType(type: DatabaseType): DriverMetadata[]

	/** Find best driver for database type */
	findBestDriver(type: DatabaseType): IDatabaseDriver | undefined

	/** Find compatible drivers for configuration */
	findCompatible(config: DatabaseConfig): Promise<DriverMetadata[]>

	/** Validate driver */
	validate(driver: IDatabaseDriver): Promise<DriverValidationResult>

	/** Test driver with configuration */
	testDriver(driverId: string, config: DatabaseConfig): Promise<boolean>

	/** Clear all drivers */
	clear(): Promise<void>

	/** Enable driver */
	enable(driverId: string): void

	/** Disable driver */
	disable(driverId: string): void

	/** Check if driver is enabled */
	isEnabled(driverId: string): boolean

	/** Get registry statistics */
	getStatistics(): RegistryStatistics
}

/**
 * Registry statistics
 */
export interface RegistryStatistics {
	/** Total registered drivers */
	totalDrivers: number

	/** Enabled drivers */
	enabledDrivers: number

	/** Disabled drivers */
	disabledDrivers: number

	/** Drivers by type */
	byType: Map<DatabaseType, number>

	/** Drivers by source */
	bySource: Map<string, number>

	/** Registry creation time */
	createdAt: Date

	/** Last modification time */
	lastModified: Date
}

/**
 * Database driver registry implementation
 */
export class DatabaseDriverRegistry extends EventEmitter implements IDatabaseDriverRegistry {
	private readonly _drivers = new Map<string, DriverRegistryEntry>()
	private readonly _createdAt = new Date()
	private _lastModified = new Date()

	/**
	 * Register a driver in the registry
	 */
	async register(driver: IDatabaseDriver, priority: number = 50, source: string = "external"): Promise<void> {
		try {
			// Validate driver
			const validation = await this.validate(driver)
			if (!validation.isValid) {
				throw new Error(`Driver validation failed: ${validation.errors.join(", ")}`)
			}

			const metadata = driver.metadata

			// Check for duplicate registration
			if (this._drivers.has(metadata.id)) {
				throw new Error(`Driver with ID '${metadata.id}' is already registered`)
			}

			// Validate metadata
			this.validateMetadata(metadata)

			// Create registry entry
			const entry: DriverRegistryEntry = {
				driver,
				metadata: { ...metadata },
				registeredAt: new Date(),
				enabled: true,
				source: source as any,
				priority,
				tags: [...metadata.tags],
			}

			// Register the driver
			this._drivers.set(metadata.id, entry)
			this._lastModified = new Date()

			// Emit registration event
			this.emit("driver-registered", metadata.id, metadata)
		} catch (error) {
			this.emit("error", error as Error, "register")
			throw error
		}
	}

	/**
	 * Unregister a driver from the registry
	 */
	async unregister(driverId: string): Promise<void> {
		try {
			const entry = this._drivers.get(driverId)
			if (!entry) {
				throw new Error(`Driver with ID '${driverId}' is not registered`)
			}

			// Dispose the driver
			await entry.driver.dispose()

			// Remove from registry
			this._drivers.delete(driverId)
			this._lastModified = new Date()

			// Emit unregistration event
			this.emit("driver-unregistered", driverId, entry.metadata)
		} catch (error) {
			this.emit("error", error as Error, "unregister")
			throw error
		}
	}

	/**
	 * Get driver by ID
	 */
	get(driverId: string): IDatabaseDriver | undefined {
		const entry = this._drivers.get(driverId)
		return entry?.enabled ? entry.driver : undefined
	}

	/**
	 * Get driver metadata by ID
	 */
	getMetadata(driverId: string): DriverMetadata | undefined {
		const entry = this._drivers.get(driverId)
		return entry ? { ...entry.metadata } : undefined
	}

	/**
	 * List all registered drivers
	 */
	list(): DriverMetadata[] {
		return Array.from(this._drivers.values())
			.filter((entry) => entry.enabled)
			.sort((a, b) => b.priority - a.priority)
			.map((entry) => ({ ...entry.metadata }))
	}

	/**
	 * Find drivers by database type
	 */
	findByType(type: DatabaseType): DriverMetadata[] {
		return Array.from(this._drivers.values())
			.filter((entry) => entry.enabled && entry.metadata.databaseType === type)
			.sort((a, b) => b.priority - a.priority)
			.map((entry) => ({ ...entry.metadata }))
	}

	/**
	 * Find best driver for database type
	 */
	findBestDriver(type: DatabaseType): IDatabaseDriver | undefined {
		const entries = Array.from(this._drivers.values())
			.filter((entry) => entry.enabled && entry.metadata.databaseType === type)
			.sort((a, b) => b.priority - a.priority)

		return entries.length > 0 ? entries[0].driver : undefined
	}

	/**
	 * Find compatible drivers for configuration
	 */
	async findCompatible(config: DatabaseConfig): Promise<DriverMetadata[]> {
		const compatible: DriverMetadata[] = []

		for (const entry of this._drivers.values()) {
			if (!entry.enabled) continue

			try {
				const validation = await entry.driver.validate(config)
				if (validation.isValid) {
					compatible.push({ ...entry.metadata })
				}
			} catch (error) {
				// Log error but continue with other drivers
				console.warn(`Error checking compatibility for driver ${entry.metadata.id}:`, error)
			}
		}

		// Sort by priority (higher priority first)
		return compatible.sort((a, b) => {
			const entryA = this._drivers.get(a.id)!
			const entryB = this._drivers.get(b.id)!
			return entryB.priority - entryA.priority
		})
	}

	/**
	 * Validate a driver
	 */
	async validate(driver: IDatabaseDriver): Promise<DriverValidationResult> {
		const result: DriverValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
			validatedAt: new Date(),
		}

		try {
			// Check if driver implements required methods
			const requiredMethods = [
				"initialize",
				"validate",
				"testConnection",
				"createConnection",
				"closeConnection",
				"executeQuery",
				"getSchema",
				"getStatistics",
				"getDriverStatistics",
				"supportsFeature",
				"getSupportedDialects",
				"parseConnectionString",
				"buildConnectionString",
				"dispose",
			]

			for (const method of requiredMethods) {
				if (typeof (driver as any)[method] !== "function") {
					result.errors.push(`Missing required method: ${method}`)
				}
			}

			// Check metadata
			if (!driver.metadata) {
				result.errors.push("Driver metadata is required")
			} else {
				const metadataValidation = this.validateMetadata(driver.metadata)
				result.errors.push(...metadataValidation.errors)
				result.warnings.push(...metadataValidation.warnings)
			}

			// Check configuration
			if (!driver.config) {
				result.errors.push("Driver configuration is required")
			}

			// Check capabilities
			if (!driver.capabilities) {
				result.errors.push("Driver capabilities are required")
			}

			// Validate streaming capabilities
			if (isStreamingDriver(driver)) {
				if (typeof driver.executeStreamingQuery !== "function") {
					result.errors.push("Streaming driver must implement executeStreamingQuery method")
				}
				if (!driver.capabilities.supportsStreaming) {
					result.warnings.push("Streaming driver should declare streaming support in capabilities")
				}
			}

			// Validate bulk capabilities
			if (isBulkDriver(driver)) {
				const bulkMethods = ["bulkInsert", "bulkUpdate", "bulkDelete"]
				for (const method of bulkMethods) {
					if (typeof (driver as any)[method] !== "function") {
						result.errors.push(`Bulk driver must implement ${method} method`)
					}
				}
				if (!driver.capabilities.supportsBulkOperations) {
					result.warnings.push("Bulk driver should declare bulk operations support in capabilities")
				}
			}
		} catch (error) {
			result.errors.push(`Validation error: ${(error as Error).message}`)
		}

		result.isValid = result.errors.length === 0
		return result
	}

	/**
	 * Test driver with configuration
	 */
	async testDriver(driverId: string, config: DatabaseConfig): Promise<boolean> {
		const entry = this._drivers.get(driverId)
		if (!entry || !entry.enabled) {
			throw new Error(`Driver '${driverId}' is not available`)
		}

		try {
			return await entry.driver.testConnection(config)
		} catch (error) {
			this.emit("error", error as Error, "testDriver")
			return false
		}
	}

	/**
	 * Clear all drivers from the registry
	 */
	async clear(): Promise<void> {
		try {
			// Dispose all drivers
			const disposePromises = Array.from(this._drivers.values()).map((entry) => entry.driver.dispose())

			await Promise.all(disposePromises)

			// Clear the registry
			this._drivers.clear()
			this._lastModified = new Date()

			// Emit clear event
			this.emit("registry-cleared")
		} catch (error) {
			this.emit("error", error as Error, "clear")
			throw error
		}
	}

	/**
	 * Enable a driver
	 */
	enable(driverId: string): void {
		const entry = this._drivers.get(driverId)
		if (entry && !entry.enabled) {
			entry.enabled = true
			this._lastModified = new Date()
			this.emit("driver-enabled", driverId)
		}
	}

	/**
	 * Disable a driver
	 */
	disable(driverId: string): void {
		const entry = this._drivers.get(driverId)
		if (entry && entry.enabled) {
			entry.enabled = false
			this._lastModified = new Date()
			this.emit("driver-disabled", driverId)
		}
	}

	/**
	 * Check if driver is enabled
	 */
	isEnabled(driverId: string): boolean {
		const entry = this._drivers.get(driverId)
		return entry?.enabled ?? false
	}

	/**
	 * Get registry statistics
	 */
	getStatistics(): RegistryStatistics {
		const entries = Array.from(this._drivers.values())
		const enabledEntries = entries.filter((entry) => entry.enabled)

		const byType = new Map<DatabaseType, number>()
		const bySource = new Map<string, number>()

		for (const entry of entries) {
			// Count by type
			const typeCount = byType.get(entry.metadata.databaseType) || 0
			byType.set(entry.metadata.databaseType, typeCount + 1)

			// Count by source
			const sourceCount = bySource.get(entry.source) || 0
			bySource.set(entry.source, sourceCount + 1)
		}

		return {
			totalDrivers: entries.length,
			enabledDrivers: enabledEntries.length,
			disabledDrivers: entries.length - enabledEntries.length,
			byType,
			bySource,
			createdAt: this._createdAt,
			lastModified: this._lastModified,
		}
	}

	/**
	 * Validate driver metadata
	 */
	private validateMetadata(metadata: DriverMetadata): DriverValidationResult {
		const result: DriverValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
			validatedAt: new Date(),
		}

		// Required fields
		if (!metadata.id) {
			result.errors.push("Driver ID is required")
		} else if (!/^[a-zA-Z0-9-_]+$/.test(metadata.id)) {
			result.errors.push("Driver ID must contain only alphanumeric characters, hyphens, and underscores")
		}

		if (!metadata.name) {
			result.errors.push("Driver name is required")
		}

		if (!metadata.version) {
			result.errors.push("Driver version is required")
		} else if (!/^\d+\.\d+\.\d+/.test(metadata.version)) {
			result.warnings.push("Driver version should follow semantic versioning (x.y.z)")
		}

		if (!metadata.author) {
			result.warnings.push("Driver author is recommended")
		}

		if (!metadata.databaseType) {
			result.errors.push("Database type is required")
		}

		// Validate capabilities
		if (!metadata.capabilities) {
			result.errors.push("Driver capabilities are required")
		} else {
			if (metadata.capabilities.maxConnections < 1) {
				result.errors.push("Maximum connections must be at least 1")
			}
		}

		result.isValid = result.errors.length === 0
		return result
	}
}

/**
 * Default driver registry instance
 */
export const driverRegistry = new DatabaseDriverRegistry()
