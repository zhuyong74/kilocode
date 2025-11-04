/**
 * 验证类型定义
 *
 * 定义数据验证相关的接口和类型。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

/**
 * 验证规则接口
 */
export interface IValidationRule {
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

	/**
	 * 验证函数
	 */
	validate(value: any, context?: ValidationContext): Promise<boolean>
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
	LENGTH_CHECK = "length_check",
	PATTERN_CHECK = "pattern_check",
	ENUM_CHECK = "enum_check",
	UNIQUE_CHECK = "unique_check",
	DEPENDENCY_CHECK = "dependency_check",
}

/**
 * 验证上下文接口
 */
export interface ValidationContext {
	/**
	 * 验证的对象
	 */
	object: any

	/**
	 * 字段名称
	 */
	fieldName: string

	/**
	 * 字段路径
	 */
	fieldPath: string

	/**
	 * 根对象
	 */
	rootObject: any

	/**
	 * 其他上下文数据
	 */
	[key: string]: any
}

/**
 * 验证结果接口
 */
export interface IValidationResult {
	/**
	 * 是否有效
	 */
	isValid: boolean

	/**
	 * 错误列表
	 */
	errors: ValidationError[]

	/**
	 * 警告列表
	 */
	warnings: ValidationWarning[]

	/**
	 * 验证时间（毫秒）
	 */
	validationTime: number

	/**
	 * 验证的字段数量
	 */
	fieldCount: number

	/**
	 * 验证的规则数量
	 */
	ruleCount: number
}

/**
 * 验证错误接口
 */
export interface ValidationError {
	/**
	 * 错误代码
	 */
	code: string

	/**
	 * 错误消息
	 */
	message: string

	/**
	 * 字段名称
	 */
	fieldName: string

	/**
	 * 字段路径
	 */
	fieldPath: string

	/**
	 * 规则名称
	 */
	ruleName: string

	/**
	 * 错误详情
	 */
	details?: Record<string, any>

	/**
	 * 时间戳
	 */
	timestamp: Date
}

/**
 * 验证警告接口
 */
export interface ValidationWarning {
	/**
	 * 警告代码
	 */
	code: string

	/**
	 * 警告消息
	 */
	message: string

	/**
	 * 字段名称
	 */
	fieldName: string

	/**
	 * 字段路径
	 */
	fieldPath: string

	/**
	 * 规则名称
	 */
	ruleName: string

	/**
	 * 警告详情
	 */
	details?: Record<string, any>

	/**
	 * 时间戳
	 */
	timestamp: Date
}

/**
 * 验证选项接口
 */
export interface ValidationOptions {
	/**
	 * 是否启用缓存
	 */
	enableCache: boolean

	/**
	 * 缓存大小
	 */
	cacheSize: number

	/**
	 * 是否并行验证
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
	 * 是否跳过可选字段
	 */
	skipOptionalFields: boolean

	/**
	 * 验证级别
	 */
	validationLevel: ValidationLevel

	/**
	 * 是否收集所有错误
	 */
	collectAllErrors: boolean
}

/**
 * 验证级别枚举
 */
export enum ValidationLevel {
	BASIC = "basic",
	STANDARD = "standard",
	STRICT = "strict",
	CUSTOM = "custom",
}

/**
 * 验证统计接口
 */
export interface ValidationStatistics {
	/**
	 * 总验证次数
	 */
	totalValidations: number

	/**
	 * 成功验证次数
	 */
	successfulValidations: number

	/**
	 * 失败验证次数
	 */
	failedValidations: number

	/**
	 * 平均验证时间（毫秒）
	 */
	averageValidationTime: number

	/**
	 * 缓存命中率
	 */
	cacheHitRate: number

	/**
	 * 验证的对象数量
	 */
	objectsValidated: number

	/**
	 * 验证的字段数量
	 */
	fieldsValidated: number

	/**
	 * 验证的规则数量
	 */
	rulesApplied: number
}

/**
 * 验证缓存接口
 */
export interface IValidationCache {
	/**
	 * 获取缓存键
	 */
	getCacheKey(object: any, rules: IValidationRule[]): string

	/**
	 * 添加到缓存
	 */
	addToCache(key: string, result: IValidationResult): void

	/**
	 * 从缓存获取
	 */
	getFromCache(key: string): IValidationResult | null

	/**
	 * 清除缓存
	 */
	clearCache(): void

	/**
	 * 获取缓存统计
	 */
	getCacheStatistics(): CacheStatistics
}

/**
 * 缓存统计接口
 */
export interface CacheStatistics {
	/**
	 * 缓存大小
	 */
	cacheSize: number

	/**
	 * 缓存命中次数
	 */
	cacheHits: number

	/**
	 * 缓存未命中次数
	 */
	cacheMisses: number

	/**
	 * 缓存命中率
	 */
	hitRate: number

	/**
	 * 缓存项数量
	 */
	itemCount: number

	/**
	 * 缓存最大容量
	 */
	maxCapacity: number
}
