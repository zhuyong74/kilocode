/**
 * 数据库模块类型定义
 *
 * 定义了数据库分析相关的所有类型、接口和枚举。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel } from "./models"

/**
 * 数据库模式接口
 */
export interface DatabaseSchema extends BaseModel {
	/** 数据库类型 */
	databaseType: DatabaseType
	/** 数据库版本 */
	databaseVersion: string
	/** 连接字符串 */
	connectionString?: string
	/** 表结构列表 */
	tables: TableStructure[]
	/** 关系映射 */
	relationships: RelationshipMap[]
	/** 索引列表 */
	indexes: DatabaseIndex[]
	/** 约束列表 */
	constraints: DatabaseConstraint[]
	/** 视图列表 */
	views: DatabaseView[]
	/** 存储过程列表 */
	storedProcedures: StoredProcedure[]
	/** 触发器列表 */
	triggers: DatabaseTrigger[]
	/** 模式元数据 */
	schemaMetadata: SchemaMetadata
}

/**
 * 数据库类型枚举
 */
export enum DatabaseType {
	MYSQL = "mysql",
	POSTGRESQL = "postgresql",
	SQLITE = "sqlite",
	MONGODB = "mongodb",
	REDIS = "redis",
	ORACLE = "oracle",
	SQLSERVER = "sqlserver",
	MARIADB = "mariadb",
	COUCHDB = "couchdb",
	NEO4J = "neo4j",
	ELASTICSEARCH = "elasticsearch",
	CASSANDRA = "cassandra",
	DYNAMODB = "dynamodb",
	FIREBASE = "firebase",
	SUPABASE = "supabase",
}

/**
 * 表结构接口
 */
export interface TableStructure extends BaseModel {
	/** 表名 */
	tableName: string
	/** 表架构 */
	schema?: string
	/** 字段列表 */
	columns: ColumnDefinition[]
	/** 主键 */
	primaryKey: PrimaryKey
	/** 外键列表 */
	foreignKeys: ForeignKey[]
	/** 索引列表 */
	indexes: TableIndex[]
	/** 约束列表 */
	constraints: TableConstraint[]
	/** 表类型 */
	tableType: TableType
	/** 存储引擎 */
	storageEngine?: string
	/** 字符集 */
	charset?: string
	/** 排序规则 */
	collation?: string
	/** 行数估计 */
	rowCount?: number
	/** 表大小（字节） */
	tableSize?: number
	/** 创建时间 */
	createdAt?: Date
	/** 最后修改时间 */
	lastModified?: Date
	/** 表注释 */
	comment?: string
	/** 表元数据 */
	tableMetadata?: Record<string, any>
}

/**
 * 字段定义接口
 */
export interface ColumnDefinition {
	/** 字段名 */
	name: string
	/** 数据类型 */
	dataType: DataType
	/** 是否可空 */
	nullable: boolean
	/** 默认值 */
	defaultValue?: any
	/** 是否自增 */
	autoIncrement?: boolean
	/** 是否唯一 */
	unique?: boolean
	/** 是否主键 */
	isPrimaryKey?: boolean
	/** 是否外键 */
	isForeignKey?: boolean
	/** 字段长度 */
	length?: number
	/** 字段精度 */
	precision?: number
	/** 字段标度 */
	scale?: number
	/** 字符集 */
	charset?: string
	/** 排序规则 */
	collation?: string
	/** 字段注释 */
	comment?: string
	/** 字段位置 */
	position: number
	/** 字段元数据 */
	metadata?: Record<string, any>
}

/**
 * 数据类型枚举
 */
export enum DataType {
	// 数值类型
	INTEGER = "integer",
	BIGINT = "bigint",
	SMALLINT = "smallint",
	DECIMAL = "decimal",
	NUMERIC = "numeric",
	REAL = "real",
	DOUBLE = "double",
	FLOAT = "float",

	// 字符串类型
	VARCHAR = "varchar",
	CHAR = "char",
	TEXT = "text",
	LONGTEXT = "longtext",
	MEDIUMTEXT = "mediumtext",
	TINYTEXT = "tinytext",

