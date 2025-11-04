/**
 * 模型类型定义
 *
 * 定义所有数据模型的基础接口和类型。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

/**
 * 基础模型接口
 */
export interface BaseModel {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]
}

/**
 * 可序列化接口
 */
export interface Serializable {
	/**
	 * 序列化对象
	 */
	serialize(): string

	/**
	 * 反序列化对象
	 */
	deserialize(data: string): void

	/**
	 * 获取序列化格式
	 */
	getSerializationFormat(): string
}

/**
 * 可验证接口
 */
export interface Validatable {
	/**
	 * 验证对象
	 */
	validate(): Promise<boolean>

	/**
	 * 获取验证规则
	 */
	getValidationRules(): any[]

	/**
	 * 获取验证结果
	 */
	getValidationResult(): any
}

/**
 * 可克隆接口
 */
export interface Cloneable {
	/**
	 * 克隆对象
	 */
	clone(): this

	/**
	 * 深度克隆对象
	 */
	deepClone(): this
}

/**
 * 可观察接口
 */
export interface Observable {
	/**
	 * 添加观察者
	 */
	addObserver(observer: Observer): void

	/**
	 * 移除观察者
	 */
	removeObserver(observer: Observer): void

	/**
	 * 通知观察者
	 */
	notifyObservers(event: ModelEvent): void
}

/**
 * 观察者接口
 */
export interface Observer {
	/**
	 * 更新观察者
	 */
	update(event: ModelEvent): void
}

/**
 * 模型事件接口
 */
export interface ModelEvent {
	/**
	 * 事件类型
	 */
	type: ModelEventType

	/**
	 * 事件源
	 */
	source: string

	/**
	 * 事件数据
	 */
	data: Record<string, any>

	/**
	 * 时间戳
	 */
	timestamp: Date

	/**
	 * 标签
	 */
	tags?: string[]
}

/**
 * 模型事件类型枚举
 */
export enum ModelEventType {
	CREATED = "created",
	UPDATED = "updated",
	DELETED = "deleted",
	LOADED = "loaded",
	SAVED = "saved",
	VALIDATED = "validated",
	SERIALIZED = "serialized",
	DESERIALIZED = "deserialized",
	CLONED = "cloned",
	INITIALIZED = "initialized",
	CLOSED = "closed",
	ERROR = "error",
}

/**
 * 分析配置接口
 */
export interface IAnalysisConfig extends BaseModel {
	/**
	 * 分析类型
	 */
	analysisType: AnalysisType

	/**
	 * 目标路径
	 */
	targetPath: string

	/**
	 * 输出路径
	 */
	outputPath?: string

	/**
	 * 包含的文件模式
	 */
	includePatterns: string[]

	/**
	 * 排除的文件模式
	 */
	excludePatterns: string[]

	/**
	 * 分析选项
	 */
	options: AnalysisOptions

	/**
	 * 验证规则
	 */
	validationRules: ValidationRule[]

	/**
	 * 性能配置
	 */
	performanceConfig: PerformanceConfig

	/**
	 * 输出配置
	 */
	outputConfig: OutputConfig
}

/**
 * 分析类型枚举
 */
export enum AnalysisType {
	CODE_ANALYSIS = "code_analysis",
	DEPENDENCY_ANALYSIS = "dependency_analysis",
	ARCHITECTURE_ANALYSIS = "architecture_analysis",
	PERFORMANCE_ANALYSIS = "performance_analysis",
	SECURITY_ANALYSIS = "security_analysis",
	COMPREHENSIVE_ANALYSIS = "comprehensive_analysis",
}

/**
 * 分析范围枚举
 */
export enum AnalysisScope {
	FULL = "FULL",
	MODULE = "MODULE",
	PACKAGE = "PACKAGE",
	FILE = "FILE",
}

/**
 * 分析模式枚举
 */
export enum AnalysisMode {
	QUICK = "QUICK",
	STANDARD = "STANDARD",
	DEEP = "DEEP",
}

/**
 * 分析目标枚举
 */
