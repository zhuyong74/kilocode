/**
 * Analyzer Registry
 *
 * This module provides a registry for managing analyzer instances,
 * including registration, discovery, validation, and lifecycle management.
 */

import { EventEmitter } from "events"
import { AnalyzerMetadata, AnalyzerType, AnalyzerValidationResult, AnalyzerCapabilities } from "../../types/analyzer"
import { AnalysisContext } from "../../types/engine"
import { IAnalyzer } from "./IAnalyzer"

/**
 * Registry entry for an analyzer
 */
interface AnalyzerRegistryEntry {
	/** Analyzer instance */
	analyzer: IAnalyzer

	/** Analyzer metadata */
	metadata: AnalyzerMetadata

	/** Registration timestamp */
	registeredAt: Date

	/** Whether analyzer is enabled */
	enabled: boolean

	/** Registration source */
	source: "builtin" | "plugin" | "external"

	/** Analyzer dependencies */
	dependencies: string[]

	/** Analyzer tags for categorization */
	tags: string[]
}

/**
 * Registry events
 */
interface RegistryEvents {
	/** Analyzer registered */
	"analyzer-registered": (analyzerId: string, metadata: AnalyzerMetadata) => void

	/** Analyzer unregistered */
	"analyzer-unregistered": (analyzerId: string, metadata: AnalyzerMetadata) => void

	/** Analyzer enabled */
	"analyzer-enabled": (analyzerId: string) => void

	/** Analyzer disabled */
	"analyzer-disabled": (analyzerId: string) => void

	/** Registry cleared */
	"registry-cleared": () => void

	/** Registry error */
	error: (error: Error, operation: string) => void
}

/**
 * Analyzer registry interface
 */
export interface IAnalyzerRegistry extends EventEmitter {
	/** Register an analyzer */
	register(analyzer: IAnalyzer, metadata: AnalyzerMetadata, source?: string): Promise<void>

	/** Unregister an analyzer */
	unregister(analyzerId: string): Promise<void>

	/** Get analyzer by ID */
	get(analyzerId: string): IAnalyzer | undefined

	/** Get analyzer metadata */
	getMetadata(analyzerId: string): AnalyzerMetadata | undefined

	/** List all analyzers */
	list(): AnalyzerMetadata[]

	/** Find analyzers by type */
	findByType(type: AnalyzerType): AnalyzerMetadata[]

	/** Find analyzers by capability */
	findByCapability(capability: keyof AnalyzerCapabilities): AnalyzerMetadata[]

	/** Find analyzers that can handle context */
	findCompatible(context: AnalysisContext): Promise<AnalyzerMetadata[]>

	/** Validate analyzer */
	validate(analyzer: IAnalyzer): Promise<AnalyzerValidationResult>

	/** Clear all analyzers */
	clear(): Promise<void>

	/** Enable analyzer */
	enable(analyzerId: string): void

	/** Disable analyzer */
	disable(analyzerId: string): void

	/** Check if analyzer is enabled */
	isEnabled(analyzerId: string): boolean

	/** Get registry statistics */
	getStatistics(): RegistryStatistics
}

/**
 * Registry statistics
 */
export interface RegistryStatistics {
	/** Total registered analyzers */
	totalAnalyzers: number

	/** Enabled analyzers */
	enabledAnalyzers: number

	/** Disabled analyzers */
	disabledAnalyzers: number

	/** Analyzers by type */
	byType: Map<AnalyzerType, number>

	/** Analyzers by source */
	bySource: Map<string, number>

	/** Registry creation time */
	createdAt: Date

	/** Last modification time */
	lastModified: Date
}

/**
 * Analyzer registry implementation
 */
export class AnalyzerRegistry extends EventEmitter implements IAnalyzerRegistry {
	private readonly _analyzers = new Map<string, AnalyzerRegistryEntry>()
	private readonly _createdAt = new Date()
	private _lastModified = new Date()

	/**
	 * Register an analyzer in the registry
	 */
	async register(analyzer: IAnalyzer, metadata: AnalyzerMetadata, source: string = "external"): Promise<void> {
		try {
			// Validate analyzer
			const validation = await this.validate(analyzer)
			if (!validation.isValid) {
				throw new Error(`Analyzer validation failed: ${validation.errors.join(", ")}`)
			}

			// Check for duplicate registration
			if (this._analyzers.has(metadata.id)) {
				throw new Error(`Analyzer with ID '${metadata.id}' is already registered`)
			}

			// Validate metadata
			this.validateMetadata(metadata)

			// Check dependencies
			await this.checkDependencies(metadata.dependencies)

			// Create registry entry
			const entry: AnalyzerRegistryEntry = {
				analyzer,
				metadata: { ...metadata },
				registeredAt: new Date(),
				enabled: true,
				source: source as any,
				dependencies: [...metadata.dependencies],
				tags: [...metadata.tags],
			}

			// Register the analyzer
			this._analyzers.set(metadata.id, entry)
			this._lastModified = new Date()

			// Emit registration event
			this.emit("analyzer-registered", metadata.id, metadata)
		} catch (error) {
			this.emit("error", error as Error, "register")
			throw error
		}
	}