	// 日期时间类型
	DATE = "date",
	TIME = "time",
	DATETIME = "datetime",
	TIMESTAMP = "timestamp",
	YEAR = "year",

	// 布尔类型
	BOOLEAN = "boolean",

	// 二进制类型
	BLOB = "blob",
	LONGBLOB = "longblob",
	MEDIUMBLOB = "mediumblob",
	TINYBLOB = "tinyblob",
	BINARY = "binary",
	VARBINARY = "varbinary",

	// JSON类型
	JSON = "json",
	JSONB = "jsonb",

	// UUID类型
	UUID = "uuid",

	// 数组类型
	ARRAY = "array",

	// 枚举类型
	ENUM = "enum",

	// 几何类型
	GEOMETRY = "geometry",
	GEOGRAPHY = "geography",

	// 网络类型
	INET = "inet",
	CIDR = "cidr",
	MACADDR = "macaddr",

	// 范围类型
	INT4RANGE = "int4range",
	INT8RANGE = "int8range",
	NUMRANGE = "numrange",
	TSRANGE = "tsrange",
	TSTZRANGE = "tstzrange",
	DATERANGE = "daterange",

	// 自定义类型
	CUSTOM = "custom",
}

/**
 * 表类型枚举
 */
export enum TableType {
	TABLE = "table",
	VIEW = "view",
	MATERIALIZED_VIEW = "materialized_view",
	TEMPORARY_TABLE = "temporary_table",
	EXTERNAL_TABLE = "external_table",
	SYSTEM_TABLE = "system_table",
}

/**
 * 主键接口
 */
export interface PrimaryKey {
	/** 主键名称 */
	name: string
	/** 主键字段 */
	columns: string[]
	/** 是否自动递增 */
	autoIncrement?: boolean
	/** 主键约束名 */
	constraintName?: string
}

/**
 * 外键接口
 */
export interface ForeignKey {
	/** 外键名称 */
	name: string
	/** 外键字段 */
	columns: string[]
	/** 引用表 */
	referencedTable: string
	/** 引用字段 */
	referencedColumns: string[]
	/** 更新规则 */
	onUpdate: ReferentialAction
	/** 删除规则 */
	onDelete: ReferentialAction
	/** 外键约束名 */
	constraintName?: string
}

/**
 * 引用动作枚举
 */
export enum ReferentialAction {
	CASCADE = "cascade",
	SET_NULL = "set_null",
	SET_DEFAULT = "set_default",
	RESTRICT = "restrict",
	NO_ACTION = "no_action",
}

/**
 * 表索引接口
 */
export interface TableIndex {
	/** 索引名称 */
	name: string
	/** 索引字段 */
	columns: string[]
	/** 是否唯一 */
	unique: boolean
	/** 是否主键 */
	isPrimary?: boolean
	/** 索引类型 */
	type: IndexType
	/** 索引方法 */
	method?: string
	/** 索引注释 */
	comment?: string
}

/**
 * 索引类型枚举
 */
export enum IndexType {
	BTREE = "btree",
	HASH = "hash",
	GIST = "gist",
	SPGIST = "spgist",
	GIN = "gin",
	BRIN = "brin",
	FULLTEXT = "fulltext",
	SPATIAL = "spatial",
}

/**
 * 表约束接口
 */
export interface TableConstraint {
	/** 约束名称 */
	name: string
	/** 约束类型 */
	type: ConstraintType
	/** 约束字段 */
	columns: string[]
	/** 约束条件 */
	condition?: string
	/** 约束定义 */
	definition?: string
}

/**
 * 约束类型枚举
 */
export enum ConstraintType {
	PRIMARY_KEY = "primary_key",
	FOREIGN_KEY = "foreign_key",
	UNIQUE = "unique",
	CHECK = "check",
	NOT_NULL = "not_null",
	DEFAULT = "default",
}

/**
 * 关系映射接口
 */
