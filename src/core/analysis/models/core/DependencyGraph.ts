/**
 * 依赖关系图类
 *
 * 提供项目依赖关系的管理，支持依赖分析和可视化。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent, ModelEventType } from "../../types"
import {
	DependencyGraph as IDependencyGraph,
	DependencyNode,
	DependencyEdge,
	GraphMetadata,
	CentralityMeasures,
	CommunityStructure,
} from "../../types/models"
import { DataValidator } from "../validation/DataValidator"
import { ValidationResult } from "../validation/ValidationResult"
import { EventEmitter } from "events"

export class DependencyGraph implements IDependencyGraph, Serializable, Validatable, Cloneable, Observable {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]

	// 依赖图特定属性
	nodes: DependencyNode[]
	edges: DependencyEdge[]
	directed: boolean
	weighted: boolean
	metadata: GraphMetadata
	centralityMeasures: CentralityMeasures
	communities: CommunityStructure[]
	density: number
	clusteringCoefficient: number
	averagePathLength: number

	private observers: Observer[] = []
	private eventEmitter: EventEmitter
	private validator: DataValidator
	private nodeMap: Map<string, DependencyNode>
	private edgeMap: Map<string, DependencyEdge>
	private adjacencyList: Map<string, Set<string>>
	private reverseAdjacencyList: Map<string, Set<string>>

	constructor(graph?: Partial<IDependencyGraph>) {
		const now = new Date()

		// 基础属性
		this.id = graph?.id || this.generateId()
		this.name = graph?.name || "dependency-graph"
		this.description = graph?.description
		this.version = graph?.version || "1.0.0"
		this.createdAt = graph?.createdAt || now
		this.updatedAt = graph?.updatedAt || now
		this.metadata = graph?.metadata || {}
		this.enabled = graph?.enabled ?? true
		this.tags = graph?.tags || []

		// 依赖图特定属性
		this.nodes = graph?.nodes || []
		this.edges = graph?.edges || []
		this.directed = graph?.directed ?? true
		this.weighted = graph?.weighted ?? false
		this.metadata = graph?.metadata || {
			nodeCount: 0,
			edgeCount: 0,
			componentCount: 0,
			isConnected: false,
			isAcyclic: true,
			diameter: 0,
		}
		this.centralityMeasures = graph?.centralityMeasures || {
			degree: {},
			betweenness: {},
			closeness: {},
			eigenvector: {},
			pagerank: {},
		}
		this.communities = graph?.communities || []
		this.density = graph?.density || 0
		this.clusteringCoefficient = graph?.clusteringCoefficient || 0
		this.averagePathLength = graph?.averagePathLength || 0

		this.eventEmitter = new EventEmitter()
		this.validator = new DataValidator()
		this.nodeMap = new Map()
		this.edgeMap = new Map()
		this.adjacencyList = new Map()
		this.reverseAdjacencyList = new Map()

		this.buildGraph()
		this.setupEventListeners()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `graph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 构建图结构
	 */
	private buildGraph(): void {
		this.nodeMap.clear()
		this.edgeMap.clear()
		this.adjacencyList.clear()
		this.reverseAdjacencyList.clear()

		// 构建节点映射
		this.nodes.forEach((node) => {
			this.nodeMap.set(node.id, node)
			this.adjacencyList.set(node.id, new Set())
			this.reverseAdjacencyList.set(node.id, new Set())
		})

		// 构建边映射和邻接表
		this.edges.forEach((edge) => {
			const edgeKey = `${edge.source}-${edge.target}`
			this.edgeMap.set(edgeKey, edge)

			this.adjacencyList.get(edge.source)?.add(edge.target)
			this.reverseAdjacencyList.get(edge.target)?.add(edge.source)

			if (!this.directed) {
				const reverseEdgeKey = `${edge.target}-${edge.source}`
				this.edgeMap.set(reverseEdgeKey, {
					...edge,
					source: edge.target,
					target: edge.source,
				})
				this.adjacencyList.get(edge.target)?.add(edge.source)
				this.reverseAdjacencyList.get(edge.source)?.add(edge.target)
			}
		})

		this.updateMetadata()
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("graph:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	/**
	 * 验证图
	 */
	async validate(): Promise<boolean> {
		try {
			const validationResult = await this.validator.validate(this)

			this.notifyObservers({
				type: ModelEventType.VALIDATED,
				source: this.id,
				data: { validationResult },
				timestamp: new Date(),
				tags: ["validation", "graph"],
			})

			return validationResult.isValid
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["validation", "error", "graph"],
			})
			return false
		}
	}

	/**
	 * 获取验证规则
	 */
	getValidationRules(): any[] {
		return [
			{
				field: "name",
				rules: ["required", "string", "minLength:3", "maxLength:100"],
			},
			{
				field: "nodes",
				rules: ["required", "array"],
			},
			{
				field: "edges",
				rules: ["required", "array"],
			},
			{
				field: "directed",
				rules: ["required", "boolean"],
			},
			{
				field: "weighted",
				rules: ["required", "boolean"],
			},
			{
				field: "density",
				rules: ["required", "number", "min:0", "max:1"],
			},
			{
				field: "clusteringCoefficient",
				rules: ["required", "number", "min:0", "max:1"],
			},
			{
				field: "averagePathLength",
				rules: ["required", "number", "min:0"],
			},
		]
	}

	/**
	 * 获取验证结果
	 */
	getValidationResult(): ValidationResult {
		return this.validator.getLastResult()
	}

	/**
	 * 序列化图
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
				nodes: this.nodes,
				edges: this.edges,
				directed: this.directed,
				weighted: this.weighted,
				metadata: this.metadata,
				centralityMeasures: this.centralityMeasures,
				communities: this.communities,
				density: this.density,
				clusteringCoefficient: this.clusteringCoefficient,
				averagePathLength: this.averagePathLength,
			}

			this.notifyObservers({
				type: ModelEventType.SERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["serialization", "graph"],
			})

			return JSON.stringify(data, null, 2)
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["serialization", "error", "graph"],
			})
			throw error
		}
	}

	/**
	 * 反序列化图
	 */
	deserialize(data: string): void {
		try {
			const parsed = JSON.parse(data)

			// 基础属性
			this.id = parsed.id || this.generateId()
			this.name = parsed.name || "dependency-graph"
			this.description = parsed.description
			this.version = parsed.version || "1.0.0"
			this.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date()
			this.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
			this.metadata = parsed.metadata || {}
			this.enabled = parsed.enabled ?? true
			this.tags = parsed.tags || []

			// 依赖图特定属性
			this.nodes = parsed.nodes || []
			this.edges = parsed.edges || []
			this.directed = parsed.directed ?? true
			this.weighted = parsed.weighted ?? false
			this.metadata = parsed.metadata || {
				nodeCount: 0,
				edgeCount: 0,
				componentCount: 0,
				isConnected: false,
				isAcyclic: true,
				diameter: 0,
			}
			this.centralityMeasures = parsed.centralityMeasures || {
				degree: {},
				betweenness: {},
				closeness: {},
				eigenvector: {},
				pagerank: {},
			}
			this.communities = parsed.communities || []
			this.density = parsed.density || 0
			this.clusteringCoefficient = parsed.clusteringCoefficient || 0
			this.averagePathLength = parsed.averagePathLength || 0

			this.buildGraph()

			this.notifyObservers({
				type: ModelEventType.DESERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["deserialization", "graph"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["deserialization", "error", "graph"],
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
	 * 克隆图
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
			tags: ["clone", "graph"],
		})

		return cloned
	}

	/**
	 * 深度克隆图
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
	 * 添加节点
	 */
	addNode(node: DependencyNode): void {
		this.nodes.push(node)
		this.nodeMap.set(node.id, node)
		this.adjacencyList.set(node.id, new Set())
		this.reverseAdjacencyList.set(node.id, new Set())
		this.updatedAt = new Date()

		this.updateMetadata()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { nodeAdded: node.id },
			timestamp: new Date(),
			tags: ["node", "add", "graph"],
		})
	}

	/**
	 * 移除节点
	 */
	removeNode(nodeId: string): boolean {
		const node = this.nodeMap.get(nodeId)
		if (node) {
			const index = this.nodes.indexOf(node)
			if (index > -1) {
				this.nodes.splice(index, 1)
				this.nodeMap.delete(nodeId)

				// 移除相关边
				this.edges = this.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)

				this.adjacencyList.delete(nodeId)
				this.reverseAdjacencyList.delete(nodeId)

				// 从其他节点的邻接表中移除
				this.adjacencyList.forEach((adjacent) => adjacent.delete(nodeId))
				this.reverseAdjacencyList.forEach((adjacent) => adjacent.delete(nodeId))

				this.updatedAt = new Date()
				this.updateMetadata()

				this.notifyObservers({
					type: ModelEventType.UPDATED,
					source: this.id,
					data: { nodeRemoved: nodeId },
					timestamp: new Date(),
					tags: ["node", "remove", "graph"],
				})

				return true
			}
		}
		return false
	}

	/**
	 * 获取节点
	 */
	getNode(nodeId: string): DependencyNode | undefined {
		return this.nodeMap.get(nodeId)
	}

	/**
	 * 添加边
	 */
	addEdge(edge: DependencyEdge): void {
		this.edges.push(edge)

		const edgeKey = `${edge.source}-${edge.target}`
		this.edgeMap.set(edgeKey, edge)

		this.adjacencyList.get(edge.source)?.add(edge.target)
		this.reverseAdjacencyList.get(edge.target)?.add(edge.source)

		if (!this.directed) {
			const reverseEdgeKey = `${edge.target}-${edge.source}`
			this.edgeMap.set(reverseEdgeKey, {
				...edge,
				source: edge.target,
				target: edge.source,
			})
			this.adjacencyList.get(edge.target)?.add(edge.source)
			this.reverseAdjacencyList.get(edge.source)?.add(edge.target)
		}

		this.updatedAt = new Date()
		this.updateMetadata()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { edgeAdded: edgeKey },
			timestamp: new Date(),
			tags: ["edge", "add", "graph"],
		})
	}

	/**
	 * 移除边
	 */
	removeEdge(sourceId: string, targetId: string): boolean {
		const edgeKey = `${sourceId}-${targetId}`
		const edge = this.edgeMap.get(edgeKey)

		if (edge) {
			const index = this.edges.indexOf(edge)
			if (index > -1) {
				this.edges.splice(index, 1)
				this.edgeMap.delete(edgeKey)

				this.adjacencyList.get(sourceId)?.delete(targetId)
				this.reverseAdjacencyList.get(targetId)?.delete(sourceId)

				if (!this.directed) {
					const reverseEdgeKey = `${targetId}-${sourceId}`
					this.edgeMap.delete(reverseEdgeKey)
					this.adjacencyList.get(targetId)?.delete(sourceId)
					this.reverseAdjacencyList.get(sourceId)?.delete(targetId)
				}

				this.updatedAt = new Date()
				this.updateMetadata()

				this.notifyObservers({
					type: ModelEventType.UPDATED,
					source: this.id,
					data: { edgeRemoved: edgeKey },
					timestamp: new Date(),
					tags: ["edge", "remove", "graph"],
				})

				return true
			}
		}
		return false
	}

	/**
	 * 获取边
	 */
	getEdge(sourceId: string, targetId: string): DependencyEdge | undefined {
		const edgeKey = `${sourceId}-${targetId}`
		return this.edgeMap.get(edgeKey)
	}

	/**
	 * 获取节点的邻居
	 */
	getNeighbors(nodeId: string): string[] {
		return Array.from(this.adjacencyList.get(nodeId) || [])
	}

	/**
	 * 获取节点的入邻居
	 */
	getInNeighbors(nodeId: string): string[] {
		return Array.from(this.reverseAdjacencyList.get(nodeId) || [])
	}

	/**
	 * 获取节点的出邻居
	 */
	getOutNeighbors(nodeId: string): string[] {
		return Array.from(this.adjacencyList.get(nodeId) || [])
	}

	/**
	 * 检查节点是否存在路径
	 */
	hasPath(sourceId: string, targetId: string): boolean {
		if (sourceId === targetId) return true

		const visited = new Set<string>()
		const queue: string[] = [sourceId]

		while (queue.length > 0) {
			const current = queue.shift()!

			if (current === targetId) return true

			if (!visited.has(current)) {
				visited.add(current)
				const neighbors = this.adjacencyList.get(current) || new Set()
				queue.push(...Array.from(neighbors))
			}
		}

		return false
	}

	/**
	 * 获取最短路径
	 */
	getShortestPath(sourceId: string, targetId: string): string[] {
		if (sourceId === targetId) return [sourceId]

		const queue: string[] = [sourceId]
		const visited = new Set<string>([sourceId])
		const parent = new Map<string, string>()

		while (queue.length > 0) {
			const current = queue.shift()!

			const neighbors = this.adjacencyList.get(current) || new Set()
			for (const neighbor of neighbors) {
				if (!visited.has(neighbor)) {
					visited.add(neighbor)
					parent.set(neighbor, current)
					queue.push(neighbor)

					if (neighbor === targetId) {
						// 重构路径
						const path: string[] = [targetId]
						let node = targetId
						while (parent.has(node)) {
							node = parent.get(node)!
							path.unshift(node)
						}
						return path
					}
				}
			}
		}

		return [] // 无路径
	}

	/**
	 * 检测环
	 */
	hasCycle(): boolean {
		const visited = new Set<string>()
		const recursionStack = new Set<string>()

		const dfs = (nodeId: string): boolean => {
			if (recursionStack.has(nodeId)) return true
			if (visited.has(nodeId)) return false

			visited.add(nodeId)
			recursionStack.add(nodeId)

			const neighbors = this.adjacencyList.get(nodeId) || new Set()
			for (const neighbor of neighbors) {
				if (dfs(neighbor)) return true
			}

			recursionStack.delete(nodeId)
			return false
		}

		for (const node of this.nodes) {
			if (!visited.has(node.id)) {
				if (dfs(node.id)) return true
			}
		}

		return false
	}

	/**
	 * 获取连通分量
	 */
	getConnectedComponents(): string[][] {
		const visited = new Set<string>()
		const components: string[][] = []

		const dfs = (nodeId: string, component: string[]) => {
			visited.add(nodeId)
			component.push(nodeId)

			const neighbors = this.adjacencyList.get(nodeId) || new Set()
			for (const neighbor of neighbors) {
				if (!visited.has(neighbor)) {
					dfs(neighbor, component)
				}
			}

			const reverseNeighbors = this.reverseAdjacencyList.get(nodeId) || new Set()
			for (const neighbor of reverseNeighbors) {
				if (!visited.has(neighbor)) {
					dfs(neighbor, component)
				}
			}
		}

		for (const node of this.nodes) {
			if (!visited.has(node.id)) {
				const component: string[] = []
				dfs(node.id, component)
				components.push(component)
			}
		}

		return components
	}

	/**
	 * 计算中心性度量
	 */
	calculateCentrality(): void {
		this.calculateDegreeCentrality()
		this.calculateBetweennessCentrality()
		this.calculateClosenessCentrality()
		this.calculateEigenvectorCentrality()
		this.calculatePageRank()
	}

	/**
	 * 计算度中心性
	 */
	private calculateDegreeCentrality(): void {
		this.nodes.forEach((node) => {
			const degree = this.adjacencyList.get(node.id)?.size || 0
			const maxDegree = this.nodes.length - 1
			this.centralityMeasures.degree[node.id] = maxDegree > 0 ? degree / maxDegree : 0
		})
	}

	/**
	 * 计算介数中心性
	 */
	private calculateBetweennessCentrality(): void {
		this.nodes.forEach((node) => {
			let betweenness = 0

			this.nodes.forEach((source) => {
				this.nodes.forEach((target) => {
					if (source.id !== node.id && target.id !== node.id && source.id !== target.id) {
						const paths = this.getAllShortestPaths(source.id, target.id)
						const pathsThroughNode = paths.filter((path) => path.includes(node.id))

						if (paths.length > 0) {
							betweenness += pathsThroughNode.length / paths.length
						}
					}
				})
			})

			this.centralityMeasures.betweenness[node.id] = betweenness
		})
	}

	/**
	 * 获取所有最短路径
	 */
	private getAllShortestPaths(sourceId: string, targetId: string): string[][] {
		const paths: string[][] = []
		const queue: { node: string; path: string[] }[] = [{ node: sourceId, path: [sourceId] }]
		let shortestLength = Infinity

		while (queue.length > 0) {
			const { node, path } = queue.shift()!

			if (node === targetId) {
				if (path.length <= shortestLength) {
					if (path.length < shortestLength) {
						shortestLength = path.length
						paths.length = 0 // 清空之前的路径
					}
					paths.push([...path])
				}
				continue
			}

			if (path.length >= shortestLength) continue

			const neighbors = this.adjacencyList.get(node) || new Set()
			for (const neighbor of neighbors) {
				if (!path.includes(neighbor)) {
					queue.push({ node: neighbor, path: [...path, neighbor] })
				}
			}
		}

		return paths
	}

	/**
	 * 计算接近中心性
	 */
	private calculateClosenessCentrality(): void {
		this.nodes.forEach((node) => {
			const distances = this.calculateDistancesFromNode(node.id)
			const sumDistances = Object.values(distances).reduce((sum, dist) => sum + dist, 0)

			this.centralityMeasures.closeness[node.id] = sumDistances > 0 ? (this.nodes.length - 1) / sumDistances : 0
		})
	}

	/**
	 * 计算从节点到所有其他节点的距离
	 */
	private calculateDistancesFromNode(sourceId: string): Record<string, number> {
		const distances: Record<string, number> = {}
		const visited = new Set<string>()
		const queue: string[] = [sourceId]

		this.nodes.forEach((node) => {
			distances[node.id] = node.id === sourceId ? 0 : Infinity
		})

		while (queue.length > 0) {
			const current = queue.shift()!

			if (!visited.has(current)) {
				visited.add(current)

				const neighbors = this.adjacencyList.get(current) || new Set()
				for (const neighbor of neighbors) {
					const newDistance = distances[current] + 1
					if (newDistance < distances[neighbor]) {
						distances[neighbor] = newDistance
						queue.push(neighbor)
					}
				}
			}
		}

		return distances
	}

	/**
	 * 计算特征向量中心性
	 */
	private calculateEigenvectorCentrality(): void {
		const eigenvector: Record<string, number> = {}
		const nodes = this.nodes.map((n) => n.id)

		// 初始化
		nodes.forEach((nodeId) => {
			eigenvector[nodeId] = 1 / nodes.length
		})

		// 幂迭代
		for (let iteration = 0; iteration < 100; iteration++) {
			const newEigenvector: Record<string, number> = {}
			let maxValue = 0

			nodes.forEach((nodeId) => {
				let sum = 0
				const neighbors = this.reverseAdjacencyList.get(nodeId) || new Set()

				neighbors.forEach((neighbor) => {
					sum += eigenvector[neighbor] || 0
				})

				newEigenvector[nodeId] = sum
				maxValue = Math.max(maxValue, sum)
			})

			// 归一化
			if (maxValue > 0) {
				nodes.forEach((nodeId) => {
					newEigenvector[nodeId] /= maxValue
				})
			}

			// 检查收敛
			let converged = true
			nodes.forEach((nodeId) => {
				if (Math.abs(newEigenvector[nodeId] - eigenvector[nodeId]) > 1e-6) {
					converged = false
				}
			})

			Object.assign(eigenvector, newEigenvector)

			if (converged) break
		}

		this.centralityMeasures.eigenvector = eigenvector
	}

	/**
	 * 计算PageRank
	 */
	private calculatePageRank(): void {
		const pagerank: Record<string, number> = {}
		const nodes = this.nodes.map((n) => n.id)
		const dampingFactor = 0.85

		// 初始化
		const initialValue = 1 / nodes.length
		nodes.forEach((nodeId) => {
			pagerank[nodeId] = initialValue
		})

		// 迭代计算
		for (let iteration = 0; iteration < 100; iteration++) {
			const newPagerank: Record<string, number> = {}

			nodes.forEach((nodeId) => {
				let sum = 0
				const inNeighbors = this.reverseAdjacencyList.get(nodeId) || new Set()

				inNeighbors.forEach((neighbor) => {
					const outDegree = this.adjacencyList.get(neighbor)?.size || 0
					if (outDegree > 0) {
						sum += pagerank[neighbor] / outDegree
					}
				})

				newPagerank[nodeId] = (1 - dampingFactor) / nodes.length + dampingFactor * sum
			})

			Object.assign(pagerank, newPagerank)
		}

		this.centralityMeasures.pagerank = pagerank
	}

	/**
	 * 更新元数据
	 */
	private updateMetadata(): void {
		this.metadata.nodeCount = this.nodes.length
		this.metadata.edgeCount = this.edges.length

		// 计算连通分量
		const components = this.getConnectedComponents()
		this.metadata.componentCount = components.length
		this.metadata.isConnected = components.length === 1

		// 检测环
		this.metadata.isAcyclic = !this.hasCycle()

		// 计算密度
		const maxEdges = this.directed
			? this.nodes.length * (this.nodes.length - 1)
			: (this.nodes.length * (this.nodes.length - 1)) / 2

		this.density = maxEdges > 0 ? this.edges.length / maxEdges : 0

		// 计算聚类系数
		this.clusteringCoefficient = this.calculateClusteringCoefficient()

		// 计算平均路径长度
		this.averagePathLength = this.calculateAveragePathLength()

		// 计算直径
		this.metadata.diameter = this.calculateDiameter()
	}

	/**
	 * 计算聚类系数
	 */
	private calculateClusteringCoefficient(): number {
		let totalCoefficient = 0

		this.nodes.forEach((node) => {
			const neighbors = Array.from(this.adjacencyList.get(node.id) || [])

			if (neighbors.length < 2) {
				return // 跳过节点数少于2的节点
			}

			let triangles = 0
			let possibleTriangles = (neighbors.length * (neighbors.length - 1)) / 2

			for (let i = 0; i < neighbors.length; i++) {
				for (let j = i + 1; j < neighbors.length; j++) {
					if (this.adjacencyList.get(neighbors[i])?.has(neighbors[j])) {
						triangles++
					}
				}
			}

			totalCoefficient += possibleTriangles > 0 ? triangles / possibleTriangles : 0
		})

		return this.nodes.length > 0 ? totalCoefficient / this.nodes.length : 0
	}

	/**
	 * 计算平均路径长度
	 */
	private calculateAveragePathLength(): number {
		let totalLength = 0
		let pathCount = 0

		for (let i = 0; i < this.nodes.length; i++) {
			const distances = this.calculateDistancesFromNode(this.nodes[i].id)

			Object.values(distances).forEach((distance) => {
				if (distance < Infinity && distance > 0) {
					totalLength += distance
					pathCount++
				}
			})
		}

		return pathCount > 0 ? totalLength / pathCount : 0
	}

	/**
	 * 计算直径
	 */
	private calculateDiameter(): number {
		let maxDistance = 0

		this.nodes.forEach((node) => {
			const distances = this.calculateDistancesFromNode(node.id)
			const maxNodeDistance = Math.max(...Object.values(distances).filter((d) => d < Infinity))
			maxDistance = Math.max(maxDistance, maxNodeDistance)
		})

		return maxDistance
	}

	/**
	 * 获取图摘要
	 */
	getSummary(): Record<string, any> {
		return {
			id: this.id,
			name: this.name,
			nodeCount: this.nodes.length,
			edgeCount: this.edges.length,
			directed: this.directed,
			weighted: this.weighted,
			density: this.density,
			clusteringCoefficient: this.clusteringCoefficient,
			averagePathLength: this.averagePathLength,
			componentCount: this.metadata.componentCount,
			isConnected: this.metadata.isConnected,
			isAcyclic: this.metadata.isAcyclic,
			diameter: this.metadata.diameter,
		}
	}
}