	/**
	 * Unregister an analyzer from the registry
	 */
	async unregister(analyzerId: string): Promise<void> {
		try {
			const entry = this._analyzers.get(analyzerId)
			if (!entry) {
				throw new Error(`Analyzer with ID '${analyzerId}' is not registered`)
			}

			// Check if other analyzers depend on this one
			const dependents = this.findDependents(analyzerId)
			if (dependents.length > 0) {
				throw new Error(
					`Cannot unregister analyzer '${analyzerId}' because it is required by: ${dependents.join(", ")}`,
				)
			}

			// Dispose the analyzer
			await entry.analyzer.dispose()

			// Remove from registry
			this._analyzers.delete(analyzerId)
			this._lastModified = new Date()

			// Emit unregistration event
			this.emit("analyzer-unregistered", analyzerId, entry.metadata)
		} catch (error) {
			this.emit("error", error as Error, "unregister")
			throw error
		}
	}

	/**
	 * Get analyzer by ID
	 */
	get(analyzerId: string): IAnalyzer | undefined {
		const entry = this._analyzers.get(analyzerId)
		return entry?.enabled ? entry.analyzer : undefined
	}

	/**
	 * Get analyzer metadata by ID
	 */
	getMetadata(analyzerId: string): AnalyzerMetadata | undefined {
		const entry = this._analyzers.get(analyzerId)
		return entry ? { ...entry.metadata } : undefined
	}

	/**
	 * List all registered analyzers
	 */
	list(): AnalyzerMetadata[] {
		return Array.from(this._analyzers.values())
			.filter((entry) => entry.enabled)
			.map((entry) => ({ ...entry.metadata }))
	}

	/**
	 * Find analyzers by type
	 */
	findByType(type: AnalyzerType): AnalyzerMetadata[] {
		return Array.from(this._analyzers.values())
			.filter((entry) => entry.enabled && entry.metadata.type === type)
			.map((entry) => ({ ...entry.metadata }))
	}

	/**
	 * Find analyzers by capability
	 */
	findByCapability(capability: keyof AnalyzerCapabilities): AnalyzerMetadata[] {
		return Array.from(this._analyzers.values())
			.filter((entry) => entry.enabled && entry.metadata.capabilities[capability])
			.map((entry) => ({ ...entry.metadata }))
	}

	/**
	 * Find analyzers that can handle the given context
	 */
	async findCompatible(context: AnalysisContext): Promise<AnalyzerMetadata[]> {
		const compatible: AnalyzerMetadata[] = []

		for (const entry of this._analyzers.values()) {
			if (!entry.enabled) continue

			try {
				const canHandle = await entry.analyzer.canHandle(context)
				if (canHandle) {
					compatible.push({ ...entry.metadata })
				}
			} catch (error) {
				// Log error but continue with other analyzers
				console.warn(`Error checking compatibility for analyzer ${entry.metadata.id}:`, error)
			}
		}

		// Sort by priority (higher priority first)
		return compatible.sort((a, b) => b.priority - a.priority)
	}

	/**
	 * Validate an analyzer
	 */
	async validate(analyzer: IAnalyzer): Promise<AnalyzerValidationResult> {
		const result: AnalyzerValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
		}

		try {
			// Check if analyzer implements required methods
			const requiredMethods = [
				"initialize",
				"validate",
				"canHandle",
				"analyze",
				"cancel",
				"pause",
				"resume",
				"getStatistics",
				"dispose",
			]

			for (const method of requiredMethods) {
				if (typeof (analyzer as any)[method] !== "function") {
					result.errors.push(`Missing required method: ${method}`)
				}
			}

			// Check metadata
			if (!analyzer.metadata) {
				result.errors.push("Analyzer metadata is required")
			} else {
				const metadataValidation = this.validateMetadata(analyzer.metadata)
				result.errors.push(...metadataValidation.errors)
				result.warnings.push(...metadataValidation.warnings)
			}

			// Check configuration
			if (!analyzer.config) {
				result.errors.push("Analyzer configuration is required")
			}
		} catch (error) {
			result.errors.push(`Validation error: ${(error as Error).message}`)
		}

