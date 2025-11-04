/**
 * 内存存储类
 *
 * 提供基于内存的数据存储功能，适合临时数据和高速缓存。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, ModelEvent, ModelEventType } from "../../types"
import {
	IStorage,
	StorageType,
	StorageConfiguration,
	SaveOptions,
	SaveResult,
	LoadOptions,
	DeleteOptions,
	DeleteResult,
	ListOptions,
	SearchQuery,
	SearchOptions,
	SearchResult,
	StorageStats,
	Observer,
} from "./IStorage"
import { EventEmitter } from "events"

export class MemoryStorage<T extends BaseModel> implements IStorage<T> {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]
	storageType: StorageType
	connectionString?: string
	configuration: StorageConfiguration

	private data: Map<string, T>
	private metadata: Map<string, any>
	private accessTimes: Map<string, number>
	private eventEmitter: EventEmitter
	private observers: Observer[] = []

	constructor(config: {
		id?: string
		name?: string
		description?: string
		version?: string
		configuration?: Partial<StorageConfiguration>
		metadata?: Record<string, any>
		enabled?: boolean
		tags?: string[]
	}) {
		const now = new Date()

		this.id = config.id || this.generateId()
		this.name = config.name || "memory-storage"
		this.description = config.description
		this.version = config.version || "1.0.0"
		this.createdAt = now
		this.updatedAt = now
		this.metadata = config.metadata || {}
		this.enabled = config.enabled ?? true
		this.tags = config.tags || []
		this.storageType = StorageType.MEMORY
		this.configuration = {
			maxCapacity: 1024 * 1024 * 100, // 100MB
			compression: false,
			encryption: false,
			caching: true,
			cacheSize: 10000,
			cacheExpiry: 3600000, // 1小时
			indexing: true,
			...config.configuration,
		}

		this.data = new Map()
		this.metadata = new Map()
		this.accessTimes = new Map()
		this.eventEmitter = new EventEmitter()

		this.setupEventListeners()
		this.initializeStorage()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `memory-storage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("storage:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	/**
	 * 初始化存储
	 */
	private initializeStorage(): void {
		this.notifyObservers({
			type: ModelEventType.INITIALIZED,
			source: this.id,
			data: { memoryAllocated: this.configuration.maxCapacity },
			timestamp: new Date(),
			tags: ["initialization", "memory-storage"],
		})
	}

	/**
	 * 检查内存容量
	 */
	private checkMemoryCapacity(data: T): boolean {
		const currentSize = this.getCurrentMemoryUsage()
		const estimatedSize = this.estimateObjectSize(data)
		const maxSize = this.configuration.maxCapacity || 0

		return currentSize + estimatedSize <= maxSize
	}

	/**
	 * 获取当前内存使用量
	 */
	private getCurrentMemoryUsage(): number {
		let totalSize = 0

		for (const item of this.data.values()) {
			totalSize += this.estimateObjectSize(item)
		}

		return totalSize
	}

	/**
	 * 估算对象大小（简化实现）
	 */
	private estimateObjectSize(obj: any): number {
		try {
			return Buffer.byteLength(JSON.stringify(obj), "utf8")
		} catch {
			return 1024 // 默认1KB
		}
	}

	/**
	 * 清理过期数据
	 */
	private evictOldData(): void {
		if (this.data.size <= this.configuration.cacheSize!) {
			return
		}

		// 获取访问时间最早的条目
		const entries = Array.from(this.accessTimes.entries())
		entries.sort((a, b) => a[1] - b[1])

		const toRemove = entries.slice(0, this.data.size - this.configuration.cacheSize!)
		toRemove.forEach(([key]) => {
			this.data.delete(key)
			this.metadata.delete(key)
			this.accessTimes.delete(key)
		})
	}

	/**
	 * 保存数据
	 */
	async save(data: T, options?: SaveOptions): Promise<SaveResult> {
		const startTime = Date.now()

		try {
			if (!this.enabled) {
				throw new Error("Storage is disabled")
			}

			const id = data.id || this.generateId()

			// 检查内存容量
			if (!this.checkMemoryCapacity(data)) {
				// 如果容量不足，清理一些旧数据
				this.evictOldData()

				// 再次检查容量
				if (!this.checkMemoryCapacity(data)) {
					throw new Error("Insufficient memory capacity")
				}
			}

			// 检查是否已存在（如果不允许覆盖）
			if (this.data.has(id) && !options?.overwrite) {
				throw new Error(`Data with id ${id} already exists`)
			}

			// 保存数据
			this.data.set(id, data)
			this.accessTimes.set(id, Date.now())

			// 保存元数据
			const metadata = {
				id,
				name: data.name,
				version: data.version,
				createdAt: data.createdAt,
				updatedAt: data.updatedAt,
				size: this.estimateObjectSize(data),
				tags: data.tags,
				customMetadata: options?.metadata,
				savedAt: new Date(),
			}

			this.metadata.set(id, metadata)

			const executionTime = Date.now() - startTime

			const result: SaveResult = {
				success: true,
				id,
				size: metadata.size,
				executionTime,
			}

			this.notifyObservers({
				type: ModelEventType.CREATED,
				source: this.id,
				data: { saved: true, id },
				timestamp: new Date(),
				tags: ["save", "success", "memory-storage"],
			})

			return result
		} catch (error) {
			const result: SaveResult = {
				success: false,
				error: error as Error,
			}

			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { saveError: error.message },
				timestamp: new Date(),
				tags: ["save", "error", "memory-storage"],
			})

			return result
		}
	}

	/**
	 * 加载数据
	 */
	async load(id: string, options?: LoadOptions): Promise<T | null> {
		try {
			if (!this.enabled) {
				throw new Error("Storage is disabled")
			}

			const data = this.data.get(id)

			if (data) {
				// 更新访问时间
				this.accessTimes.set(id, Date.now())

				// 验证数据（如果需要）
				if (options?.validate && data.validate) {
					const isValid = await data.validate()
					if (!isValid) {
						throw new Error("Data validation failed")
					}
				}

				this.notifyObservers({
					type: ModelEventType.LOADED,
					source: this.id,
					data: { loaded: true, id },
					timestamp: new Date(),
					tags: ["load", "success", "memory-storage"],
				})
			}

			return data || null
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { loadError: error.message, id },
				timestamp: new Date(),
				tags: ["load", "error", "memory-storage"],
			})
			throw error
		}
	}

	/**
	 * 删除数据
	 */
	async delete(id: string, options?: DeleteOptions): Promise<DeleteResult> {
		try {
			if (!this.enabled) {
				throw new Error("Storage is disabled")
			}

			if (!this.data.has(id)) {
				return {
					success: false,
					error: new Error(`Data with id ${id} not found`),
				}
			}

			// 删除数据
			this.data.delete(id)
			this.metadata.delete(id)
			this.accessTimes.delete(id)

			this.notifyObservers({
				type: ModelEventType.DELETED,
				source: this.id,
				data: { deleted: true, id },
				timestamp: new Date(),
				tags: ["delete", "success", "memory-storage"],
			})

			return {
				success: true,
				deletedCount: 1,
			}
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { deleteError: error.message, id },
				timestamp: new Date(),
				tags: ["delete", "error", "memory-storage"],
			})

			return {
				success: false,
				error: error as Error,
			}
		}
	}

	/**
	 * 检查数据是否存在
	 */
	async exists(id: string): Promise<boolean> {
		return this.data.has(id)
	}

	/**
	 * 列出所有数据ID
	 */
	async list(options?: ListOptions): Promise<string[]> {
		try {
			const ids = Array.from(this.data.keys())

			// 应用排序
			if (options?.sortBy) {
				ids.sort((a, b) => {
					const dataA = this.data.get(a)
					const dataB = this.data.get(b)

					if (!dataA || !dataB) return 0

					const valueA = dataA[options.sortBy!]
					const valueB = dataB[options.sortBy!]

					if (valueA < valueB) return options.sortOrder === "desc" ? 1 : -1
					if (valueA > valueB) return options.sortOrder === "desc" ? -1 : 1
					return 0
				})
			}

			// 应用分页
			const limit = options?.limit || ids.length
			const offset = options?.offset || 0

			return ids.slice(offset, offset + limit)
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { listError: error.message },
				timestamp: new Date(),
				tags: ["list", "error", "memory-storage"],
			})
			throw error
		}
	}

	/**
	 * 搜索数据
	 */
	async search(query: SearchQuery, options?: SearchOptions): Promise<SearchResult<T>> {
		const startTime = Date.now()

		try {
			const allIds = Array.from(this.data.keys())
			const results: T[] = []

			for (const id of allIds) {
				const data = this.data.get(id)
				if (!data) continue

				// 文本搜索
				if (query.text) {
					const textMatch = this.matchesTextSearch(data, query.text)
					if (!textMatch) continue
				}

				// 过滤条件
				if (query.filters && query.filters.length > 0) {
					const filterMatch = this.matchesFilters(data, query.filters)
					if (!filterMatch) continue
				}

				results.push(data)
			}

			// 应用排序
			if (query.sortBy) {
				results.sort((a, b) => {
					const valueA = a[query.sortBy!]
					const valueB = b[query.sortBy!]

					if (valueA < valueB) return query.sortOrder === "desc" ? 1 : -1
					if (valueA > valueB) return query.sortOrder === "desc" ? -1 : 1
					return 0
				})
			}

			// 应用分页
			const limit = options?.limit || results.length
			const offset = options?.offset || 0
			const paginatedResults = results.slice(offset, offset + limit)

			const executionTime = Date.now() - startTime

			return {
				items: paginatedResults,
				totalCount: results.length,
				executionTime,
				hasMore: offset + limit < results.length,
			}
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { searchError: error.message },
				timestamp: new Date(),
				tags: ["search", "error", "memory-storage"],
			})
			throw error
		}
	}

	/**
	 * 文本搜索匹配
	 */
	private matchesTextSearch(data: T, text: string): boolean {
		const searchText = text.toLowerCase()
		const dataString = JSON.stringify(data).toLowerCase()
		return dataString.includes(searchText)
	}

	/**
	 * 过滤条件匹配
	 */
	private matchesFilters(data: T, filters: any[]): boolean {
		return filters.every((filter) => {
			const fieldValue = data[filter.field]

			switch (filter.operator) {
				case "equal":
					return fieldValue === filter.value
				case "not_equal":
					return fieldValue !== filter.value
				case "greater_than":
					return fieldValue > filter.value
				case "less_than":
					return fieldValue < filter.value
				case "like":
					return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase())
				case "in":
					return Array.isArray(filter.value) && filter.value.includes(fieldValue)
				default:
					return true
			}
		})
	}

	/**
	 * 获取统计信息
	 */
	async getStats(): Promise<StorageStats> {
		try {
			const totalCapacity = this.configuration.maxCapacity || 0
			const usedCapacity = this.getCurrentMemoryUsage()
			const availableCapacity = totalCapacity - usedCapacity
			const itemCount = this.data.size
			const averageItemSize = itemCount > 0 ? usedCapacity / itemCount : 0

			return {
				totalCapacity,
				usedCapacity,
				availableCapacity,
				itemCount,
				indexCount: this.data.size,
				averageItemSize,
				totalSize: usedCapacity, // 兼容测试期望的属性名
				averageSize: averageItemSize, // 兼容测试期望的属性名
				lastUpdated: new Date(),
			}
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { statsError: error.message },
				timestamp: new Date(),
				tags: ["stats", "error", "memory-storage"],
			})
			throw error
		}
	}

	/**
	 * 清空存储
	 */
	async clear(): Promise<void> {
		try {
			this.data.clear()
			this.metadata.clear()
			this.accessTimes.clear()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { cleared: true },
				timestamp: new Date(),
				tags: ["clear", "success", "memory-storage"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { clearError: error.message },
				timestamp: new Date(),
				tags: ["clear", "error", "memory-storage"],
			})
			throw error
		}
	}

	/**
	 * 关闭存储连接
	 */
	async close(): Promise<void> {
		try {
			// 清空所有数据
			this.data.clear()
			this.metadata.clear()
			this.accessTimes.clear()

			this.notifyObservers({
				type: ModelEventType.CLOSED,
				source: this.id,
				data: { closed: true },
				timestamp: new Date(),
				tags: ["close", "success", "memory-storage"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { closeError: error.message },
				timestamp: new Date(),
				tags: ["close", "error", "memory-storage"],
			})
			throw error
		}
	}

	/**
	 * 验证存储
	 */
	async validate(): Promise<boolean> {
		try {
			const isValid = !!this.configuration

			this.notifyObservers({
				type: ModelEventType.VALIDATED,
				source: this.id,
				data: { isValid },
				timestamp: new Date(),
				tags: ["validation", "memory-storage"],
			})

			return isValid
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { validationError: error.message },
				timestamp: new Date(),
				tags: ["validation", "error", "memory-storage"],
			})
			return false
		}
	}

	/**
	 * 序列化存储
	 */
	serialize(): string {
		const dataArray = Array.from(this.data.entries())
		const metadataArray = Array.from(this.metadata.entries())

		return JSON.stringify(
			{
				id: this.id,
				name: this.name,
				description: this.description,
				version: this.version,
				createdAt: this.createdAt,
				updatedAt: this.updatedAt,
				metadata: this.metadata,
				enabled: this.enabled,
				tags: this.tags,
				storageType: this.storageType,
				configuration: this.configuration,
				data: dataArray,
				metadataMap: metadataArray,
			},
			null,
			2,
		)
	}

	/**
	 * 反序列化存储
	 */
	deserialize(data: string): void {
		const parsed = JSON.parse(data)

		this.id = parsed.id
		this.name = parsed.name
		this.description = parsed.description
		this.version = parsed.version
		this.createdAt = new Date(parsed.createdAt)
		this.updatedAt = new Date(parsed.updatedAt)
		this.metadata = parsed.metadata
		this.enabled = parsed.enabled
		this.tags = parsed.tags
		this.storageType = parsed.storageType
		this.configuration = parsed.configuration

		// 恢复数据
		this.data = new Map(parsed.data)
		this.metadata = new Map(parsed.metadataMap)

		// 重建访问时间
		this.accessTimes = new Map()
		const now = Date.now()
		for (const id of this.data.keys()) {
			this.accessTimes.set(id, now)
		}
	}

	/**
	 * 克隆存储
	 */
	clone(): this {
		const serialized = this.serialize()
		const cloned = new (this.constructor as any)()
		cloned.deserialize(serialized)
		return cloned
	}

	/**
	 * 深度克隆存储
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
}
