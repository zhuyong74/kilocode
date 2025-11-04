/**
 * 分析结果类
 *
 * 提供分析任务的结果管理，支持多种结果类型和统计信息。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent, ModelEventType } from "../../types"
import { AnalysisResults as IAnalysisResults, AnalysisStatus, ResultType, AnalysisMetric } from "../../types/models"
import { DataValidator } from "../validation/DataValidator"
import { ValidationResult } from "../validation/ValidationResult"
import { EventEmitter } from "events"

export class AnalysisResults implements IAnalysisResults, Serializable, Validatable, Cloneable, Observable {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]

	// 分析结果特定属性
	configId: string
	projectPath: string
	status: AnalysisStatus
	startTime: Date
	endTime?: Date
	duration: number
	results: Record<string, any>
	metrics: AnalysisMetric[]
	errors: string[]
	warnings: string[]
	info: string[]
	resultType: ResultType
	summary: Record<string, any>
	details: Record<string, any>
	recommendations: string[]

	private observers: Observer[] = []
	private eventEmitter: EventEmitter
	private validator: DataValidator

	constructor(results?: Partial<IAnalysisResults>) {
		const now = new Date()

		// 基础属性
		this.id = results?.id || this.generateId()
		this.name = results?.name || "analysis-results"
		this.description = results?.description
		this.version = results?.version || "1.0.0"
		this.createdAt = results?.createdAt || now
		this.updatedAt = results?.updatedAt || now
		this.metadata = results?.metadata || {}
		this.enabled = results?.enabled ?? true
		this.tags = results?.tags || []

		// 分析结果特定属性
		this.configId = results?.configId || ""
		this.projectPath = results?.projectPath || ""
		this.status = results?.status || AnalysisStatus.PENDING
		this.startTime = results?.startTime || now
		this.endTime = results?.endTime
		this.duration = results?.duration || 0
		this.results = results?.results || {}
		this.metrics = results?.metrics || []
		this.errors = results?.errors || []
		this.warnings = results?.warnings || []
		this.info = results?.info || []
		this.resultType = results?.resultType || ResultType.STRUCTURAL
		this.summary = results?.summary || {}
		this.details = results?.details || {}
		this.recommendations = results?.recommendations || []

		this.eventEmitter = new EventEmitter()
		this.validator = new DataValidator()

		this.setupEventListeners()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `results-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("results:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	/**
	 * 验证结果
	 */
	async validate(): Promise<boolean> {
		try {
			const validationResult = await this.validator.validate(this)

			this.notifyObservers({
				type: ModelEventType.VALIDATED,
				source: this.id,
				data: { validationResult },
				timestamp: new Date(),
				tags: ["validation", "results"],
			})

			return validationResult.isValid
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["validation", "error", "results"],
			})
			return false
		}
	}

	/**
	 * 获取验证规则
	 */
	getValidationRules(): any[] {
		return [
			{
				field: "name",
				rules: ["required", "string", "minLength:3", "maxLength:100"],
			},
			{
				field: "configId",
				rules: ["required", "string"],
			},
			{
				field: "projectPath",
				rules: ["required", "string"],
			},
			{
				field: "status",
				rules: ["required", "enum:PENDING,RUNNING,COMPLETED,FAILED,CANCELLED"],
			},
			{
				field: "startTime",
				rules: ["required", "date"],
			},
			{
				field: "duration",
				rules: ["required", "number", "min:0"],
			},
			{
				field: "resultType",
				rules: ["required", "enum:STRUCTURAL,DEPENDENCY,PERFORMANCE,SECURITY,QUALITY"],
			},
		]
	}

	/**
	 * 获取验证结果
	 */
	getValidationResult(): ValidationResult {
		return this.validator.getLastResult()
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
				configId: this.configId,
				projectPath: this.projectPath,
				status: this.status,
				startTime: this.startTime.toISOString(),
				endTime: this.endTime?.toISOString(),
				duration: this.duration,
				results: this.results,
				metrics: this.metrics,
				errors: this.errors,
				warnings: this.warnings,
				info: this.info,
				resultType: this.resultType,
				summary: this.summary,
				details: this.details,
				recommendations: this.recommendations,
			}

			this.notifyObservers({
				type: ModelEventType.SERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["serialization", "results"],
			})

			return JSON.stringify(data, null, 2)
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["serialization", "error", "results"],
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
			this.name = parsed.name || "analysis-results"
			this.description = parsed.description
			this.version = parsed.version || "1.0.0"
			this.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date()
			this.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
			this.metadata = parsed.metadata || {}
			this.enabled = parsed.enabled ?? true
			this.tags = parsed.tags || []

			// 分析结果特定属性
			this.configId = parsed.configId || ""
			this.projectPath = parsed.projectPath || ""
			this.status = parsed.status || AnalysisStatus.PENDING
			this.startTime = parsed.startTime ? new Date(parsed.startTime) : new Date()
			this.endTime = parsed.endTime ? new Date(parsed.endTime) : undefined
			this.duration = parsed.duration || 0
			this.results = parsed.results || {}
			this.metrics = parsed.metrics || []
			this.errors = parsed.errors || []
			this.warnings = parsed.warnings || []
			this.info = parsed.info || []
			this.resultType = parsed.resultType || ResultType.STRUCTURAL
			this.summary = parsed.summary || {}
			this.details = parsed.details || {}
			this.recommendations = parsed.recommendations || []

			this.notifyObservers({
				type: ModelEventType.DESERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["deserialization", "results"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["deserialization", "error", "results"],
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
			tags: ["clone", "results"],
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
	 * 开始分析
	 */
	start(): void {
		this.status = AnalysisStatus.RUNNING
		this.startTime = new Date()
		this.endTime = undefined
		this.duration = 0
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { status: this.status, startTime: this.startTime },
			timestamp: new Date(),
			tags: ["start", "results"],
		})
	}

	/**
	 * 完成分析
	 */
	complete(): void {
		this.status = AnalysisStatus.COMPLETED
		this.endTime = new Date()
		this.duration = this.endTime.getTime() - this.startTime.getTime()
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: {
				status: this.status,
				endTime: this.endTime,
				duration: this.duration,
			},
			timestamp: new Date(),
			tags: ["complete", "results"],
		})
	}

	/**
	 * 失败分析
	 */
	fail(error: string): void {
		this.status = AnalysisStatus.FAILED
		this.endTime = new Date()
		this.duration = this.endTime.getTime() - this.startTime.getTime()
		this.errors.push(error)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.ERROR,
			source: this.id,
			data: {
				status: this.status,
				endTime: this.endTime,
				duration: this.duration,
				error,
			},
			timestamp: new Date(),
			tags: ["fail", "error", "results"],
		})
	}

	/**
	 * 取消分析
	 */
	cancel(): void {
		this.status = AnalysisStatus.CANCELLED
		this.endTime = new Date()
		this.duration = this.endTime.getTime() - this.startTime.getTime()
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: {
				status: this.status,
				endTime: this.endTime,
				duration: this.duration,
			},
			timestamp: new Date(),
			tags: ["cancel", "results"],
		})
	}

	/**
	 * 添加结果
	 */
	addResult(key: string, data: any): void {
		this.results[key] = data
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { resultAdded: key },
			timestamp: new Date(),
			tags: ["result", "add", "results"],
		})
	}

	/**
	 * 获取结果
	 */
	getResult(key: string): any {
		return this.results[key]
	}

	/**
	 * 添加指标
	 */
	addMetric(metric: AnalysisMetric): void {
		this.metrics.push(metric)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { metricAdded: metric.name },
			timestamp: new Date(),
			tags: ["metric", "add", "results"],
		})
	}

	/**
	 * 获取指标
	 */
	getMetric(name: string): AnalysisMetric | undefined {
		return this.metrics.find((m) => m.name === name)
	}

	/**
	 * 添加错误
	 */
	addError(error: string): void {
		this.errors.push(error)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.ERROR,
			source: this.id,
			data: { errorAdded: error },
			timestamp: new Date(),
			tags: ["error", "add", "results"],
		})
	}

	/**
	 * 添加警告
	 */
	addWarning(warning: string): void {
		this.warnings.push(warning)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.WARNING,
			source: this.id,
			data: { warningAdded: warning },
			timestamp: new Date(),
			tags: ["warning", "add", "results"],
		})
	}

	/**
	 * 添加信息
	 */
	addInfo(info: string): void {
		this.info.push(info)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.INFO,
			source: this.id,
			data: { infoAdded: info },
			timestamp: new Date(),
			tags: ["info", "add", "results"],
		})
	}

	/**
	 * 添加建议
	 */
	addRecommendation(recommendation: string): void {
		this.recommendations.push(recommendation)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { recommendationAdded: recommendation },
			timestamp: new Date(),
			tags: ["recommendation", "add", "results"],
		})
	}

	/**
	 * 更新摘要
	 */
	updateSummary(summary: Record<string, any>): void {
		this.summary = { ...this.summary, ...summary }
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { summaryUpdated: Object.keys(summary) },
			timestamp: new Date(),
			tags: ["summary", "update", "results"],
		})
	}

	/**
	 * 更新详情
	 */
	updateDetails(details: Record<string, any>): void {
		this.details = { ...this.details, ...details }
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { detailsUpdated: Object.keys(details) },
			timestamp: new Date(),
			tags: ["details", "update", "results"],
		})
	}

	/**
	 * 获取结果摘要
	 */
	getSummary(): Record<string, any> {
		return {
			id: this.id,
			name: this.name,
			configId: this.configId,
			projectPath: this.projectPath,
			status: this.status,
			startTime: this.startTime,
			endTime: this.endTime,
			duration: this.duration,
			resultType: this.resultType,
			resultCount: Object.keys(this.results).length,
			metricCount: this.metrics.length,
			errorCount: this.errors.length,
			warningCount: this.warnings.length,
			infoCount: this.info.length,
			recommendationCount: this.recommendations.length,
			summary: this.summary,
		}
	}

	/**
	 * 获取错误统计
	 */
	getErrorStats(): Record<string, number> {
		return {
			total: this.errors.length,
			critical: this.errors.filter((e) => e.includes("CRITICAL")).length,
			high: this.errors.filter((e) => e.includes("HIGH")).length,
			medium: this.errors.filter((e) => e.includes("MEDIUM")).length,
			low: this.errors.filter((e) => e.includes("LOW")).length,
		}
	}

	/**
	 * 获取警告统计
	 */
	getWarningStats(): Record<string, number> {
		return {
			total: this.warnings.length,
			high: this.warnings.filter((w) => w.includes("HIGH")).length,
			medium: this.warnings.filter((w) => w.includes("MEDIUM")).length,
			low: this.warnings.filter((w) => w.includes("LOW")).length,
		}
	}

	/**
	 * 获取指标统计
	 */
	getMetricStats(): Record<string, any> {
		const stats: Record<string, any> = {
			total: this.metrics.length,
			byCategory: {},
		}

		this.metrics.forEach((metric) => {
			if (!stats.byCategory[metric.category]) {
				stats.byCategory[metric.category] = {
					count: 0,
					sum: 0,
					avg: 0,
					min: Infinity,
					max: -Infinity,
				}
			}

			const category = stats.byCategory[metric.category]
			category.count++
			category.sum += metric.value
			category.min = Math.min(category.min, metric.value)
			category.max = Math.max(category.max, metric.value)
		})

		// 计算平均值
		Object.keys(stats.byCategory).forEach((category) => {
			const cat = stats.byCategory[category]
			cat.avg = cat.count > 0 ? cat.sum / cat.count : 0
			if (cat.min === Infinity) cat.min = 0
			if (cat.max === -Infinity) cat.max = 0
		})

		return stats
	}
}
