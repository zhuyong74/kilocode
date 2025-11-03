/**
 * Configuration Manager Implementation
 *
 * A comprehensive configuration management system for the Kilocode Analysis Engine
 * that supports multiple configuration sources, validation, hot reload, and
 * environment-specific configurations.
 *
 * @author Kilocode Analysis Team
 * @version 1.0.0
 */

import * as fs from "fs"
import * as path from "path"
import { EventBus } from "./EventBus"
import {
	IConfigManager,
	IConfigLoader,
	IConfigWatcher,
	ConfigValue,
	ConfigEntry,
	ConfigSchema,
	ConfigSource,
	ConfigEnvironment,
	ConfigFileFormat,
	ConfigManagerOptions,
	ConfigChangeData,
	ConfigValidationResult,
	IConfigValidationError,
	ConfigValidationWarning,
	ConfigEvents,
	ConfigLoadedData,
	ConfigErrorData,
	FileChangedData,
	ValidationFailedData,
	BuiltInConfigs,
	DefaultConfigSchema,
	ConfigError,
	ConfigValidationErrorClass,
	ConfigLoadError,
	ConfigSchemaError,
} from "../types/config"

/**
 * Configuration File Loader Implementation
 */
class ConfigLoader implements IConfigLoader {
	public readonly supportedFormats = [ConfigFileFormat.JSON, ConfigFileFormat.JS, ConfigFileFormat.TS]

	async loadFromFile(filePath: string): Promise<Record<string, ConfigValue>> {
		const ext = path.extname(filePath).toLowerCase()
		const format = this._getFormatFromExtension(ext)

		if (!this.supportsFormat(format)) {
			throw new ConfigLoadError(`Unsupported file format: ${ext}`, filePath)
		}

		try {
			const content = await fs.promises.readFile(filePath, "utf-8")
			return this.loadFromString(content, format)
		} catch (error) {
			throw new ConfigLoadError(
				`Failed to load config from ${filePath}: ${(error as Error).message}`,
				filePath,
				error as Error,
			)
		}
	}

	loadFromString(content: string, format: ConfigFileFormat): Record<string, ConfigValue> {
		try {
			switch (format) {
				case ConfigFileFormat.JSON:
					return JSON.parse(content)

				case ConfigFileFormat.JS:
				case ConfigFileFormat.TS:
					// For JS/TS files, we would need to evaluate them
					// This is a simplified implementation
					return this._evaluateJavaScript(content)

				default:
					throw new ConfigLoadError(`Unsupported format: ${format}`)
			}
		} catch (error) {
			throw new ConfigLoadError(
				`Failed to parse config content: ${(error as Error).message}`,
				undefined,
				error as Error,
			)
		}
	}

	supportsFormat(format: ConfigFileFormat): boolean {
		return this.supportedFormats.includes(format)
	}

	private _getFormatFromExtension(ext: string): ConfigFileFormat {
		switch (ext) {
			case ".json":
				return ConfigFileFormat.JSON
			case ".js":
				return ConfigFileFormat.JS
			case ".ts":
				return ConfigFileFormat.TS
			case ".yaml":
			case ".yml":
				return ConfigFileFormat.YAML
			case ".toml":
				return ConfigFileFormat.TOML
			case ".ini":
				return ConfigFileFormat.INI
			default:
				return ConfigFileFormat.JSON
		}
	}

	private _evaluateJavaScript(content: string): Record<string, ConfigValue> {
		// This is a simplified implementation
		// In a real scenario, you would use a proper JS/TS evaluator
		try {
			// Remove export statements and evaluate
			const cleanContent = content.replace(/export\s+default\s+/, "return ").replace(/export\s+/, "")

			const func = new Function(cleanContent)
			return func() || {}
		} catch (error) {
			throw new ConfigLoadError(`Failed to evaluate JavaScript config: ${(error as Error).message}`)
		}
	}
}

/**
 * Configuration File Watcher Implementation
 */
class ConfigWatcher implements IConfigWatcher {
	private _watchers = new Map<string, fs.FSWatcher>()
	private _isWatching = false
	private _eventBus: EventBus

	constructor(eventBus: EventBus) {
		this._eventBus = eventBus
	}

	start(): void {
		this._isWatching = true
	}

	stop(): void {
		this._isWatching = false
		for (const [filePath, watcher] of this._watchers) {
			watcher.close()
		}
		this._watchers.clear()
	}

