/**
 * Configuration Management Type Definitions
 *
 * Defines all types and interfaces for the configuration management system
 * used in the Kilocode Analysis Engine.
 *
 * @author Kilocode Analysis Team
 * @version 1.0.0
 */

/**
 * Configuration environment types
 */
export enum ConfigEnvironment {
	DEVELOPMENT = "development",
	TESTING = "testing",
	STAGING = "staging",
	PRODUCTION = "production",
}

/**
 * Configuration source types
 */
export enum ConfigSource {
	FILE = "file",
	ENVIRONMENT = "environment",
	COMMAND_LINE = "command_line",
	REMOTE = "remote",
	DEFAULT = "default",
}

/**
 * Configuration value types
 */
export type ConfigValue = string | number | boolean | object | null | undefined

/**
 * Configuration schema definition
 */
export interface ConfigSchema {
	/** Configuration key */
	key: string

	/** Expected value type */
	type: "string" | "number" | "boolean" | "object" | "array"

	/** Whether this configuration is required */
	required?: boolean

	/** Default value */
	defaultValue?: ConfigValue

	/** Value validation function */
	validator?: (value: ConfigValue) => boolean | string

	/** Configuration description */
	description?: string

	/** Environment variable name */
	envVar?: string

	/** Whether this config is sensitive (should not be logged) */
	sensitive?: boolean
}

/**
 * Configuration entry with metadata
 */
export interface ConfigEntry {
	/** Configuration key */
	key: string

	/** Configuration value */
	value: ConfigValue

	/** Configuration source */
	source: ConfigSource

	/** When this config was loaded */
	loadedAt: Date

	/** Whether this config is overridden */
	isOverridden: boolean

	/** Original value before override */
	originalValue?: ConfigValue

	/** Configuration schema */
	schema?: ConfigSchema
}

/**
 * Configuration change event data
 */
export interface ConfigChangeData {
	/** Configuration key */
	key: string

	/** Old value */
	oldValue: ConfigValue

	/** New value */
	newValue: ConfigValue

	/** Configuration source */
	source: ConfigSource

	/** When the change occurred */
	timestamp: Date
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
	/** Whether validation passed */
	isValid: boolean

	/** Validation errors */
	errors: IConfigValidationError[]

	/** Validation warnings */
	warnings: ConfigValidationWarning[]
}

/**
 * Configuration validation error interface
 */
export interface IConfigValidationError {
	/** Configuration key */
	key: string

	/** Error message */
	message: string

	/** Expected type or format */
	expected?: string

	/** Actual value */
	actual?: ConfigValue
}

/**
 * Configuration validation warning
 */
export interface ConfigValidationWarning {
	/** Configuration key */
	key: string

	/** Warning message */
	message: string

	/** Suggested action */
	suggestion?: string
}

/**
 * Configuration manager options
 */
export interface ConfigManagerOptions {
	/** Current environment */
	environment?: ConfigEnvironment

	/** Configuration file paths */
	configFiles?: string[]

	/** Whether to watch for file changes */
	watchFiles?: boolean

	/** Whether to load environment variables */
	loadEnvVars?: boolean

	/** Environment variable prefix */
	envPrefix?: string

	/** Whether to enable hot reload */
	hotReload?: boolean

	/** Configuration schema */
	schema?: ConfigSchema[]

	/** Whether to validate configuration on load */
	validateOnLoad?: boolean

	/** Whether to throw on validation errors */
	throwOnValidationError?: boolean

	/** Configuration cache TTL in milliseconds */
	cacheTtl?: number

	/** Whether to enable debug logging */
	debug?: boolean
}

/**
 * Configuration file format
 */
export enum ConfigFileFormat {
	JSON = "json",
	YAML = "yaml",
	TOML = "toml",
	INI = "ini",
	JS = "js",
	TS = "ts",
}

/**
 * Configuration loader interface
 */
export interface IConfigLoader {
	/** Supported file formats */
	supportedFormats: ConfigFileFormat[]

	/** Load configuration from file */
	loadFromFile(filePath: string): Promise<Record<string, ConfigValue>>

	/** Load configuration from string */
	loadFromString(content: string, format: ConfigFileFormat): Record<string, ConfigValue>

