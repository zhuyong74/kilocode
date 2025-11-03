/**
 * Database Analysis Type Definitions
 *
 * This module defines the core types for database analysis,
 * including database connections, drivers, and analysis results.
 */

import { EventEmitter } from "events"

/**
 * Supported database types
 */
export enum DatabaseType {
	/** MySQL database */
	MYSQL = "mysql",
	/** PostgreSQL database */
	POSTGRESQL = "postgresql",
	/** SQLite database */
	SQLITE = "sqlite",
	/** Microsoft SQL Server */
	MSSQL = "mssql",
	/** Oracle database */
	ORACLE = "oracle",
	/** MongoDB database */
	MONGODB = "mongodb",
	/** Redis database */
	REDIS = "redis",
	/** Cassandra database */
	CASSANDRA = "cassandra",
	/** InfluxDB database */
	INFLUXDB = "influxdb",
	/** Elasticsearch */
	ELASTICSEARCH = "elasticsearch",
}

/**
 * Database connection status
 */
export enum ConnectionStatus {
	/** Connection is disconnected */
	DISCONNECTED = "disconnected",
	/** Connection is connecting */
	CONNECTING = "connecting",
	/** Connection is connected */
	CONNECTED = "connected",
	/** Connection is reconnecting */
	RECONNECTING = "reconnecting",
	/** Connection failed */
	FAILED = "failed",
	/** Connection is closing */
	CLOSING = "closing",
	/** Connection is closed */
	CLOSED = "closed",
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
	/** Database type */
	type: DatabaseType

	/** Database host */
	host: string

	/** Database port */
	port: number

	/** Database name */
	database: string

	/** Username */
	username: string

	/** Password */
	password: string

	/** Connection timeout in milliseconds */
	connectionTimeout: number

	/** Query timeout in milliseconds */
	queryTimeout: number

	/** Enable SSL */
	ssl: boolean

	/** SSL configuration */
	sslConfig?: SSLConfig

	/** Connection pool configuration */
	pool?: PoolConfig

	/** Custom connection options */
	options?: Record<string, any>
}

/**
 * SSL configuration
 */
export interface SSLConfig {
	/** Require SSL */
	require: boolean

	/** Reject unauthorized certificates */
	rejectUnauthorized: boolean

	/** CA certificate */
	ca?: string

	/** Client certificate */
	cert?: string

	/** Client private key */
	key?: string

	/** Passphrase for private key */
	passphrase?: string
}

/**
 * Connection pool configuration
 */
export interface PoolConfig {
	/** Minimum pool size */
	min: number

	/** Maximum pool size */
	max: number

	/** Connection idle timeout in milliseconds */
	idleTimeout: number

	/** Connection acquire timeout in milliseconds */
	acquireTimeout: number

	/** Connection create timeout in milliseconds */
	createTimeout: number

	/** Connection destroy timeout in milliseconds */
	destroyTimeout: number

	/** Enable connection validation */
	validate: boolean

	/** Validation query */
	validationQuery?: string
}

/**
 * Database connection interface
 */
export interface IDatabaseConnection extends EventEmitter {
	/** Connection ID */
	readonly id: string

	/** Database configuration */
	readonly config: DatabaseConfig

	/** Connection status */
	readonly status: ConnectionStatus

	/** Connection metadata */
	readonly metadata: ConnectionMetadata

	/** Connect to database */
	connect(): Promise<void>

	/** Disconnect from database */
	disconnect(): Promise<void>

	/** Test connection */
	ping(): Promise<boolean>

	/** Execute query */
	query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>

	/** Execute multiple queries in transaction */
	transaction<T = any>(queries: TransactionQuery[]): Promise<T[]>

	/** Begin transaction */
	beginTransaction(): Promise<void>

	/** Commit transaction */
	commit(): Promise<void>

	/** Rollback transaction */
	rollback(): Promise<void>

	/** Get database schema */
	getSchema(): Promise<DatabaseSchema>

	/** Get table information */
	getTableInfo(tableName: string): Promise<TableInfo>

	/** Get column information */
	getColumnInfo(tableName: string): Promise<ColumnInfo[]>

	/** Get index information */
	getIndexInfo(tableName: string): Promise<IndexInfo[]>

	/** Get foreign key information */
	getForeignKeyInfo(tableName: string): Promise<ForeignKeyInfo[]>