export interface RelationshipMap extends BaseModel {
	/** 源表 */
	sourceTable: string
	/** 目标表 */
	targetTable: string
	/** 关系类型 */
	relationshipType: RelationshipType
	/** 源字段 */
	sourceColumns: string[]
	/** 目标字段 */
	targetColumns: string[]
	/** 基数 */
	cardinality: Cardinality
	/** 关系强度 */
	relationshipStrength: RelationshipStrength
	/** 是否双向 */
	bidirectional: boolean
	/** 级联操作 */
	cascadeOperations: CascadeOperation[]
	/** 关系注释 */
	comment?: string
	/** 关系元数据 */
	metadata?: Record<string, any>
}

/**
 * 关系类型枚举
 */
export enum RelationshipType {
	ONE_TO_ONE = "one_to_one",
	ONE_TO_MANY = "one_to_many",
	MANY_TO_ONE = "many_to_one",
	MANY_TO_MANY = "many_to_many",
	INHERITANCE = "inheritance",
	COMPOSITION = "composition",
	AGGREGATION = "aggregation",
}

/**
 * 基数枚举
 */
export enum Cardinality {
	ZERO_OR_ONE = "zero_or_one",
	ONE = "one",
	ZERO_OR_MANY = "zero_or_many",
	ONE_OR_MANY = "one_or_many",
	MANY = "many",
}

/**
 * 关系强度枚举
 */
export enum RelationshipStrength {
	WEAK = "weak",
	STRONG = "strong",
	ASSOCIATIVE = "associative",
}

/**
 * 级联操作枚举
 */
export enum CascadeOperation {
	CASCADE = "cascade",
	SET_NULL = "set_null",
	SET_DEFAULT = "set_default",
	RESTRICT = "restrict",
	NO_ACTION = "no_action",
}

/**
 * 数据库索引接口
 */
export interface DatabaseIndex extends BaseModel {
	/** 索引名称 */
	indexName: string
	/** 表名 */
	tableName: string
	/** 索引字段 */
	columns: string[]
	/** 是否唯一 */
	unique: boolean
	/** 索引类型 */
	indexType: IndexType
	/** 索引方法 */
	method?: string
	/** 索引注释 */
	comment?: string
	/** 索引大小（字节） */
	size?: number
	/** 索引选择性 */
	selectivity?: number
	/** 最后重建时间 */
	lastRebuilt?: Date
	/** 索引元数据 */
	metadata?: Record<string, any>
}

/**
 * 数据库约束接口
 */
export interface DatabaseConstraint extends BaseModel {
	/** 约束名称 */
	constraintName: string
	/** 约束类型 */
	constraintType: ConstraintType
	/** 表名 */
	tableName: string
	/** 约束字段 */
	columns: string[]
	/** 约束定义 */
	definition: string
	/** 约束状态 */
	status: ConstraintStatus
	/** 约束注释 */
	comment?: string
	/** 约束元数据 */
	metadata?: Record<string, any>
}

/**
 * 约束状态枚举
 */
export enum ConstraintStatus {
	ENABLED = "enabled",
	DISABLED = "disabled",
	VALIDATED = "validated",
	NOVALIDATE = "novalidate",
}

/**
 * 数据库视图接口
 */
export interface DatabaseView extends BaseModel {
	/** 视图名称 */
	viewName: string
	/** 视图定义 */
	definition: string
	/** 视图字段 */
	columns: ColumnDefinition[]
	/** 基础表 */
	baseTables: string[]
	/** 是否可更新 */
	isUpdatable: boolean
	/** 检查选项 */
	checkOption?: string
	/** 视图注释 */
	comment?: string
	/** 创建时间 */
	createdAt?: Date
	/** 最后修改时间 */
	lastModified?: Date
	/** 视图元数据 */
	metadata?: Record<string, any>
}

/**
 * 存储过程接口
 */