	/** Check if file format is supported */
	supportsFormat(format: ConfigFileFormat): boolean
}

/**
 * Configuration watcher interface
 */
export interface IConfigWatcher {
	/** Start watching configuration files */
	start(): void

	/** Stop watching configuration files */
	stop(): void

	/** Add file to watch list */
	addFile(filePath: string): void

	/** Remove file from watch list */
	removeFile(filePath: string): void

	/** Whether watcher is active */
	isWatching: boolean
}

/**
 * Main Configuration Manager interface
 */
export interface IConfigManager {
	/**
	 * Get configuration value
	 */
	get<T = ConfigValue>(key: string): T | undefined

	/**
	 * Get configuration value with default
	 */
	get<T = ConfigValue>(key: string, defaultValue: T): T

	/**
	 * Set configuration value
	 */
	set(key: string, value: ConfigValue, source?: ConfigSource): void

	/**
	 * Check if configuration key exists
	 */
	has(key: string): boolean

	/**
	 * Delete configuration key
	 */
	delete(key: string): boolean

	/**
	 * Get all configuration keys
	 */
	keys(): string[]

	/**
	 * Get all configuration entries
	 */
	entries(): ConfigEntry[]

	/**
	 * Load configuration from file
	 */
	loadFromFile(filePath: string): Promise<void>

	/**
	 * Load configuration from object
	 */
	loadFromObject(config: Record<string, ConfigValue>, source?: ConfigSource): void

	/**
	 * Load configuration from environment variables
	 */
	loadFromEnv(prefix?: string): void

	/**
	 * Reload all configuration sources
	 */
	reload(): Promise<void>

	/**
	 * Validate configuration against schema
	 */
	validate(): ConfigValidationResult

	/**
	 * Get configuration for specific environment
	 */
	getEnvironmentConfig(environment: ConfigEnvironment): Record<string, ConfigValue>

	/**
	 * Override configuration temporarily
	 */
	override(key: string, value: ConfigValue): () => void

	/**
	 * Clear all overrides
	 */
	clearOverrides(): void

	/**
	 * Export configuration to object
	 */
	export(includeDefaults?: boolean, includeSensitive?: boolean): Record<string, ConfigValue>

	/**
	 * Get configuration metadata
	 */
	getMetadata(key: string): ConfigEntry | undefined

	/**
	 * Subscribe to configuration changes
	 */
	onChange(callback: (data: ConfigChangeData) => void): () => void

	/**
	 * Dispose of the configuration manager
	 */
	dispose(): void
}

/**
 * Configuration events
 */
export const ConfigEvents = {
	CONFIG_LOADED: "config.loaded",
	CONFIG_CHANGED: "config.changed",
	CONFIG_VALIDATED: "config.validated",
	CONFIG_ERROR: "config.error",
	FILE_CHANGED: "config.file.changed",
	VALIDATION_FAILED: "config.validation.failed",
} as const

/**
 * Configuration event data types
 */
export interface ConfigLoadedData {
	source: ConfigSource
	filePath?: string
	keyCount: number
	loadTime: number
}

export interface ConfigErrorData {
	error: Error
	source?: ConfigSource
	filePath?: string
	key?: string
}

export interface FileChangedData {
	filePath: string
	changeType: "added" | "changed" | "removed"
	timestamp: Date
}

export interface ValidationFailedData {
	errors: IConfigValidationError[]
	warnings: ConfigValidationWarning[]
	source?: ConfigSource
}

/**
 * Built-in configuration keys
 */