	addFile(filePath: string): void {
		if (this._watchers.has(filePath)) {
			return
		}

		try {
			const watcher = fs.watch(filePath, (eventType) => {
				if (!this._isWatching) return

				this._eventBus.emit(ConfigEvents.FILE_CHANGED, {
					filePath,
					changeType: eventType === "rename" ? "removed" : "changed",
					timestamp: new Date(),
				} as FileChangedData)
			})

			this._watchers.set(filePath, watcher)
		} catch (error) {
			console.warn(`Failed to watch config file ${filePath}:`, error)
		}
	}

	removeFile(filePath: string): void {
		const watcher = this._watchers.get(filePath)
		if (watcher) {
			watcher.close()
			this._watchers.delete(filePath)
		}
	}

	get isWatching(): boolean {
		return this._isWatching
	}
}

/**
 * Main Configuration Manager Implementation
 */
export class ConfigManager implements IConfigManager {
	private readonly _entries = new Map<string, ConfigEntry>()
	private readonly _overrides = new Map<string, ConfigValue>()
	private readonly _schema = new Map<string, ConfigSchema>()
	private readonly _options: Required<ConfigManagerOptions>
	private readonly _eventBus: EventBus
	private readonly _loader: ConfigLoader
	private readonly _watcher: ConfigWatcher
	private readonly _changeCallbacks = new Set<(data: ConfigChangeData) => void>()
	private _disposed = false

	constructor(options: ConfigManagerOptions = {}, eventBus?: EventBus) {
		this._options = {
			environment: options.environment ?? ConfigEnvironment.DEVELOPMENT,
			configFiles: options.configFiles ?? [],
			watchFiles: options.watchFiles ?? true,
			loadEnvVars: options.loadEnvVars ?? true,
			envPrefix: options.envPrefix ?? "KILOCODE_",
			hotReload: options.hotReload ?? true,
			schema: options.schema ?? DefaultConfigSchema,
			validateOnLoad: options.validateOnLoad ?? true,
			throwOnValidationError: options.throwOnValidationError ?? false,
			cacheTtl: options.cacheTtl ?? 300000, // 5 minutes
			debug: options.debug ?? false,
		}

		this._eventBus = eventBus || new EventBus()
		this._loader = new ConfigLoader()
		this._watcher = new ConfigWatcher(this._eventBus)

		// Load schema
		this._loadSchema(this._options.schema)

		// Set up file change listener
		this._eventBus.on(ConfigEvents.FILE_CHANGED, this._handleFileChange.bind(this))

		// Initialize
		this._initialize()
	}

	/**
	 * Get configuration value
	 */
	get<T = ConfigValue>(key: string, defaultValue?: T): T | undefined {
		this._ensureNotDisposed()

		// Check overrides first
		if (this._overrides.has(key)) {
			return this._overrides.get(key) as T
		}

		// Check entries
		const entry = this._entries.get(key)
		if (entry) {
			return entry.value as T
		}

		// Check schema for default value
		const schema = this._schema.get(key)
		if (schema && schema.defaultValue !== undefined) {
			return schema.defaultValue as T
		}

		return defaultValue
	}

	/**
	 * Set configuration value
	 */
	set(key: string, value: ConfigValue, source: ConfigSource = ConfigSource.DEFAULT): void {
		this._ensureNotDisposed()

		const oldValue = this.get(key)
		const entry: ConfigEntry = {
			key,
			value,
			source,
			loadedAt: new Date(),
			isOverridden: this._overrides.has(key),
			originalValue: this._overrides.has(key) ? this._entries.get(key)?.value : undefined,
			schema: this._schema.get(key),
		}

		this._entries.set(key, entry)

		// Validate if schema exists
		if (this._schema.has(key)) {
			const validationResult = this._validateSingle(key, value)
			if (!validationResult.isValid && this._options.throwOnValidationError) {
				throw new ConfigValidationErrorClass(validationResult.errors[0]?.message || "Validation failed", key)
			}
		}

		// Emit change event
		const changeData: ConfigChangeData = {
			key,
			oldValue,
			newValue: value,
			source,
			timestamp: new Date(),
		}

		this._eventBus.emit(ConfigEvents.CONFIG_CHANGED, changeData)
		this._notifyChangeCallbacks(changeData)

		if (this._options.debug) {
			console.debug(`[ConfigManager] Set config: ${key} = ${value} (${source})`)
		}
	}

