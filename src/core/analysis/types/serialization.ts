/**
 * 序列化类型定义
 *
 * 定义数据序列化相关的接口和类型。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

/**
 * 序列化格式枚举
 */
export enum SerializationFormat {
	JSON = "json",
	XML = "xml",
	YAML = "yaml",
	BINARY = "binary",
	PROTOBUF = "protobuf",
	MESSAGEPACK = "messagepack",
	AVRO = "avro",
}

/**
 * 序列化选项接口
 */
export interface SerializationOptions {
	/**
	 * 序列化格式
	 */
	format: SerializationFormat

	/**
	 * 是否压缩
	 */
	compress: boolean

	/**
	 * 压缩算法
	 */
	compressionAlgorithm: CompressionAlgorithm

	/**
	 * 是否加密
	 */
	encrypt: boolean

	/**
	 * 加密算法
	 */
	encryptionAlgorithm: EncryptionAlgorithm

	/**
	 * 加密密钥
	 */
	encryptionKey?: string

	/**
	 * 版本兼容性
	 */
	versionCompatibility: boolean

	/**
	 * 目标版本
	 */
	targetVersion?: string

	/**
	 * 是否包含元数据
	 */
	includeMetadata: boolean

	/**
	 * 是否格式化输出
	 */
	prettyPrint: boolean

	/**
	 * 缩进大小
	 */
	indentSize: number

	/**
	 * 编码格式
	 */
	encoding: string

	/**
	 * 是否验证模式
	 */
	validateSchema: boolean

	/**
	 * 模式定义
	 */
	schema?: string
}

/**
 * 压缩算法枚举
 */
export enum CompressionAlgorithm {
	NONE = "none",
	GZIP = "gzip",
	DEFLATE = "deflate",
	BROTLI = "brotli",
	ZSTD = "zstd",
	LZ4 = "lz4",
}

/**
 * 加密算法枚举
 */
export enum EncryptionAlgorithm {
	NONE = "none",
	AES256 = "aes256",
	CHACHA20_POLY1305 = "chacha20_poly1305",
	RSA = "rsa",
}

/**
 * 序列化结果接口
 */
export interface SerializationResult {
	/**
	 * 序列化数据
	 */
	data: string | Buffer

	/**
	 * 数据格式
	 */
	format: SerializationFormat

	/**
	 * 数据大小（字节）
	 */
	size: number

	/**
	 * 压缩率
	 */
	compressionRatio: number

	/**
	 * 序列化时间（毫秒）
	 */
	serializationTime: number

	/**
	 * 是否成功
	 */
	success: boolean

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
 * 反序列化结果接口
 */
export interface DeserializationResult<T = any> {
	/**
	 * 反序列化对象
	 */
	object: T

	/**
	 * 数据格式
	 */
	format: SerializationFormat

	/**
	 * 数据大小（字节）
	 */
	size: number

	/**
	 * 反序列化时间（毫秒）
	 */
	deserializationTime: number

	/**
	 * 是否成功
	 */
	success: boolean

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
 * 版本信息接口
 */
export interface VersionInfo {
	/**
	 * 版本号
	 */
	version: string

	/**
	 * 版本描述
	 */
	description?: string

	/**
	 * 发布日期
	 */
	releaseDate: Date

	/**
	 * 兼容性信息
	 */
	compatibility: CompatibilityInfo

	/**
	 * 变更日志
	 */
	changelog: ChangeLogEntry[]

	/**
	 * 依赖信息
	 */
	dependencies?: Record<string, string>

	/**
	 * 元数据
	 */
	metadata?: Record<string, any>
}

/**
 * 兼容性信息接口
 */
export interface CompatibilityInfo {
	/**
	 * 向后兼容的版本
	 */
	backwardCompatible: string[]

	/**
	 * 向前兼容的版本
	 */
	forwardCompatible: string[]

	/**
	 * 不兼容的版本
	 */
	incompatible: string[]

