/**
 * 存储类型定义
 *
 * 定义数据存储相关的接口和类型。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

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
	 * 存储类型
	 */
	type: StorageType

	/**
	 * 连接字符串
	 */
	connectionString?: string

	/**
	 * 基本路径
	 */
	basePath?: string

	/**
	 * 数据库配置
	 */
	databaseConfig?: DatabaseConfiguration

	/**
	 * 文件系统配置
	 */
	fileSystemConfig?: FileSystemConfiguration

	/**
	 * 内存配置
	 */
	memoryConfig?: MemoryConfiguration

	/**
	 * 云存储配置
	 */
	cloudConfig?: CloudConfiguration

	/**
	 * 索引配置
	 */
	indexingConfig?: IndexingConfiguration

	/**
	 * 备份配置
	 */
	backupConfig?: BackupConfiguration

	/**
	 * 性能配置
	 */
	performanceConfig?: PerformanceConfiguration

	/**
	 * 其他配置
	 */
	[key: string]: any
}

/**
 * 数据库配置接口
 */
export interface DatabaseConfiguration {
	/**
	 * 数据库类型
	 */
	databaseType: DatabaseType

	/**
	 * 主机地址
	 */
	host: string

	/**
	 * 端口号
	 */
	port: number

	/**
	 * 数据库名称
	 */
	databaseName: string

	/**
	 * 用户名
	 */
	username: string

	/**
	 * 密码
	 */
	password: string

	/**
	 * 连接池配置
	 */
	poolConfig?: ConnectionPoolConfiguration

	/**
	 * 其他数据库特定配置
	 */
	[key: string]: any
}

/**
 * 数据库类型枚举
 */
export enum DatabaseType {
	POSTGRESQL = "postgresql",
	MYSQL = "mysql",
	SQLITE = "sqlite",
	MONGODB = "mongodb",
	REDIS = "redis",
}

/**
 * 连接池配置接口
 */
export interface ConnectionPoolConfiguration {
	/**
	 * 最小连接数
	 */
	minConnections: number

	/**
	 * 最大连接数
	 */
	maxConnections: number

	/**
	 * 连接超时时间（毫秒）
	 */
	connectionTimeout: number

	/**
	 * 空闲超时时间（毫秒）
	 */
	idleTimeout: number

	/**
	 * 获取连接重试次数
	 */
	acquireRetries: number
}

/**
 * 文件系统配置接口
 */
export interface FileSystemConfiguration {
	/**
	 * 根目录
	 */
	rootDirectory: string

	/**
	 * 是否启用压缩
	 */
	enableCompression: boolean

	/**
	 * 压缩算法
	 */
	compressionAlgorithm?: string

	/**
	 * 是否启用加密
	 */
	enableEncryption: boolean

	/**
	 * 加密密钥
	 */
	encryptionKey?: string

	/**
	 * 文件权限
	 */
	filePermissions?: string

	/**
	 * 最大文件大小（字节）
	 */
	maxFileSize?: number

	/**
	 * 是否启用缓存
	 */
	enableCache: boolean

	/**
	 * 缓存大小
	 */
	cacheSize?: number
}

/**
 * 内存配置接口
 */
export interface MemoryConfiguration {
	/**
	 * 最大内存使用量（字节）
	 */
	maxMemoryUsage: number

	/**
	 * 是否启用压缩
	 */
	enableCompression: boolean

	/**
	 * 压缩算法
	 */
	compressionAlgorithm?: string

	/**
	 * 清理策略
	 */
	cleanupStrategy: CleanupStrategy

	/**
	 * 清理间隔（毫秒）
	 */
	cleanupInterval: number

	/**
	 * 过期时间（毫秒）
	 */
	expirationTime?: number
}

/**
 * 清理策略枚举
 */
export enum CleanupStrategy {
	LRU = "lru",
	FIFO = "fifo",
	LFU = "lfu",
	TTL = "ttl",
}

/**
 * 云存储配置接口
 */
export interface CloudConfiguration {
	/**
	 * 云提供商
	 */
	provider: CloudProvider

	/**
	 * 区域
	 */
	region: string

	/**
	 * 存储桶名称
	 */
	bucketName: string

	/**
	 * 访问密钥ID
	 */
	accessKeyId: string

	/**
	 * 访问密钥
	 */
	secretAccessKey: string

	/**
	 * 端点URL
	 */
	endpointUrl?: string

	/**
	 * 是否启用CDN
	 */
	enableCDN: boolean

	/**
	 * CDN配置
	 */
	cdnConfig?: CDNConfiguration
}

/**
 * 云提供商枚举
 */
