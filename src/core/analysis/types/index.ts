/**
 * Type Definitions Index
 *
 * Centralized exports for all type definitions used in the
 * Kilocode Analysis Engine core architecture.
 *
 * @author Kilocode Analysis Team
 * @version 1.0.0
 */

// Event System Types
export * from "./events"

// Dependency Injection Container Types
export * from "./container"

// Configuration Management Types
export * from "./config"

// Error Handling Types
export * from "./errors"

// Re-export commonly used types for convenience
export type {
	// Event System
	EventPriority,
	EventHandler,
	EventSubscription,
	EventMetadata,
	EventBusConfig,
	IEventBus,

	// Container System
	ServiceLifetime,
	ServiceToken,
	ServiceFactory,
	ServiceConstructor,
	ServiceRegistration,
	ResolutionContext,
	DIContainerConfig,
	IServiceScope,
	IDIContainer,

	// Configuration System
	ConfigEnvironment,
	ConfigSource,
	ConfigValue,
	ConfigSchema,
	ConfigEntry,
	ConfigChangeData,
	ConfigValidationResult,
	ConfigManagerOptions,
	IConfigLoader,
	IConfigWatcher,
	IConfigManager,

	// Error System
	ErrorSeverity,
	ErrorCategory,
	ErrorContext,
	ErrorDetails,
	ErrorHandlerConfig,
	ErrorRecoveryStrategy,
	IErrorReporter,
	IErrorLogger,
	ErrorFilter,
	IErrorHandler,
	ErrorStats,
} from "./events"

export type {
	ServiceLifetime,
	ServiceToken,
	ServiceFactory,
	ServiceConstructor,
	ServiceRegistration,
	ResolutionContext,
	DIContainerConfig,
	IServiceScope,
	IDIContainer,
} from "./container"

export type {
	ConfigEnvironment,
	ConfigSource,
	ConfigValue,
	ConfigSchema,
	ConfigEntry,
	ConfigChangeData,
	ConfigValidationResult,
	ConfigManagerOptions,
	IConfigLoader,
	IConfigWatcher,
	IConfigManager,
} from "./config"

export type {
	ErrorSeverity,
	ErrorCategory,
	ErrorContext,
	ErrorDetails,
	ErrorHandlerConfig,
	ErrorRecoveryStrategy,
	IErrorReporter,
	IErrorLogger,
	ErrorFilter,
	IErrorHandler,
	ErrorStats,
} from "./errors"

// Re-export classes and constants
export {
	AnalysisEvents,
	BuiltInServices,
	ContainerEvents,
	ContainerError,
	ServiceNotFoundError,
	CircularDependencyError,
	ServiceRegistrationError,
	ServiceResolutionError,
	BuiltInConfigs,
	DefaultConfigSchema,
	ConfigEvents,
	ConfigError,
	IConfigValidationError,
	ConfigValidationErrorClass,
	ConfigLoadError,
	ConfigWatchError,
	AnalysisError,
	ErrorEvents,
	ErrorCodes,
	ErrorUtils,
} from "./events"

export {
	BuiltInServices,
	ContainerEvents,
	ContainerError,
	ServiceNotFoundError,
	CircularDependencyError,
	ServiceRegistrationError,
	ServiceResolutionError,
} from "./container"

export {
	BuiltInConfigs,
	DefaultConfigSchema,
	ConfigEvents,
	ConfigError,
	ConfigValidationErrorClass,
	ConfigLoadError,
	ConfigWatchError,
} from "./config"

export { AnalysisError, ErrorEvents, ErrorCodes, ErrorUtils } from "./errors"
