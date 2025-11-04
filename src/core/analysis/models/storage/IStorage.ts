/**
 * 存储接口
 *
 * 定义数据持久化的基本契约。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent } from "../types"

export interface IStorage<T extends BaseModel> extends Serializable, Validatable, Cloneable, Observable {
	/**
	 * 存储ID
	 */
	id: string

	/**
	 * 存储名称
	 */
	name: string

	/**
	 * 存储描述
	 */
	description?: string

	/**
	 * 存储版本
	 */
	version: string

	/**
	 * 创建时间
	 */
	createdAt: Date

	/**
	 * 更新时间
	 */
	updatedAt: Date

	/**
	 * 元数据
	 */
	metadata?: Record<string, any>

	/**
	 * 是否启用
	 */
	enabled: boolean

	/**
	 * 标签
	 */
	tags?: string[]

	/**
	 * 存储类型
	 */
	storageType: StorageType

	/**
	 * 连接字符串
	 */
	connectionString?: string

	/**
	 * 存储配置
	 */
	configuration: StorageConfiguration

	/**
	 * 保存数据
	 */
	save(data: T, options?: SaveOptions): Promise<SaveResult>

	/**
	 * 加载数据
	 */
	load(id: string, options?: LoadOptions): Promise<T | null>

	/**
	 * 删除数据
	 */
	delete(id: string, options?: DeleteOptions): Promise<DeleteResult>

	/**
	 * 检查数据是否存在
	 */
	exists(id: string): Promise<boolean>

	/**
	 * 列出所有数据ID
	 */
	list(options?: ListOptions): Promise<string[]>

	/**
	 * 搜索数据
	 */
	search(query: SearchQuery, options?: SearchOptions): Promise<SearchResult<T>>

	/**
	 * 获取统计信息
	 */
	getStats(): Promise<StorageStats>

	/**
	 * 清空存储
	 */
	clear(): Promise<void>

	/**
	 * 关闭存储连接
	 */
	close(): Promise<void>
}

/**
 * 存储类型枚举
 */
export enum StorageType {
	FILE_SYSTEM = "file_system",
	DATABASE = "database",
	MEMORY = "memory",
	CLOUD = "cloud",
	HYBRID = "hybrid",
}

/**
 * 存储配置接口
 */
export interface StorageConfiguration {
	/**
	 * 最大存储容量（字节）
	 */
	maxCapacity?: number

	/**
	 * 是否启用压缩
	 */
	compression?: boolean

	/**
	 * 压缩级别（1-9）
	 */
	compressionLevel?: number

	/**
	 * 是否启用加密
	 */
	encryption?: boolean

	/**
	 * 加密密钥
	 */
	encryptionKey?: string

	/**
	 * 是否启用缓存
	 */
	caching?: boolean

	/**
	 * 缓存大小
	 */
	cacheSize?: number

	/**
	 * 缓存过期时间（毫秒）
	 */
	cacheExpiry?: number

	/**
	 * 是否启用索引
	 */
	indexing?: boolean

	/**
	 * 索引配置
	 */
	indexingConfig?: IndexingConfiguration

	/**
	 * 备份配置
	 */
	backup?: BackupConfiguration

	/**
	 * 性能配置
	 */
	performance?: PerformanceConfiguration

	/**
	 * 其他自定义配置
	 */
	custom?: Record<string, any>
}

/**
 * 索引配置接口
 */
export interface IndexingConfiguration {
	/**
	 * 索引类型
	 */
	type: IndexType

	/**
	 * 索引字段
	 */
	fields: string[]

	/**
	 * 是否唯一索引
	 */
	unique?: boolean

	/**
	 * 索引选项
	 */
	options?: Record<string, any>
}

/**
 * 索引类型枚举
 */
export enum IndexType {
	BTREE = "btree",
	HASH = "hash",
	FULLTEXT = "fulltext",
	SPATIAL = "spatial",
	COMPOSITE = "composite",
}

/**
 * 备份配置接口
 */
export interface BackupConfiguration {
	/**
	 * 是否启用备份
	 */
	enabled: boolean

	/**
	 * 备份间隔（毫秒）
	 */
	interval?: number

	/**
	 * 备份保留数量
	 */
	retentionCount?: number

	/**
	 * 备份存储路径
	 */
	backupPath?: string

	/**
	 * 备份策略
	 */
	strategy?: BackupStrategy
}

/**
 * 备份策略枚举
 */
export enum BackupStrategy {
	FULL = "full",
	INCREMENTAL = "incremental",
	DIFFERENTIAL = "differential",
}

/**
 * 性能配置接口
 */
export interface PerformanceConfiguration {
	/**
	 * 批量操作大小
	 */
	batchSize?: number

	/**
	 * 连接池大小
	 */
	connectionPoolSize?: number

	/**
	 * 超时时间（毫秒）
	 */
	timeout?: number

	/**
	 * 重试次数
	 */
	retryAttempts?: number

	/**
	 * 重试间隔（毫秒）
	 */
	retryInterval?: number
}

/**
 * 保存选项接口
 */
