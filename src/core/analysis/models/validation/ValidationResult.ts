/**
 * 验证结果类
 *
 * 提供数据验证结果的管理和报告。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent, ModelEventType } from "../../types"
import {
	ValidationResult as IValidationResult,
	ValidationError,
	ValidationWarning,
	ValidationInfo,
	ValidationStats,
} from "../../types/validation"
import { EventEmitter } from "events"

export class ValidationResult implements IValidationResult, Serializable, Validatable, Cloneable, Observable {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]

	// 验证结果特定属性
	isValid: boolean
	errors: ValidationError[]
	warnings: ValidationWarning[]
	info: ValidationInfo[]
	stats: ValidationStats

	private observers: Observer[] = []
	private eventEmitter: EventEmitter

	constructor(result?: Partial<IValidationResult>) {
		const now = new Date()

		// 基础属性
		this.id = result?.id || this.generateId()
		this.name = result?.name || "validation-result"
		this.description = result?.description
		this.version = result?.version || "1.0.0"
		this.createdAt = result?.createdAt || now
		this.updatedAt = result?.updatedAt || now
		this.metadata = result?.metadata || {}
		this.enabled = result?.enabled ?? true
		this.tags = result?.tags || []

		// 验证结果特定属性
		this.isValid = result?.isValid ?? true
		this.errors = result?.errors || []
		this.warnings = result?.warnings || []
		this.info = result?.info || []
		this.stats = result?.stats || {
			totalRules: 0,
			passedRules: 0,
			failedRules: 0,
			warningRules: 0,
			errorCount: 0,
			warningCount: 0,
			infoCount: 0,
			executionTime: 0,
		}

		this.eventEmitter = new EventEmitter()
		this.setupEventListeners()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("validation:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	/**
	 * 验证结果（自验证）
	 */
	async validate(): Promise<boolean> {
		try {
			// 基本的自验证逻辑
			const isValid = this.errors.length === 0

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
				field: "isValid",
				rules: ["required", "boolean"],
			},
			{
				field: "errors",
				rules: ["required", "array"],
			},
			{
				field: "warnings",
				rules: ["required", "array"],
			},
			{
				field: "info",
				rules: ["required", "array"],
			},
			{
				field: "stats",
				rules: ["required", "object"],
			},
		]
	}

	/**
	 * 获取验证结果（自验证）
	 */
	getValidationResult(): any {
		return this
	}

	/**
	 * 序列化结果
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
				isValid: this.isValid,
				errors: this.errors,
				warnings: this.warnings,
				info: this.info,
				stats: this.stats,
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
	 * 反序列化结果
	 */
	deserialize(data: string): void {
		try {
			const parsed = JSON.parse(data)

			// 基础属性
			this.id = parsed.id || this.generateId()
			this.name = parsed.name || "validation-result"
			this.description = parsed.description
			this.version = parsed.version || "1.0.0"
			this.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date()
			this.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
			this.metadata = parsed.metadata || {}
			this.enabled = parsed.enabled ?? true
			this.tags = parsed.tags || []

			// 验证结果特定属性
			this.isValid = parsed.isValid ?? true
			this.errors = parsed.errors || []
			this.warnings = parsed.warnings || []
			this.info = parsed.info || []
			this.stats = parsed.stats || {
				totalRules: 0,
				passedRules: 0,
				failedRules: 0,
				warningRules: 0,
				errorCount: 0,
				warningCount: 0,
				infoCount: 0,
				executionTime: 0,
			}

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
	 * 克隆结果
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
	 * 深度克隆结果
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
	 * 添加错误
	 */
	addError(error: ValidationError): void {
		this.errors.push(error)
		this.isValid = false
		this.stats.errorCount++
		this.stats.failedRules++
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.ERROR,
			source: this.id,
			data: { errorAdded: error },
			timestamp: new Date(),
			tags: ["error", "add", "validation"],
		})
	}

	/**
	 * 添加警告
	 */
	addWarning(warning: ValidationWarning): void {
		this.warnings.push(warning)
		this.stats.warningCount++
		this.stats.warningRules++
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.WARNING,
			source: this.id,
			data: { warningAdded: warning },
			timestamp: new Date(),
			tags: ["warning", "add", "validation"],
		})
	}

	/**
	 * 添加信息
	 */
	addInfo(info: ValidationInfo): void {
		this.info.push(info)
		this.stats.infoCount++
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.INFO,
			source: this.id,
			data: { infoAdded: info },
			timestamp: new Date(),
			tags: ["info", "add", "validation"],
		})
	}

	/**
	 * 创建错误
	 */
	createError(code: string, message: string, field?: string, details?: Record<string, any>): ValidationError {
		return {
			code,
			message,
			field,
			severity: "error",
			timestamp: new Date(),
			details,
		}
	}

	/**
	 * 创建警告
	 */
	createWarning(code: string, message: string, field?: string, details?: Record<string, any>): ValidationWarning {
		return {
			code,
			message,
			field,
			severity: "warning",
			timestamp: new Date(),
			details,
		}
	}

	/**
	 * 创建信息
	 */
	createInfo(code: string, message: string, field?: string, details?: Record<string, any>): ValidationInfo {
		return {
			code,
			message,
			field,
			severity: "info",
			timestamp: new Date(),
			details,
		}
	}

	/**
	 * 获取字段错误
	 */
	getFieldErrors(field: string): ValidationError[] {
		return this.errors.filter((error) => error.field === field)
	}

	/**
	 * 获取字段警告
	 */
	getFieldWarnings(field: string): ValidationWarning[] {
		return this.warnings.filter((warning) => warning.field === field)
	}

	/**
	 * 获取字段信息
	 */
	getFieldInfo(field: string): ValidationInfo[] {
		return this.info.filter((info) => info.field === field)
	}

	/**
	 * 获取错误代码
	 */
	getErrorsByCode(code: string): ValidationError[] {
		return this.errors.filter((error) => error.code === code)
	}

	/**
	 * 获取警告代码
	 */
	getWarningsByCode(code: string): ValidationWarning[] {
		return this.warnings.filter((warning) => warning.code === code)
	}

	/**
	 * 获取信息代码
	 */
	getInfoByCode(code: string): ValidationInfo[] {
		return this.info.filter((info) => info.code === code)
	}

	/**
	 * 获取严重错误
	 */
	getCriticalErrors(): ValidationError[] {
		return this.errors.filter((error) => error.severity === "critical")
	}

	/**
	 * 获取高优先级警告
	 */
	getHighPriorityWarnings(): ValidationWarning[] {
		return this.warnings.filter((warning) => warning.severity === "high")
	}

	/**
	 * 获取统计信息
	 */
	getStats(): ValidationStats {
		return { ...this.stats }
	}

	/**
	 * 更新统计信息
	 */
	updateStats(updates: Partial<ValidationStats>): void {
		this.stats = { ...this.stats, ...updates }
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { statsUpdated: updates },
			timestamp: new Date(),
			tags: ["stats", "update", "validation"],
		})
	}

	/**
	 * 合并验证结果
	 */
	merge(other: ValidationResult): void {
		this.errors.push(...other.errors)
		this.warnings.push(...other.warnings)
		this.info.push(...other.info)

		this.stats.totalRules += other.stats.totalRules
		this.stats.passedRules += other.stats.passedRules
		this.stats.failedRules += other.stats.failedRules
		this.stats.warningRules += other.stats.warningRules
		this.stats.errorCount += other.stats.errorCount
		this.stats.warningCount += other.stats.warningCount
		this.stats.infoCount += other.stats.infoCount
		this.stats.executionTime += other.stats.executionTime

		this.isValid = this.isValid && other.isValid
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { mergedWith: other.id },
			timestamp: new Date(),
			tags: ["merge", "validation"],
		})
	}

	/**
	 * 清除所有消息
	 */
	clear(): void {
		this.errors = []
		this.warnings = []
		this.info = []
		this.isValid = true

		this.stats.errorCount = 0
		this.stats.warningCount = 0
		this.stats.infoCount = 0
		this.stats.failedRules = 0
		this.stats.warningRules = 0

		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { cleared: true },
			timestamp: new Date(),
			tags: ["clear", "validation"],
		})
	}

	/**
	 * 获取结果摘要
	 */
	getSummary(): Record<string, any> {
		return {
			id: this.id,
			name: this.name,
			isValid: this.isValid,
			errorCount: this.stats.errorCount,
			warningCount: this.stats.warningCount,
			infoCount: this.stats.infoCount,
			totalRules: this.stats.totalRules,
			passedRules: this.stats.passedRules,
			failedRules: this.stats.failedRules,
			executionTime: this.stats.executionTime,
		}
	}

	/**
	 * 获取错误统计
	 */
	getErrorStats(): Record<string, number> {
		const stats: Record<string, number> = {}

		this.errors.forEach((error) => {
			const key = error.field || "general"
			stats[key] = (stats[key] || 0) + 1
		})

		return stats
	}

	/**
	 * 获取警告统计
	 */
	getWarningStats(): Record<string, number> {
		const stats: Record<string, number> = {}

		this.warnings.forEach((warning) => {
			const key = warning.field || "general"
			stats[key] = (stats[key] || 0) + 1
		})

		return stats
	}

	/**
	 * 获取信息统计
	 */
	getInfoStats(): Record<string, number> {
		const stats: Record<string, number> = {}

		this.info.forEach((info) => {
			const key = info.field || "general"
			stats[key] = (stats[key] || 0) + 1
		})

		return stats
	}

	/**
	 * 格式化输出
	 */
	format(): string {
		const lines: string[] = []

		lines.push(`Validation Result: ${this.isValid ? "PASSED" : "FAILED"}`)
		lines.push(`Total Rules: ${this.stats.totalRules}`)
		lines.push(`Passed Rules: ${this.stats.passedRules}`)
		lines.push(`Failed Rules: ${this.stats.failedRules}`)
		lines.push(`Warning Rules: ${this.stats.warningRules}`)
		lines.push(`Errors: ${this.stats.errorCount}`)
		lines.push(`Warnings: ${this.stats.warningCount}`)
		lines.push(`Info: ${this.stats.infoCount}`)
		lines.push(`Execution Time: ${this.stats.executionTime}ms`)

		if (this.errors.length > 0) {
			lines.push("\nErrors:")
			this.errors.forEach((error) => {
				lines.push(`  [${error.code}] ${error.message}${error.field ? ` (${error.field})` : ""}`)
			})
		}

		if (this.warnings.length > 0) {
			lines.push("\nWarnings:")
			this.warnings.forEach((warning) => {
				lines.push(`  [${warning.code}] ${warning.message}${warning.field ? ` (${warning.field})` : ""}`)
			})
		}

		if (this.info.length > 0) {
			lines.push("\nInfo:")
			this.info.forEach((info) => {
				lines.push(`  [${info.code}] ${info.message}${info.field ? ` (${info.field})` : ""}`)
			})
		}

		return lines.join("\n")
	}
}
