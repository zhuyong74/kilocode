/**
 * 数据验证器类
 *
 * 提供数据验证的核心功能，支持多种验证规则和自定义验证逻辑。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent, ModelEventType } from "../../types"
import { ValidationOptions, IValidator, IRuleManager, IResultManager } from "../../types/validation"
import { ValidationResult } from "./ValidationResult"
import { ValidationRules } from "./ValidationRules"
import { EventEmitter } from "events"

export class DataValidator implements IValidator, Serializable, Validatable, Cloneable, Observable {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]

	// 数据验证器特定属性
	rules: ValidationRules
	options: ValidationOptions
	cacheEnabled: boolean
	cache: Map<string, ValidationResult>
	maxCacheSize: number

	private observers: Observer[] = []
	private eventEmitter: EventEmitter

	constructor(options?: Partial<ValidationOptions>) {
		const now = new Date()

		// 基础属性
		this.id = this.generateId()
		this.name = "data-validator"
		this.description = "数据验证器"
		this.version = "1.0.0"
		this.createdAt = now
		this.updatedAt = now
		this.metadata = {}
		this.enabled = true
		this.tags = ["validator", "validation"]

		// 数据验证器特定属性
		this.rules = new ValidationRules()
		this.options = {
			abortOnFirstError: false,
			skipDisabledRules: true,
			cacheResults: true,
			maxErrors: 100,
			maxWarnings: 100,
			maxInfo: 100,
			parallelValidation: false,
			...options,
		}

		this.cacheEnabled = this.options.cacheResults ?? true
		this.cache = new Map()
		this.maxCacheSize = 1000

		this.eventEmitter = new EventEmitter()
		this.setupEventListeners()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `validator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("validator:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	/**
	 * 验证验证器（自验证）
	 */
	async validate(): Promise<boolean> {
		try {
			// 基本的自验证逻辑
			const isValid = this.rules && this.options

			this.notifyObservers({
				type: ModelEventType.VALIDATED,
				source: this.id,
				data: { isValid },
				timestamp: new Date(),
				tags: ["validation", "self"],
			})

			return isValid
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["validation", "error", "self"],
			})
			return false
		}
	}

	/**
	 * 获取验证规则（自验证）
	 */
	getValidationRules(): any[] {
		return [
			{
				field: "name",
				rules: ["required", "string", "minLength:3", "maxLength:100"],
			},
			{
				field: "rules",
				rules: ["required", "object"],
			},
			{
				field: "options",
				rules: ["required", "object"],
			},
		]
	}

	/**
	 * 获取验证结果（自验证）
	 */
	getValidationResult(): any {
		return new ValidationResult({
			name: "DataValidator Self Validation",
			description: "数据验证器的自验证结果",
		})
	}

	/**
	 * 序列化验证器
	 */
	serialize(): string {
		try {
			const data = {
				id: this.id,
				name: this.name,
				description: this.description,
				version: this.version,
				createdAt: this.createdAt.toISOString(),
				updatedAt: this.updatedAt.toISOString(),
				metadata: this.metadata,
				enabled: this.enabled,
				tags: this.tags,
				rules: this.rules.serialize(),
				options: this.options,
				cacheEnabled: this.cacheEnabled,
				maxCacheSize: this.maxCacheSize,
			}

			this.notifyObservers({
				type: ModelEventType.SERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["serialization", "validation"],
			})

			return JSON.stringify(data, null, 2)
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["serialization", "error", "validation"],
			})
			throw error
		}
	}

	/**
	 * 反序列化验证器
	 */
	deserialize(data: string): void {
		try {
			const parsed = JSON.parse(data)

			// 基础属性
			this.id = parsed.id || this.generateId()
			this.name = parsed.name || "data-validator"
			this.description = parsed.description
			this.version = parsed.version || "1.0.0"
			this.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date()
			this.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
			this.metadata = parsed.metadata || {}
			this.enabled = parsed.enabled ?? true
			this.tags = parsed.tags || ["validator", "validation"]

			// 数据验证器特定属性
			if (parsed.rules) {
				this.rules.deserialize(parsed.rules)
			}

			this.options = { ...this.options, ...parsed.options }
			this.cacheEnabled = parsed.cacheEnabled ?? true
			this.maxCacheSize = parsed.maxCacheSize || 1000

			this.notifyObservers({
				type: ModelEventType.DESERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["deserialization", "validation"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["deserialization", "error", "validation"],
			})
			throw error
		}
	}

	/**
	 * 获取序列化格式
	 */
	getSerializationFormat(): string {
		return "json"
	}

	/**
	 * 克隆验证器
	 */
	clone(): this {
		const serialized = this.serialize()
		const cloned = new (this.constructor as any)()
		cloned.deserialize(serialized)

		this.notifyObservers({
			type: ModelEventType.CLONED,
			source: this.id,
			data: { clonedId: cloned.id },
			timestamp: new Date(),
			tags: ["clone", "validation"],
		})

		return cloned
	}

	/**
	 * 深度克隆验证器
	 */
	deepClone(): this {
		return this.clone()
	}

	/**
	 * 添加观察者
	 */
	addObserver(observer: Observer): void {
		this.observers.push(observer)
	}

	/**
	 * 移除观察者
	 */
	removeObserver(observer: Observer): void {
		const index = this.observers.indexOf(observer)
		if (index > -1) {
			this.observers.splice(index, 1)
		}
	}

	/**
	 * 通知观察者
	 */
	notifyObservers(event: ModelEvent): void {
		this.observers.forEach((observer) => {
			try {
				observer.update(event)
			} catch (error) {
				console.error("Error notifying observer:", error)
			}
		})
	}

	/**
	 * 验证数据
	 */
	async validate(data: any, options?: Partial<ValidationOptions>): Promise<ValidationResult> {
		const mergedOptions = { ...this.options, ...options }
		const cacheKey = this.generateCacheKey(data, mergedOptions)

		// 检查缓存
		if (this.cacheEnabled && this.cache.has(cacheKey)) {
			const cachedResult = this.cache.get(cacheKey)!
			this.notifyObservers({
				type: ModelEventType.INFO,
				source: this.id,
				data: { cacheHit: true, cacheKey },
				timestamp: new Date(),
				tags: ["cache", "hit", "validation"],
			})
			return cachedResult
		}

		const startTime = Date.now()
		const result = new ValidationResult({
			name: "Data Validation Result",
			description: "数据验证结果",
		})

		try {
			// 执行验证
			const validationResult = await this.rules.validateData(data, {
				field: "root",
				data,
				options: mergedOptions,
			})

			// 合并结果
			result.merge(validationResult)

			// 限制错误数量
			if (mergedOptions.maxErrors && result.errors.length > mergedOptions.maxErrors) {
				result.errors = result.errors.slice(0, mergedOptions.maxErrors)
			}

			if (mergedOptions.maxWarnings && result.warnings.length > mergedOptions.maxWarnings) {
				result.warnings = result.warnings.slice(0, mergedOptions.maxWarnings)
			}

			if (mergedOptions.maxInfo && result.info.length > mergedOptions.maxInfo) {
				result.info = result.info.slice(0, mergedOptions.maxInfo)
			}

			// 更新统计信息
			const executionTime = Date.now() - startTime
			result.updateStats({
				executionTime,
				totalRules: this.rules.getAllRules().length,
				passedRules: result.isValid ? this.rules.getAllRules().length : 0,
				failedRules: result.errors.length,
			})

			// 缓存结果
			if (this.cacheEnabled) {
				this.addToCache(cacheKey, result)
			}

			this.notifyObservers({
				type: ModelEventType.VALIDATED,
				source: this.id,
				data: {
					dataValidated: true,
					isValid: result.isValid,
					executionTime,
					errorCount: result.errors.length,
					warningCount: result.warnings.length,
				},
				timestamp: new Date(),
				tags: ["validation", "data"],
			})
		} catch (error) {
			const validationError = result.createError("validation_error", `验证过程失败: ${error.message}`, "root", {
				error: error.message,
			})
			result.addError(validationError)

			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: {
					dataValidated: false,
					error: error.message,
				},
				timestamp: new Date(),
				tags: ["validation", "error", "data"],
			})
		}

		return result
	}

	/**
	 * 验证字段
	 */
	async validateField(
		field: string,
		value: any,
		ruleNames: string[],
		options?: Partial<ValidationOptions>,
	): Promise<ValidationResult> {
		const mergedOptions = { ...this.options, ...options }
		const cacheKey = this.generateCacheKey({ field, value, ruleNames }, mergedOptions)

		// 检查缓存
		if (this.cacheEnabled && this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey)!
		}

		const result = await this.rules.validateField(field, value, ruleNames, {
			field,
			data: value,
			options: mergedOptions,
		})

		// 限制结果数量
		if (mergedOptions.maxErrors && result.errors.length > mergedOptions.maxErrors) {
			result.errors = result.errors.slice(0, mergedOptions.maxErrors)
		}

		if (mergedOptions.maxWarnings && result.warnings.length > mergedOptions.maxWarnings) {
			result.warnings = result.warnings.slice(0, mergedOptions.maxWarnings)
		}

		if (mergedOptions.maxInfo && result.info.length > mergedOptions.maxInfo) {
			result.info = result.info.slice(0, mergedOptions.maxInfo)
		}

		// 缓存结果
		if (this.cacheEnabled) {
			this.addToCache(cacheKey, result)
		}

		return result
	}

	/**
	 * 执行规则集
	 */
	async executeRuleSet(setName: string, data: any, options?: Partial<ValidationOptions>): Promise<ValidationResult> {
		const mergedOptions = { ...this.options, ...options }
		const cacheKey = this.generateCacheKey({ setName, data }, mergedOptions)

		// 检查缓存
		if (this.cacheEnabled && this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey)!
		}

		const result = await this.rules.executeRuleSet(setName, data, {
			field: "root",
			data,
			options: mergedOptions,
		})

		// 缓存结果
		if (this.cacheEnabled) {
			this.addToCache(cacheKey, result)
		}

		return result
	}

	/**
	 * 生成缓存键
	 */
	private generateCacheKey(data: any, options: ValidationOptions): string {
		try {
			const dataStr = JSON.stringify(data)
			const optionsStr = JSON.stringify(options)
			return `${dataStr}::${optionsStr}`
		} catch (error) {
			return `${Date.now()}-${Math.random()}`
		}
	}

	/**
	 * 添加到缓存
	 */
	private addToCache(key: string, result: ValidationResult): void {
		// 清理缓存如果太大
		if (this.cache.size >= this.maxCacheSize) {
			const firstKey = this.cache.keys().next().value
			this.cache.delete(firstKey)
		}

		this.cache.set(key, result)
	}

	/**
	 * 清除缓存
	 */
	clearCache(): void {
		this.cache.clear()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { cacheCleared: true },
			timestamp: new Date(),
			tags: ["cache", "clear", "validation"],
		})
	}

	/**
	 * 获取缓存统计
	 */
	getCacheStats(): { size: number; maxSize: number; hitRate: number } {
		return {
			size: this.cache.size,
			maxSize: this.maxCacheSize,
			hitRate: 0, // 简化实现，实际应该跟踪命中率
		}
	}

	/**
	 * 启用缓存
	 */
	enableCache(): void {
		this.cacheEnabled = true

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { cacheEnabled: true },
			timestamp: new Date(),
			tags: ["cache", "enable", "validation"],
		})
	}

	/**
	 * 禁用缓存
	 */
	disableCache(): void {
		this.cacheEnabled = false
		this.clearCache()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { cacheDisabled: true },
			timestamp: new Date(),
			tags: ["cache", "disable", "validation"],
		})
	}

	/**
	 * 更新选项
	 */
	updateOptions(options: Partial<ValidationOptions>): void {
		const oldOptions = { ...this.options }
		this.options = { ...this.options, ...options }

		// 如果缓存选项改变，相应处理
		if (oldOptions.cacheResults !== this.options.cacheResults) {
			if (this.options.cacheResults) {
				this.enableCache()
			} else {
				this.disableCache()
			}
		}

		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { optionsUpdated: options },
			timestamp: new Date(),
			tags: ["options", "update", "validation"],
		})
	}

	/**
	 * 获取规则管理器
	 */
	getRuleManager(): IRuleManager {
		return {
			addRule: (rule) => this.rules.addRule(rule),
			removeRule: (name) => this.rules.removeRule(name),
			getRule: (name) => this.rules.getRule(name),
			getAllRules: () => this.rules.getAllRules(),
			enableRule: (name) => this.rules.enableRule(name),
			disableRule: (name) => this.rules.disableRule(name),
		}
	}

	/**
	 * 获取结果管理器
	 */
	getResultManager(): IResultManager {
		return {
			createResult: (options) => new ValidationResult(options),
			mergeResults: (results) => {
				const merged = new ValidationResult()
				results.forEach((result) => merged.merge(result))
				return merged
			},
			filterResults: (results, criteria) => {
				return results.filter((result) => {
					if (criteria.isValid !== undefined && result.isValid !== criteria.isValid) return false
					if (criteria.maxErrors !== undefined && result.errors.length > criteria.maxErrors) return false
					if (criteria.maxWarnings !== undefined && result.warnings.length > criteria.maxWarnings)
						return false
					return true
				})
			},
		}
	}

	/**
	 * 获取验证器统计
	 */
	getValidatorStats(): Record<string, any> {
		const ruleStats = this.rules.getRuleStats()
		const cacheStats = this.getCacheStats()

		return {
			id: this.id,
			name: this.name,
			enabled: this.enabled,
			cacheEnabled: this.cacheEnabled,
			ruleStats,
			cacheStats,
			options: this.options,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		}
	}

	/**
	 * 重置验证器
	 */
	reset(): void {
		this.clearCache()
		this.options = {
			abortOnFirstError: false,
			skipDisabledRules: true,
			cacheResults: true,
			maxErrors: 100,
			maxWarnings: 100,
			maxInfo: 100,
			parallelValidation: false,
		}

		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { reset: true },
			timestamp: new Date(),
			tags: ["reset", "validation"],
		})
	}
}