	/** Get database statistics */
	getStatistics(): Promise<DatabaseStatistics>

	/** Dispose connection */
	dispose(): Promise<void>
}

/**
 * Connection metadata
 */
export interface ConnectionMetadata {
	/** Database server version */
	serverVersion: string

	/** Database client version */
	clientVersion: string

	/** Connection creation time */
	createdAt: Date

	/** Last activity time */
	lastActivityAt: Date

	/** Connection uptime in milliseconds */
	uptime: number

	/** Total queries executed */
	totalQueries: number

	/** Connection properties */
	properties: Record<string, any>
}

/**
 * Query result
 */
export interface QueryResult<T = any> {
	/** Query result rows */
	rows: T[]

	/** Number of affected rows */
	rowCount: number

	/** Query execution time in milliseconds */
	executionTime: number

	/** Query metadata */
	metadata: QueryMetadata

	/** Query warnings */
	warnings: QueryWarning[]
}

/**
 * Query metadata
 */
export interface QueryMetadata {
	/** Query ID */
	id: string

	/** Query SQL */
	sql: string

	/** Query parameters */
	parameters?: any[]

	/** Query type */
	type: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "CREATE" | "DROP" | "ALTER" | "OTHER"

	/** Query plan */
	plan?: QueryPlan

	/** Query statistics */
	statistics: QueryStatistics
}

/**
 * Query plan
 */
export interface QueryPlan {
	/** Plan nodes */
	nodes: QueryPlanNode[]

	/** Total cost */
	totalCost: number

	/** Execution time */
	executionTime: number

	/** Plan text */
	text: string
}

/**
 * Query plan node
 */
export interface QueryPlanNode {
	/** Node type */
	type: string

	/** Node operation */
	operation: string

	/** Node cost */
	cost: number

	/** Node rows */
	rows: number

	/** Node width */
	width: number

	/** Child nodes */
	children: QueryPlanNode[]

	/** Node details */
	details: Record<string, any>
}

/**
 * Query statistics
 */
export interface QueryStatistics {
	/** Rows examined */
	rowsExamined: number

	/** Rows sent */
	rowsSent: number

	/** Bytes sent */
	bytesSent: number

	/** Temporary tables created */
	tempTablesCreated: number

	/** Temporary disk tables created */
	tempDiskTablesCreated: number

	/** Sort merge passes */
	sortMergePasses: number

	/** Sort rows */
	sortRows: number

	/** Sort scan count */
	sortScanCount: number
}

/**
 * Query warning
 */
export interface QueryWarning {
	/** Warning code */
	code: string

	/** Warning message */
	message: string

	/** Warning level */
	level: "NOTE" | "WARNING" | "ERROR"
}

/**
 * Transaction query
 */
export interface TransactionQuery {
	/** Query SQL */
	sql: string

	/** Query parameters */
	params?: any[]

	/** Query name */
	name?: string
}

/**
 * Database schema
 */
export interface DatabaseSchema {
	/** Database name */
	name: string

	/** Database version */
	version: string

	/** Database character set */
	charset: string

	/** Database collation */
	collation: string

	/** Database tables */
	tables: TableInfo[]

	/** Database views */
	views: ViewInfo[]

	/** Database procedures */
	procedures: ProcedureInfo[]

	/** Database functions */
	functions: FunctionInfo[]

	/** Database triggers */
	triggers: TriggerInfo[]

	/** Database indexes */
	indexes: IndexInfo[]

	/** Database constraints */
	constraints: ConstraintInfo[]
}

/**
 * Table information
 */
export interface TableInfo {
	/** Table name */
	name: string

	/** Table schema */
	schema: string

	/** Table type */
	type: "TABLE" | "VIEW" | "TEMPORARY"

	/** Table engine */
	engine?: string

	/** Table character set */
	charset?: string

	/** Table collation */
	collation?: string

	/** Table comment */
	comment?: string

	/** Table creation time */
	createdAt?: Date

	/** Table modification time */
	modifiedAt?: Date

	/** Table row count */
	rowCount: number

	/** Table size in bytes */
	size: number

	/** Table columns */
	columns: ColumnInfo[]

	/** Table indexes */
	indexes: IndexInfo[]

	/** Table foreign keys */
	foreignKeys: ForeignKeyInfo[]

	/** Table constraints */
	constraints: ConstraintInfo[]
}