	/**
	 * Check if configuration key exists
	 */
	has(key: string): boolean {
		return this._overrides.has(key) || this._entries.has(key) || this._schema.has(key)
	}

	/**
	 * Delete configuration key
	 */
	delete(key: string): boolean {
		this._ensureNotDisposed()

		const hadOverride = this._overrides.delete(key)
		const hadEntry = this._entries.delete(key)

		if (hadOverride || hadEntry) {
			this._eventBus.emit(ConfigEvents.CONFIG_CHANGED, {
				key,
				oldValue: this.get(key),
				newValue: undefined,
				source: ConfigSource.DEFAULT,
				timestamp: new Date(),
			} as ConfigChangeData)

			return true
		}

		return false
	}

	/**
	 * Get all configuration keys
	 */
	keys(): string[] {
		const keys = new Set<string>()

		for (const key of this._schema.keys()) keys.add(key)
		for (const key of this._entries.keys()) keys.add(key)
		for (const key of this._overrides.keys()) keys.add(key)

		return Array.from(keys)
	}

	/**
	 * Get all configuration entries
	 */
	entries(): ConfigEntry[] {
		const entries: ConfigEntry[] = []

		for (const key of this.keys()) {
			const entry = this.getMetadata(key)
			if (entry) {
				entries.push(entry)
			}
		}

		return entries
	}

	/**
	 * Load configuration from file
	 */
	async loadFromFile(filePath: string): Promise<void> {
		this._ensureNotDisposed()

		const startTime = performance.now()

		try {
			const config = await this._loader.loadFromFile(filePath)
			this.loadFromObject(config, ConfigSource.FILE)

			// Add to watcher if enabled
			if (this._options.watchFiles && this._options.hotReload) {
				this._watcher.addFile(filePath)
			}

			const loadTime = performance.now() - startTime

			this._eventBus.emit(ConfigEvents.CONFIG_LOADED, {
				source: ConfigSource.FILE,
				filePath,
				keyCount: Object.keys(config).length,
				loadTime,
			} as ConfigLoadedData)

			if (this._options.debug) {
				console.debug(`[ConfigManager] Loaded config from ${filePath} (${loadTime.toFixed(2)}ms)`)
			}
		} catch (error) {
			this._eventBus.emit(ConfigEvents.CONFIG_ERROR, {
				error: error as Error,
				source: ConfigSource.FILE,
				filePath,
			} as ConfigErrorData)

			throw error
		}
	}

	/**
	 * Load configuration from object
	 */
	loadFromObject(config: Record<string, ConfigValue>, source: ConfigSource = ConfigSource.DEFAULT): void {
		this._ensureNotDisposed()

		for (const [key, value] of Object.entries(config)) {
			this.set(key, value, source)
		}

		if (this._options.validateOnLoad) {
			const validationResult = this.validate()
			if (!validationResult.isValid) {
				this._eventBus.emit(ConfigEvents.VALIDATION_FAILED, {
					errors: validationResult.errors,
					warnings: validationResult.warnings,
					source,
				} as ValidationFailedData)

				if (this._options.throwOnValidationError) {
					throw new ConfigValidationErrorClass(
						`Configuration validation failed: ${validationResult.errors[0]?.message}`,
					)
				}
			}
		}
	}

	/**
	 * Load configuration from environment variables
	 */
	loadFromEnv(prefix: string = this._options.envPrefix): void {
		this._ensureNotDisposed()

		const envConfig: Record<string, ConfigValue> = {}

		for (const [envKey, envValue] of Object.entries(process.env)) {
			if (envKey.startsWith(prefix)) {
				const configKey = envKey.substring(prefix.length).toLowerCase().replace(/_/g, ".")
				envConfig[configKey] = this._parseEnvValue(envValue)
			}
		}

		// Also check schema for specific env vars
		for (const schema of this._schema.values()) {
			if (schema.envVar && process.env[schema.envVar]) {
				envConfig[schema.key] = this._parseEnvValue(process.env[schema.envVar])
			}
		}

		this.loadFromObject(envConfig, ConfigSource.ENVIRONMENT)

		if (this._options.debug) {
			console.debug(`[ConfigManager] Loaded ${Object.keys(envConfig).length} config(s) from environment`)
		}
	}

