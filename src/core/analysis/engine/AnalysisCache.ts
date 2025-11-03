/**
 * Analysis Cache
 *
 * This module provides a comprehensive caching system for analysis results,
 * supporting multiple storage backends, intelligent eviction policies,
 * and cache warming strategies.
 */

import { EventEmitter } from "events"
import {
	IAnalysisCache,
	CacheConfig,
	CacheEntry,
	CacheKey,
	CacheStatistics,
	CacheEvents,
	CacheStorageType,
	CacheEvictionPolicy,
	CacheCompressionType,
	CacheSerializationFormat,
	ICacheStorage,
	ICacheKeyGenerator,
	ICacheSerializer,
	ICacheCompressor,
} from "../types/cache"
import { AnalysisContext, AnalysisResult } from "../types/engine"
import { EventBus } from "../../events/EventBus"
import { DIContainer } from "../../di/DIContainer"

/**
 * Cache entry with internal metadata
 */
interface InternalCacheEntry extends CacheEntry {
	/** Access count */
	accessCount: number

	/** Last access time */
	lastAccessTime: Date

	/** Creation time */
	createdAt: Date

	/** Expiration time */
	expiresAt?: Date

	/** Entry size in bytes */
	size: number

	/** Compression status */
	compressed: boolean
}

/**
 * Default cache key generator
 */
class DefaultCacheKeyGenerator implements ICacheKeyGenerator {
	generate(context: AnalysisContext): CacheKey {
		const targetKey = `${context.target.type}:${context.target.id}`
		const optionsKey = context.options ? JSON.stringify(context.options) : ""
		const metadataKey = context.metadata ? JSON.stringify(context.metadata) : ""

		const combined = `${targetKey}|${optionsKey}|${metadataKey}`

		return {
			key: this.hash(combined),
			namespace: context.target.type,
			tags: [context.target.type, context.target.id],
			metadata: {
				targetType: context.target.type,
				targetId: context.target.id,
				hasOptions: !!context.options,
				hasMetadata: !!context.metadata,
			},
		}
	}

	private hash(input: string): string {
		let hash = 0
		for (let i = 0; i < input.length; i++) {
			const char = input.charCodeAt(i)
			hash = (hash << 5) - hash + char
			hash = hash & hash // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(36)
	}
}

/**
 * Default JSON serializer
 */
class DefaultCacheSerializer implements ICacheSerializer {
	serialize(data: any): Buffer {
		const json = JSON.stringify(data)
		return Buffer.from(json, "utf8")
	}

	deserialize(buffer: Buffer): any {
		const json = buffer.toString("utf8")
		return JSON.parse(json)
	}
}

/**
 * Memory cache storage
 */
class MemoryCacheStorage implements ICacheStorage {
	private readonly _storage = new Map<string, Buffer>()

	async get(key: string): Promise<Buffer | null> {
		return this._storage.get(key) || null
	}

	async set(key: string, value: Buffer, ttl?: number): Promise<void> {
		this._storage.set(key, value)

		if (ttl) {
			setTimeout(() => {
				this._storage.delete(key)
			}, ttl * 1000)
		}
	}

	async delete(key: string): Promise<boolean> {
		return this._storage.delete(key)
	}

	async clear(): Promise<void> {
		this._storage.clear()
	}

	async keys(): Promise<string[]> {
		return Array.from(this._storage.keys())
	}

	async size(): Promise<number> {
		return this._storage.size
	}

	async dispose(): Promise<void> {
		this._storage.clear()
	}
}

/**
 * Analysis cache implementation
 */
export class AnalysisCache extends EventEmitter implements IAnalysisCache {
	private readonly _config: CacheConfig
	private readonly _storage: ICacheStorage
	private readonly _keyGenerator: ICacheKeyGenerator
	private readonly _serializer: ICacheSerializer
	private readonly _compressor?: ICacheCompressor
	private readonly _eventBus: EventBus

	private _initialized = false
	private _disposed = false

	// Cache metadata
	private readonly _entries = new Map<string, InternalCacheEntry>()
	private _statistics: CacheStatistics = {
		hits: 0,
		misses: 0,
		hitRate: 0,
		totalEntries: 0,
		totalSize: 0,
		evictions: 0,
		compressionRatio: 0,
		averageAccessTime: 0,
		oldestEntry: new Date(),
		newestEntry: new Date(),
		createdAt: new Date(),
	}

	// Cleanup timer
	private _cleanupTimer?: NodeJS.Timeout