export const BuiltInConfigs = {
	// Analysis Engine
	ANALYSIS_ENABLED: "analysis.enabled",
	ANALYSIS_TIMEOUT: "analysis.timeout",
	ANALYSIS_MAX_DEPTH: "analysis.maxDepth",
	ANALYSIS_CACHE_SIZE: "analysis.cacheSize",

	// Project Analysis
	PROJECT_IGNORE_PATTERNS: "project.ignorePatterns",
	PROJECT_INCLUDE_PATTERNS: "project.includePatterns",
	PROJECT_MAX_FILE_SIZE: "project.maxFileSize",
	PROJECT_SCAN_HIDDEN: "project.scanHidden",

	// Database Analysis
	DATABASE_ENABLED: "database.enabled",
	DATABASE_TIMEOUT: "database.timeout",
	DATABASE_MAX_CONNECTIONS: "database.maxConnections",
	DATABASE_SUPPORTED_TYPES: "database.supportedTypes",

	// Code Quality
	QUALITY_ENABLED: "quality.enabled",
	QUALITY_RULES: "quality.rules",
	QUALITY_THRESHOLDS: "quality.thresholds",

	// Security Analysis
	SECURITY_ENABLED: "security.enabled",
	SECURITY_RULES: "security.rules",
	SECURITY_SCAN_DEPENDENCIES: "security.scanDependencies",

	// Performance
	PERFORMANCE_MONITORING: "performance.monitoring",
	PERFORMANCE_METRICS: "performance.metrics",
	PERFORMANCE_PROFILING: "performance.profiling",

	// Logging
	LOG_LEVEL: "log.level",
	LOG_FORMAT: "log.format",
	LOG_OUTPUT: "log.output",

	// WebView
	WEBVIEW_ENABLED: "webview.enabled",
	WEBVIEW_PORT: "webview.port",
	WEBVIEW_HOST: "webview.host",
} as const

/**
 * Default configuration schema
 */
export const DefaultConfigSchema: ConfigSchema[] = [
	{
		key: BuiltInConfigs.ANALYSIS_ENABLED,
		type: "boolean",
		defaultValue: true,
		description: "Enable analysis engine",
		envVar: "KILOCODE_ANALYSIS_ENABLED",
	},
	{
		key: BuiltInConfigs.ANALYSIS_TIMEOUT,
		type: "number",
		defaultValue: 30000,
		description: "Analysis timeout in milliseconds",
		envVar: "KILOCODE_ANALYSIS_TIMEOUT",
		validator: (value) => typeof value === "number" && value > 0,
	},
	{
		key: BuiltInConfigs.ANALYSIS_MAX_DEPTH,
		type: "number",
		defaultValue: 10,
		description: "Maximum analysis depth",
		envVar: "KILOCODE_ANALYSIS_MAX_DEPTH",
		validator: (value) => typeof value === "number" && value > 0 && value <= 50,
	},
	{
		key: BuiltInConfigs.PROJECT_MAX_FILE_SIZE,
		type: "number",
		defaultValue: 1024 * 1024, // 1MB
		description: "Maximum file size to analyze in bytes",
		envVar: "KILOCODE_PROJECT_MAX_FILE_SIZE",
	},
	{
		key: BuiltInConfigs.DATABASE_ENABLED,
		type: "boolean",
		defaultValue: true,
		description: "Enable database analysis",
		envVar: "KILOCODE_DATABASE_ENABLED",
	},
	{
		key: BuiltInConfigs.LOG_LEVEL,
		type: "string",
		defaultValue: "info",
		description: "Logging level",
		envVar: "KILOCODE_LOG_LEVEL",
		validator: (value) => ["debug", "info", "warn", "error"].includes(value as string),
	},
	{
		key: BuiltInConfigs.WEBVIEW_PORT,
		type: "number",
		defaultValue: 3000,
		description: "WebView server port",
		envVar: "KILOCODE_WEBVIEW_PORT",
		validator: (value) => typeof value === "number" && value > 0 && value < 65536,
	},
]

/**
 * Configuration error types
 */
export class ConfigError extends Error {
	constructor(
		message: string,
		public key?: string,
	) {
		super(message)
		this.name = "ConfigError"
	}
}

export class ConfigValidationErrorClass extends ConfigError {
	constructor(
		message: string,
		key?: string,
		public expected?: string,
		public actual?: ConfigValue,
	) {
		super(message, key)
		this.name = "ConfigValidationError"
	}
}

export class ConfigLoadError extends ConfigError {
	constructor(
		message: string,
		public filePath?: string,
		public cause?: Error,
	) {
		super(message)
		this.name = "ConfigLoadError"
	}
}

export class ConfigSchemaError extends ConfigError {
	constructor(message: string, key?: string) {
		super(message, key)
		this.name = "ConfigSchemaError"
	}
}
