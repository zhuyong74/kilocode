/**
 * Analysis Cache Type Definitions
 *
 * This module defines the core types for the analysis cache system,
 * including cache configuration, storage, and invalidation strategies.
 */

import { EventEmitter } from "events"
import { AnalysisResult } from "./engine"

/**
 * Cache storage types
 */
export enum CacheStorageType {
	/** In-memory cache */
	MEMORY = "memory",
	/** File system cache */
	FILE = "file",
	/** Database cache */
	DATABASE = "database",
	/** Redis cache */
	REDIS = "redis",
	/** Hybrid cache (memory + persistent) */
	HYBRID = "hybrid",
}

/**
 * Cache eviction policies
 */
export enum CacheEvictionPolicy {
	/** Least Recently Used */
	LRU = "lru",
	/** Least Frequently Used */
	LFU = "lfu",
	/** First In First Out */
	FIFO = "fifo",
	/** Time To Live */
	TTL = "ttl",
	/** Random eviction */
	RANDOM = "random",
	/** No eviction */
	NONE = "none",
}

/**
 * Cache compression types
 */
export enum CacheCompressionType {
	/** No compression */
	NONE = "none",
	/** GZIP compression */
	GZIP = "gzip",
	/** LZ4 compression */
	LZ4 = "lz4",
	/** Brotli compression */
	BROTLI = "brotli",
}

/**
 * Cache serialization formats
 */
export enum CacheSerializationFormat {
	/** JSON serialization */
	JSON = "json",
	/** MessagePack serialization */
	MSGPACK = "msgpack",
	/** Protocol Buffers */
	PROTOBUF = "protobuf",
	/** Binary serialization */
	BINARY = "binary",
}

/**
 * Cache configuration
 */
export interface CacheConfig {
	/** Cache storage type */
	storageType: CacheStorageType

	/** Maximum cache size in bytes */
	maxSize: number

	/** Maximum number of entries */
	maxEntries: number

	/** Default TTL in milliseconds */
	defaultTtl: number

	/** Cache eviction policy */
	evictionPolicy: CacheEvictionPolicy

	/** Enable compression */
	enableCompression: boolean

	/** Compression type */
	compressionType: CacheCompressionType

	/** Serialization format */
	serializationFormat: CacheSerializationFormat

	/** Enable cache persistence */
	enablePersistence: boolean

	/** Persistence path (for file-based cache) */
	persistencePath?: string

	/** Enable cache statistics */
	enableStatistics: boolean

	/** Enable cache warming */
	enableWarming: boolean

	/** Cache warming strategies */
	warmingStrategies?: CacheWarmingStrategy[]

	/** Custom configuration */
	custom?: Record<string, any>
}

/**
 * Cache warming strategy
 */
export interface CacheWarmingStrategy {
	/** Strategy name */
	name: string

	/** Strategy type */
	type: "preload" | "background" | "lazy"

	/** Strategy configuration */
	config: Record<string, any>

	/** Strategy priority */
	priority: number

	/** Enable strategy */
	enabled: boolean
}

/**
 * Cache entry metadata
 */
export interface CacheEntryMetadata {
	/** Entry key */
	key: string

	/** Entry creation time */
	createdAt: Date

	/** Entry last access time */
	lastAccessedAt: Date

	/** Entry last modified time */
	lastModifiedAt: Date

	/** Entry expiration time */
	expiresAt?: Date

	/** Entry TTL in milliseconds */
	ttl: number

	/** Entry size in bytes */
	size: number

	/** Entry access count */
	accessCount: number

	/** Entry hit count */
	hitCount: number

	/** Entry version */
	version: string

	/** Entry checksum */
	checksum: string

	/** Entry tags */
	tags: string[]

	/** Custom metadata */
	custom?: Record<string, any>
}

/**
 * Cache entry
 */
export interface CacheEntry<T = any> {
	/** Entry metadata */
	metadata: CacheEntryMetadata

	/** Entry data */
	data: T

	/** Entry compressed data */
	compressedData?: Buffer

	/** Entry is compressed */
	isCompressed: boolean
}

/**
 * Cache key
 */
export interface CacheKey {
	/** Analyzer ID */
	analyzerId: string

	/** Project path */
	projectPath: string

	/** Analysis parameters hash */
	parametersHash: string

	/** File modification times hash */
	filesHash?: string

	/** Dependencies hash */
	dependenciesHash?: string

	/** Custom key components */
	custom?: Record<string, string>
}

/**
 * Cache invalidation rule
 */
export interface CacheInvalidationRule {
	/** Rule name */
	name: string

	/** Rule type */
	type: "time" | "file" | "dependency" | "custom"

	/** Rule pattern */
	pattern: string | RegExp

	/** Rule configuration */
	config: Record<string, any>

	/** Rule priority */
	priority: number

	/** Enable rule */
	enabled: boolean
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
	/** Total cache hits */
	hits: number

	/** Total cache misses */
	misses: number

	/** Cache hit rate */
	hitRate: number

	/** Total entries */
	totalEntries: number

	/** Total cache size in bytes */
	totalSize: number

	/** Average entry size */
	averageEntrySize: number

	/** Memory usage in bytes */
	memoryUsage: number

	/** Disk usage in bytes */
	diskUsage: number

	/** Eviction count */
	evictions: number

	/** Expiration count */
	expirations: number

	/** Compression ratio */
	compressionRatio: number

