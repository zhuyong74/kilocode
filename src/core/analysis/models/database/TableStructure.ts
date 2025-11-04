/**
 * 表结构类
 *
 * 提供数据库表结构的详细信息和分析功能。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent, ModelEventType } from "../../types"
import {
	TableStructure as ITableStructure,
	ColumnDefinition,
	PrimaryKey,
	ForeignKey,
	TableIndex,
	TableConstraint,
	DataType,
	TableType,
} from "../../types/database"
import { ValidationResult } from "../validation/ValidationResult"
import { EventEmitter } from "events"

export class TableStructure implements ITableStructure, Serializable, Validatable, Cloneable, Observable {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]

	// 表结构特定属性
	tableName: string
	schemaName: string
	tableType: TableType
	columns: ColumnDefinition[]
	primaryKey?: PrimaryKey
	foreignKeys: ForeignKey[]
	indexes: TableIndex[]
	constraints: TableConstraint[]
	estimatedRowCount: number
	tableSizeInBytes: number
	lastAnalyzed: Date

	private observers: Observer[] = []
	private eventEmitter: EventEmitter

	constructor(table?: Partial<ITableStructure>) {
		const now = new Date()

		// 基础属性
		this.id = table?.id || this.generateId()
		this.name = table?.name || "table-structure"
		this.description = table?.description
		this.version = table?.version || "1.0.0"
		this.createdAt = table?.createdAt || now
		this.updatedAt = table?.updatedAt || now
		this.metadata = table?.metadata || {}
		this.enabled = table?.enabled ?? true
		this.tags = table?.tags || []

		// 表结构特定属性
		this.tableName = table?.tableName || "unknown_table"
		this.schemaName = table?.schemaName || "public"
		this.tableType = table?.tableType || "table"
		this.columns = table?.columns || []
		this.primaryKey = table?.primaryKey
		this.foreignKeys = table?.foreignKeys || []
		this.indexes = table?.indexes || []
		this.constraints = table?.constraints || []
		this.estimatedRowCount = table?.estimatedRowCount || 0
		this.tableSizeInBytes = table?.tableSizeInBytes || 0
		this.lastAnalyzed = table?.lastAnalyzed || now

		this.eventEmitter = new EventEmitter()
		this.setupEventListeners()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("table:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	/**
	 * 验证表结构（自验证）
	 */
	async validate(): Promise<boolean> {
		try {
			// 基本的自验证逻辑
			const isValid = this.tableName && this.columns.length > 0

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
				field: "tableName",
				rules: ["required", "string", "minLength:1", "maxLength:100"],
			},
			{
				field: "columns",
				rules: ["required", "array", "minItems:1"],
			},
			{
				field: "tableType",
				rules: ["required", "string"],
			},
		]
	}

	/**
	 * 获取验证结果（自验证）
	 */
	getValidationResult(): any {
		return new ValidationResult({
			name: "TableStructure Self Validation",
			description: "表结构的自验证结果",
		})
	}

	/**
	 * 序列化表结构
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
				tableName: this.tableName,
				schemaName: this.schemaName,
				tableType: this.tableType,
				columns: this.columns,
				primaryKey: this.primaryKey,
				foreignKeys: this.foreignKeys,
				indexes: this.indexes,
				constraints: this.constraints,
				estimatedRowCount: this.estimatedRowCount,
				tableSizeInBytes: this.tableSizeInBytes,
				lastAnalyzed: this.lastAnalyzed.toISOString(),
			}

			this.notifyObservers({
				type: ModelEventType.SERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["serialization", "table"],
			})

			return JSON.stringify(data, null, 2)
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["serialization", "error", "table"],
			})
			throw error
		}
	}

	/**
	 * 反序列化表结构
	 */
	deserialize(data: string): void {
		try {
			const parsed = JSON.parse(data)

			// 基础属性
			this.id = parsed.id || this.generateId()
			this.name = parsed.name || "table-structure"
			this.description = parsed.description
			this.version = parsed.version || "1.0.0"
			this.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date()
			this.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
			this.metadata = parsed.metadata || {}
			this.enabled = parsed.enabled ?? true
			this.tags = parsed.tags || []

			// 表结构特定属性
			this.tableName = parsed.tableName || "unknown_table"
			this.schemaName = parsed.schemaName || "public"
			this.tableType = parsed.tableType || "table"
			this.columns = parsed.columns || []
			this.primaryKey = parsed.primaryKey
			this.foreignKeys = parsed.foreignKeys || []
			this.indexes = parsed.indexes || []
			this.constraints = parsed.constraints || []
			this.estimatedRowCount = parsed.estimatedRowCount || 0
			this.tableSizeInBytes = parsed.tableSizeInBytes || 0
			this.lastAnalyzed = parsed.lastAnalyzed ? new Date(parsed.lastAnalyzed) : new Date()

			this.notifyObservers({
				type: ModelEventType.DESERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["deserialization", "table"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["deserialization", "error", "table"],
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
	 * 克隆表结构
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
			tags: ["clone", "table"],
		})

		return cloned
	}

	/**
	 * 深度克隆表结构
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
	 * 添加列
	 */
	addColumn(column: ColumnDefinition): void {
		this.columns.push(column)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { columnAdded: column.columnName },
			timestamp: new Date(),
			tags: ["column", "add", "table"],
		})
	}

	/**
	 * 移除列
	 */
	removeColumn(columnName: string): boolean {
		const index = this.columns.findIndex((col) => col.columnName === columnName)
		if (index > -1) {
			this.columns.splice(index, 1)
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { columnRemoved: columnName },
				timestamp: new Date(),
				tags: ["column", "remove", "table"],
			})

			return true
		}
		return false
	}

	/**
	 * 获取列
	 */
	getColumn(columnName: string): ColumnDefinition | undefined {
		return this.columns.find((col) => col.columnName === columnName)
	}

	/**
	 * 获取所有列
	 */
	getAllColumns(): ColumnDefinition[] {
		return [...this.columns]
	}

	/**
	 * 获取主键列
	 */
	getPrimaryKeyColumns(): ColumnDefinition[] {
		if (!this.primaryKey) {
			return []
		}

		return this.columns.filter((col) => this.primaryKey!.columnNames.includes(col.columnName))
	}

	/**
	 * 获取外键列
	 */
	getForeignKeyColumns(): ColumnDefinition[] {
		const fkColumnNames = this.foreignKeys.flatMap((fk) => fk.columnNames)
		return this.columns.filter((col) => fkColumnNames.includes(col.columnName))
	}

	/**
	 * 获取索引列
	 */
	getIndexedColumns(): ColumnDefinition[] {
		const indexedColumnNames = this.indexes.flatMap((idx) => idx.columnNames)
		return this.columns.filter((col) => indexedColumnNames.includes(col.columnName))
	}

	/**
	 * 设置主键
	 */
	setPrimaryKey(primaryKey: PrimaryKey): void {
		this.primaryKey = primaryKey
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { primaryKeySet: primaryKey.constraintName },
			timestamp: new Date(),
			tags: ["primaryKey", "set", "table"],
		})
	}

	/**
	 * 移除主键
	 */
	removePrimaryKey(): void {
		const oldPk = this.primaryKey
		this.primaryKey = undefined
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { primaryKeyRemoved: oldPk?.constraintName },
			timestamp: new Date(),
			tags: ["primaryKey", "remove", "table"],
		})
	}

	/**
	 * 添加外键
	 */
	addForeignKey(foreignKey: ForeignKey): void {
		this.foreignKeys.push(foreignKey)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { foreignKeyAdded: foreignKey.constraintName },
			timestamp: new Date(),
			tags: ["foreignKey", "add", "table"],
		})
	}

	/**
	 * 移除外键
	 */
	removeForeignKey(constraintName: string): boolean {
		const index = this.foreignKeys.findIndex((fk) => fk.constraintName === constraintName)
		if (index > -1) {
			this.foreignKeys.splice(index, 1)
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { foreignKeyRemoved: constraintName },
				timestamp: new Date(),
				tags: ["foreignKey", "remove", "table"],
			})

			return true
		}
		return false
	}

	/**
	 * 获取外键
	 */
	getForeignKey(constraintName: string): ForeignKey | undefined {
		return this.foreignKeys.find((fk) => fk.constraintName === constraintName)
	}

	/**
	 * 获取所有外键
	 */
	getAllForeignKeys(): ForeignKey[] {
		return [...this.foreignKeys]
	}

	/**
	 * 添加索引
	 */
	addIndex(index: TableIndex): void {
		this.indexes.push(index)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { indexAdded: index.indexName },
			timestamp: new Date(),
			tags: ["index", "add", "table"],
		})
	}

	/**
	 * 移除索引
	 */
	removeIndex(indexName: string): boolean {
		const index = this.indexes.findIndex((idx) => idx.indexName === indexName)
		if (index > -1) {
			this.indexes.splice(index, 1)
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { indexRemoved: indexName },
				timestamp: new Date(),
				tags: ["index", "remove", "table"],
			})

			return true
		}
		return false
	}

	/**
	 * 获取索引
	 */
	getIndex(indexName: string): TableIndex | undefined {
		return this.indexes.find((idx) => idx.indexName === indexName)
	}

	/**
	 * 获取所有索引
	 */
	getAllIndexes(): TableIndex[] {
		return [...this.indexes]
	}

	/**
	 * 添加约束
	 */
	addConstraint(constraint: TableConstraint): void {
		this.constraints.push(constraint)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { constraintAdded: constraint.constraintName },
			timestamp: new Date(),
			tags: ["constraint", "add", "table"],
		})
	}

	/**
	 * 移除约束
	 */
	removeConstraint(constraintName: string): boolean {
		const index = this.constraints.findIndex((constraint) => constraint.constraintName === constraintName)
		if (index > -1) {
			this.constraints.splice(index, 1)
			this.updatedAt = new Date()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { constraintRemoved: constraintName },
				timestamp: new Date(),
				tags: ["constraint", "remove", "table"],
			})

			return true
		}
		return false
	}

	/**
	 * 获取约束
	 */
	getConstraint(constraintName: string): TableConstraint | undefined {
		return this.constraints.find((constraint) => constraint.constraintName === constraintName)
	}

	/**
	 * 获取所有约束
	 */
	getAllConstraints(): TableConstraint[] {
		return [...this.constraints]
	}

	/**
	 * 更新行数估计
	 */
	updateRowCount(count: number): void {
		this.estimatedRowCount = count
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { rowCountUpdated: count },
			timestamp: new Date(),
			tags: ["rowCount", "update", "table"],
		})
	}

	/**
	 * 更新表大小
	 */
	updateTableSize(sizeInBytes: number): void {
		this.tableSizeInBytes = sizeInBytes
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { tableSizeUpdated: sizeInBytes },
			timestamp: new Date(),
			tags: ["tableSize", "update", "table"],
		})
	}

	/**
	 * 更新分析时间
	 */
	updateLastAnalyzed(): void {
		this.lastAnalyzed = new Date()
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { lastAnalyzedUpdated: this.lastAnalyzed },
			timestamp: new Date(),
			tags: ["lastAnalyzed", "update", "table"],
		})
	}

	/**
	 * 分析表结构
	 */
	analyzeStructure(): Record<string, any> {
		const analysis = {
			columnCount: this.columns.length,
			nullableColumns: this.columns.filter((col) => col.isNullable).length,
			primaryKeyColumns: this.getPrimaryKeyColumns().length,
			foreignKeyColumns: this.getForeignKeyColumns().length,
			indexedColumns: this.getIndexedColumns().length,
			uniqueConstraints: this.constraints.filter((c) => c.constraintType === "UNIQUE").length,
			checkConstraints: this.constraints.filter((c) => c.constraintType === "CHECK").length,
			estimatedRowCount: this.estimatedRowCount,
			tableSizeInBytes: this.tableSizeInBytes,
			lastAnalyzed: this.lastAnalyzed,
		}

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { structureAnalyzed: analysis },
			timestamp: new Date(),
			tags: ["structure", "analysis", "table"],
		})

		return analysis
	}

	/**
	 * 获取列统计
	 */
	getColumnStats(): Record<string, any> {
		const stats: Record<string, any> = {}

		this.columns.forEach((column) => {
			stats[column.columnName] = {
				dataType: column.dataType,
				isNullable: column.isNullable,
				isPrimaryKey: this.primaryKey?.columnNames.includes(column.columnName) || false,
				isForeignKey: this.foreignKeys.some((fk) => fk.columnNames.includes(column.columnName)),
				isIndexed: this.indexes.some((idx) => idx.columnNames.includes(column.columnName)),
				defaultValue: column.defaultValue,
				maxLength: column.maxLength,
				precision: column.precision,
				scale: column.scale,
			}
		})

		return stats
	}

	/**
	 * 获取数据类型分布
	 */
	getDataTypeDistribution(): Record<DataType, number> {
		const distribution: Record<DataType, number> = {} as any

		this.columns.forEach((column) => {
			distribution[column.dataType] = (distribution[column.dataType] || 0) + 1
		})

		return distribution
	}

	/**
	 * 查找未使用的列
	 */
	findUnusedColumns(): string[] {
		// 简化的实现：假设没有被任何索引、外键或约束引用的列可能是未使用的
		const usedColumns = new Set<string>()

		// 主键列
		if (this.primaryKey) {
			this.primaryKey.columnNames.forEach((col) => usedColumns.add(col))
		}

		// 外键列
		this.foreignKeys.forEach((fk) => {
			fk.columnNames.forEach((col) => usedColumns.add(col))
		})

		// 索引列
		this.indexes.forEach((idx) => {
			idx.columnNames.forEach((col) => usedColumns.add(col))
		})

		// 约束列
		this.constraints.forEach((constraint) => {
			if (constraint.columnNames) {
				constraint.columnNames.forEach((col) => usedColumns.add(col))
			}
		})

		return this.columns.map((col) => col.columnName).filter((colName) => !usedColumns.has(colName))
	}

	/**
	 * 检查规范化
	 */
	checkNormalization(): Record<string, any> {
		const issues: string[] = []

		// 检查是否有重复列
		const columnNames = this.columns.map((col) => col.columnName)
		const duplicates = columnNames.filter((name, index) => columnNames.indexOf(name) !== index)
		if (duplicates.length > 0) {
			issues.push(`发现重复列名: ${duplicates.join(", ")}`)
		}

		// 检查是否有主键
		if (!this.primaryKey && this.columns.length > 0) {
			issues.push("表没有主键")
		}

		// 检查外键约束
		this.foreignKeys.forEach((fk) => {
			const referencedColumns = fk.columnNames
			const localColumns = this.columns.map((col) => col.columnName)

			referencedColumns.forEach((col) => {
				if (!localColumns.includes(col)) {
					issues.push(`外键 ${fk.constraintName} 引用了不存在的列: ${col}`)
				}
			})
		})

		return {
			isNormalized: issues.length === 0,
			issues,
			score: Math.max(0, 100 - issues.length * 10),
		}
	}

	/**
	 * 生成表文档
	 */
	generateDocumentation(): string {
		const lines: string[] = []

		lines.push(`# 表: ${this.tableName}`)
		lines.push(`模式: ${this.schemaName}`)
		lines.push(`类型: ${this.tableType}`)
		lines.push(`行数估计: ${this.estimatedRowCount.toLocaleString()}`)
		lines.push(`表大小: ${this.formatBytes(this.tableSizeInBytes)}`)
		lines.push(`最后分析: ${this.lastAnalyzed.toISOString()}`)
		lines.push("")

		lines.push("## 列定义")
		this.columns.forEach((column) => {
			lines.push(`### ${column.columnName}`)
			lines.push(`- 数据类型: ${column.dataType}`)
			lines.push(`- 可空: ${column.isNullable ? "是" : "否"}`)
			if (column.defaultValue) {
				lines.push(`- 默认值: ${column.defaultValue}`)
			}
			if (column.maxLength) {
				lines.push(`- 最大长度: ${column.maxLength}`)
			}
			if (column.precision) {
				lines.push(`- 精度: ${column.precision}`)
				if (column.scale) {
					lines.push(`- 小数位: ${column.scale}`)
				}
			}
			if (column.description) {
				lines.push(`- 描述: ${column.description}`)
			}
			lines.push("")
		})

		if (this.primaryKey) {
			lines.push("## 主键")
			lines.push(`约束名: ${this.primaryKey.constraintName}`)
			lines.push(`列: ${this.primaryKey.columnNames.join(", ")}`)
			lines.push("")
		}

		if (this.foreignKeys.length > 0) {
			lines.push("## 外键")
			this.foreignKeys.forEach((fk) => {
				lines.push(`### ${fk.constraintName}`)
				lines.push(`列: ${fk.columnNames.join(", ")}`)
				lines.push(`引用表: ${fk.referencedTableName}`)
				lines.push(`引用列: ${fk.referencedColumnNames.join(", ")}`)
				lines.push("")
			})
		}

		if (this.indexes.length > 0) {
			lines.push("## 索引")
			this.indexes.forEach((index) => {
				lines.push(`### ${index.indexName}`)
				lines.push(`列: ${index.columnNames.join(", ")}`)
				lines.push(`唯一: ${index.isUnique ? "是" : "否"}`)
				lines.push(`类型: ${index.indexType}`)
				lines.push("")
			})
		}

		return lines.join("\n")
	}

	/**
	 * 格式化字节数
	 */
	private formatBytes(bytes: number): string {
		if (bytes === 0) return "0 Bytes"

		const k = 1024
		const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
		const i = Math.floor(Math.log(bytes) / Math.log(k))

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
	}

	/**
	 * 获取表摘要
	 */
	getSummary(): Record<string, any> {
		return {
			id: this.id,
			name: this.name,
			tableName: this.tableName,
			schemaName: this.schemaName,
			tableType: this.tableType,
			columnCount: this.columns.length,
			hasPrimaryKey: !!this.primaryKey,
			foreignKeyCount: this.foreignKeys.length,
			indexCount: this.indexes.length,
			constraintCount: this.constraints.length,
			estimatedRowCount: this.estimatedRowCount,
			tableSizeInBytes: this.tableSizeInBytes,
			lastAnalyzed: this.lastAnalyzed,
		}
	}
}