/**
 * Column information
 */
export interface ColumnInfo {
	/** Column name */
	name: string

	/** Column data type */
	dataType: string

	/** Column length */
	length?: number

	/** Column precision */
	precision?: number

	/** Column scale */
	scale?: number

	/** Column is nullable */
	nullable: boolean

	/** Column default value */
	defaultValue?: any

	/** Column is primary key */
	isPrimaryKey: boolean

	/** Column is unique */
	isUnique: boolean

	/** Column is auto increment */
	isAutoIncrement: boolean

	/** Column comment */
	comment?: string

	/** Column character set */
	charset?: string

	/** Column collation */
	collation?: string
}

/**
 * Index information
 */
export interface IndexInfo {
	/** Index name */
	name: string

	/** Index table */
	table: string

	/** Index type */
	type: "PRIMARY" | "UNIQUE" | "INDEX" | "FULLTEXT" | "SPATIAL"

	/** Index columns */
	columns: IndexColumnInfo[]

	/** Index is unique */
	isUnique: boolean

	/** Index cardinality */
	cardinality: number

	/** Index size in bytes */
	size: number

	/** Index comment */
	comment?: string
}

/**
 * Index column information
 */
export interface IndexColumnInfo {
	/** Column name */
	name: string

	/** Column order */
	order: "ASC" | "DESC"

	/** Column length */
	length?: number

	/** Column position in index */
	position: number
}

/**
 * Foreign key information
 */
export interface ForeignKeyInfo {
	/** Foreign key name */
	name: string

	/** Source table */
	table: string

	/** Source columns */
	columns: string[]

	/** Referenced table */
	referencedTable: string

	/** Referenced columns */
	referencedColumns: string[]

	/** On update action */
	onUpdate: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION"

	/** On delete action */
	onDelete: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION"
}

/**
 * Constraint information
 */
export interface ConstraintInfo {
	/** Constraint name */
	name: string

	/** Constraint type */
	type: "PRIMARY KEY" | "FOREIGN KEY" | "UNIQUE" | "CHECK" | "NOT NULL"

	/** Constraint table */
	table: string

	/** Constraint columns */
	columns: string[]

	/** Constraint definition */
	definition?: string
}

/**
 * View information
 */
export interface ViewInfo {
	/** View name */
	name: string

	/** View schema */
	schema: string

	/** View definition */
	definition: string

	/** View is updatable */
	isUpdatable: boolean

	/** View comment */
	comment?: string
}

/**
 * Procedure information
 */
export interface ProcedureInfo {
	/** Procedure name */
	name: string

	/** Procedure schema */
	schema: string

	/** Procedure definition */
	definition: string

	/** Procedure parameters */
	parameters: ParameterInfo[]

	/** Procedure return type */
	returnType?: string

	/** Procedure comment */
	comment?: string
}

/**
 * Function information
 */
export interface FunctionInfo {
	/** Function name */
	name: string

	/** Function schema */
	schema: string

	/** Function definition */
	definition: string

	/** Function parameters */
	parameters: ParameterInfo[]

	/** Function return type */
	returnType: string

	/** Function comment */
	comment?: string
}

/**
 * Parameter information
 */
export interface ParameterInfo {
	/** Parameter name */
	name: string

	/** Parameter data type */
	dataType: string

	/** Parameter mode */
	mode: "IN" | "OUT" | "INOUT"

	/** Parameter default value */
	defaultValue?: any
}

/**
 * Trigger information
 */
export interface TriggerInfo {
	/** Trigger name */
	name: string

	/** Trigger table */
	table: string

	/** Trigger event */
	event: "INSERT" | "UPDATE" | "DELETE"

	/** Trigger timing */
	timing: "BEFORE" | "AFTER" | "INSTEAD OF"

	/** Trigger definition */
	definition: string

	/** Trigger is active */
	isActive: boolean
}

/**
 * Database statistics
 */
export interface DatabaseStatistics {
	/** Database size in bytes */
	size: number

	/** Number of tables */
	tableCount: number

	/** Number of views */
	viewCount: number

	/** Number of procedures */
	procedureCount: number

	/** Number of functions */
	functionCount: number

	/** Number of triggers */
	triggerCount: number

	/** Number of indexes */
	indexCount: number

	/** Total row count */
	totalRows: number

	/** Connection count */
	connectionCount: number

	/** Active connection count */
	activeConnections: number