export enum AnalysisTarget {
	SOURCE = "SOURCE",
	DEPENDENCIES = "DEPENDENCIES",
	ARCHITECTURE = "ARCHITECTURE",
	PERFORMANCE = "PERFORMANCE",
	SECURITY = "SECURITY",
}

/**
 * 分析选项接口
 */
export interface AnalysisOptions {
	/**
	 * 是否递归分析
	 */
	recursive: boolean

	/**
	 * 是否并行处理
	 */
	parallel: boolean

	/**
	 * 最大并发数
	 */
	maxConcurrency: number

	/**
	 * 超时时间（毫秒）
	 */
	timeout: number

	/**
	 * 内存限制（MB）
	 */
	memoryLimit: number

	/**
	 * 是否启用缓存
	 */
	enableCache: boolean

	/**
	 * 缓存大小
	 */
	cacheSize: number

	/**
	 * 其他自定义选项
	 */
	[key: string]: any
}

/**
 * 验证规则接口
 */
export interface ValidationRule {
	/**
	 * 规则名称
	 */
	name: string

	/**
	 * 规则类型
	 */
	type: ValidationRuleType

	/**
	 * 规则配置
	 */
	config: Record<string, any>

	/**
	 * 是否启用
	 */
	enabled: boolean

	/**
	 * 错误消息
	 */
	errorMessage?: string
}

/**
 * 验证规则类型枚举
 */
export enum ValidationRuleType {
	REQUIRED = "required",
	TYPE_CHECK = "type_check",
	RANGE_CHECK = "range_check",
	FORMAT_CHECK = "format_check",
	CUSTOM_VALIDATION = "custom_validation",
}

/**
 * 性能配置接口
 */
export interface PerformanceConfig {
	/**
	 * 批量大小
	 */
	batchSize: number

	/**
	 * 重试次数
	 */
	retryAttempts: number

	/**
	 * 重试间隔（毫秒）
	 */
	retryInterval: number

	/**
	 * 进度报告间隔（毫秒）
	 */
	progressInterval: number

	/**
	 * 是否启用性能监控
	 */
	enableMonitoring: boolean
}

/**
 * 输出配置接口
 */
export interface OutputConfig {
	/**
	 * 输出格式
	 */
	format: OutputFormat

	/**
	 * 是否压缩输出
	 */
	compressOutput: boolean

	/**
	 * 是否生成报告
	 */
	generateReport: boolean

	/**
	 * 报告模板
	 */
	reportTemplate?: string

	/**
	 * 输出文件扩展名
	 */
	fileExtension: string
}

/**
 * 输出格式枚举
 */
export enum OutputFormat {
	JSON = "json",
	XML = "xml",
	YAML = "yaml",
	CSV = "csv",
	HTML = "html",
	MARKDOWN = "markdown",
}

/**
 * 分析结果接口
 */
export interface IAnalysisResults extends BaseModel {
	/**
	 * 关联的配置ID
	 */
	configId: string

	/**
	 * 分析状态
	 */
	status: AnalysisStatus

	/**
	 * 开始时间
	 */
	startTime: Date

	/**
	 * 结束时间
	 */
	endTime?: Date

	/**
	 * 持续时间（毫秒）
	 */
	duration?: number

	/**
	 * 进度百分比
	 */
	progress: number

	/**
	 * 分析结果
	 */
	results: AnalysisResult[]

	/**
	 * 错误信息
	 */
	errors: AnalysisError[]

	/**
	 * 警告信息
	 */
	warnings: AnalysisWarning[]

	/**
	 * 统计信息
	 */
	statistics: AnalysisStatistics

	/**
	 * 输出文件
	 */
	outputFiles: string[]
}

/**
 * 分析状态枚举
 */
export enum AnalysisStatus {
	PENDING = "pending",
	RUNNING = "running",
	COMPLETED = "completed",
	FAILED = "failed",
	CANCELLED = "cancelled",
}

/**
 * 分析结果接口
 */
export interface AnalysisResult {
	/**
	 * 结果类型
	 */
	type: string