export interface StoredProcedure extends BaseModel {
	/** 存储过程名称 */
	procedureName: string
	/** 参数列表 */
	parameters: ProcedureParameter[]
	/** 返回类型 */
	returnType?: DataType
	/** 存储过程定义 */
	definition: string
	/** 存储过程语言 */
	language: string
	/** 存储过程注释 */
	comment?: string
	/** 创建时间 */
	createdAt?: Date
	/** 最后修改时间 */
	lastModified?: Date
	/** 存储过程元数据 */
	metadata?: Record<string, any>
}

/**
 * 存储过程参数接口
 */
export interface ProcedureParameter {
	/** 参数名称 */
	name: string
	/** 参数类型 */
	type: DataType
	/** 参数模式 */
	mode: ParameterMode
	/** 默认值 */
	defaultValue?: any
	/** 参数注释 */
	comment?: string
}

/**
 * 参数模式枚举
 */
export enum ParameterMode {
	IN = "in",
	OUT = "out",
	INOUT = "inout",
}

/**
 * 数据库触发器接口
 */
export interface DatabaseTrigger extends BaseModel {
	/** 触发器名称 */
	triggerName: string
	/** 触发器事件 */
	triggerEvent: TriggerEvent
	/** 触发时机 */
	triggerTiming: TriggerTiming
	/** 触发器表 */
	triggerTable: string
	/** 触发器定义 */
	definition: string
	/** 触发器条件 */
	condition?: string
	/** 触发器注释 */
	comment?: string
	/** 创建时间 */
	createdAt?: Date
	/** 最后修改时间 */
	lastModified?: Date
	/** 触发器元数据 */
	metadata?: Record<string, any>
}

/**
 * 触发器事件枚举
 */
export enum TriggerEvent {
	INSERT = "insert",
	UPDATE = "update",
	DELETE = "delete",
	TRUNCATE = "truncate",
}

/**
 * 触发时机枚举
 */
export enum TriggerTiming {
	BEFORE = "before",
	AFTER = "after",
	INSTEAD_OF = "instead_of",
}

/**
 * 模式元数据接口
 */
export interface SchemaMetadata {
	/** 数据库大小（字节） */
	databaseSize: number
	/** 表数量 */
	tableCount: number
	/** 视图数量 */
	viewCount: number
	/** 索引数量 */
	indexCount: number
	/** 存储过程数量 */
	procedureCount: number
	/** 触发器数量 */
	triggerCount: number
	/** 约束数量 */
	constraintCount: number
	/** 关系数量 */
	relationshipCount: number
	/** 模式复杂度 */
	complexity: SchemaComplexity
	/** 性能指标 */
	performanceMetrics: SchemaPerformanceMetrics
	/** 创建时间 */
	createdAt?: Date
	/** 最后修改时间 */
	lastModified?: Date
}

/**
 * 模式复杂度接口
 */
export interface SchemaComplexity {
	/** 复杂度得分 */
	score: number
	/** 复杂度级别 */
	level: ComplexityLevel
	/** 表复杂度 */
	tableComplexity: number
	/** 关系复杂度 */
	relationshipComplexity: number
	/** 索引复杂度 */
	indexComplexity: number
	/** 约束复杂度 */
	constraintComplexity: number
}

/**
 * 复杂度级别枚举
 */
export enum ComplexityLevel {
	SIMPLE = "simple",
	MODERATE = "moderate",
	COMPLEX = "complex",
	VERY_COMPLEX = "very_complex",
}

/**
 * 模式性能指标接口
 */
export interface SchemaPerformanceMetrics {
	/** 查询性能 */
	queryPerformance: number
	/** 索引效率 */
	indexEfficiency: number
	/** 存储效率 */
	storageEfficiency: number
	/** 维护成本 */
	maintenanceCost: number
	/** 可扩展性 */
	scalability: number
	/** 性能评分 */
	performanceScore: number
}

/**
 * 数据库分析结果接口
 */