	/**
	 * 迁移说明
	 */
	migrationNotes?: string
}

/**
 * 变更日志条目接口
 */
export interface ChangeLogEntry {
	/**
	 * 变更类型
	 */
	type: ChangeType

	/**
	 * 变更描述
	 */
	description: string

	/**
	 * 影响范围
	 */
	impact: ImpactLevel

	/**
	 * 相关组件
	 */
	components?: string[]

	/**
	 * 时间戳
	 */
	timestamp: Date
}

/**
 * 变更类型枚举
 */
export enum ChangeType {
	FEATURE = "feature",
	BUGFIX = "bugfix",
	BREAKING = "breaking",
	DEPRECATION = "deprecation",
	REFACTOR = "refactor",
	PERFORMANCE = "performance",
	SECURITY = "security",
}

/**
 * 影响级别枚举
 */
export enum ImpactLevel {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}

/**
 * 迁移步骤接口
 */
export interface MigrationStep {
	/**
	 * 步骤ID
	 */
	id: string

	/**
	 * 步骤描述
	 */
	description: string

	/**
	 * 迁移函数
	 */
	migrate: (data: any) => Promise<any>

	/**
	 * 回滚函数
	 */
	rollback?: (data: any) => Promise<any>

	/**
	 * 依赖步骤
	 */
	dependencies?: string[]

	/**
	 * 是否必需
	 */
	required: boolean
}

/**
 * 版本配置接口
 */
export interface VersionConfig {
	/**
	 * 当前版本
	 */
	currentVersion: string

	/**
	 * 支持的版本
	 */
	supportedVersions: string[]

	/**
	 * 弃用的版本
	 */
	deprecatedVersions: string[]

	/**
	 * 版本历史
	 */
	versionHistory: VersionInfo[]

	/**
	 * 兼容性矩阵
	 */
	compatibilityMatrix: Record<string, string[]>

	/**
	 * 迁移映射
	 */
	migrationMap: Record<string, MigrationStep[]>
}

/**
 * 序列化配置接口
 */
export interface SerializationConfig {
	/**
	 * 默认选项
	 */
	defaultOptions: SerializationOptions

	/**
	 * 格式配置
	 */
	formatConfigs: Record<SerializationFormat, FormatConfig>

	/**
	 * 版本管理
	 */
	versionManager: VersionConfig

	/**
	 * 自定义序列化器
	 */
	customSerializers: Record<string, CustomSerializer>

	/**
	 * 自定义反序列化器
	 */
	customDeserializers: Record<string, CustomDeserializer>
}

/**
 * 格式配置接口
 */
export interface FormatConfig {
	/**
	 * 是否支持
	 */
	supported: boolean

	/**
	 * 是否支持压缩
	 */
	supportsCompression: boolean

	/**
	 * 是否支持加密
	 */
	supportsEncryption: boolean

	/**
	 * 是否支持模式验证
	 */
	supportsSchemaValidation: boolean

	/**
	 * MIME类型
	 */
	mimeType: string

	/**
	 * 文件扩展名
	 */
	fileExtensions: string[]

	/**
	 * 配置选项
	 */
	options: Record<string, any>
}

/**
 * 自定义序列化器接口
 */
export interface CustomSerializer {
	/**
	 * 序列化函数
	 */
	serialize: (obj: any, options: SerializationOptions) => Promise<string | Buffer>

	/**
	 * 支持的类型
	 */
	supportedTypes: string[]

	/**
	 * 优先级
	 */
	priority: number
}

/**
 * 自定义反序列化器接口
 */
export interface CustomDeserializer {
	/**
	 * 反序列化函数
	 */
	deserialize: (data: string | Buffer, options: SerializationOptions) => Promise<any>

	/**
	 * 支持的类型
	 */
	supportedTypes: string[]

	/**
	 * 优先级
	 */
	priority: number
}
