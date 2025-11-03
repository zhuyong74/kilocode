/**
 * Kilocode Analysis Engine - Core Module
 *
 * Main entry point for the Kilocode Analysis Engine core functionality.
 * This module provides the foundational architecture components including
 * event-driven architecture, dependency injection, configuration management,
 * and error handling systems.
 *
 * @author Kilocode Analysis Team
 * @version 1.0.0
 */

// Core Architecture Components
export { EventBus } from "./architecture/EventBus"
export { DIContainer } from "./architecture/DIContainer"
export { ConfigManager } from "./architecture/ConfigManager"
export { ErrorHandler } from "./architecture/ErrorHandler"

// Type Definitions
export * from "./types"

// Re-export key interfaces for convenience
export type {
	IEventBus,
	IDIContainer,
	IConfigManager,
	IErrorHandler,

	// Configuration types
	EventBusConfig,
	DIContainerConfig,
	ConfigManagerOptions,
	ErrorHandlerConfig,

	// Core data types
	EventHandler,
	ServiceFactory,
	ConfigValue,
	AnalysisError,
} from "./types"

/**
 * Core Analysis Engine Factory
 *
 * Provides a convenient way to create and configure the core
 * analysis engine components with proper dependency injection.
 */
export class AnalysisEngineCore {
	private readonly _eventBus: EventBus
	private readonly _container: DIContainer
	private readonly _configManager: ConfigManager
	private readonly _errorHandler: ErrorHandler
	private _initialized = false

	constructor(
		eventBusConfig?: EventBusConfig,
		containerConfig?: DIContainerConfig,
		configOptions?: ConfigManagerOptions,
		errorConfig?: ErrorHandlerConfig,
	) {
		// Create event bus first as other components depend on it
		this._eventBus = new EventBus(eventBusConfig)

		// Create container and register event bus
		this._container = new DIContainer(containerConfig, this._eventBus)
		this._container.registerSingleton("EventBus", () => this._eventBus)

		// Create config manager
		this._configManager = new ConfigManager(configOptions, this._eventBus)
		this._container.registerSingleton("ConfigManager", () => this._configManager)

		// Create error handler
		this._errorHandler = new ErrorHandler(errorConfig, this._eventBus)
		this._container.registerSingleton("ErrorHandler", () => this._errorHandler)
	}

	/**
	 * Initialize the analysis engine core
	 */
	async initialize(): Promise<void> {
		if (this._initialized) {
			throw new Error("Analysis engine core is already initialized")
		}

		try {
			// Initialize configuration manager first
			await this._configManager.initialize()

			// Load any additional configuration
			await this._configManager.loadFromEnvironment()

			this._initialized = true

			// Emit initialization complete event
			this._eventBus.emit("core.initialized", {
				timestamp: new Date(),
				components: ["EventBus", "DIContainer", "ConfigManager", "ErrorHandler"],
			})
		} catch (error) {
			const analysisError = this._errorHandler.wrapError(
				error as Error,
				"CORE_INITIALIZATION_FAILED",
				"Failed to initialize analysis engine core",
				"SYSTEM" as any,
			)

			await this._errorHandler.handle(analysisError)
			throw analysisError
		}
	}

	/**
	 * Dispose of the analysis engine core
	 */
	dispose(): void {
		if (!this._initialized) return

		try {
			this._errorHandler.dispose()
			this._configManager.dispose()
			this._container.dispose()
			this._eventBus.dispose()

			this._initialized = false
		} catch (error) {
			console.error("Error disposing analysis engine core:", error)
		}
	}

	/**
	 * Get the event bus instance
	 */
	get eventBus(): EventBus {
		return this._eventBus
	}

	/**
	 * Get the dependency injection container
	 */
	get container(): DIContainer {
		return this._container
	}

	/**
	 * Get the configuration manager
	 */
	get configManager(): ConfigManager {
		return this._configManager
	}

	/**
	 * Get the error handler
	 */
	get errorHandler(): ErrorHandler {
		return this._errorHandler
	}

	/**
	 * Check if the core is initialized
	 */
	get isInitialized(): boolean {
		return this._initialized
	}
}

/**
 * Default Analysis Engine Core Instance
 *
 * A pre-configured instance of the analysis engine core that can be
 * used throughout the application. This provides a singleton pattern
 * for the core components.
 */
let defaultCore: AnalysisEngineCore | null = null

/**
 * Get or create the default analysis engine core instance
 */
export function getDefaultCore(): AnalysisEngineCore {
	if (!defaultCore) {
		defaultCore = new AnalysisEngineCore()
	}
	return defaultCore
}

/**
 * Initialize the default analysis engine core
 */
export async function initializeDefaultCore(): Promise<AnalysisEngineCore> {
	const core = getDefaultCore()

	if (!core.isInitialized) {
		await core.initialize()
	}

	return core
}

/**
 * Dispose of the default analysis engine core
 */
export function disposeDefaultCore(): void {
	if (defaultCore) {
		defaultCore.dispose()
		defaultCore = null
	}
}

// Export version information
export const VERSION = "1.0.0"
export const BUILD_DATE = new Date().toISOString()

/**
 * Analysis Engine Core Information
 */
export const CORE_INFO = {
	name: "Kilocode Analysis Engine Core",
	version: VERSION,
	buildDate: BUILD_DATE,
	components: [
		"EventBus - Event-driven architecture",
		"DIContainer - Dependency injection container",
		"ConfigManager - Configuration management system",
		"ErrorHandler - Comprehensive error handling",
	],
	description: "Core architecture components for the Kilocode reverse analysis engine",
} as const