	constructor(config: CacheConfig, container: DIContainer) {
		super()
		this._config = { ...config }
		this._eventBus = container.resolve<EventBus>("eventBus")

		// Initialize components
		this._storage = this.createStorage(config.storageType)
		this._keyGenerator =
			container.tryResolve<ICacheKeyGenerator>("cacheKeyGenerator") || new DefaultCacheKeyGenerator()
		this._serializer = container.tryResolve<ICacheSerializer>("cacheSerializer") || new DefaultCacheSerializer()
		this._compressor = container.tryResolve<ICacheCompressor>("cacheCompressor")

		// Set default values
		this._config.maxSize = this._config.maxSize || 1000
		this._config.ttl = this._config.ttl || 3600 // 1 hour
		this._config.evictionPolicy = this._config.evictionPolicy || CacheEvictionPolicy.LRU
		this._config.compressionThreshold = this._config.compressionThreshold || 1024 // 1KB
	}

	/**
	 * Get cache configuration
	 */
	get config(): CacheConfig {
		return { ...this._config }
	}

	/**
	 * Check if cache is initialized
	 */
	get isInitialized(): boolean {
		return this._initialized
	}

	/**
	 * Initialize the cache
	 */
	async initialize(): Promise<void> {
		if (this._initialized) {
			throw new Error("Cache is already initialized")
		}

		try {
			// Initialize storage
			if (this._storage.initialize) {
				await this._storage.initialize()
			}

			// Load existing entries if persistent storage
			if (this._config.persistent) {
				await this.loadPersistedEntries()
			}

			// Start cleanup timer
			this.startCleanupTimer()

			// Warm cache if configured
			if (this._config.warmingStrategy) {
				await this.warmCache()
			}

			this._initialized = true
			this._statistics.createdAt = new Date()

			this.emit("initialized")
			this._eventBus.emit("cache:initialized", { cacheId: "analysis" })
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Get cached analysis result
	 */
	async get(context: AnalysisContext): Promise<AnalysisResult | null> {
		if (!this._initialized) {
			throw new Error("Cache is not initialized")
		}

		const startTime = Date.now()

		try {
			const cacheKey = this._keyGenerator.generate(context)
			const entry = this._entries.get(cacheKey.key)

			if (!entry) {
				this._statistics.misses++
				this.updateHitRate()
				return null
			}

			// Check expiration
			if (entry.expiresAt && entry.expiresAt < new Date()) {
				await this.delete(context)
				this._statistics.misses++
				this.updateHitRate()
				return null
			}

			// Load data from storage
			const buffer = await this._storage.get(cacheKey.key)
			if (!buffer) {
				// Entry exists in metadata but not in storage - cleanup
				this._entries.delete(cacheKey.key)
				this._statistics.misses++
				this.updateHitRate()
				return null
			}

			// Decompress if needed
			let dataBuffer = buffer
			if (entry.compressed && this._compressor) {
				dataBuffer = await this._compressor.decompress(buffer)
			}

			// Deserialize
			const result = this._serializer.deserialize(dataBuffer)

			// Update access metadata
			entry.accessCount++
			entry.lastAccessTime = new Date()

			// Update statistics
			this._statistics.hits++
			this.updateHitRate()
			this.updateAverageAccessTime(Date.now() - startTime)

			this.emit("cache-hit", cacheKey.key, context)
			this._eventBus.emit("cache:hit", { key: cacheKey.key, context })

			return result
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Set cached analysis result
	 */
	async set(context: AnalysisContext, result: AnalysisResult): Promise<void> {
		if (!this._initialized) {
			throw new Error("Cache is not initialized")
		}

		try {
			const cacheKey = this._keyGenerator.generate(context)

			// Serialize data
			let dataBuffer = this._serializer.serialize(result)
			let compressed = false

			// Compress if needed
			if (
				this._compressor &&
				this._config.compressionThreshold &&
				dataBuffer.length > this._config.compressionThreshold
			) {
				dataBuffer = await this._compressor.compress(dataBuffer)
				compressed = true
			}

			// Check cache size limits
			await this.ensureCapacity(dataBuffer.length)

			// Calculate expiration
			const expiresAt = this._config.ttl ? new Date(Date.now() + this._config.ttl * 1000) : undefined

			// Create cache entry
			const entry: InternalCacheEntry = {
				key: cacheKey.key,
				value: result,
				metadata: {
					size: dataBuffer.length,
					createdAt: new Date(),
					lastAccessTime: new Date(),
					accessCount: 0,
					tags: cacheKey.tags,
					namespace: cacheKey.namespace,
					compressed,
					checksum: this.calculateChecksum(dataBuffer),
				},
				accessCount: 0,
				lastAccessTime: new Date(),
				createdAt: new Date(),
				expiresAt,
				size: dataBuffer.length,
				compressed,
			}

			// Store in storage
			await this._storage.set(cacheKey.key, dataBuffer, this._config.ttl)

			// Update metadata
			this._entries.set(cacheKey.key, entry)

			// Update statistics
			this._statistics.totalEntries = this._entries.size
			this._statistics.totalSize += dataBuffer.length
			this.updateCompressionRatio()
			this.updateEntryTimestamps()

			this.emit("cache-set", cacheKey.key, context, result)
			this._eventBus.emit("cache:set", { key: cacheKey.key, context, result })
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Delete cached result
	 */
	async delete(context: AnalysisContext): Promise<boolean> {
		if (!this._initialized) {
			throw new Error("Cache is not initialized")
		}

		try {
			const cacheKey = this._keyGenerator.generate(context)
			const entry = this._entries.get(cacheKey.key)

			if (!entry) {
				return false
			}

			// Remove from storage
			const deleted = await this._storage.delete(cacheKey.key)

			if (deleted) {
				// Update statistics
				this._statistics.totalSize -= entry.size
				this._entries.delete(cacheKey.key)
				this._statistics.totalEntries = this._entries.size
				this.updateEntryTimestamps()

				this.emit("cache-delete", cacheKey.key, context)
				this._eventBus.emit("cache:delete", { key: cacheKey.key, context })
			}

			return deleted
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Clear all cached results
	 */
	async clear(): Promise<void> {
		if (!this._initialized) {
			throw new Error("Cache is not initialized")
		}

		try {
			await this._storage.clear()
			this._entries.clear()

			// Reset statistics
			this._statistics.totalEntries = 0
			this._statistics.totalSize = 0
			this.updateEntryTimestamps()

			this.emit("cache-cleared")
			this._eventBus.emit("cache:cleared", { cacheId: "analysis" })
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Invalidate cache entries by tags
	 */
	async invalidate(tags: string[]): Promise<number> {
		if (!this._initialized) {
			throw new Error("Cache is not initialized")
		}

		let invalidatedCount = 0

		try {
			const keysToDelete: string[] = []

			for (const [key, entry] of this._entries) {
				if (entry.metadata.tags && entry.metadata.tags.some((tag) => tags.includes(tag))) {
					keysToDelete.push(key)
				}
			}

			for (const key of keysToDelete) {
				await this._storage.delete(key)
				const entry = this._entries.get(key)
				if (entry) {
					this._statistics.totalSize -= entry.size
					this._entries.delete(key)
					invalidatedCount++
				}
			}

			this._statistics.totalEntries = this._entries.size
			this.updateEntryTimestamps()

			this.emit("cache-invalidated", tags, invalidatedCount)
			this._eventBus.emit("cache:invalidated", { tags, count: invalidatedCount })

			return invalidatedCount
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Get cache statistics
	 */
	getStatistics(): CacheStatistics {
		return { ...this._statistics }
	}

	/**
	 * Dispose the cache
	 */
	async dispose(): Promise<void> {
		if (this._disposed) {
			return
		}

		try {
			// Stop cleanup timer
			if (this._cleanupTimer) {
				clearInterval(this._cleanupTimer)
				this._cleanupTimer = undefined
			}

			// Persist entries if configured
			if (this._config.persistent) {
				await this.persistEntries()
			}

			// Dispose storage
			await this._storage.dispose()

			// Clear metadata
			this._entries.clear()

			this._disposed = true

			this.emit("disposed")
			this._eventBus.emit("cache:disposed", { cacheId: "analysis" })
		} catch (error) {
			this.emit("error", error)
			throw error
		}
	}

	/**
	 * Create storage instance based on type
	 */
	private createStorage(type: CacheStorageType): ICacheStorage {
		switch (type) {
			case CacheStorageType.MEMORY:
				return new MemoryCacheStorage()

			case CacheStorageType.DISK:
				// TODO: Implement disk storage
				throw new Error("Disk storage not implemented yet")

			case CacheStorageType.REDIS:
				// TODO: Implement Redis storage
				throw new Error("Redis storage not implemented yet")

			case CacheStorageType.HYBRID:
				// TODO: Implement hybrid storage
				throw new Error("Hybrid storage not implemented yet")

			default:
				return new MemoryCacheStorage()
		}
	}

	/**
	 * Ensure cache capacity
	 */
	private async ensureCapacity(newEntrySize: number): Promise<void> {
		if (!this._config.maxSize) {
			return
		}

		const currentSize = this._statistics.totalSize
		const maxSize = this._config.maxSize

		if (currentSize + newEntrySize <= maxSize) {
			return
		}

		// Need to evict entries
		const targetSize = maxSize - newEntrySize
		await this.evictEntries(currentSize - targetSize)
	}

	/**
	 * Evict entries based on eviction policy
	 */
	private async evictEntries(bytesToEvict: number): Promise<void> {
		let evictedBytes = 0
		const entries = Array.from(this._entries.entries())

		// Sort entries based on eviction policy
		switch (this._config.evictionPolicy) {
			case CacheEvictionPolicy.LRU:
				entries.sort(([, a], [, b]) => a.lastAccessTime.getTime() - b.lastAccessTime.getTime())
				break

			case CacheEvictionPolicy.LFU:
				entries.sort(([, a], [, b]) => a.accessCount - b.accessCount)
				break

			case CacheEvictionPolicy.FIFO:
				entries.sort(([, a], [, b]) => a.createdAt.getTime() - b.createdAt.getTime())
				break

			case CacheEvictionPolicy.TTL:
				entries.sort(([, a], [, b]) => {
					const aExpires = a.expiresAt?.getTime() || Infinity
					const bExpires = b.expiresAt?.getTime() || Infinity
					return aExpires - bExpires
				})
				break
		}

		// Evict entries
		for (const [key, entry] of entries) {
			if (evictedBytes >= bytesToEvict) {
				break
			}

			await this._storage.delete(key)
			this._entries.delete(key)
			evictedBytes += entry.size
			this._statistics.evictions++
		}

		this._statistics.totalSize -= evictedBytes
		this._statistics.totalEntries = this._entries.size
	}

	/**
	 * Start cleanup timer
	 */
	private startCleanupTimer(): void {
		if (this._config.cleanupInterval) {
			this._cleanupTimer = setInterval(() => {
				this.cleanup().catch((error) => {
					this.emit("error", error)
				})
			}, this._config.cleanupInterval * 1000)
		}
	}

	/**
	 * Cleanup expired entries
	 */
	private async cleanup(): Promise<void> {
		const now = new Date()
		const expiredKeys: string[] = []

		for (const [key, entry] of this._entries) {
			if (entry.expiresAt && entry.expiresAt < now) {
				expiredKeys.push(key)
			}
		}

		for (const key of expiredKeys) {
			await this._storage.delete(key)
			const entry = this._entries.get(key)
			if (entry) {
				this._statistics.totalSize -= entry.size
				this._entries.delete(key)
			}
		}

		if (expiredKeys.length > 0) {
			this._statistics.totalEntries = this._entries.size
			this.updateEntryTimestamps()

			this.emit("cache-cleanup", expiredKeys.length)
			this._eventBus.emit("cache:cleanup", { expired: expiredKeys.length })
		}
	}

	/**
	 * Warm cache with predefined data
	 */
	private async warmCache(): Promise<void> {
		// TODO: Implement cache warming based on strategy
		// This would involve pre-loading frequently accessed data
	}

	/**
	 * Load persisted entries
	 */
	private async loadPersistedEntries(): Promise<void> {
		// TODO: Implement loading from persistent storage
	}

	/**
	 * Persist entries to storage
	 */
	private async persistEntries(): Promise<void> {
		// TODO: Implement persisting to storage
	}

	/**
	 * Calculate checksum for data
	 */
	private calculateChecksum(buffer: Buffer): string {
		// Simple checksum - in production, use a proper hash function
		let checksum = 0
		for (let i = 0; i < buffer.length; i++) {
			checksum = (checksum + buffer[i]) % 65536
		}
		return checksum.toString(16)
	}

	/**
	 * Update hit rate statistics
	 */
	private updateHitRate(): void {
		const total = this._statistics.hits + this._statistics.misses
		this._statistics.hitRate = total > 0 ? (this._statistics.hits / total) * 100 : 0
	}

	/**
	 * Update average access time
	 */
	private updateAverageAccessTime(accessTime: number): void {
		const weight = 0.1
		this._statistics.averageAccessTime = (1 - weight) * this._statistics.averageAccessTime + weight * accessTime
	}

	/**
	 * Update compression ratio
	 */
	private updateCompressionRatio(): void {
		let compressedSize = 0
		let uncompressedSize = 0

		for (const entry of this._entries.values()) {
			if (entry.compressed) {
				compressedSize += entry.size
				// Estimate uncompressed size (this is approximate)
				uncompressedSize += entry.size * 2
			} else {
				uncompressedSize += entry.size
			}
		}

		this._statistics.compressionRatio = uncompressedSize > 0 ? (1 - compressedSize / uncompressedSize) * 100 : 0
	}

	/**
	 * Update entry timestamps
	 */
	private updateEntryTimestamps(): void {
		if (this._entries.size === 0) {
			this._statistics.oldestEntry = new Date()
			this._statistics.newestEntry = new Date()
			return
		}

		let oldest = new Date()
		let newest = new Date(0)

		for (const entry of this._entries.values()) {
			if (entry.createdAt < oldest) {
				oldest = entry.createdAt
			}
			if (entry.createdAt > newest) {
				newest = entry.createdAt
			}
		}

		this._statistics.oldestEntry = oldest
		this._statistics.newestEntry = newest
	}
}