		result.isValid = result.errors.length === 0
		return result
	}

	/**
	 * Clear all analyzers from the registry
	 */
	async clear(): Promise<void> {
		try {
			// Dispose all analyzers
			const disposePromises = Array.from(this._analyzers.values()).map((entry) => entry.analyzer.dispose())

			await Promise.all(disposePromises)

			// Clear the registry
			this._analyzers.clear()
			this._lastModified = new Date()

			// Emit clear event
			this.emit("registry-cleared")
		} catch (error) {
			this.emit("error", error as Error, "clear")
			throw error
		}
	}

	/**
	 * Enable an analyzer
	 */
	enable(analyzerId: string): void {
		const entry = this._analyzers.get(analyzerId)
		if (entry && !entry.enabled) {
			entry.enabled = true
			this._lastModified = new Date()
			this.emit("analyzer-enabled", analyzerId)
		}
	}

	/**
	 * Disable an analyzer
	 */
	disable(analyzerId: string): void {
		const entry = this._analyzers.get(analyzerId)
		if (entry && entry.enabled) {
			entry.enabled = false
			this._lastModified = new Date()
			this.emit("analyzer-disabled", analyzerId)
		}
	}

	/**
	 * Check if analyzer is enabled
	 */
	isEnabled(analyzerId: string): boolean {
		const entry = this._analyzers.get(analyzerId)
		return entry?.enabled ?? false
	}

	/**
	 * Get registry statistics
	 */
	getStatistics(): RegistryStatistics {
		const entries = Array.from(this._analyzers.values())
		const enabledEntries = entries.filter((entry) => entry.enabled)

		const byType = new Map<AnalyzerType, number>()
		const bySource = new Map<string, number>()

		for (const entry of entries) {
			// Count by type
			const typeCount = byType.get(entry.metadata.type) || 0
			byType.set(entry.metadata.type, typeCount + 1)

			// Count by source
			const sourceCount = bySource.get(entry.source) || 0
			bySource.set(entry.source, sourceCount + 1)
		}

		return {
			totalAnalyzers: entries.length,
			enabledAnalyzers: enabledEntries.length,
			disabledAnalyzers: entries.length - enabledEntries.length,
			byType,
			bySource,
			createdAt: this._createdAt,
			lastModified: this._lastModified,
		}
	}

	/**
	 * Validate analyzer metadata
	 */
	private validateMetadata(metadata: AnalyzerMetadata): AnalyzerValidationResult {
		const result: AnalyzerValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
		}

		// Required fields
		if (!metadata.id) {
			result.errors.push("Analyzer ID is required")
		} else if (!/^[a-zA-Z0-9-_]+$/.test(metadata.id)) {
			result.errors.push("Analyzer ID must contain only alphanumeric characters, hyphens, and underscores")
		}

		if (!metadata.name) {
			result.errors.push("Analyzer name is required")
		}

		if (!metadata.version) {
			result.errors.push("Analyzer version is required")
		} else if (!/^\d+\.\d+\.\d+/.test(metadata.version)) {
			result.warnings.push("Analyzer version should follow semantic versioning (x.y.z)")
		}

		if (!metadata.author) {
			result.warnings.push("Analyzer author is recommended")
		}

		// Validate capabilities
		if (!metadata.capabilities) {
			result.errors.push("Analyzer capabilities are required")
		}

		// Validate priority
		if (metadata.priority < 0 || metadata.priority > 100) {
			result.warnings.push("Analyzer priority should be between 0 and 100")
		}

		result.isValid = result.errors.length === 0
		return result
	}

	/**
	 * Check if dependencies are satisfied
	 */
	private async checkDependencies(dependencies: string[]): Promise<void> {
		for (const dep of dependencies) {
			if (!this._analyzers.has(dep)) {
				throw new Error(`Dependency '${dep}' is not registered`)
			}

			const depEntry = this._analyzers.get(dep)!
			if (!depEntry.enabled) {
				throw new Error(`Dependency '${dep}' is disabled`)
			}
		}
	}

	/**
	 * Find analyzers that depend on the given analyzer
	 */
	private findDependents(analyzerId: string): string[] {
		const dependents: string[] = []

		for (const [id, entry] of this._analyzers) {
			if (entry.dependencies.includes(analyzerId)) {
				dependents.push(id)
			}
		}

		return dependents
	}
}

/**
 * Default analyzer registry instance
 */
export const analyzerRegistry = new AnalyzerRegistry()