export interface DatabaseAnalysisResult extends BaseModel {
	/** 数据库模式 */
	schema: DatabaseSchema
	/** 分析状态 */
	status: AnalysisStatus
	/** 开始时间 */
	startTime: Date
	/** 结束时间 */
	endTime?: Date
	/** 持续时间（毫秒） */
	duration?: number
	/** 发现的表数量 */
	discoveredTables: number
	/** 分析的表数量 */
	analyzedTables: number
	/** 跳过的表数量 */
	skippedTables: number
	/** 错误表数量 */
	errorTables: number
	/** 警告表数量 */
	warningTables: number
	/** 分析结果 */
	results: DatabaseResult[]
	/** 错误信息 */
	errors: DatabaseError[]
	/** 警告信息 */
	warnings: DatabaseWarning[]
	/** 统计信息 */
	statistics: DatabaseStatistics
	/** 性能指标 */
	performanceMetrics: DatabasePerformanceMetrics
	/** 建议 */
	recommendations: DatabaseRecommendation[]
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
	TIMEOUT = "timeout",
}

/**
 * 数据库结果接口
 */
export interface DatabaseResult {
	/** 结果ID */
	id: string
	/** 结果类型 */
	type: DatabaseResultType
	/** 表名 */
	tableName: string
	/** 严重程度 */
	severity: SeverityLevel
	/** 消息 */
	message: string
	/** 规则ID */
	ruleId?: string
	/** 规则名称 */
	ruleName?: string
	/** 建议 */
	suggestions?: string[]
	/** 上下文信息 */
	context?: Record<string, any>
	/** 元数据 */
	metadata?: Record<string, any>
}

/**
 * 数据库结果类型枚举
 */
export enum DatabaseResultType {
	SCHEMA_ISSUE = "schema_issue",
	PERFORMANCE_ISSUE = "performance_issue",
	SECURITY_ISSUE = "security_issue",
	DESIGN_ISSUE = "design_issue",
	NORMALIZATION_ISSUE = "normalization_issue",
	INDEX_ISSUE = "index_issue",
	CONSTRAINT_ISSUE = "constraint_issue",
	RELATIONSHIP_ISSUE = "relationship_issue",
	BEST_PRACTICE = "best_practice",
}

/**
 * 严重程度级别枚举
 */
export enum SeverityLevel {
	INFO = "info",
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}

/**
 * 数据库错误接口
 */
export interface DatabaseError {
	/** 错误代码 */
	code: string
	/** 错误消息 */
	message: string
	/** 表名 */
	tableName?: string
	/** 字段名 */
	columnName?: string
	/** 约束名 */
	constraintName?: string
	/** 堆栈跟踪 */
	stack?: string
	/** 错误详情 */
	details?: Record<string, any>
}

/**
 * 数据库警告接口
 */
export interface DatabaseWarning {
	/** 警告代码 */
	code: string
	/** 警告消息 */
	message: string
	/** 表名 */
	tableName?: string
	/** 字段名 */
	columnName?: string
	/** 约束名 */
	constraintName?: string
	/** 警告详情 */
	details?: Record<string, any>
}

/**
 * 数据库统计接口
 */
export interface DatabaseStatistics {
	/** 总表数 */
	totalTables: number
	/** 总字段数 */
	totalColumns: number
	/** 总索引数 */
	totalIndexes: number
	/** 总约束数 */
	totalConstraints: number
	/** 总关系数 */
	totalRelationships: number
	/** 总存储过程数 */
	totalProcedures: number
	/** 总触发器数 */
	totalTriggers: number
	/** 总视图数 */
	totalViews: number
	/** 数据库大小（字节） */
	totalSize: number
	/** 平均表大小（字节） */
	averageTableSize: number
	/** 最大表大小（字节） */
	maxTableSize: number
	/** 最小表大小（字节） */
	minTableSize: number
	/** 平均字段数 */
	averageColumnCount: number
	/** 最大字段数 */
	maxColumnCount: number
	/** 最小字段数 */
	minColumnCount: number
	/** 索引覆盖率 */
	indexCoverage: number
	/** 约束覆盖率 */
	constraintCoverage: number
	/** 规范化级别 */
	normalizationLevel: number
}