	/** Query statistics */
	queryStatistics: {
		totalQueries: number
		selectQueries: number
		insertQueries: number
		updateQueries: number
		deleteQueries: number
		averageQueryTime: number
	}

	/** Performance statistics */
	performanceStatistics: {
		cpuUsage: number
		memoryUsage: number
		diskUsage: number
		networkIO: number
	}
}

/**
 * Database driver interface
 */
export interface IDatabaseDriver {
	/** Driver name */
	readonly name: string

	/** Supported database type */
	readonly type: DatabaseType

	/** Driver version */
	readonly version: string

	/** Create connection */
	createConnection(config: DatabaseConfig): Promise<IDatabaseConnection>

	/** Test connection */
	testConnection(config: DatabaseConfig): Promise<boolean>

	/** Validate configuration */
	validateConfig(config: DatabaseConfig): Promise<boolean>

	/** Get default configuration */
	getDefaultConfig(): Partial<DatabaseConfig>

	/** Dispose driver */
	dispose(): Promise<void>
}

/**
 * Database driver registry interface
 */
export interface IDatabaseDriverRegistry {
	/** Register driver */
	register(driver: IDatabaseDriver): void

	/** Unregister driver */
	unregister(type: DatabaseType): void

	/** Get driver */
	get(type: DatabaseType): IDatabaseDriver | undefined

	/** List all drivers */
	list(): IDatabaseDriver[]

	/** Check if driver is supported */
	isSupported(type: DatabaseType): boolean
}

/**
 * Connection pool interface
 */
export interface IConnectionPool extends EventEmitter {
	/** Pool configuration */
	readonly config: PoolConfig

	/** Pool statistics */
	readonly statistics: PoolStatistics

	/** Initialize pool */
	initialize(config: PoolConfig, factory: ConnectionFactory): Promise<void>

	/** Acquire connection */
	acquire(): Promise<IDatabaseConnection>

	/** Release connection */
	release(connection: IDatabaseConnection): Promise<void>

	/** Destroy connection */
	destroy(connection: IDatabaseConnection): Promise<void>

	/** Clear pool */
	clear(): Promise<void>

	/** Dispose pool */
	dispose(): Promise<void>
}

/**
 * Connection factory
 */
export type ConnectionFactory = () => Promise<IDatabaseConnection>

/**
 * Pool statistics
 */
export interface PoolStatistics {
	/** Total connections */
	total: number

	/** Active connections */
	active: number

	/** Idle connections */
	idle: number

	/** Pending requests */
	pending: number

	/** Total acquisitions */
	totalAcquisitions: number

	/** Total releases */
	totalReleases: number

	/** Total destroys */
	totalDestroys: number

	/** Average acquisition time */
	averageAcquisitionTime: number

	/** Average connection lifetime */
	averageConnectionLifetime: number
}

/**
 * Database engine interface
 */
export interface IDatabaseEngine {
	/** Engine configuration */
	readonly config: DatabaseConfig

	/** Driver registry */
	readonly drivers: IDatabaseDriverRegistry

	/** Connection pool */
	readonly pool: IConnectionPool

	/** Initialize engine */
	initialize(config: DatabaseConfig): Promise<void>

	/** Create connection */
	createConnection(): Promise<IDatabaseConnection>

	/** Get connection from pool */
	getConnection(): Promise<IDatabaseConnection>

	/** Release connection to pool */
	releaseConnection(connection: IDatabaseConnection): Promise<void>

	/** Execute query */
	query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>

	/** Execute transaction */
	transaction<T = any>(queries: TransactionQuery[]): Promise<T[]>

	/** Get database schema */
	getSchema(): Promise<DatabaseSchema>

	/** Get engine statistics */
	getStatistics(): Promise<DatabaseEngineStatistics>

	/** Dispose engine */
	dispose(): Promise<void>
}

/**
 * Database engine statistics
 */
export interface DatabaseEngineStatistics {
	/** Connection statistics */
	connections: PoolStatistics

	/** Query statistics */
	queries: {
		total: number
		successful: number
		failed: number
		averageTime: number
	}

	/** Transaction statistics */
	transactions: {
		total: number
		committed: number
		rolledBack: number
		averageTime: number
	}

	/** Performance statistics */
	performance: {
		memoryUsage: number
		cpuUsage: number
		networkIO: number
	}
}
