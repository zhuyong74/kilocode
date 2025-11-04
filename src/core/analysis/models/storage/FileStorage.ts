/**
 * 文件存储类
 *
 * 提供基于文件系统的数据持久化功能。
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
import * as fs from "fs/promises"
import * as path from "path"
import * as crypto from "crypto"
import * as zlib from "zlib"
import { promisify } from "util"

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

export class FileStorage<T extends BaseModel> implements IStorage<T> {
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

	private basePath: string
	private cache: Map<string, { data: T; timestamp: number }>
	private index: Map<string, any>
	private eventEmitter: EventEmitter
	private observers: Observer[] = []

	constructor(config: {
		id?: string
		name?: string
		description?: string
		version?: string
		basePath: string
		configuration?: Partial<StorageConfiguration>
		metadata?: Record<string, any>
		enabled?: boolean
		tags?: string[]
	}) {
		const now = new Date()

		this.id = config.id || this.generateId()
		this.name = config.name || "file-storage"
		this.description = config.description
		this.version = config.version || "1.0.0"
		this.createdAt = now
		this.updatedAt = now
		this.metadata = config.metadata || {}
		this.enabled = config.enabled ?? true
		this.tags = config.tags || []
		this.storageType = StorageType.FILE_SYSTEM
		this.basePath = path.resolve(config.basePath)
		this.configuration = {
			maxCapacity: 1024 * 1024 * 1024, // 1GB
			compression: true,
			compressionLevel: 6,
			encryption: false,
			encryptionKey: "",
			caching: true,
			cacheSize: 100,
			cacheExpiry: 3600000, // 1小时
			indexing: true,
			...config.configuration,
		}

		this.cache = new Map()
		this.index = new Map()
		this.eventEmitter = new EventEmitter()

		this.setupEventListeners()
		this.initializeStorage()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `file-storage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
	private async initializeStorage(): Promise<void> {
		try {
			// 创建基础目录
			await fs.mkdir(this.basePath, { recursive: true })
			await fs.mkdir(path.join(this.basePath, "data"), { recursive: true })
			await fs.mkdir(path.join(this.basePath, "metadata"), { recursive: true })
			await fs.mkdir(path.join(this.basePath, "index"), { recursive: true })
			await fs.mkdir(path.join(this.basePath, "backup"), { recursive: true })

			// 加载索引
			await this.loadIndex()

			this.notifyObservers({
				type: ModelEventType.INITIALIZED,
				source: this.id,
				data: { basePath: this.basePath },
				timestamp: new Date(),
				tags: ["initialization", "file-storage"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { initializationError: error.message },
				timestamp: new Date(),
				tags: ["initialization", "error", "file-storage"],
			})
			throw error
		}
	}

	/**
	 * 加载索引
	 */
	private async loadIndex(): Promise<void> {
		try {
			const indexPath = path.join(this.basePath, "index", "main.json")
			const exists = await this.fileExists(indexPath)

			if (exists) {
				const indexData = await fs.readFile(indexPath, "utf8")
				const parsed = JSON.parse(indexData)
				this.index = new Map(Object.entries(parsed))
			}
		} catch (error) {
			console.warn("Failed to load index:", error.message)
		}
	}

	/**
	 * 保存索引
	 */
	private async saveIndex(): Promise<void> {
		try {
			const indexPath = path.join(this.basePath, "index", "main.json")
			const indexData = Object.fromEntries(this.index)
			await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2))
		} catch (error) {
			console.warn("Failed to save index:", error.message)
		}
	}

	/**
	 * 检查文件是否存在
	 */
	private async fileExists(filePath: string): Promise<boolean> {
		try {
			await fs.access(filePath)
			return true
		} catch {
			return false
		}
	}

	/**
	 * 生成文件路径
	 */
	private generateFilePath(id: string): string {
		// 使用哈希分布文件，避免单个目录文件过多
		const hash = crypto.createHash("md5").update(id).digest("hex")
		const subDir = hash.substring(0, 2)
		const fileName = `${hash}.json`

		return path.join(this.basePath, "data", subDir, fileName)
	}

	/**
	 * 生成元数据文件路径
	 */
	private generateMetadataPath(id: string): string {
		return path.join(this.basePath, "metadata", `${id}.json`)
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
			const filePath = this.generateFilePath(id)
			const metadataPath = this.generateMetadataPath(id)

			// 确保目录存在
			await fs.mkdir(path.dirname(filePath), { recursive: true })

			// 序列化数据
			const serializedData = JSON.stringify(data, null, 2)
			let dataToSave = serializedData
			let compressionRatio: number | undefined

			// 压缩（如果需要）
			if (this.configuration.compression || options?.compression) {
				const compressed = await gzip(Buffer.from(serializedData), {
					level: this.configuration.compressionLevel,
				})
				dataToSave = compressed.toString("base64")
				compressionRatio = Math.round((1 - compressed.length / Buffer.byteLength(serializedData)) * 100)
			}

			// 加密（如果需要）
			if (this.configuration.encryption || options?.encryption) {
				// 简化的加密实现
				const encrypted = crypto.createCipher("aes-256-cbc", this.configuration.encryptionKey || "default-key")
				dataToSave = encrypted.update(dataToSave, "utf8", "hex") + encrypted.final("hex")
			}

			// 保存数据文件
			await fs.writeFile(filePath, dataToSave)

			// 保存元数据
			const metadata = {
				id,
				name: data.name,
				version: data.version,
				createdAt: data.createdAt,
				updatedAt: data.updatedAt,
				size: Buffer.byteLength(serializedData),
				compressedSize: Buffer.byteLength(dataToSave),
				compressionRatio,
				tags: data.tags,
				customMetadata: options?.metadata,
			}

			await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

			// 更新索引
			this.index.set(id, {
				id,
				name: data.name,
				path: filePath,
				metadataPath,
				size: metadata.size,
				compressedSize: metadata.compressedSize,
				updatedAt: new Date(),
			})

			// 保存索引
			await this.saveIndex()

			// 更新缓存
			if (this.configuration.caching) {
				this.cache.set(id, { data, timestamp: Date.now() })
				this.evictOldCache()
			}

			const executionTime = Date.now() - startTime

			const result: SaveResult = {
				success: true,
				id,
				path: filePath,
				size: metadata.size,
				compressionRatio,
				executionTime,
			}

			this.notifyObservers({
				type: ModelEventType.CREATED,
				source: this.id,
				data: { saved: true, id, path: filePath },
				timestamp: new Date(),
				tags: ["save", "success", "file-storage"],
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
				tags: ["save", "error", "file-storage"],
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

			// 检查缓存
			if (this.configuration.caching && options?.useCache !== false) {
				const cached = this.cache.get(id)
				if (cached && Date.now() - cached.timestamp < this.configuration.cacheExpiry!) {
					return cached.data
				}
			}

			const indexEntry = this.index.get(id)
			if (!indexEntry) {
				return null
			}

			const filePath = indexEntry.path

			// 检查文件是否存在
			if (!(await this.fileExists(filePath))) {
				this.index.delete(id)
				await this.saveIndex()
				return null
			}

			// 读取数据
			let data = await fs.readFile(filePath, "utf8")

			// 解密（如果需要）
			if (this.configuration.encryption) {
				const decrypted = crypto.createDecipher(
					"aes-256-cbc",
					this.configuration.encryptionKey || "default-key",
				)
				data = decrypted.update(data, "hex", "utf8") + decrypted.final("utf8")
			}

			// 解压缩（如果需要）
			if (this.configuration.compression) {
				const decompressed = await gunzip(Buffer.from(data, "base64"))
				data = decompressed.toString("utf8")
			}

			// 反序列化
			const parsed = JSON.parse(data)

			// 验证数据（如果需要）
			if (options?.validate && parsed.validate) {
				const isValid = await parsed.validate()
				if (!isValid) {
					throw new Error("Data validation failed")
				}
			}

			// 更新缓存
			if (this.configuration.caching) {
				this.cache.set(id, { data: parsed, timestamp: Date.now() })
			}

			this.notifyObservers({
				type: ModelEventType.LOADED,
				source: this.id,
				data: { loaded: true, id, path: filePath },
				timestamp: new Date(),
				tags: ["load", "success", "file-storage"],
			})

			return parsed
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { loadError: error.message, id },
				timestamp: new Date(),
				tags: ["load", "error", "file-storage"],
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

			const indexEntry = this.index.get(id)
			if (!indexEntry) {
				return {
					success: false,
					error: new Error(`Data with id ${id} not found`),
				}
			}

			// 删除数据文件
			if (await this.fileExists(indexEntry.path)) {
				await fs.unlink(indexEntry.path)
			}

			// 删除元数据文件
			if (await this.fileExists(indexEntry.metadataPath)) {
				await fs.unlink(indexEntry.metadataPath)
			}

			// 删除索引
			this.index.delete(id)
			await this.saveIndex()

			// 清除缓存
			this.cache.delete(id)

			this.notifyObservers({
				type: ModelEventType.DELETED,
				source: this.id,
				data: { deleted: true, id },
				timestamp: new Date(),
				tags: ["delete", "success", "file-storage"],
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
				tags: ["delete", "error", "file-storage"],
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
		return this.index.has(id)
	}

	/**
	 * 列出所有数据ID
	 */
	async list(options?: ListOptions): Promise<string[]> {
		try {
			const ids = Array.from(this.index.keys())

			// 应用排序
			if (options?.sortBy) {
				ids.sort((a, b) => {
					const entryA = this.index.get(a)
					const entryB = this.index.get(b)

					if (!entryA || !entryB) return 0

					const valueA = entryA[options.sortBy!]
					const valueB = entryB[options.sortBy!]

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
				tags: ["list", "error", "file-storage"],
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
			const allIds = Array.from(this.index.keys())
			const results: T[] = []

			for (const id of allIds) {
				const data = await this.load(id, { useCache: true })
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
				tags: ["search", "error", "file-storage"],
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
			let usedCapacity = 0

			// 计算已使用容量
			for (const entry of this.index.values()) {
				usedCapacity += entry.size || 0
			}

			const availableCapacity = totalCapacity - usedCapacity
			const itemCount = this.index.size
			const averageItemSize = itemCount > 0 ? usedCapacity / itemCount : 0

			return {
				totalCapacity,
				usedCapacity,
				availableCapacity,
				itemCount,
				indexCount: this.index.size,
				averageItemSize,
				lastUpdated: new Date(),
			}
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { statsError: error.message },
				timestamp: new Date(),
				tags: ["stats", "error", "file-storage"],
			})
			throw error
		}
	}

	/**
	 * 清空存储
	 */
	async clear(): Promise<void> {
		try {
			// 删除所有数据文件
			const dataDir = path.join(this.basePath, "data")
			await this.deleteDirectoryContents(dataDir)

			// 删除所有元数据文件
			const metadataDir = path.join(this.basePath, "metadata")
			await this.deleteDirectoryContents(metadataDir)

			// 清空索引和缓存
			this.index.clear()
			this.cache.clear()

			// 保存空索引
			await this.saveIndex()

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { cleared: true },
				timestamp: new Date(),
				tags: ["clear", "success", "file-storage"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { clearError: error.message },
				timestamp: new Date(),
				tags: ["clear", "error", "file-storage"],
			})
			throw error
		}
	}

	/**
	 * 删除目录内容
	 */
	private async deleteDirectoryContents(dirPath: string): Promise<void> {
		try {
			const items = await fs.readdir(dirPath)

			for (const item of items) {
				const itemPath = path.join(dirPath, item)
				const stat = await fs.stat(itemPath)

				if (stat.isDirectory()) {
					await this.deleteDirectoryContents(itemPath)
					await fs.rmdir(itemPath)
				} else {
					await fs.unlink(itemPath)
				}
			}
		} catch (error) {
			if (error.code !== "ENOENT") {
				throw error
			}
		}
	}

	/**
	 * 关闭存储连接
	 */
	async close(): Promise<void> {
		try {
			// 保存索引
			await this.saveIndex()

			// 清空缓存
			this.cache.clear()

			this.notifyObservers({
				type: ModelEventType.CLOSED,
				source: this.id,
				data: { closed: true },
				timestamp: new Date(),
				tags: ["close", "success", "file-storage"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { closeError: error.message },
				timestamp: new Date(),
				tags: ["close", "error", "file-storage"],
			})
			throw error
		}
	}

	/**
	 * 清理过期缓存
	 */
	private evictOldCache(): void {
		if (this.cache.size <= this.configuration.cacheSize!) {
			return
		}

		const entries = Array.from(this.cache.entries())
		entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

		const toRemove = entries.slice(0, this.cache.size - this.configuration.cacheSize!)
		toRemove.forEach(([key]) => this.cache.delete(key))
	}

	/**
	 * 验证存储
	 */
	async validate(): Promise<boolean> {
		try {
			const isValid = !!this.basePath && !!this.configuration

			this.notifyObservers({
				type: ModelEventType.VALIDATED,
				source: this.id,
				data: { isValid },
				timestamp: new Date(),
				tags: ["validation", "file-storage"],
			})

			return isValid
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { validationError: error.message },
				timestamp: new Date(),
				tags: ["validation", "error", "file-storage"],
			})
			return false
		}
	}

	/**
	 * 序列化存储
	 */
	serialize(): string {
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
				basePath: this.basePath,
				configuration: this.configuration,
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
		this.basePath = parsed.basePath
		this.configuration = parsed.configuration
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