export enum CloudProvider {
	AWS_S3 = "aws_s3",
	AZURE_BLOB = "azure_blob",
	GOOGLE_CLOUD = "google_cloud",
	ALIYUN_OSS = "aliyun_oss",
	TENCENT_COS = "tencent_cos",
}

/**
 * CDN配置接口
 */
export interface CDNConfiguration {
	/**
	 * CDN域名
	 */
	domain: string

	/**
	 * 缓存时间（秒）
	 */
	cacheTime: number

	/**
	 * 是否启用HTTPS
	 */
	enableHTTPS: boolean
}

/**
 * 索引配置接口
 */
export interface IndexingConfiguration {
	/**
	 * 是否启用索引
	 */
	enabled: boolean

	/**
	 * 索引类型
	 */
	indexTypes: IndexType[]

	/**
	 * 索引路径
	 */
	indexPath?: string

	/**
	 * 更新间隔（毫秒）
	 */
	updateInterval: number

	/**
	 * 重建间隔（毫秒）
	 */
	rebuildInterval: number

	/**
	 * 内存索引配置
	 */
	memoryIndexConfig?: MemoryIndexConfiguration
}

/**
 * 索引类型枚举
 */
export enum IndexType {
	BTREE = "btree",
	HASH = "hash",
	FULLTEXT = "fulltext",
	SPATIAL = "spatial",
}

/**
 * 内存索引配置接口
 */
export interface MemoryIndexConfiguration {
	/**
	 * 最大索引条目数
	 */
	maxEntries: number

	/**
	 * 索引更新策略
	 */
	updateStrategy: IndexUpdateStrategy
}

/**
 * 索引更新策略枚举
 */
export enum IndexUpdateStrategy {
	IMMEDIATE = "immediate",
	LAZY = "lazy",
	BATCH = "batch",
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
	 * 备份策略
	 */
	strategy: BackupStrategy

	/**
	 * 备份路径
	 */
	backupPath: string

	/**
	 * 备份间隔（毫秒）
	 */
	backupInterval: number

	/**
	 * 保留备份数量
	 */
	retentionCount: number

	/**
	 * 是否压缩备份
	 */
	compressBackup: boolean

	/**
	 * 是否加密备份
	 */
	encryptBackup: boolean

	/**
	 * 备份加密密钥
	 */
	backupEncryptionKey?: string
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
	 * 批量大小
	 */
	batchSize: number

	/**
	 * 最大重试次数
	 */
	maxRetries: number

	/**
	 * 重试间隔（毫秒）
	 */
	retryInterval: number

	/**
	 * 超时时间（毫秒）
	 */
	timeout: number

	/**
	 * 是否启用连接池
	 */
	enableConnectionPooling: boolean

	/**
	 * 连接池配置
	 */
	connectionPoolConfig?: ConnectionPoolConfiguration

	/**
	 * 是否启用缓存
	 */
	enableCaching: boolean

	/**
	 * 缓存配置
	 */
	cacheConfig?: CacheConfiguration
}

/**
 * 缓存配置接口
 */
export interface CacheConfiguration {
	/**
	 * 缓存类型
	 */
	cacheType: CacheType

	/**
	 * 缓存大小
	 */
	cacheSize: number

	/**
	 * 过期时间（毫秒）
	 */
	expirationTime: number

	/**
	 * 清理策略
	 */
	cleanupStrategy: CleanupStrategy
}

/**
 * 缓存类型枚举
 */
export enum CacheType {
	MEMORY = "memory",
	REDIS = "redis",
	MEMCACHED = "memcached",
}

/**
 * 保存选项接口
 */
export interface SaveOptions {
	/**
	 * 是否覆盖
	 */
	overwrite: boolean

	/**
	 * 是否压缩
	 */
	compress: boolean

	/**
	 * 是否加密
	 */
	encrypt: boolean

	/**
	 * 是否验证
	 */
	validate: boolean

	/**
	 * 元数据
	 */
	metadata?: Record<string, any>

	/**
	 * 标签
	 */
	tags?: string[]
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
	 * 存储ID
	 */
	storageId: string

	/**
	 * 存储路径
	 */
	storagePath: string

	/**
	 * 数据大小（字节）
	 */
	size: number

	/**
	 * 保存时间（毫秒）
	 */
	saveTime: number

	/**
	 * 错误信息
	 */
	error?: string

	/**
	 * 元数据
	 */
	metadata?: Record<string, any>
}

/**
 * 加载选项接口
 */
export interface LoadOptions {
	/**
	 * 是否验证
	 */
	validate: boolean

	/**
	 * 是否解密
	 */
	decrypt: boolean

	/**
	 * 是否解压缩
	 */
	decompress: boolean

	/**
	 * 版本检查
	 */
	versionCheck: boolean

	/**
	 * 目标版本
	 */
	targetVersion?: string
}