	/**
	 * Reload all configuration sources
	 */
	async reload(): Promise<void> {
		this._ensureNotDisposed()

		// Clear current entries (but keep overrides and schema)
		this._entries.clear()

		// Reload from files
		for (const filePath of this._options.configFiles) {
			try {
				await this.loadFromFile(filePath)
			} catch (error) {
				console.warn(`Failed to reload config from ${filePath}:`, error)
			}
		}

		// Reload from environment
		if (this._options.loadEnvVars) {
			this.loadFromEnv()
		}

		if (this._options.debug) {
			console.debug("[ConfigManager] Configuration reloaded")
		}
	}

	/**
	 * Validate configuration against schema
	 */
	validate(): ConfigValidationResult {
		const errors: IConfigValidationError[] = []
		const warnings: ConfigValidationWarning[] = []

		for (const [key, schema] of this._schema) {
			const value = this.get(key)
			const result = this._validateSingle(key, value)

			errors.push(...result.errors)
			warnings.push(...result.warnings)
		}

		const result: ConfigValidationResult = {
			isValid: errors.length === 0,
			errors,
			warnings,
		}

		this._eventBus.emit(ConfigEvents.CONFIG_VALIDATED, result)

		return result
	}

	/**
	 * Get configuration for specific environment
	 */
	getEnvironmentConfig(environment: ConfigEnvironment): Record<string, ConfigValue> {
		const config: Record<string, ConfigValue> = {}

		for (const key of this.keys()) {
			const value = this.get(key)
			if (value !== undefined) {
				config[key] = value
			}
		}

		return config
	}

	/**
	 * Override configuration temporarily
	 */
	override(key: string, value: ConfigValue): () => void {
		this._ensureNotDisposed()

		const oldValue = this.get(key)
		this._overrides.set(key, value)

		// Update entry metadata
		const entry = this._entries.get(key)
		if (entry) {
			entry.isOverridden = true
			entry.originalValue = entry.value
		}

		// Emit change event
		this._eventBus.emit(ConfigEvents.CONFIG_CHANGED, {
			key,
			oldValue,
			newValue: value,
			source: ConfigSource.DEFAULT,
			timestamp: new Date(),
		} as ConfigChangeData)

		// Return function to remove override
		return () => {
			this._overrides.delete(key)

			const currentEntry = this._entries.get(key)
			if (currentEntry) {
				currentEntry.isOverridden = false
				currentEntry.originalValue = undefined
			}

			this._eventBus.emit(ConfigEvents.CONFIG_CHANGED, {
				key,
				oldValue: value,
				newValue: this.get(key),
				source: ConfigSource.DEFAULT,
				timestamp: new Date(),
			} as ConfigChangeData)
		}
	}

	/**
	 * Clear all overrides
	 */
	clearOverrides(): void {
		this._ensureNotDisposed()

		for (const key of this._overrides.keys()) {
			const oldValue = this.get(key)
			this._overrides.delete(key)

			const entry = this._entries.get(key)
			if (entry) {
				entry.isOverridden = false
				entry.originalValue = undefined
			}

			this._eventBus.emit(ConfigEvents.CONFIG_CHANGED, {
				key,
				oldValue,
				newValue: this.get(key),
				source: ConfigSource.DEFAULT,
				timestamp: new Date(),
			} as ConfigChangeData)
		}

		if (this._options.debug) {
			console.debug("[ConfigManager] Cleared all overrides")
		}
	}

	/**
	 * Export configuration to object
	 */
	export(includeDefaults = true, includeSensitive = false): Record<string, ConfigValue> {
		const config: Record<string, ConfigValue> = {}

		for (const key of this.keys()) {
			const schema = this._schema.get(key)

			// Skip sensitive configs if not requested
			if (!includeSensitive && schema?.sensitive) {
				continue
			}

			const value = this.get(key)

			// Skip default values if not requested
			if (!includeDefaults && schema && value === schema.defaultValue) {
				continue
			}

			if (value !== undefined) {
				config[key] = value
			}
		}

		return config
	}

	/**
	 * Get configuration metadata
	 */
	getMetadata(key: string): ConfigEntry | undefined {
		const value = this.get(key)
		if (value === undefined && !this._schema.has(key)) {
			return undefined
		}

		const entry = this._entries.get(key)
		const schema = this._schema.get(key)

		return {
			key,
			value: value ?? schema?.defaultValue,
			source: entry?.source ?? ConfigSource.DEFAULT,
			loadedAt: entry?.loadedAt ?? new Date(),
			isOverridden: this._overrides.has(key),
			originalValue: entry?.originalValue,
			schema,
		}
	}