/**
 * 数据库性能指标接口
 */
export interface DatabasePerformanceMetrics {
	/** 查询性能评分 */
	queryPerformanceScore: number
	/** 索引效率评分 */
	indexEfficiencyScore: number
	/** 存储效率评分 */
	storageEfficiencyScore: number
	/** 维护成本评分 */
	maintenanceCostScore: number
	/** 可扩展性评分 */
	scalabilityScore: number
	/** 总体性能评分 */
	overallPerformanceScore: number
	/** 性能瓶颈 */
	performanceBottlenecks: PerformanceBottleneck[]
	/** 优化建议 */
	optimizationSuggestions: string[]
}

/**
 * 性能瓶颈接口
 */
export interface PerformanceBottleneck {
	/** 瓶颈类型 */
	type: BottleneckType
	/** 瓶颈位置 */
	location: string
	/** 严重程度 */
	severity: SeverityLevel
	/** 影响描述 */
	impact: string
	/** 建议解决方案 */
	suggestions: string[]
	/** 预估改进 */
	estimatedImprovement: number
}

/**
 * 瓶颈类型枚举
 */
export enum BottleneckType {
	MISSING_INDEX = "missing_index",
	REDUNDANT_INDEX = "redundant_index",
	INEFFICIENT_QUERY = "inefficient_query",
	TABLE_SCAN = "table_scan",
	LOCK_CONTENTION = "lock_contention",
	STORAGE_INEFFICIENCY = "storage_inefficiency",
	NORMALIZATION_ISSUE = "normalization_issue",
	DESIGN_PROBLEM = "design_problem",
}

/**
 * 数据库建议接口
 */
export interface DatabaseRecommendation {
	/** 建议ID */
	id: string
	/** 建议类型 */
	type: RecommendationType
	/** 建议标题 */
	title: string
	/** 建议描述 */
	description: string
	/** 优先级 */
	priority: RecommendationPriority
	/** 影响范围 */
	impactScope: ImpactScope
	/** 预估收益 */
	estimatedBenefit: number
	/** 实施难度 */
	implementationDifficulty: ImplementationDifficulty
	/** 具体建议 */
	suggestions: string[]
	/** 实施步骤 */
	implementationSteps?: string[]
	/** 风险评估 */
	riskAssessment: RiskAssessment
	/** 元数据 */
	metadata?: Record<string, any>
}

/**
 * 建议类型枚举
 */
export enum RecommendationType {
	INDEX_OPTIMIZATION = "index_optimization",
	SCHEMA_NORMALIZATION = "schema_normalization",
	PERFORMANCE_IMPROVEMENT = "performance_improvement",
	SECURITY_ENHANCEMENT = "security_enhancement",
	STORAGE_OPTIMIZATION = "storage_optimization",
	DESIGN_IMPROVEMENT = "design_improvement",
	MAINTENANCE_OPTIMIZATION = "maintenance_optimization",
}

/**
 * 建议优先级枚举
 */
export enum RecommendationPriority {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}

/**
 * 影响范围枚举
 */
export enum ImpactScope {
	SINGLE_TABLE = "single_table",
	MULTIPLE_TABLES = "multiple_tables",
	WHOLE_SCHEMA = "whole_schema",
	PERFORMANCE = "performance",
	SECURITY = "security",
	STORAGE = "storage",
}

/**
 * 实施难度枚举
 */
export enum ImplementationDifficulty {
	EASY = "easy",
	MODERATE = "moderate",
	DIFFICULT = "difficult",
	COMPLEX = "complex",
}

/**
 * 风险评估接口
 */
export interface RiskAssessment {
	/** 风险级别 */
	riskLevel: RiskLevel
	/** 风险描述 */
	riskDescription: string
	/** 缓解措施 */
	mitigationStrategies: string[]
	/** 回滚计划 */
	rollbackPlan?: string
}

/**
 * 风险级别枚举
 */
export enum RiskLevel {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}