/**
 * 删除选项接口
 */
export interface DeleteOptions {
	/**
	 * 是否强制删除
	 */
	force: boolean

	/**
	 * 是否删除元数据
	 */
	deleteMetadata: boolean

	/**
	 * 是否删除备份
	 */
	deleteBackup: boolean
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
	 * 删除的项目数量
	 */
	itemsDeleted: number

	/**
	 * 删除时间（毫秒）
	 */
	deleteTime: number

	/**
	 * 错误信息
	 */
	error?: string
}

/**
 * 列表选项接口
 */
export interface ListOptions {
	/**
	 * 排序字段
	 */
	sortBy?: string

	/**
	 * 排序顺序
	 */
	sortOrder: SortOrder

	/**
	 * 分页大小
	 */
	pageSize: number

	/**
	 * 页码
	 */
	page: number

	/**
	 * 过滤条件
	 */
	filters?: Record<string, any>

	/**
	 * 搜索查询
	 */
	searchQuery?: string
}

/**
 * 排序顺序枚举
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
	 * 查询字符串
	 */
	query: string

	/**
	 * 搜索字段
	 */
	fields?: string[]

	/**
	 * 过滤条件
	 */
	filters?: SearchFilter[]

	/**
	 * 模糊搜索
	 */
	fuzzy: boolean

	/**
	 * 大小写敏感
	 */
	caseSensitive: boolean
}

/**
 * 搜索过滤接口
 */
export interface SearchFilter {
	/**
	 * 字段名称
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
	 * 逻辑操作符
	 */
	logicalOperator?: LogicalOperator
}

/**
 * 过滤操作符枚举
 */
export enum FilterOperator {
	EQUAL = "eq",
	NOT_EQUAL = "ne",
	GREATER_THAN = "gt",
	GREATER_THAN_OR_EQUAL = "gte",
	LESS_THAN = "lt",
	LESS_THAN_OR_EQUAL = "lte",
	IN = "in",
	NOT_IN = "nin",
	LIKE = "like",
	NOT_LIKE = "not_like",
	IS_NULL = "is_null",
	IS_NOT_NULL = "is_not_null",
}

/**
 * 逻辑操作符枚举
 */
export enum LogicalOperator {
	AND = "and",
	OR = "or",
}

/**
 * 搜索选项接口
 */
export interface SearchOptions {
	/**
	 * 搜索查询
	 */
	query: SearchQuery

	/**
	 * 排序字段
	 */
	sortBy?: string

	/**
	 * 排序顺序
	 */
	sortOrder: SortOrder

	/**
	 * 分页大小
	 */
	pageSize: number

	/**
	 * 页码
	 */
	page: number

	/**
	 * 是否高亮
	 */
	highlight: boolean

	/**
	 * 超时时间（毫秒）
	 */
	timeout: number
}

/**
 * 搜索结果接口
 */
export interface SearchResult<T = any> {
	/**
	 * 搜索结果
	 */
	items: T[]

	/**
	 * 总数量
	 */
	totalCount: number

	/**
	 * 页码
	 */
	page: number

	/**
	 * 分页大小
	 */
	pageSize: number

	/**
	 * 总页数
	 */
	totalPages: number

	/**
	 * 搜索时间（毫秒）
	 */
	searchTime: number

	/**
	 * 高亮结果
	 */
	highlights?: Record<string, string[]>
}

/**
 * 存储统计接口
 */
export interface StorageStats {
	/**
	 * 存储的项目数量
	 */
	itemCount: number

	/**
	 * 总大小（字节）
	 */
	totalSize: number

	/**
	 * 平均大小（字节）
	 */
	averageSize: number

	/**
	 * 索引统计
	 */
	indexStats?: IndexStatistics

	/**
	 * 缓存统计
	 */
	cacheStats?: CacheStatistics

	/**
	 * 性能统计
	 */
	performanceStats?: PerformanceStatistics
}

/**
 * 索引统计接口
 */
export interface IndexStatistics {
	/**
	 * 索引数量
	 */
	indexCount: number

	/**
	 * 索引大小（字节）
	 */
	indexSize: number

	/**
	 * 最后更新时间
	 */
	lastUpdated: Date

	/**
	 * 索引命中率
	 */
	hitRate: number
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

/**
 * 性能统计接口
 */
export interface PerformanceStatistics {
	/**
	 * 平均响应时间（毫秒）
	 */
	averageResponseTime: number

	/**
	 * 最小响应时间（毫秒）
	 */
	minResponseTime: number

	/**
	 * 最大响应时间（毫秒）
	 */
	maxResponseTime: number

	/**
	 * 操作次数
	 */
	operationCount: number

	/**
	 * 错误率
	 */
	errorRate: number
}