	/**
	 * Subscribe to configuration changes
	 */
	onChange(callback: (data: ConfigChangeData) => void): () => void {
		this._changeCallbacks.add(callback)

		return () => {
			this._changeCallbacks.delete(callback)
		}
	}

	/**
	 * Dispose of the configuration manager
	 */
	dispose(): void {
		if (this._disposed) return

		this._watcher.stop()
		this._changeCallbacks.clear()
		this._entries.clear()
		this._overrides.clear()
		this._schema.clear()
		this._disposed = true

		if (this._options.debug) {
			console.debug("[ConfigManager] Configuration manager disposed")
		}
	}

	/**
	 * Initialize configuration manager
	 */
	private async _initialize(): Promise<void> {
		try {
			// Load from files
			for (const filePath of this._options.configFiles) {
				try {
					await this.loadFromFile(filePath)
				} catch (error) {
					console.warn(`Failed to load config from ${filePath}:`, error)
				}
			}

			// Load from environment
			if (this._options.loadEnvVars) {
				this.loadFromEnv()
			}

			// Start file watcher
			if (this._options.watchFiles && this._options.hotReload) {
				this._watcher.start()
			}

			if (this._options.debug) {
				console.debug("[ConfigManager] Configuration manager initialized")
			}
		} catch (error) {
			console.error("[ConfigManager] Failed to initialize:", error)
			throw error
		}
	}

	/**
	 * Load configuration schema
	 */
	private _loadSchema(schemas: ConfigSchema[]): void {
		for (const schema of schemas) {
			this._schema.set(schema.key, schema)
		}
	}

	/**
	 * Validate single configuration value
	 */
	private _validateSingle(key: string, value: ConfigValue): ConfigValidationResult {
		const errors: IConfigValidationError[] = []
		const warnings: ConfigValidationWarning[] = []
		const schema = this._schema.get(key)

		if (!schema) {
			return { isValid: true, errors, warnings }
		}

		// Check required
		if (schema.required && (value === null || value === undefined)) {
			errors.push({
				key,
				message: `Required configuration '${key}' is missing`,
				expected: schema.type,
			})
			return { isValid: false, errors, warnings }
		}

		// Skip validation if value is undefined and not required
		if (value === undefined || value === null) {
			return { isValid: true, errors, warnings }
		}

		// Check type
		const actualType = Array.isArray(value) ? "array" : typeof value
		if (schema.type !== actualType) {
			errors.push({
				key,
				message: `Configuration '${key}' has wrong type`,
				expected: schema.type,
				actual: value,
			})
		}

		// Custom validation
		if (schema.validator) {
			const validationResult = schema.validator(value)
			if (validationResult !== true) {
				errors.push({
					key,
					message: typeof validationResult === "string" ? validationResult : `Validation failed for '${key}'`,
					actual: value,
				})
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		}
	}

	/**
	 * Parse environment variable value
	 */
	private _parseEnvValue(value: string | undefined): ConfigValue {
		if (!value) return undefined

		// Try to parse as JSON first
		try {
			return JSON.parse(value)
		} catch {
			// Return as string if JSON parsing fails
			return value
		}
	}

	/**
	 * Handle file change events
	 */
	private async _handleFileChange(data: FileChangedData): Promise<void> {
		if (!this._options.hotReload) return

		try {
			await this.loadFromFile(data.filePath)

			if (this._options.debug) {
				console.debug(`[ConfigManager] Reloaded config from ${data.filePath} due to file change`)
			}
		} catch (error) {
			console.warn(`Failed to reload config from ${data.filePath}:`, error)
		}
	}

	/**
	 * Notify change callbacks
	 */
	private _notifyChangeCallbacks(data: ConfigChangeData): void {
		for (const callback of this._changeCallbacks) {
			try {
				callback(data)
			} catch (error) {
				console.warn("Error in config change callback:", error)
			}
		}
	}

	/**
	 * Ensure manager is not disposed
	 */
	private _ensureNotDisposed(): void {
		if (this._disposed) {
			throw new ConfigError("Configuration manager has been disposed")
		}
	}

	/**
	 * Get configuration manager statistics
	 */
	get stats() {
		return {
			entryCount: this._entries.size,
			overrideCount: this._overrides.size,
			schemaCount: this._schema.size,
			watchedFileCount: this._watcher.isWatching ? this._options.configFiles.length : 0,
			isDisposed: this._disposed,
		}
	}

	/**
	 * Get current environment
	 */
	get environment(): ConfigEnvironment {
		return this._options.environment
	}
}
