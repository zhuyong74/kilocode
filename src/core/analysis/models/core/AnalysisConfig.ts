/**
 * 分析配置类
 *
 * 提供分析任务的配置管理，支持多种配置选项和验证。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent, ModelEventType } from "../../types"
import {
	AnalysisConfig as IAnalysisConfig,
	AnalysisScope,
	AnalysisMode,
	AnalysisTarget,
	AnalysisType,
} from "../../types/models"
import { DataValidator } from "../validation/DataValidator"
import { ValidationResult } from "../validation/ValidationResult"
import { EventEmitter } from "events"

export class AnalysisConfig implements IAnalysisConfig, Serializable, Validatable, Cloneable, Observable {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]

	// 分析配置特定属性
	analysisType: AnalysisType
	targetPath: string
	outputPath?: string
	includePatterns: string[]
	excludePatterns: string[]
	options: AnalysisOptions
	validationRules: ValidationRule[]
	performanceConfig: PerformanceConfig
	outputConfig: OutputConfig

	private observers: Observer[] = []
	private eventEmitter: EventEmitter
	private validator: DataValidator

	constructor(config?: Partial<IAnalysisConfig>) {
		const now = new Date()

		// 基础属性
		this.id = config?.id || this.generateId()
		this.name = config?.name || "analysis-config"
		this.description = config?.description
		this.version = config?.version || "1.0.0"
		this.createdAt = config?.createdAt || now
		this.updatedAt = config?.updatedAt || now
		this.metadata = config?.metadata || {}
		this.enabled = config?.enabled ?? true
		this.tags = config?.tags || []

		// 分析配置特定属性
		this.analysisType = config?.analysisType || AnalysisType.CODE_ANALYSIS
		this.targetPath = config?.targetPath || "./"
		this.outputPath = config?.outputPath
		this.includePatterns = config?.includePatterns || ["**/*.ts", "**/*.js"]
		this.excludePatterns = config?.excludePatterns || ["node_modules/**", ".git/**", "dist/**", "build/**", "*.log"]
		this.options = config?.options || {
			recursive: true,
			parallel: true,
			maxConcurrency: 4,
			timeout: 60000,
			memoryLimit: 1024,
			enableCache: true,
			cacheSize: 200,
		}
		this.validationRules = config?.validationRules || []
		this.performanceConfig = config?.performanceConfig || {
			batchSize: 50,
			retryAttempts: 3,
			retryInterval: 1000,
			progressInterval: 1000,
			enableMonitoring: true,
		}
		this.outputConfig = config?.outputConfig || {
			format: "json",
			compressOutput: true,
			generateReport: true,
			fileExtension: ".json",
		}

		this.eventEmitter = new EventEmitter()
		this.validator = new DataValidator()

		this.setupEventListeners()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("config:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	async validate(): Promise<boolean> {
		try {
			// 手动验证各个字段，而不是依赖自动验证
			const validationResult = await this.performValidation()

			this.notifyObservers({
				type: ModelEventType.VALIDATED,
				source: this.id,
				data: { validationResult },
				timestamp: new Date(),
				tags: ["validation", "config"],
			})

			return validationResult.isValid
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["validation", "error", "config"],
			})
			return false
		}
	}

	/**
	 * 执行验证逻辑
	 */
	private async performValidation(): Promise<ValidationResult> {
		const result = new ValidationResult({
			name: "AnalysisConfig Validation",
			description: "分析配置验证结果",
		})

		// 验证基础字段
		if (!this.name || this.name.length < 3) {
			result.addError(
				result.createError("name_validation", "名称必须至少包含3个字符", "name", { value: this.name }),
			)
		}

		if (!this.analysisType) {
			result.addError(
				result.createError("analysisType_validation", "分析类型不能为空", "analysisType", {
					value: this.analysisType,
				}),
			)
		}

		if (!this.targetPath) {
			result.addError(
				result.createError("targetPath_validation", "目标路径不能为空", "targetPath", {
					value: this.targetPath,
				}),
			)
		}

		// 验证数组字段
		if (!Array.isArray(this.includePatterns) || this.includePatterns.length === 0) {
			result.addError(
				result.createError(
					"includePatterns_validation",
					"包含模式必须是包含至少一个元素的非空数组",
					"includePatterns",
					{ value: this.includePatterns },
				),
			)
		}

		if (!Array.isArray(this.excludePatterns)) {
			result.addError(
				result.createError("excludePatterns_validation", "排除模式必须是数组", "excludePatterns", {
					value: this.excludePatterns,
				}),
			)
		}

		if (!Array.isArray(this.validationRules)) {
			result.addError(
				result.createError("validationRules_validation", "验证规则必须是数组", "validationRules", {
					value: this.validationRules,
				}),
			)
		}

		// 验证嵌套对象
		if (!this.options || typeof this.options !== "object") {
			result.addError(
				result.createError("options_validation", "选项必须是对象", "options", { value: this.options }),
			)
		} else {
			// 验证选项字段
			if (typeof this.options.recursive !== "boolean") {
				result.addError(
					result.createError("options.recursive_validation", "递归选项必须是布尔值", "options.recursive", {
						value: this.options.recursive,
					}),
				)
			}

			if (typeof this.options.parallel !== "boolean") {
				result.addError(
					result.createError("options.parallel_validation", "并行选项必须是布尔值", "options.parallel", {
						value: this.options.parallel,
					}),
				)
			}

			if (
				typeof this.options.maxConcurrency !== "number" ||
				this.options.maxConcurrency < 1 ||
				this.options.maxConcurrency > 64
			) {
				result.addError(
					result.createError(
						"options.maxConcurrency_validation",
						"最大并发数必须是1-64之间的数字",
						"options.maxConcurrency",
						{ value: this.options.maxConcurrency },
					),
				)
			}

			if (
				typeof this.options.timeout !== "number" ||
				this.options.timeout < 1000 ||
				this.options.timeout > 3600000
			) {
				result.addError(
					result.createError(
						"options.timeout_validation",
						"超时时间必须是1000-3600000毫秒之间的数字",
						"options.timeout",
						{ value: this.options.timeout },
					),
				)
			}

			if (
				typeof this.options.memoryLimit !== "number" ||
				this.options.memoryLimit < 1 ||
				this.options.memoryLimit > 16384
			) {
				result.addError(
					result.createError(
						"options.memoryLimit_validation",
						"内存限制必须是1-16384MB之间的数字",
						"options.memoryLimit",
						{ value: this.options.memoryLimit },
					),
				)
			}

			if (typeof this.options.enableCache !== "boolean") {
				result.addError(
					result.createError(
						"options.enableCache_validation",
						"缓存选项必须是布尔值",
						"options.enableCache",
						{ value: this.options.enableCache },
					),
				)
			}

			if (typeof this.options.cacheSize !== "number" || this.options.cacheSize < 0) {
				result.addError(
					result.createError("options.cacheSize_validation", "缓存大小必须是非负数字", "options.cacheSize", {
						value: this.options.cacheSize,
					}),
				)
			}
		}

		// 验证性能配置
		if (!this.performanceConfig || typeof this.performanceConfig !== "object") {
			result.addError(
				result.createError("performanceConfig_validation", "性能配置必须是对象", "performanceConfig", {
					value: this.performanceConfig,
				}),
			)
		} else {
			if (
				typeof this.performanceConfig.batchSize !== "number" ||
				this.performanceConfig.batchSize < 1 ||
				this.performanceConfig.batchSize > 1000
			) {
				result.addError(
					result.createError(
						"performanceConfig.batchSize_validation",
						"批量大小必须是1-1000之间的数字",
						"performanceConfig.batchSize",
						{ value: this.performanceConfig.batchSize },
					),
				)
			}

			if (
				typeof this.performanceConfig.retryAttempts !== "number" ||
				this.performanceConfig.retryAttempts < 0 ||
				this.performanceConfig.retryAttempts > 10
			) {
				result.addError(
					result.createError(
						"performanceConfig.retryAttempts_validation",
						"重试次数必须是0-10之间的数字",
						"performanceConfig.retryAttempts",
						{ value: this.performanceConfig.retryAttempts },
					),
				)
			}

			if (
				typeof this.performanceConfig.retryInterval !== "number" ||
				this.performanceConfig.retryInterval < 0 ||
				this.performanceConfig.retryInterval > 60000
			) {
				result.addError(
					result.createError(
						"performanceConfig.retryInterval_validation",
						"重试间隔必须是0-60000毫秒之间的数字",
						"performanceConfig.retryInterval",
						{ value: this.performanceConfig.retryInterval },
					),
				)
			}

			if (
				typeof this.performanceConfig.progressInterval !== "number" ||
				this.performanceConfig.progressInterval < 0 ||
				this.performanceConfig.progressInterval > 60000
			) {
				result.addError(
					result.createError(
						"performanceConfig.progressInterval_validation",
						"进度间隔必须是0-60000毫秒之间的数字",
						"performanceConfig.progressInterval",
						{ value: this.performanceConfig.progressInterval },
					),
				)
			}

			if (typeof this.performanceConfig.enableMonitoring !== "boolean") {
				result.addError(
					result.createError(
						"performanceConfig.enableMonitoring_validation",
						"性能监控选项必须是布尔值",
						"performanceConfig.enableMonitoring",
						{ value: this.performanceConfig.enableMonitoring },
					),
				)
			}
		}

		// 验证输出配置
		if (!this.outputConfig || typeof this.outputConfig !== "object") {
			result.addError(
				result.createError("outputConfig_validation", "输出配置必须是对象", "outputConfig", {
					value: this.outputConfig,
				}),
			)
		} else {
			const validFormats = ["json", "xml", "yaml", "csv", "html", "markdown"]
			if (!validFormats.includes(this.outputConfig.format)) {
				result.addError(
					result.createError(
						"outputConfig.format_validation",
						"输出格式必须是有效的格式之一",
						"outputConfig.format",
						{ value: this.outputConfig.format },
					),
				)
			}

			if (typeof this.outputConfig.compressOutput !== "boolean") {
				result.addError(
					result.createError(
						"outputConfig.compressOutput_validation",
						"压缩输出选项必须是布尔值",
						"outputConfig.compressOutput",
						{ value: this.outputConfig.compressOutput },
					),
				)
			}

			if (typeof this.outputConfig.generateReport !== "boolean") {
				result.addError(
					result.createError(
						"outputConfig.generateReport_validation",
						"生成报告选项必须是布尔值",
						"outputConfig.generateReport",
						{ value: this.outputConfig.generateReport },
					),
				)
			}

			if (this.outputConfig.fileExtension && !this.outputConfig.fileExtension.match(/^\.[a-zA-Z0-9]+$/)) {
				result.addError(
					result.createError(
						"outputConfig.fileExtension_validation",
						"文件扩展名必须以点开头，后跟字母数字字符",
						"outputConfig.fileExtension",
						{ value: this.outputConfig.fileExtension },
					),
				)
			}
		}

		return result
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
				field: "analysisType",
				rules: [
					"required",
					"enum:code_analysis,dependency_analysis,architecture_analysis,performance_analysis,security_analysis,comprehensive_analysis",
				],
			},
			{
				field: "targetPath",
				rules: ["required", "string", "minLength:1"],
			},
			{
				field: "includePatterns",
				rules: ["required", "array", "minLength:1"],
			},
			{
				field: "excludePatterns",
				rules: ["array"],
			},
			{
				field: "options",
				rules: ["required", "object"],
			},
			{
				field: "options.recursive",
				rules: ["boolean"],
			},
			{
				field: "options.parallel",
				rules: ["boolean"],
			},
			{
				field: "options.maxConcurrency",
				rules: ["number", "min:1", "max:64"],
			},
			{
				field: "options.timeout",
				rules: ["number", "min:1000", "max:3600000"],
			},
			{
				field: "options.memoryLimit",
				rules: ["number", "min:1", "max:16384"],
			},
			{
				field: "options.enableCache",
				rules: ["boolean"],
			},
			{
				field: "options.cacheSize",
				rules: ["number", "min:0"],
			},
			{
				field: "validationRules",
				rules: ["array"],
			},
			{
				field: "performanceConfig",
				rules: ["required", "object"],
			},
			{
				field: "performanceConfig.batchSize",
				rules: ["number", "min:1", "max:1000"],
			},
			{
				field: "performanceConfig.retryAttempts",
				rules: ["number", "min:0", "max:10"],
			},
			{
				field: "performanceConfig.retryInterval",
				rules: ["number", "min:0", "max:60000"],
			},
			{
				field: "performanceConfig.progressInterval",
				rules: ["number", "min:0", "max:60000"],
			},
			{
				field: "performanceConfig.enableMonitoring",
				rules: ["boolean"],
			},
			{
				field: "outputConfig",
				rules: ["required", "object"],
			},
			{
				field: "outputConfig.format",
				rules: ["required", "enum:json,xml,yaml,csv,html,markdown"],
			},
			{
				field: "outputConfig.compressOutput",
				rules: ["boolean"],
			},
			{
				field: "outputConfig.generateReport",
				rules: ["boolean"],
			},
			{
				field: "outputConfig.fileExtension",
				rules: ["string", "pattern:^\\.[a-zA-Z0-9]+$"],
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
	 * 序列化配置
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
				analysisType: this.analysisType,
				targetPath: this.targetPath,
				outputPath: this.outputPath,
				includePatterns: this.includePatterns,
				excludePatterns: this.excludePatterns,
				options: this.options,
				validationRules: this.validationRules,
				performanceConfig: this.performanceConfig,
				outputConfig: this.outputConfig,
			}

			this.notifyObservers({
				type: ModelEventType.SERIALIZED,
				source: this.id,
				data: { format: "json", size: JSON.stringify(data).length },
				timestamp: new Date(),
				tags: ["serialization", "config"],
			})

			return JSON.stringify(data)
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["serialization", "error", "config"],
			})
			throw error
		}
	}

	/**
	 * 反序列化配置
	 */
	deserialize(data: string): void {
		try {
			const parsed = JSON.parse(data)

			// 基础属性
			this.id = parsed.id || this.generateId()
			this.name = parsed.name || "analysis-config"
			this.description = parsed.description
			this.version = parsed.version || "1.0.0"
			this.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date()
			this.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
			this.metadata = parsed.metadata || {}
			this.enabled = parsed.enabled ?? true
			this.tags = parsed.tags || []

			// 分析配置特定属性
			this.analysisType = parsed.analysisType || "comprehensive_analysis"
			this.targetPath = parsed.targetPath || "./"
			this.outputPath = parsed.outputPath || "./analysis-output"
			this.includePatterns = parsed.includePatterns || ["**/*"]
			this.excludePatterns = parsed.excludePatterns || []
			this.options = parsed.options || {
				recursive: true,
				parallel: true,
				maxConcurrency: 4,
				timeout: 300000,
				memoryLimit: 512,
				enableCache: true,
				cacheSize: 100,
			}
			this.validationRules = parsed.validationRules || []
			this.performanceConfig = parsed.performanceConfig || {
				batchSize: 50,
				retryAttempts: 3,
				retryInterval: 1000,
				progressInterval: 5000,
				enableMonitoring: true,
			}
			this.outputConfig = parsed.outputConfig || {
				format: "json",
				compressOutput: false,
				generateReport: true,
				fileExtension: ".json",
			}

			this.notifyObservers({
				type: ModelEventType.DESERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["deserialization", "config"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["deserialization", "error", "config"],
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
	 * 克隆配置
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
			tags: ["clone", "config"],
		})

		return cloned
	}

	/**
	 * 深度克隆配置
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
	 * 更新配置
	 */
	update(updates: Partial<IAnalysisConfig>): void {
		const oldData = this.serialize()

		Object.assign(this, updates)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: {
				oldData,
				newData: this.serialize(),
				updates,
			},
			timestamp: new Date(),
			tags: ["update", "config"],
		})
	}

	/**
	 * 启用配置
	 */
	enable(): void {
		this.enabled = true
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { enabled: true },
			timestamp: new Date(),
			tags: ["enable", "config"],
		})
	}

	/**
	 * 禁用配置
	 */
	disable(): void {
		this.enabled = false
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { enabled: false },
			timestamp: new Date(),
			tags: ["disable", "config"],
		})
	}

	/**
	 * 添加插件
	 */
	addPlugin(plugin: string): void {
		if (!this.plugins.includes(plugin)) {
			this.plugins.push(plugin)
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { pluginAdded: plugin },
				timestamp: new Date(),
				tags: ["plugin", "add", "config"],
			})
		}
	}

	/**
	 * 移除插件
	 */
	removePlugin(plugin: string): void {
		const index = this.plugins.indexOf(plugin)
		if (index > -1) {
			this.plugins.splice(index, 1)
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { pluginRemoved: plugin },
				timestamp: new Date(),
				tags: ["plugin", "remove", "config"],
			})
		}
	}

	/**
	 * 添加排除模式
	 */
	addExcludePattern(pattern: string): void {
		if (!this.excludePatterns.includes(pattern)) {
			this.excludePatterns.push(pattern)
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { excludePatternAdded: pattern },
				timestamp: new Date(),
				tags: ["exclude", "add", "config"],
			})
		}
	}

	/**
	 * 添加包含模式
	 */
	addIncludePattern(pattern: string): void {
		if (!this.includePatterns.includes(pattern)) {
			this.includePatterns.push(pattern)
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { includePatternAdded: pattern },
				timestamp: new Date(),
				tags: ["include", "add", "config"],
			})
		}
	}

	/**
	 * 获取配置摘要
	 */
	getSummary(): Record<string, any> {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			version: this.version,
			scope: this.scope,
			mode: this.mode,
			targets: this.targets,
			maxDepth: this.maxDepth,
			timeout: this.timeout,
			concurrency: this.concurrency,
			enabled: this.enabled,
			tags: this.tags,
			pluginCount: this.plugins.length,
			excludePatternCount: this.excludePatterns.length,
			includePatternCount: this.includePatterns.length,
		}
	}
}
