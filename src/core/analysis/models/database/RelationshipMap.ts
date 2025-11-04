/**
 * 关系映射类
 *
 * 提供数据库表间关系的映射和分析功能。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent, ModelEventType } from "../../types"
import {
	RelationshipMap as IRelationshipMap,
	Relationship,
	RelationshipType,
	Cardinality,
	RelationshipStrength,
	ReferentialAction,
} from "../../types/database"
import { ValidationResult } from "../validation/ValidationResult"
import { EventEmitter } from "events"

export class RelationshipMap implements IRelationshipMap, Serializable, Validatable, Cloneable, Observable {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]

	// 关系映射特定属性
	relationships: Relationship[]
	tableNames: Set<string>
	relationshipMatrix: Map<string, Map<string, Relationship[]>>
	cyclicDependencies: Relationship[]
	orphanTables: string[]
	relationshipStrengths: Map<string, RelationshipStrength>

	private observers: Observer[] = []
	private eventEmitter: EventEmitter

	constructor(relationshipMap?: Partial<IRelationshipMap>) {
		const now = new Date()

		// 基础属性
		this.id = relationshipMap?.id || this.generateId()
		this.name = relationshipMap?.name || "relationship-map"
		this.description = relationshipMap?.description
		this.version = relationshipMap?.version || "1.0.0"
		this.createdAt = relationshipMap?.createdAt || now
		this.updatedAt = relationshipMap?.updatedAt || now
		this.metadata = relationshipMap?.metadata || {}
		this.enabled = relationshipMap?.enabled ?? true
		this.tags = relationshipMap?.tags || []

		// 关系映射特定属性
		this.relationships = relationshipMap?.relationships || []
		this.tableNames = new Set(relationshipMap?.tableNames || [])
		this.relationshipMatrix = new Map()
		this.cyclicDependencies = relationshipMap?.cyclicDependencies || []
		this.orphanTables = relationshipMap?.orphanTables || []
		this.relationshipStrengths = new Map()

		this.eventEmitter = new EventEmitter()
		this.setupEventListeners()
		this.buildRelationshipMatrix()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `relationship-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("relationship:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	/**
	 * 验证关系映射（自验证）
	 */
	async validate(): Promise<boolean> {
		try {
			// 基本的自验证逻辑
			const isValid = this.relationships.length >= 0

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
				field: "relationships",
				rules: ["array"],
			},
		]
	}

	/**
	 * 获取验证结果（自验证）
	 */
	getValidationResult(): any {
		return new ValidationResult({
			name: "RelationshipMap Self Validation",
			description: "关系映射的自验证结果",
		})
	}

	/**
	 * 序列化关系映射
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
				relationships: this.relationships,
				tableNames: Array.from(this.tableNames),
				cyclicDependencies: this.cyclicDependencies,
				orphanTables: this.orphanTables,
				relationshipStrengths: Array.from(this.relationshipStrengths.entries()),
			}

			this.notifyObservers({
				type: ModelEventType.SERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["serialization", "relationship"],
			})

			return JSON.stringify(data, null, 2)
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["serialization", "error", "relationship"],
			})
			throw error
		}
	}

	/**
	 * 反序列化关系映射
	 */
	deserialize(data: string): void {
		try {
			const parsed = JSON.parse(data)

			// 基础属性
			this.id = parsed.id || this.generateId()
			this.name = parsed.name || "relationship-map"
			this.description = parsed.description
			this.version = parsed.version || "1.0.0"
			this.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date()
			this.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
			this.metadata = parsed.metadata || {}
			this.enabled = parsed.enabled ?? true
			this.tags = parsed.tags || []

			// 关系映射特定属性
			this.relationships = parsed.relationships || []
			this.tableNames = new Set(parsed.tableNames || [])
			this.cyclicDependencies = parsed.cyclicDependencies || []
			this.orphanTables = parsed.orphanTables || []
			this.relationshipStrengths = new Map(parsed.relationshipStrengths || [])

			this.buildRelationshipMatrix()

			this.notifyObservers({
				type: ModelEventType.DESERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["deserialization", "relationship"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["deserialization", "error", "relationship"],
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
	 * 克隆关系映射
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
			tags: ["clone", "relationship"],
		})

		return cloned
	}

	/**
	 * 深度克隆关系映射
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
	 * 构建关系矩阵
	 */
	private buildRelationshipMatrix(): void {
		this.relationshipMatrix.clear()

		this.relationships.forEach((relationship) => {
			const sourceTable = relationship.sourceTable
			const targetTable = relationship.targetTable

			if (!this.relationshipMatrix.has(sourceTable)) {
				this.relationshipMatrix.set(sourceTable, new Map())
			}

			const targetMap = this.relationshipMatrix.get(sourceTable)!
			if (!targetMap.has(targetTable)) {
				targetMap.set(targetTable, [])
			}

			targetMap.get(targetTable)!.push(relationship)

			// 添加到表名集合
			this.tableNames.add(sourceTable)
			this.tableNames.add(targetTable)
		})
	}

	/**
	 * 添加关系
	 */
	addRelationship(relationship: Relationship): void {
		this.relationships.push(relationship)
		this.updatedAt = new Date()

		// 更新关系矩阵
		this.buildRelationshipMatrix()

		// 计算关系强度
		this.calculateRelationshipStrength(relationship)

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { relationshipAdded: relationship.relationshipName },
			timestamp: new Date(),
			tags: ["relationship", "add"],
		})
	}

	/**
	 * 移除关系
	 */
	removeRelationship(relationshipName: string): boolean {
		const index = this.relationships.findIndex((rel) => rel.relationshipName === relationshipName)
		if (index > -1) {
			this.relationships.splice(index, 1)
			this.updatedAt = new Date()

			// 更新关系矩阵
			this.buildRelationshipMatrix()

			// 移除关系强度
			this.relationshipStrengths.delete(relationshipName)

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { relationshipRemoved: relationshipName },
				timestamp: new Date(),
				tags: ["relationship", "remove"],
			})

			return true
		}
		return false
	}

	/**
	 * 获取关系
	 */
	getRelationship(relationshipName: string): Relationship | undefined {
		return this.relationships.find((rel) => rel.relationshipName === relationshipName)
	}

	/**
	 * 获取所有关系
	 */
	getAllRelationships(): Relationship[] {
		return [...this.relationships]
	}

	/**
	 * 获取表之间的关系
	 */
	getRelationshipsBetween(sourceTable: string, targetTable: string): Relationship[] {
		const targetMap = this.relationshipMatrix.get(sourceTable)
		if (!targetMap) {
			return []
		}

		return targetMap.get(targetTable) || []
	}

	/**
	 * 获取表的所有关系
	 */
	getTableRelationships(tableName: string): Relationship[] {
		const relationships: Relationship[] = []

		// 查找作为源表的关系
		const sourceRelationships = this.relationships.filter((rel) => rel.sourceTable === tableName)
		relationships.push(...sourceRelationships)

		// 查找作为目标表的关系
		const targetRelationships = this.relationships.filter((rel) => rel.targetTable === tableName)
		relationships.push(...targetRelationships)

		return relationships
	}

	/**
	 * 计算关系强度
	 */
	private calculateRelationshipStrength(relationship: Relationship): void {
		let strength: RelationshipStrength = "weak"

		// 基于基数计算强度
		if (relationship.sourceCardinality === "one" && relationship.targetCardinality === "one") {
			strength = "strong"
		} else if (relationship.sourceCardinality === "many" && relationship.targetCardinality === "many") {
			strength = "medium"
		} else {
			strength = "weak"
		}

		// 基于外键约束计算强度
		if (relationship.onDelete === "CASCADE" || relationship.onUpdate === "CASCADE") {
			strength = "strong"
		}

		this.relationshipStrengths.set(relationship.relationshipName, strength)
	}

	/**
	 * 获取关系强度
	 */
	getRelationshipStrength(relationshipName: string): RelationshipStrength | undefined {
		return this.relationshipStrengths.get(relationshipName)
	}

	/**
	 * 检测循环依赖
	 */
	detectCyclicDependencies(): Relationship[] {
		const cycles: Relationship[] = []
		const visited = new Set<string>()
		const recursionStack = new Set<string>()

		const dfs = (tableName: string, path: string[]): void => {
			visited.add(tableName)
			recursionStack.add(tableName)

			const outgoingRelationships = this.relationships.filter((rel) => rel.sourceTable === tableName)

			for (const relationship of outgoingRelationships) {
				const targetTable = relationship.targetTable

				if (recursionStack.has(targetTable)) {
					// 发现循环
					cycles.push(relationship)
				} else if (!visited.has(targetTable)) {
					dfs(targetTable, [...path, tableName])
				}
			}

			recursionStack.delete(tableName)
		}

		// 对每个表进行DFS
		this.tableNames.forEach((tableName) => {
			if (!visited.has(tableName)) {
				dfs(tableName, [])
			}
		})

		this.cyclicDependencies = cycles

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { cyclicDependenciesDetected: cycles.length },
			timestamp: new Date(),
			tags: ["cyclic", "dependencies", "detected"],
		})

		return cycles
	}

	/**
	 * 查找孤立表
	 */
	findOrphanTables(): string[] {
		const connectedTables = new Set<string>()

		// 收集所有有关系的表
		this.relationships.forEach((relationship) => {
			connectedTables.add(relationship.sourceTable)
			connectedTables.add(relationship.targetTable)
		})

		// 查找孤立表
		const orphans = Array.from(this.tableNames).filter((tableName) => !connectedTables.has(tableName))
		this.orphanTables = orphans

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { orphanTablesFound: orphans.length },
			timestamp: new Date(),
			tags: ["orphan", "tables", "found"],
		})

		return orphans
	}

	/**
	 * 获取关系图
	 */
	getRelationshipGraph(): Record<string, any> {
		const nodes: Record<string, any>[] = []
		const edges: Record<string, any>[] = []

		// 创建节点
		this.tableNames.forEach((tableName) => {
			nodes.push({
				id: tableName,
				label: tableName,
				type: "table",
				relationships: this.getTableRelationships(tableName).length,
			})
		})

		// 创建边
		this.relationships.forEach((relationship) => {
			edges.push({
				id: relationship.relationshipName,
				source: relationship.sourceTable,
				target: relationship.targetTable,
				label: relationship.relationshipType,
				type: relationship.relationshipType,
				cardinality: `${relationship.sourceCardinality}-${relationship.targetCardinality}`,
				strength: this.getRelationshipStrength(relationship.relationshipName),
			})
		})

		return { nodes, edges }
	}

	/**
	 * 获取关系统计
	 */
	getRelationshipStats(): Record<string, any> {
		const stats = {
			totalRelationships: this.relationships.length,
			oneToOne: this.relationships.filter(
				(rel) => rel.sourceCardinality === "one" && rel.targetCardinality === "one",
			).length,
			oneToMany: this.relationships.filter(
				(rel) =>
					(rel.sourceCardinality === "one" && rel.targetCardinality === "many") ||
					(rel.sourceCardinality === "many" && rel.targetCardinality === "one"),
			).length,
			manyToMany: this.relationships.filter(
				(rel) => rel.sourceCardinality === "many" && rel.targetCardinality === "many",
			).length,
			strongRelationships: Array.from(this.relationshipStrengths.values()).filter(
				(strength) => strength === "strong",
			).length,
			mediumRelationships: Array.from(this.relationshipStrengths.values()).filter(
				(strength) => strength === "medium",
			).length,
			weakRelationships: Array.from(this.relationshipStrengths.values()).filter((strength) => strength === "weak")
				.length,
			cyclicDependencies: this.cyclicDependencies.length,
			orphanTables: this.orphanTables.length,
			tableCount: this.tableNames.size,
		}

		return stats
	}

	/**
	 * 获取关系路径
	 */
	findRelationshipPath(sourceTable: string, targetTable: string): Relationship[] | null {
		if (sourceTable === targetTable) {
			return []
		}

		const queue: { table: string; path: Relationship[] }[] = [{ table: sourceTable, path: [] }]
		const visited = new Set<string>()

		while (queue.length > 0) {
			const { table, path } = queue.shift()!

			if (table === targetTable) {
				return path
			}

			if (visited.has(table)) {
				continue
			}

			visited.add(table)

			// 查找从当前表出发的关系
			const outgoingRelationships = this.relationships.filter((rel) => rel.sourceTable === table)

			for (const relationship of outgoingRelationships) {
				if (!visited.has(relationship.targetTable)) {
					queue.push({
						table: relationship.targetTable,
						path: [...path, relationship],
					})
				}
			}
		}

		return null
	}

	/**
	 * 分析关系影响
	 */
	analyzeRelationshipImpact(tableName: string): Record<string, any> {
		const directRelationships = this.getTableRelationships(tableName)
		const relatedTables = new Set<string>()

		// 收集直接相关的表
		directRelationships.forEach((rel) => {
			relatedTables.add(rel.sourceTable)
			relatedTables.add(rel.targetTable)
		})

		// 查找间接相关的表（通过路径）
		const allTables = Array.from(this.tableNames)
		const indirectRelationships: Record<string, Relationship[]> = {}

		allTables.forEach((otherTable) => {
			if (otherTable !== tableName && !relatedTables.has(otherTable)) {
				const path = this.findRelationshipPath(tableName, otherTable)
				if (path) {
					indirectRelationships[otherTable] = path
				}
			}
		})

		return {
			tableName,
			directRelationships: directRelationships.length,
			relatedTables: relatedTables.size,
			indirectRelationships: Object.keys(indirectRelationships).length,
			relationshipPaths: indirectRelationships,
			impactScore: this.calculateImpactScore(tableName, directRelationships, indirectRelationships),
		}
	}

	/**
	 * 计算影响分数
	 */
	private calculateImpactScore(
		tableName: string,
		directRelationships: Relationship[],
		indirectRelationships: Record<string, Relationship[]>,
	): number {
		let score = 0

		// 直接关系权重
		score += directRelationships.length * 10

		// 间接关系权重
		score += Object.keys(indirectRelationships).length * 5

		// 循环依赖权重
		const hasCyclicDependency = this.cyclicDependencies.some(
			(rel) => rel.sourceTable === tableName || rel.targetTable === tableName,
		)
		if (hasCyclicDependency) {
			score += 20
		}

		// 孤立表权重
		const isOrphan = this.orphanTables.includes(tableName)
		if (isOrphan) {
			score -= 10
		}

		return Math.max(0, Math.min(100, score))
	}

	/**
	 * 生成关系文档
	 */
	generateDocumentation(): string {
		const lines: string[] = []

		lines.push(`# 关系映射: ${this.name}`)
		lines.push(`表数量: ${this.tableNames.size}`)
		lines.push(`关系数量: ${this.relationships.length}`)
		lines.push(`循环依赖数量: ${this.cyclicDependencies.length}`)
		lines.push(`孤立表数量: ${this.orphanTables.length}`)
		lines.push("")

		lines.push("## 表列表")
		Array.from(this.tableNames).forEach((tableName) => {
			const relationships = this.getTableRelationships(tableName)
			lines.push(`### ${tableName}`)
			lines.push(`关系数量: ${relationships.length}`)
			lines.push(`影响分数: ${this.analyzeRelationshipImpact(tableName).impactScore}`)
			lines.push("")
		})

		lines.push("## 关系列表")
		this.relationships.forEach((relationship) => {
			lines.push(`### ${relationship.relationshipName}`)
			lines.push(`类型: ${relationship.relationshipType}`)
			lines.push(`源表: ${relationship.sourceTable}`)
			lines.push(`目标表: ${relationship.targetTable}`)
			lines.push(`基数: ${relationship.sourceCardinality} -> ${relationship.targetCardinality}`)
			lines.push(`强度: ${this.getRelationshipStrength(relationship.relationshipName)}`)
			lines.push("")
		})

		if (this.cyclicDependencies.length > 0) {
			lines.push("## 循环依赖")
			this.cyclicDependencies.forEach((relationship) => {
				lines.push(
					`- ${relationship.relationshipName}: ${relationship.sourceTable} -> ${relationship.targetTable}`,
				)
			})
			lines.push("")
		}

		if (this.orphanTables.length > 0) {
			lines.push("## 孤立表")
			this.orphanTables.forEach((tableName) => {
				lines.push(`- ${tableName}`)
			})
			lines.push("")
		}

		return lines.join("\n")
	}

	/**
	 * 获取关系映射摘要
	 */
	getSummary(): Record<string, any> {
		return {
			id: this.id,
			name: this.name,
			tableCount: this.tableNames.size,
			relationshipCount: this.relationships.length,
			cyclicDependencyCount: this.cyclicDependencies.length,
			orphanTableCount: this.orphanTables.length,
			relationshipTypes: this.getRelationshipTypeDistribution(),
			relationshipStrengths: this.getRelationshipStrengthDistribution(),
		}
	}

	/**
	 * 获取关系类型分布
	 */
	private getRelationshipTypeDistribution(): Record<RelationshipType, number> {
		const distribution: Record<RelationshipType, number> = {} as any

		this.relationships.forEach((relationship) => {
			distribution[relationship.relationshipType] = (distribution[relationship.relationshipType] || 0) + 1
		})

		return distribution
	}

	/**
	 * 获取关系强度分布
	 */
	private getRelationshipStrengthDistribution(): Record<RelationshipStrength, number> {
		const distribution: Record<RelationshipStrength, number> = {
			strong: 0,
			medium: 0,
			weak: 0,
		}

		this.relationshipStrengths.forEach((strength) => {
			distribution[strength] = (distribution[strength] || 0) + 1
		})

		return distribution
	}
}
