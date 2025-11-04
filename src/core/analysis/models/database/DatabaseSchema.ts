/**
 * 数据库模式类
 *
 * 提供数据库模式的管理和分析功能。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent, ModelEventType } from "../../types"
import {
	DatabaseSchema as IDatabaseSchema,
	TableStructure,
	ColumnDefinition,
	PrimaryKey,
	ForeignKey,
	TableIndex,
	TableConstraint,
	DatabaseIndex,
	DatabaseConstraint,
	DatabaseView,
	StoredProcedure,
	DatabaseTrigger,
	SchemaMetadata,
	SchemaComplexity,
	SchemaPerformanceMetrics,
	DatabaseType,
} from "../../types/database"
import { ValidationResult } from "../validation/ValidationResult"
import { EventEmitter } from "events"

export class DatabaseSchema implements IDatabaseSchema, Serializable, Validatable, Cloneable, Observable {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]

	// 数据库模式特定属性
	schemaName: string
	databaseName: string
	databaseType: DatabaseType
	tables: Map<string, TableStructure>
	views: Map<string, DatabaseView>
	procedures: Map<string, StoredProcedure>
	triggers: Map<string, DatabaseTrigger>
	indexes: Map<string, DatabaseIndex>
	constraints: Map<string, DatabaseConstraint>
	relationships: Map<string, ForeignKey>
	schemaMetadata: SchemaMetadata
	complexity: SchemaComplexity
	performanceMetrics: SchemaPerformanceMetrics

	private observers: Observer[] = []
	private eventEmitter: EventEmitter

	constructor(schema?: Partial<IDatabaseSchema>) {
		const now = new Date()

		// 基础属性
		this.id = schema?.id || this.generateId()
		this.name = schema?.name || "database-schema"
		this.description = schema?.description
		this.version = schema?.version || "1.0.0"
		this.createdAt = schema?.createdAt || now
		this.updatedAt = schema?.updatedAt || now
		this.metadata = schema?.metadata || {}
		this.enabled = schema?.enabled ?? true
		this.tags = schema?.tags || []

		// 数据库模式特定属性
		this.schemaName = schema?.schemaName || "public"
		this.databaseName = schema?.databaseName || "unknown"
		this.databaseType = schema?.databaseType || "postgresql"
		this.tables = new Map()
		this.views = new Map()
		this.procedures = new Map()
		this.triggers = new Map()
		this.indexes = new Map()
		this.constraints = new Map()
		this.relationships = new Map()

		this.schemaMetadata = schema?.metadata || {
			totalTables: 0,
			totalViews: 0,
			totalProcedures: 0,
			totalTriggers: 0,
			totalIndexes: 0,
			totalConstraints: 0,
			totalRelationships: 0,
			sizeInBytes: 0,
			lastAnalyzed: now,
			analysisVersion: "1.0.0",
		}

		this.complexity = schema?.complexity || {
			overallScore: 0,
			tableComplexity: 0,
			relationshipComplexity: 0,
			normalizationScore: 0,
			redundancyScore: 0,
			level: "simple",
		}

		this.performanceMetrics = schema?.performanceMetrics || {
			queryPerformance: 0,
			indexEfficiency: 0,
			tableScanRatio: 0,
			joinComplexity: 0,
			storageEfficiency: 0,
			cacheHitRatio: 0,
		}

		this.eventEmitter = new EventEmitter()
		this.setupEventListeners()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `schema-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("schema:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	/**
	 * 验证模式（自验证）
	 */
	async validate(): Promise<boolean> {
		try {
			// 基本的自验证逻辑
			const isValid = this.schemaName && this.databaseType

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
				field: "schemaName",
				rules: ["required", "string", "minLength:1", "maxLength:100"],
			},
			{
				field: "databaseType",
				rules: ["required", "string"],
			},
			{
				field: "tables",
				rules: ["required", "object"],
			},
		]
	}

	/**
	 * 获取验证结果（自验证）
	 */
	getValidationResult(): any {
		return new ValidationResult({
			name: "DatabaseSchema Self Validation",
			description: "数据库模式的自验证结果",
		})
	}

	/**
	 * 序列化模式
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
				schemaName: this.schemaName,
				databaseName: this.databaseName,
				databaseType: this.databaseType,
				tables: Array.from(this.tables.values()),
				views: Array.from(this.views.values()),
				procedures: Array.from(this.procedures.values()),
				triggers: Array.from(this.triggers.values()),
				indexes: Array.from(this.indexes.values()),
				constraints: Array.from(this.constraints.values()),
				relationships: Array.from(this.relationships.values()),
				schemaMetadata: this.schemaMetadata,
				complexity: this.complexity,
				performanceMetrics: this.performanceMetrics,
			}

			this.notifyObservers({
				type: ModelEventType.SERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["serialization", "database"],
			})

			return JSON.stringify(data, null, 2)
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["serialization", "error", "database"],
			})
			throw error
		}
	}

	/**
	 * 反序列化模式
	 */
	deserialize(data: string): void {
		try {
			const parsed = JSON.parse(data)

			// 基础属性
			this.id = parsed.id || this.generateId()
			this.name = parsed.name || "database-schema"
			this.description = parsed.description
			this.version = parsed.version || "1.0.0"
			this.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date()
			this.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
			this.metadata = parsed.metadata || {}
			this.enabled = parsed.enabled ?? true
			this.tags = parsed.tags || []

			// 数据库模式特定属性
			this.schemaName = parsed.schemaName || "public"
			this.databaseName = parsed.databaseName || "unknown"
			this.databaseType = parsed.databaseType || "postgresql"

			// 重新填充集合
			this.tables = new Map()
			this.views = new Map()
			this.procedures = new Map()
			this.triggers = new Map()
			this.indexes = new Map()
			this.constraints = new Map()
			this.relationships = new Map()

			if (parsed.tables) {
				parsed.tables.forEach((table: TableStructure) => {
					this.tables.set(table.tableName, table)
				})
			}

			if (parsed.views) {
				parsed.views.forEach((view: DatabaseView) => {
					this.views.set(view.viewName, view)
				})
			}

			if (parsed.procedures) {
				parsed.procedures.forEach((procedure: StoredProcedure) => {
					this.procedures.set(procedure.procedureName, procedure)
				})
			}

			if (parsed.triggers) {
				parsed.triggers.forEach((trigger: DatabaseTrigger) => {
					this.triggers.set(trigger.triggerName, trigger)
				})
			}

			if (parsed.indexes) {
				parsed.indexes.forEach((index: DatabaseIndex) => {
					this.indexes.set(index.indexName, index)
				})
			}

			if (parsed.constraints) {
				parsed.constraints.forEach((constraint: DatabaseConstraint) => {
					this.constraints.set(constraint.constraintName, constraint)
				})
			}

			if (parsed.relationships) {
				parsed.relationships.forEach((relationship: ForeignKey) => {
					this.relationships.set(relationship.constraintName, relationship)
				})
			}

			this.metadata = parsed.schemaMetadata || parsed.metadata || {}
			this.complexity = parsed.complexity || {
				overallScore: 0,
				tableComplexity: 0,
				relationshipComplexity: 0,
				normalizationScore: 0,
				redundancyScore: 0,
				level: "simple",
			}

			this.performanceMetrics = parsed.performanceMetrics || {
				queryPerformance: 0,
				indexEfficiency: 0,
				tableScanRatio: 0,
				joinComplexity: 0,
				storageEfficiency: 0,
				cacheHitRatio: 0,
			}

			this.notifyObservers({
				type: ModelEventType.DESERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["deserialization", "database"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["deserialization", "error", "database"],
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
	 * 克隆模式
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
			tags: ["clone", "database"],
		})

		return cloned
	}

	/**
	 * 深度克隆模式
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
	 * 添加表
	 */
	addTable(table: TableStructure): void {
		this.tables.set(table.tableName, table)
		this.updateMetadata()
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { tableAdded: table.tableName },
			timestamp: new Date(),
			tags: ["table", "add", "database"],
		})
	}

	/**
	 * 移除表
	 */
	removeTable(tableName: string): boolean {
		const removed = this.tables.delete(tableName)

		if (removed) {
			// 移除相关的索引、约束和关系
			this.removeTableIndexes(tableName)
			this.removeTableConstraints(tableName)
			this.removeTableRelationships(tableName)

			this.updateMetadata()
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { tableRemoved: tableName },
				timestamp: new Date(),
				tags: ["table", "remove", "database"],
			})
		}

		return removed
	}

	/**
	 * 获取表
	 */
	getTable(tableName: string): TableStructure | undefined {
		return this.tables.get(tableName)
	}

	/**
	 * 获取所有表
	 */
	getAllTables(): TableStructure[] {
		return Array.from(this.tables.values())
	}

	/**
	 * 按类型获取表
	 */
	getTablesByType(type: string): TableStructure[] {
		return this.getAllTables().filter((table) => table.tableType === type)
	}

	/**
	 * 添加视图
	 */
	addView(view: DatabaseView): void {
		this.views.set(view.viewName, view)
		this.updateMetadata()
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { viewAdded: view.viewName },
			timestamp: new Date(),
			tags: ["view", "add", "database"],
		})
	}

	/**
	 * 移除视图
	 */
	removeView(viewName: string): boolean {
		const removed = this.views.delete(viewName)

		if (removed) {
			this.updateMetadata()
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { viewRemoved: viewName },
				timestamp: new Date(),
				tags: ["view", "remove", "database"],
			})
		}

		return removed
	}

	/**
	 * 获取视图
	 */
	getView(viewName: string): DatabaseView | undefined {
		return this.views.get(viewName)
	}

	/**
	 * 获取所有视图
	 */
	getAllViews(): DatabaseView[] {
		return Array.from(this.views.values())
	}

	/**
	 * 添加存储过程
	 */
	addProcedure(procedure: StoredProcedure): void {
		this.procedures.set(procedure.procedureName, procedure)
		this.updateMetadata()
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { procedureAdded: procedure.procedureName },
			timestamp: new Date(),
			tags: ["procedure", "add", "database"],
		})
	}

	/**
	 * 移除存储过程
	 */
	removeProcedure(procedureName: string): boolean {
		const removed = this.procedures.delete(procedureName)

		if (removed) {
			this.updateMetadata()
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { procedureRemoved: procedureName },
				timestamp: new Date(),
				tags: ["procedure", "remove", "database"],
			})
		}

		return removed
	}

	/**
	 * 获取存储过程
	 */
	getProcedure(procedureName: string): StoredProcedure | undefined {
		return this.procedures.get(procedureName)
	}

	/**
	 * 获取所有存储过程
	 */
	getAllProcedures(): StoredProcedure[] {
		return Array.from(this.procedures.values())
	}

	/**
	 * 添加触发器
	 */
	addTrigger(trigger: DatabaseTrigger): void {
		this.triggers.set(trigger.triggerName, trigger)
		this.updateMetadata()
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { triggerAdded: trigger.triggerName },
			timestamp: new Date(),
			tags: ["trigger", "add", "database"],
		})
	}

	/**
	 * 移除触发器
	 */
	removeTrigger(triggerName: string): boolean {
		const removed = this.triggers.delete(triggerName)

		if (removed) {
			this.updateMetadata()
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { triggerRemoved: triggerName },
				timestamp: new Date(),
				tags: ["trigger", "remove", "database"],
			})
		}

		return removed
	}

	/**
	 * 获取触发器
	 */
	getTrigger(triggerName: string): DatabaseTrigger | undefined {
		return this.triggers.get(triggerName)
	}

	/**
	 * 获取所有触发器
	 */
	getAllTriggers(): DatabaseTrigger[] {
		return Array.from(this.triggers.values())
	}

	/**
	 * 添加索引
	 */
	addIndex(index: DatabaseIndex): void {
		this.indexes.set(index.indexName, index)
		this.updateMetadata()
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { indexAdded: index.indexName },
			timestamp: new Date(),
			tags: ["index", "add", "database"],
		})
	}

	/**
	 * 移除索引
	 */
	removeIndex(indexName: string): boolean {
		const removed = this.indexes.delete(indexName)

		if (removed) {
			this.updateMetadata()
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { indexRemoved: indexName },
				timestamp: new Date(),
				tags: ["index", "remove", "database"],
			})
		}

		return removed
	}

	/**
	 * 获取索引
	 */
	getIndex(indexName: string): DatabaseIndex | undefined {
		return this.indexes.get(indexName)
	}

	/**
	 * 获取所有索引
	 */
	getAllIndexes(): DatabaseIndex[] {
		return Array.from(this.indexes.values())
	}

	/**
	 * 获取表的索引
	 */
	getTableIndexes(tableName: string): DatabaseIndex[] {
		return this.getAllIndexes().filter((index) => index.tableName === tableName)
	}

	/**
	 * 添加约束
	 */
	addConstraint(constraint: DatabaseConstraint): void {
		this.constraints.set(constraint.constraintName, constraint)
		this.updateMetadata()
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { constraintAdded: constraint.constraintName },
			timestamp: new Date(),
			tags: ["constraint", "add", "database"],
		})
	}

	/**
	 * 移除约束
	 */
	removeConstraint(constraintName: string): boolean {
		const removed = this.constraints.delete(constraintName)

		if (removed) {
			this.updateMetadata()
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { constraintRemoved: constraintName },
				timestamp: new Date(),
				tags: ["constraint", "remove", "database"],
			})
		}

		return removed
	}

	/**
	 * 获取约束
	 */
	getConstraint(constraintName: string): DatabaseConstraint | undefined {
		return this.constraints.get(constraintName)
	}

	/**
	 * 获取所有约束
	 */
	getAllConstraints(): DatabaseConstraint[] {
		return Array.from(this.constraints.values())
	}

	/**
	 * 获取表的约束
	 */
	getTableConstraints(tableName: string): DatabaseConstraint[] {
		return this.getAllConstraints().filter((constraint) => constraint.tableName === tableName)
	}

	/**
	 * 添加关系
	 */
	addRelationship(relationship: ForeignKey): void {
		this.relationships.set(relationship.constraintName, relationship)
		this.updateMetadata()
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { relationshipAdded: relationship.constraintName },
			timestamp: new Date(),
			tags: ["relationship", "add", "database"],
		})
	}

	/**
	 * 移除关系
	 */
	removeRelationship(constraintName: string): boolean {
		const removed = this.relationships.delete(constraintName)

		if (removed) {
			this.updateMetadata()
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { relationshipRemoved: constraintName },
				timestamp: new Date(),
				tags: ["relationship", "remove", "database"],
			})
		}

		return removed
	}

	/**
	 * 获取关系
	 */
	getRelationship(constraintName: string): ForeignKey | undefined {
		return this.relationships.get(constraintName)
	}

	/**
	 * 获取所有关系
	 */
	getAllRelationships(): ForeignKey[] {
		return Array.from(this.relationships.values())
	}

	/**
	 * 获取表的关系
	 */
	getTableRelationships(tableName: string): ForeignKey[] {
		return this.getAllRelationships().filter(
			(relationship) => relationship.tableName === tableName || relationship.referencedTableName === tableName,
		)
	}

	/**
	 * 更新元数据
	 */
	private updateMetadata(): void {
		this.metadata = {
			totalTables: this.tables.size,
			totalViews: this.views.size,
			totalProcedures: this.procedures.size,
			totalTriggers: this.triggers.size,
			totalIndexes: this.indexes.size,
			totalConstraints: this.constraints.size,
			totalRelationships: this.relationships.size,
			sizeInBytes: this.calculateSizeInBytes(),
			lastAnalyzed: new Date(),
			analysisVersion: "1.0.0",
		}
	}

	/**
	 * 计算模式大小（字节）
	 */
	private calculateSizeInBytes(): number {
		// 简化的计算方法
		let size = 0

		this.getAllTables().forEach((table) => {
			size += table.estimatedRowCount * 100 // 假设每行100字节
		})

		return size
	}

	/**
	 * 移除表相关的索引
	 */
	private removeTableIndexes(tableName: string): void {
		const indexesToRemove = this.getTableIndexes(tableName)
		indexesToRemove.forEach((index) => {
			this.indexes.delete(index.indexName)
		})
	}

	/**
	 * 移除表相关的约束
	 */
	private removeTableConstraints(tableName: string): void {
		const constraintsToRemove = this.getTableConstraints(tableName)
		constraintsToRemove.forEach((constraint) => {
			this.constraints.delete(constraint.constraintName)
		})
	}

	/**
	 * 移除表相关的关系
	 */
	private removeTableRelationships(tableName: string): void {
		const relationshipsToRemove = this.getTableRelationships(tableName)
		relationshipsToRemove.forEach((relationship) => {
			this.relationships.delete(relationship.constraintName)
		})
	}

	/**
	 * 分析复杂度
	 */
	analyzeComplexity(): SchemaComplexity {
		const tableCount = this.tables.size
		const relationshipCount = this.relationships.size
		const totalColumns = this.getAllTables().reduce((sum, table) => sum + table.columns.length, 0)

		// 简化的复杂度计算
		const tableComplexity = Math.min(tableCount / 50, 1) // 50个表为最大复杂度
		const relationshipComplexity = Math.min(relationshipCount / 100, 1) // 100个关系为最大复杂度
		const columnComplexity = Math.min(totalColumns / 1000, 1) // 1000个列为最大复杂度

		const overallScore = (tableComplexity + relationshipComplexity + columnComplexity) / 3

		let level: "simple" | "moderate" | "complex" | "very_complex"
		if (overallScore < 0.3) {
			level = "simple"
		} else if (overallScore < 0.6) {
			level = "moderate"
		} else if (overallScore < 0.8) {
			level = "complex"
		} else {
			level = "very_complex"
		}

		this.complexity = {
			overallScore,
			tableComplexity,
			relationshipComplexity,
			normalizationScore: 0.8, // 简化的标准化分数
			redundancyScore: 0.2, // 简化的冗余分数
			level,
		}

		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { complexityAnalyzed: true, complexity: this.complexity },
			timestamp: new Date(),
			tags: ["complexity", "analysis", "database"],
		})

		return this.complexity
	}

	/**
	 * 分析性能指标
	 */
	analyzePerformance(): SchemaPerformanceMetrics {
		const tableCount = this.tables.size
		const indexCount = this.indexes.size
		const totalRows = this.getAllTables().reduce((sum, table) => sum + table.estimatedRowCount, 0)

		// 简化的性能指标计算
		const queryPerformance = Math.min(indexCount / tableCount / 2, 1) // 索引覆盖率
		const indexEfficiency = Math.min(indexCount / 50, 1) // 索引效率
		const tableScanRatio = Math.min(totalRows / 1000000, 1) // 表扫描比例
		const joinComplexity = Math.min(this.relationships.size / 50, 1) // 连接复杂度
		const storageEfficiency = Math.min(totalRows / 10000000, 1) // 存储效率
		const cacheHitRatio = 0.95 // 假设的缓存命中率

		this.performanceMetrics = {
			queryPerformance,
			indexEfficiency,
			tableScanRatio,
			joinComplexity,
			storageEfficiency,
			cacheHitRatio,
		}

		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { performanceAnalyzed: true, performance: this.performanceMetrics },
			timestamp: new Date(),
			timestamp: new Date(),
			tags: ["performance", "analysis", "database"],
		})

		return this.performanceMetrics
	}

	/**
	 * 获取模式摘要
	 */
	getSummary(): Record<string, any> {
		return {
			id: this.id,
			name: this.name,
			schemaName: this.schemaName,
			databaseName: this.databaseName,
			databaseType: this.databaseType,
			totalTables: this.metadata.totalTables,
			totalViews: this.metadata.totalViews,
			totalProcedures: this.metadata.totalProcedures,
			totalTriggers: this.metadata.totalTriggers,
			totalIndexes: this.metadata.totalIndexes,
			totalConstraints: this.metadata.totalConstraints,
			totalRelationships: this.metadata.totalRelationships,
			complexity: this.complexity,
			performanceMetrics: this.performanceMetrics,
			lastAnalyzed: this.metadata.lastAnalyzed,
			sizeInBytes: this.metadata.sizeInBytes,
		}
	}

	/**
	 * 获取表统计
	 */
	getTableStats(): Record<string, any> {
		const stats: Record<string, any> = {}

		this.getAllTables().forEach((table) => {
			stats[table.tableName] = {
				rowCount: table.estimatedRowCount,
				columnCount: table.columns.length,
				indexCount: this.getTableIndexes(table.tableName).length,
				constraintCount: this.getTableConstraints(table.tableName).length,
				relationshipCount: this.getTableRelationships(table.tableName).length,
			}
		})

		return stats
	}

	/**
	 * 获取依赖关系
	 */
	getDependencies(): Record<string, string[]> {
		const dependencies: Record<string, string[]> = {}

		this.getAllTables().forEach((table) => {
			const tableDependencies: string[] = []

			this.getTableRelationships(table.tableName).forEach((relationship) => {
				if (
					relationship.tableName === table.tableName &&
					relationship.referencedTableName !== table.tableName
				) {
					tableDependencies.push(relationship.referencedTableName)
				}
			})

			dependencies[table.tableName] = tableDependencies
		})

		return dependencies
	}

	/**
	 * 查找孤立表
	 */
	findOrphanTables(): string[] {
		const allTables = new Set(this.tables.keys())
		const connectedTables = new Set<string>()

		this.getAllRelationships().forEach((relationship) => {
			connectedTables.add(relationship.tableName)
			connectedTables.add(relationship.referencedTableName)
		})

		return Array.from(allTables).filter((table) => !connectedTables.has(table))
	}

	/**
	 * 查找循环依赖
	 */
	findCircularDependencies(): string[][] {
		const dependencies = this.getDependencies()
		const visited = new Set<string>()
		const recursionStack = new Set<string>()
		const cycles: string[][] = []

		const dfs = (table: string, path: string[]): void => {
			if (recursionStack.has(table)) {
				// 找到循环
				const cycleStart = path.indexOf(table)
				cycles.push(path.slice(cycleStart))
				return
			}

			if (visited.has(table)) {
				return
			}

			visited.add(table)
			recursionStack.add(table)
			path.push(table)

			const deps = dependencies[table] || []
			deps.forEach((dep) => {
				dfs(dep, [...path])
			})

			recursionStack.delete(table)
		}

		Object.keys(dependencies).forEach((table) => {
			if (!visited.has(table)) {
				dfs(table, [])
			}
		})

		return cycles
	}

	/**
	 * 生成模式文档
	 */
	generateDocumentation(): string {
		const lines: string[] = []

		lines.push(`# 数据库模式: ${this.schemaName}`)
		lines.push(`数据库类型: ${this.databaseType}`)
		lines.push(`分析时间: ${this.metadata.lastAnalyzed?.toISOString()}`)
		lines.push("")

		lines.push("## 表结构")
		this.getAllTables().forEach((table) => {
			lines.push(`### ${table.tableName}`)
			lines.push(`- 行数: ${table.estimatedRowCount}`)
			lines.push(`- 列数: ${table.columns.length}`)
			lines.push("")
			lines.push("#### 列定义")
			table.columns.forEach((column) => {
				lines.push(`- ${column.columnName}: ${column.dataType} ${column.isNullable ? "NULL" : "NOT NULL"}`)
			})
			lines.push("")
		})

		if (this.getAllRelationships().length > 0) {
			lines.push("## 关系")
			this.getAllRelationships().forEach((relationship) => {
				lines.push(
					`- ${relationship.tableName}.${relationship.columnName} -> ${relationship.referencedTableName}.${relationship.referencedColumnName}`,
				)
			})
			lines.push("")
		}

		return lines.join("\n")
	}
}
