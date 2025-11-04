/**
 * 存储模块导出
 *
 * 该模块提供了完整的数据存储抽象层和实现，
 * 支持文件系统、数据库、内存等多种存储方式。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

// 存储接口和基类
export {
	IStorage,
	IStorageFactory,
	IStorageManager,
	IStorageAdapter,
	IStorageMiddleware,
	IStoragePlugin,
	BaseStorage,
	StorageOptions,
	QueryOptions,
	BatchOperation,
} from "./IStorage"

// 文件存储实现
export { FileStorage, FileStorageConfig } from "./FileStorage"

// 数据库存储实现
export {
	DatabaseStorage,
	DatabaseStorageConfig,
	DatabaseType,
	ConnectionConfig,
	SQLiteConfig,
	MySQLConfig,
	PostgreSQLConfig,
	MongoDBConfig,
	RedisConfig,
} from "./DatabaseStorage"

// 内存存储实现
export { MemoryStorage, MemoryStorageConfig } from "./MemoryStorage"

// 存储工厂
export class StorageFactory implements IStorageFactory {
	private static _instance: StorageFactory
	private _storageTypes: Map<string, new (config: any) => IStorage>

	private constructor() {
		this._storageTypes = new Map()
		this.registerDefaultStorageTypes()
	}

	/**
	 * 获取单例实例
	 */
	public static getInstance(): StorageFactory {
		if (!StorageFactory._instance) {
			StorageFactory._instance = new StorageFactory()
		}
		return StorageFactory._instance
	}

	/**
	 * 注册默认存储类型
	 */
	private registerDefaultStorageTypes(): void {
		this._storageTypes.set("file", FileStorage as any)
		this._storageTypes.set("database", DatabaseStorage as any)
		this._storageTypes.set("memory", MemoryStorage as any)
	}

	/**
	 * 创建存储实例
	 */
	public createStorage(type: string, config: any): IStorage {
		const StorageClass = this._storageTypes.get(type)

		if (!StorageClass) {
			throw new Error(`Unknown storage type: ${type}`)
		}

		return new StorageClass(config)
	}

	/**
	 * 注册存储类型
	 */
	public registerStorageType(type: string, storageClass: new (config: any) => IStorage): void {
		this._storageTypes.set(type, storageClass)
	}

	/**
	 * 获取支持的存储类型
	 */
	public getSupportedTypes(): string[] {
		return Array.from(this._storageTypes.keys())
	}
}

// 存储管理器
export class StorageManager implements IStorageManager {
	private _storages: Map<string, IStorage>
	private _factory: IStorageFactory

	constructor(factory?: IStorageFactory) {
		this._storages = new Map()
		this._factory = factory || StorageFactory.getInstance()
	}

	/**
	 * 添加存储实例
	 */
	public addStorage(name: string, storage: IStorage): void {
		this._storages.set(name, storage)
	}

	/**
	 * 创建并添加存储实例
	 */
	public createStorage(name: string, type: string, config: any): IStorage {
		const storage = this._factory.createStorage(type, config)
		this._storages.set(name, storage)
		return storage
	}

	/**
	 * 获取存储实例
	 */
	public getStorage(name: string): IStorage | undefined {
		return this._storages.get(name)
	}

	/**
	 * 移除存储实例
	 */
	public async removeStorage(name: string): Promise<boolean> {
		const storage = this._storages.get(name)

		if (storage) {
			try {
				await storage.disconnect()
				await storage.destroy()
				this._storages.delete(name)
				return true
			} catch (error) {
				console.error(`Failed to remove storage '${name}':`, error)
				return false
			}
		}

		return false
	}

	/**
	 * 获取所有存储名称
	 */
	public getStorageNames(): string[] {
		return Array.from(this._storages.keys())
	}

	/**
	 * 初始化所有存储
	 */
	public async initializeAll(): Promise<void> {
		const promises = Array.from(this._storages.values()).map((storage) => storage.initialize())
		await Promise.all(promises)
	}

	/**
	 * 连接所有存储
	 */
	public async connectAll(): Promise<void> {
		const promises = Array.from(this._storages.values()).map((storage) => storage.connect())
		await Promise.all(promises)
	}

	/**
	 * 断开所有存储连接
	 */
	public async disconnectAll(): Promise<void> {
		const promises = Array.from(this._storages.values()).map((storage) => storage.disconnect())
		await Promise.all(promises)
	}

	/**
	 * 销毁所有存储
	 */
	public async destroyAll(): Promise<void> {
		const promises = Array.from(this._storages.values()).map((storage) => storage.destroy())
		await Promise.all(promises)
		this._storages.clear()
	}

	/**
	 * 健康检查所有存储
	 */
	public async healthCheckAll(): Promise<Record<string, any>> {
		const results: Record<string, any> = {}

		for (const [name, storage] of this._storages.entries()) {
			try {
				results[name] = await storage.healthCheck()
			} catch (error) {
				results[name] = {
					isHealthy: false,
					error: error instanceof Error ? error.message : "Unknown error",
				}
			}
		}

		return results
	}
}

// 默认导出
export default {
	StorageFactory,
	StorageManager,
	FileStorage,
	DatabaseStorage,
	MemoryStorage,
}