	/** Average access time in milliseconds */
	averageAccessTime: number

	/** Statistics by analyzer */
	byAnalyzer: Map<string, AnalyzerCacheStatistics>

	/** Statistics timestamp */
	timestamp: Date
}

/**
 * Analyzer cache statistics
 */
export interface AnalyzerCacheStatistics {
	/** Analyzer ID */
	analyzerId: string

	/** Cache hits */
	hits: number

	/** Cache misses */
	misses: number

	/** Hit rate */
	hitRate: number

	/** Total entries */
	entries: number

	/** Total size in bytes */
	size: number

	/** Average entry size */
	averageEntrySize: number

	/** Last access time */
	lastAccessTime?: Date
}

/**
 * Cache events
 */
export interface CacheEvents {
	/** Cache hit occurred */
	hit: (key: string, entry: CacheEntry) => void

	/** Cache miss occurred */
	miss: (key: string) => void

	/** Entry added to cache */
	"entry-added": (key: string, entry: CacheEntry) => void

	/** Entry updated in cache */
	"entry-updated": (key: string, entry: CacheEntry, oldEntry: CacheEntry) => void

	/** Entry removed from cache */
	"entry-removed": (key: string, entry: CacheEntry, reason: "evicted" | "expired" | "invalidated") => void

	/** Cache cleared */
	cleared: (reason?: string) => void

	/** Cache size limit reached */
	"size-limit-reached": (currentSize: number, maxSize: number) => void

	/** Cache warming started */
	"warming-started": (strategy: CacheWarmingStrategy) => void

	/** Cache warming completed */
	"warming-completed": (strategy: CacheWarmingStrategy, entriesWarmed: number) => void

	/** Cache error occurred */
	error: (error: Error, operation: string) => void
}

/**
 * Analysis cache interface
 */
export interface IAnalysisCache extends EventEmitter {
	/** Cache configuration */
	readonly config: CacheConfig

	/** Cache statistics */
	readonly statistics: CacheStatistics

	/** Initialize the cache */
	initialize(config: CacheConfig): Promise<void>

	/** Get entry from cache */
	get<T = AnalysisResult>(key: string | CacheKey): Promise<T | undefined>

	/** Set entry in cache */
	set<T = AnalysisResult>(key: string | CacheKey, value: T, ttl?: number): Promise<void>

	/** Check if key exists in cache */
	has(key: string | CacheKey): Promise<boolean>

	/** Delete entry from cache */
	delete(key: string | CacheKey): Promise<boolean>

	/** Clear cache */
	clear(pattern?: string | RegExp): Promise<void>

	/** Get cache keys */
	keys(pattern?: string | RegExp): Promise<string[]>

	/** Get cache size */
	size(): Promise<number>

	/** Get cache memory usage */
	memoryUsage(): Promise<number>

	/** Invalidate cache entries */
	invalidate(rule: CacheInvalidationRule): Promise<number>

	/** Warm cache */
	warm(strategy: CacheWarmingStrategy): Promise<number>

	/** Compact cache */
	compact(): Promise<void>

	/** Export cache */
	export(path: string): Promise<void>

	/** Import cache */
	import(path: string): Promise<void>

	/** Get cache statistics */
	getStatistics(): CacheStatistics

	/** Reset statistics */
	resetStatistics(): void

	/** Dispose the cache */
	dispose(): Promise<void>
}

/**
 * Cache key generator interface
 */
export interface ICacheKeyGenerator {
	/** Generate cache key */
	generate(analyzerId: string, projectPath: string, parameters: any): Promise<string>

	/** Generate cache key from components */
	generateFromComponents(components: CacheKey): string

	/** Parse cache key */
	parse(key: string): CacheKey | undefined

	/** Validate cache key */
	validate(key: string): boolean
}

/**
 * Cache serializer interface
 */
export interface ICacheSerializer {
	/** Serialize data */
	serialize<T>(data: T): Promise<Buffer>

	/** Deserialize data */
	deserialize<T>(buffer: Buffer): Promise<T>

	/** Get serialization format */
	getFormat(): CacheSerializationFormat

	/** Estimate serialized size */
	estimateSize<T>(data: T): number
}

/**
 * Cache compressor interface
 */
export interface ICacheCompressor {
	/** Compress data */
	compress(data: Buffer): Promise<Buffer>

	/** Decompress data */
	decompress(data: Buffer): Promise<Buffer>

	/** Get compression type */
	getType(): CacheCompressionType

	/** Estimate compression ratio */
	estimateRatio(data: Buffer): number
}

/**
 * Cache storage interface
 */
export interface ICacheStorage {
	/** Initialize storage */
	initialize(config: CacheConfig): Promise<void>

	/** Get entry from storage */
	get(key: string): Promise<CacheEntry | undefined>

	/** Set entry in storage */
	set(key: string, entry: CacheEntry): Promise<void>

	/** Delete entry from storage */
	delete(key: string): Promise<boolean>

	/** Check if key exists */
	has(key: string): Promise<boolean>

	/** Get all keys */
	keys(pattern?: string | RegExp): Promise<string[]>

	/** Get storage size */
	size(): Promise<number>

	/** Clear storage */
	clear(pattern?: string | RegExp): Promise<void>

	/** Compact storage */
	compact(): Promise<void>

	/** Dispose storage */
	dispose(): Promise<void>
}