	/**
	 * 结果数据
	 */
	data: Record<string, any>

	/**
	 * 结果级别
	 */
	level: ResultLevel

	/**
	 * 描述
	 */
	description?: string

	/**
	 * 相关文件
	 */
	relatedFiles?: string[]
}

/**
 * 结果级别枚举
 */
export enum ResultLevel {
	INFO = "info",
	WARNING = "warning",
	ERROR = "error",
	CRITICAL = "critical",
}

/**
 * 分析错误接口
 */
export interface AnalysisError {
	/**
	 * 错误代码
	 */
	code: string

	/**
	 * 错误消息
	 */
	message: string

	/**
	 * 错误详情
	 */
	details?: Record<string, any>

	/**
	 * 相关文件
	 */
	relatedFiles?: string[]

	/**
	 * 时间戳
	 */
	timestamp: Date
}

/**
 * 分析警告接口
 */
export interface AnalysisWarning {
	/**
	 * 警告代码
	 */
	code: string

	/**
	 * 警告消息
	 */
	message: string

	/**
	 * 警告详情
	 */
	details?: Record<string, any>

	/**
	 * 相关文件
	 */
	relatedFiles?: string[]

	/**
	 * 时间戳
	 */
	timestamp: Date
}

/**
 * 分析统计接口
 */
export interface AnalysisStatistics {
	/**
	 * 处理的文件数量
	 */
	filesProcessed: number

	/**
	 * 代码行数
	 */
	linesOfCode: number

	/**
	 * 发现的依赖数量
	 */
	dependenciesFound: number

	/**
	 * 复杂度指标
	 */
	complexityMetrics: ComplexityMetrics

	/**
	 * 性能指标
	 */
	performanceMetrics: PerformanceMetrics

	/**
	 * 其他统计信息
	 */
	[key: string]: any
}

/**
 * 复杂度指标接口
 */
export interface ComplexityMetrics {
	/**
	 * 平均复杂度
	 */
	averageComplexity: number

	/**
	 * 最大复杂度
	 */
	maxComplexity: number

	/**
	 * 最小复杂度
	 */
	minComplexity: number

	/**
	 * 复杂度分布
	 */
	complexityDistribution: Record<string, number>
}

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
	/**
	 * 执行时间（毫秒）
	 */
	executionTime: number

	/**
	 * 内存使用峰值（MB）
	 */
	memoryPeak: number

	/**
	 * CPU使用率
	 */
	cpuUsage: number

	/**
	 * I/O操作次数
	 */
	ioOperations: number
}

/**
 * 分析范围枚举
 */
export enum AnalysisScope {
	FULL = "full",
	PARTIAL = "partial",
	INCREMENTAL = "incremental",
	DIFFERENTIAL = "differential",
}

/**
 * 分析模式枚举
 */
export enum AnalysisMode {
	STANDARD = "standard",
	DEEP = "deep",
	QUICK = "quick",
	CUSTOM = "custom",
}

/**
 * 分析目标枚举
 */
export enum AnalysisTarget {
	CODE = "code",
	DEPENDENCIES = "dependencies",
	PERFORMANCE = "performance",
	SECURITY = "security",
	QUALITY = "quality",
	ARCHITECTURE = "architecture",
}

/**
 * 结果类型枚举
 */
export enum ResultType {
	STRUCTURAL = "structural",
	DEPENDENCY = "dependency",
	PERFORMANCE = "performance",
	SECURITY = "security",
	QUALITY = "quality",
}

/**
 * 分析指标接口
 */
export interface AnalysisMetric {
	/**
	 * 指标名称
	 */
	name: string

	/**
	 * 指标值
	 */
	value: number | string | boolean

	/**
	 * 指标类型
	 */
	type: string

	/**
	 * 描述
	 */
	description?: string

	/**
	 * 单位
	 */
	unit?: string

	/**
	 * 阈值
	 */
	threshold?: number

	/**
	 * 状态
	 */
	status?: "good" | "warning" | "error"
}