export interface SaveOptions {
	/**
	 * 是否覆盖已存在的数据
	 */
	overwrite?: boolean

	/**
	 * 是否启用压缩
	 */
	compression?: boolean

	/**
	 * 是否启用加密
	 */
	encryption?: boolean

	/**
	 * 元数据
	 */
	metadata?: Record<string, any>

	/**
	 * 超时时间（毫秒）
	 */
	timeout?: number
}

/**
 * 保存结果接口
 */
export interface SaveResult {
	/**
	 * 是否成功
	 */
	success: boolean

	/**
	 * 数据ID
	 */
	id?: string

	/**
	 * 存储路径
	 */
	path?: string

	/**
	 * 大小（字节）
	 */
	size?: number

	/**
	 * 压缩率
	 */
	compressionRatio?: number

	/**
	 * 执行时间（毫秒）
	 */
	executionTime?: number

	/**
	 * 错误信息
	 */
	error?: Error
}

/**
 * 加载选项接口
 */
export interface LoadOptions {
	/**
	 * 是否启用缓存
	 */
	useCache?: boolean

	/**
	 * 是否验证数据
	 */
	validate?: boolean

	/**
	 * 超时时间（毫秒）
	 */
	timeout?: number
}

/**
 * 删除选项接口
 */
export interface DeleteOptions {
	/**
	 * 是否强制删除
	 */
	force?: boolean

	/**
	 * 是否删除相关索引
	 */
	removeIndexes?: boolean

	/**
	 * 超时时间（毫秒）
	 */
	timeout?: number
}

/**
 * 删除结果接口
 */
export interface DeleteResult {
	/**
	 * 是否成功
	 */
	success: boolean

	/**
	 * 删除的数据数量
	 */
	deletedCount?: number

	/**
	 * 错误信息
	 */
	error?: Error
}

/**
 * 列表选项接口
 */
export interface ListOptions {
	/**
	 * 分页大小
	 */
	limit?: number

	/**
	 * 偏移量
	 */
	offset?: number

	/**
	 * 排序字段
	 */
	sortBy?: string

	/**
	 * 排序方向
	 */
	sortOrder?: SortOrder
}

/**
 * 排序方向枚举
 */
export enum SortOrder {
	ASC = "asc",
	DESC = "desc",
}

/**
 * 搜索查询接口
 */
export interface SearchQuery {
	/**
	 * 查询文本
	 */
	text?: string

	/**
	 * 过滤条件
	 */
	filters?: SearchFilter[]

	/**
	 * 排序字段
	 */
	sortBy?: string

	/**
	 * 排序方向
	 */
	sortOrder?: SortOrder

	/**
	 * 查询选项
	 */
	options?: Record<string, any>
}

/**
 * 搜索过滤接口
 */
export interface SearchFilter {
	/**
	 * 字段名
	 */
	field: string

	/**
	 * 操作符
	 */
	operator: FilterOperator

	/**
	 * 值
	 */
	value: any

	/**
	 * 是否区分大小写
	 */
	caseSensitive?: boolean
}

/**
 * 过滤操作符枚举
 */
export enum FilterOperator {
	EQUAL = "equal",
	NOT_EQUAL = "not_equal",
	GREATER_THAN = "greater_than",
	GREATER_THAN_OR_EQUAL = "greater_than_or_equal",
	LESS_THAN = "less_than",
	LESS_THAN_OR_EQUAL = "less_than_or_equal",
	LIKE = "like",
	NOT_LIKE = "not_like",
	IN = "in",
	NOT_IN = "not_in",
	BETWEEN = "between",
	IS_NULL = "is_null",
	IS_NOT_NULL = "is_not_null",
}

/**
 * 搜索选项接口
 */
export interface SearchOptions {
	/**
	 * 分页大小
	 */
	limit?: number

	/**
	 * 偏移量
	 */
	offset?: number

	/**
	 * 是否启用缓存
	 */
	useCache?: boolean

	/**
	 * 超时时间（毫秒）
	 */
	timeout?: number
}

/**
 * 搜索结果接口
 */
export interface SearchResult<T> {
	/**
	 * 搜索结果
	 */
	items: T[]

	/**
	 * 总数量
	 */
	totalCount: number

	/**
	 * 执行时间（毫秒）
	 */
	executionTime?: number

	/**
	 * 是否还有更多结果
	 */
	hasMore?: boolean
}

/**
 * 存储统计接口
 */
export interface StorageStats {
	/**
	 * 总容量（字节）
	 */
	totalCapacity: number

	/**
	 * 已使用容量（字节）
	 */
	usedCapacity: number

	/**
	 * 可用容量（字节）
	 */
	availableCapacity: number

	/**
	 * 数据数量
	 */
	itemCount: number

	/**
	 * 索引数量
	 */
	indexCount: number

	/**
	 * 平均项目大小（字节）
	 */
	averageItemSize: number

	/**
	 * 命中率
	 */
	hitRate?: number

	/**
	 * 最后更新时间
	 */
	lastUpdated: Date
}

/**
 * 观察者接口
 */
export interface Observer {
	update(event: ModelEvent): void
}
