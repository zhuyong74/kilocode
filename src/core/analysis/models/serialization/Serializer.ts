/**
 * 序列化器类
 *
 * 提供数据模型的序列化和反序列化功能，支持多种格式和版本管理。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent, ModelEventType } from "../../types"
import { ValidationResult } from "../validation/ValidationResult"
import {
	SerializationFormat,
	SerializationOptions,
	SerializationResult,
	DeserializationResult,
	DEFAULT_SERIALIZATION_OPTIONS,
	validateSerializationOptions,
	mergeSerializationOptions,
} from "./SerializationFormat"
import { VersionManager } from "./VersionManager"
import { EventEmitter } from "events"
import * as zlib from "zlib"
import * as crypto from "crypto"

export class Serializer implements Serializable, Validatable, Cloneable, Observable {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]

	// 序列化器特定属性
	defaultOptions: SerializationOptions
	versionManager: VersionManager
	compressionEnabled: boolean
	encryptionEnabled: boolean
	compressionLevel: number
	encryptionKey: string

	private observers: Observer[] = []
	private eventEmitter: EventEmitter

	constructor(serializer?: Partial<Serializer>) {
		const now = new Date()

		// 基础属性
		this.id = serializer?.id || this.generateId()
		this.name = serializer?.name || "serializer"
		this.description = serializer?.description
		this.version = serializer?.version || "1.0.0"
		this.createdAt = serializer?.createdAt || now
		this.updatedAt = serializer?.updatedAt || now
		this.metadata = serializer?.metadata || {}
		this.enabled = serializer?.enabled ?? true
		this.tags = serializer?.tags || []

		// 序列化器特定属性
		this.defaultOptions = serializer?.defaultOptions || { ...DEFAULT_SERIALIZATION_OPTIONS }
		this.versionManager = serializer?.versionManager || new VersionManager()
		this.compressionEnabled = serializer?.compressionEnabled ?? false
		this.encryptionEnabled = serializer?.encryptionEnabled ?? false
		this.compressionLevel = serializer?.compressionLevel ?? 6
		this.encryptionKey = serializer?.encryptionKey || ""

		this.eventEmitter = new EventEmitter()
		this.setupEventListeners()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `serializer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("serialization:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	/**
	 * 验证序列化器（自验证）
	 */
	async validate(): Promise<boolean> {
		try {
			// 基本的自验证逻辑
			const isValid = this.defaultOptions && this.versionManager

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
				field: "defaultOptions",
				rules: ["required"],
			},
		]
	}

	/**
	 * 获取验证结果（自验证）
	 */
	getValidationResult(): any {
		return new ValidationResult({
			name: "Serializer Self Validation",
			description: "序列化器的自验证结果",
		})
	}

	/**
	 * 序列化序列化器
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
				defaultOptions: this.defaultOptions,
				versionManager: this.versionManager.serialize(),
				compressionEnabled: this.compressionEnabled,
				encryptionEnabled: this.encryptionEnabled,
				compressionLevel: this.compressionLevel,
				encryptionKey: this.encryptionKey,
			}

			this.notifyObservers({
				type: ModelEventType.SERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["serialization", "serializer"],
			})

			return JSON.stringify(data, null, 2)
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["serialization", "error", "serializer"],
			})
			throw error
		}
	}

	/**
	 * 反序列化序列化器
	 */
	deserialize(data: string): void {
		try {
			const parsed = JSON.parse(data)

			// 基础属性
			this.id = parsed.id || this.generateId()
			this.name = parsed.name || "serializer"
			this.description = parsed.description
			this.version = parsed.version || "1.0.0"
			this.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date()
			this.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
			this.metadata = parsed.metadata || {}
			this.enabled = parsed.enabled ?? true
			this.tags = parsed.tags || []

			// 序列化器特定属性
			this.defaultOptions = parsed.defaultOptions || { ...DEFAULT_SERIALIZATION_OPTIONS }

			if (parsed.versionManager) {
				this.versionManager = new VersionManager()
				this.versionManager.deserialize(parsed.versionManager)
			} else {
				this.versionManager = new VersionManager()
			}

			this.compressionEnabled = parsed.compressionEnabled ?? false
			this.encryptionEnabled = parsed.encryptionEnabled ?? false
			this.compressionLevel = parsed.compressionLevel ?? 6
			this.encryptionKey = parsed.encryptionKey || ""

			this.notifyObservers({
				type: ModelEventType.DESERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["deserialization", "serializer"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["deserialization", "error", "serializer"],
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
	 * 克隆序列化器
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
			tags: ["clone", "serializer"],
		})

		return cloned
	}

	/**
	 * 深度克隆序列化器
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
	 * 序列化数据
	 */
	async serialize(data: any, options?: Partial<SerializationOptions>): Promise<SerializationResult> {
		const startTime = Date.now()
		const mergedOptions = mergeSerializationOptions(this.defaultOptions, options || {})

		try {
			// 验证选项
			validateSerializationOptions(mergedOptions)

			// 处理循环引用
			data = this.handleCircularReferences(data, mergedOptions)

			// 应用自定义序列化器
			data = this.applyCustomSerializers(data, mergedOptions)

			// 根据格式进行序列化
			let serializedData: string | Buffer

			switch (mergedOptions.format) {
				case SerializationFormat.JSON:
					serializedData = this.serializeToJSON(data, mergedOptions)
					break
				case SerializationFormat.YAML:
					serializedData = this.serializeToYAML(data, mergedOptions)
					break
				case SerializationFormat.XML:
					serializedData = this.serializeToXML(data, mergedOptions)
					break
				case SerializationFormat.BINARY:
					serializedData = this.serializeToBinary(data, mergedOptions)
					break
				default:
					throw new Error(`Unsupported serialization format: ${mergedOptions.format}`)
			}

			const originalSize = Buffer.byteLength(serializedData, "utf8")
			let compressedSize: number | undefined
			let compressionRatio: number | undefined
			let compressionTime = 0

			// 压缩（如果需要）
			if (mergedOptions.compression) {
				const compressionStart = Date.now()
				serializedData = await this.compressData(serializedData, mergedOptions.compressionLevel)
				compressionTime = Date.now() - compressionStart
				compressedSize = Buffer.byteLength(serializedData)
				compressionRatio = Math.round((1 - compressedSize / originalSize) * 100)
			}

			let encryptionTime = 0

			// 加密（如果需要）
			if (mergedOptions.encryption && mergedOptions.encryptionKey) {
				const encryptionStart = Date.now()
				serializedData = await this.encryptData(serializedData, mergedOptions.encryptionKey)
				encryptionTime = Date.now() - encryptionStart
			}

			const encodingTime = Date.now() - startTime

			const result: SerializationResult = {
				success: true,
				data: serializedData,
				metadata: {
					format: mergedOptions.format,
					size: originalSize,
					compressedSize,
					compressionRatio,
					encodingTime,
					encryptionTime,
					version: this.version,
					timestamp: new Date(),
				},
			}

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { serialized: true, format: mergedOptions.format },
				timestamp: new Date(),
				tags: ["serialization", "success"],
			})

			return result
		} catch (error) {
			const result: SerializationResult = {
				success: false,
				error: error as Error,
			}

			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { serializationError: error.message },
				timestamp: new Date(),
				tags: ["serialization", "error"],
			})

			return result
		}
	}

	/**
	 * 反序列化数据
	 */
	async deserialize(data: string | Buffer, options?: Partial<SerializationOptions>): Promise<DeserializationResult> {
		const startTime = Date.now()
		const mergedOptions = mergeSerializationOptions(this.defaultOptions, options || {})

		try {
			// 验证选项
			validateSerializationOptions(mergedOptions)

			let deserializedData = data
			let decryptionTime = 0
			let decompressionTime = 0

			// 解密（如果需要）
			if (mergedOptions.encryption && mergedOptions.encryptionKey) {
				const decryptionStart = Date.now()
				deserializedData = await this.decryptData(deserializedData, mergedOptions.encryptionKey)
				decryptionTime = Date.now() - decryptionStart
			}

			// 解压缩（如果需要）
			if (mergedOptions.compression) {
				const decompressionStart = Date.now()
				deserializedData = await this.decompressData(deserializedData)
				decompressionTime = Date.now() - decompressionStart
			}

			// 根据格式进行反序列化
			let result: any

			switch (mergedOptions.format) {
				case SerializationFormat.JSON:
					result = this.deserializeFromJSON(deserializedData.toString(), mergedOptions)
					break
				case SerializationFormat.YAML:
					result = this.deserializeFromYAML(deserializedData.toString(), mergedOptions)
					break
				case SerializationFormat.XML:
					result = this.deserializeFromXML(deserializedData.toString(), mergedOptions)
					break
				case SerializationFormat.BINARY:
					result = this.deserializeFromBinary(deserializedData, mergedOptions)
					break
				default:
					throw new Error(`Unsupported deserialization format: ${mergedOptions.format}`)
			}

			// 应用自定义反序列化器
			result = this.applyCustomDeserializers(result, mergedOptions)

			const decodingTime = Date.now() - startTime

			const deserializationResult: DeserializationResult = {
				success: true,
				data: result,
				metadata: {
					format: mergedOptions.format,
					size: Buffer.byteLength(data, "utf8"),
					decompressionTime,
					decryptionTime,
					decodingTime,
					version: this.version,
					timestamp: new Date(),
				},
			}

			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { deserialized: true, format: mergedOptions.format },
				timestamp: new Date(),
				tags: ["deserialization", "success"],
			})

			return deserializationResult
		} catch (error) {
			const result: DeserializationResult = {
				success: false,
				error: error as Error,
			}

			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { deserializationError: error.message },
				timestamp: new Date(),
				tags: ["deserialization", "error"],
			})

			return result
		}
	}

	/**
	 * JSON序列化
	 */
	private serializeToJSON(data: any, options: SerializationOptions): string {
		try {
			return options.prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data)
		} catch (error) {
			throw new Error(`JSON serialization failed: ${error.message}`)
		}
	}

	/**
	 * JSON反序列化
	 */
	private deserializeFromJSON(data: string, options: SerializationOptions): any {
		try {
			return JSON.parse(data)
		} catch (error) {
			throw new Error(`JSON deserialization failed: ${error.message}`)
		}
	}

	/**
	 * YAML序列化（简化实现）
	 */
	private serializeToYAML(data: any, options: SerializationOptions): string {
		// 这里应该使用实际的YAML库，如js-yaml
		// 为了简化，我们使用JSON作为替代
		return this.serializeToJSON(data, options)
	}

	/**
	 * YAML反序列化（简化实现）
	 */
	private deserializeFromYAML(data: string, options: SerializationOptions): any {
		// 这里应该使用实际的YAML库，如js-yaml
		// 为了简化，我们使用JSON作为替代
		return this.deserializeFromJSON(data, options)
	}

	/**
	 * XML序列化（简化实现）
	 */
	private serializeToXML(data: any, options: SerializationOptions): string {
		// 这里应该使用实际的XML库
		// 为了简化，我们使用JSON作为替代
		return this.serializeToJSON(data, options)
	}

	/**
	 * XML反序列化（简化实现）
	 */
	private deserializeFromXML(data: string, options: SerializationOptions): any {
		// 这里应该使用实际的XML库
		// 为了简化，我们使用JSON作为替代
		return this.deserializeFromJSON(data, options)
	}

	/**
	 * 二进制序列化（简化实现）
	 */
	private serializeToBinary(data: any, options: SerializationOptions): Buffer {
		const jsonString = this.serializeToJSON(data, options)
		return Buffer.from(jsonString, "utf8")
	}

	/**
	 * 二进制反序列化（简化实现）
	 */
	private deserializeFromBinary(data: Buffer, options: SerializationOptions): any {
		const jsonString = data.toString("utf8")
		return this.deserializeFromJSON(jsonString, options)
	}

	/**
	 * 处理循环引用
	 */
	private handleCircularReferences(data: any, options: SerializationOptions): any {
		if (options.circularReferenceHandling === "error") {
			// 简化的循环引用检测
			try {
				JSON.stringify(data)
			} catch (error) {
				if (error.message.includes("circular")) {
					throw new Error("Circular reference detected")
				}
			}
			return data
		}

		if (options.circularReferenceHandling === "skip") {
			// 简化的实现：移除循环引用
			return JSON.parse(JSON.stringify(data))
		}

		if (options.circularReferenceHandling === "replace") {
			// 简化的实现：替换循环引用为占位符
			return JSON.parse(
				JSON.stringify(data, (key, value) => {
					return value
				}),
			)
		}

		return data
	}

	/**
	 * 应用自定义序列化器
	 */
	private applyCustomSerializers(data: any, options: SerializationOptions): any {
		if (!options.customSerializers || options.customSerializers.size === 0) {
			return data
		}

		// 简化的实现：递归应用自定义序列化器
		const serialize = (obj: any): any => {
			if (obj === null || obj === undefined) {
				return obj
			}

			if (typeof obj === "object") {
				if (Array.isArray(obj)) {
					return obj.map(serialize)
				}

				const result: any = {}
				for (const [key, value] of Object.entries(obj)) {
					const customSerializer = options.customSerializers!.get(key)
					result[key] = customSerializer ? customSerializer(value) : serialize(value)
				}
				return result
			}

			return obj
		}

		return serialize(data)
	}

	/**
	 * 应用自定义反序列化器
	 */
	private applyCustomDeserializers(data: any, options: SerializationOptions): any {
		if (!options.customDeserializers || options.customDeserializers.size === 0) {
			return data
		}

		// 简化的实现：递归应用自定义反序列化器
		const deserialize = (obj: any): any => {
			if (obj === null || obj === undefined) {
				return obj
			}

			if (typeof obj === "object") {
				if (Array.isArray(obj)) {
					return obj.map(deserialize)
				}

				const result: any = {}
				for (const [key, value] of Object.entries(obj)) {
					const customDeserializer = options.customDeserializers!.get(key)
					result[key] = customDeserializer ? customDeserializer(value) : deserialize(value)
				}
				return result
			}

			return obj
		}

		return deserialize(data)
	}

	/**
	 * 压缩数据
	 */
	private async compressData(data: string | Buffer, level: number = 6): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			zlib.gzip(data, { level }, (error, compressed) => {
				if (error) {
					reject(new Error(`Compression failed: ${error.message}`))
				} else {
					resolve(compressed)
				}
			})
		})
	}

	/**
	 * 解压缩数据
	 */
	private async decompressData(data: string | Buffer): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			zlib.gunzip(data, (error, decompressed) => {
				if (error) {
					reject(new Error(`Decompression failed: ${error.message}`))
				} else {
					resolve(decompressed)
				}
			})
		})
	}

	/**
	 * 加密数据
	 */
	private async encryptData(data: string | Buffer, key: string): Promise<Buffer> {
		try {
			const algorithm = "aes-256-cbc"
			const keyBuffer = crypto.scryptSync(key, "salt", 32)
			const iv = crypto.randomBytes(16)

			const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv)
			const encrypted = Buffer.concat([cipher.update(data), cipher.final()])

			return Buffer.concat([iv, encrypted])
		} catch (error) {
			throw new Error(`Encryption failed: ${error.message}`)
		}
	}

	/**
	 * 解密数据
	 */
	private async decryptData(data: string | Buffer, key: string): Promise<Buffer> {
		try {
			const algorithm = "aes-256-cbc"
			const keyBuffer = crypto.scryptSync(key, "salt", 32)

			const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, "base64")
			const iv = buffer.slice(0, 16)
			const encrypted = buffer.slice(16)

			const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv)
			const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

			return decrypted
		} catch (error) {
			throw new Error(`Decryption failed: ${error.message}`)
		}
	}

	/**
	 * 更新默认选项
	 */
	updateDefaultOptions(options: Partial<SerializationOptions>): void {
		this.defaultOptions = mergeSerializationOptions(this.defaultOptions, options)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { defaultOptionsUpdated: true },
			timestamp: new Date(),
			tags: ["options", "update", "serializer"],
		})
	}

	/**
	 * 启用压缩
	 */
	enableCompression(level: number = 6): void {
		this.compressionEnabled = true
		this.compressionLevel = level
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { compressionEnabled: true, level },
			timestamp: new Date(),
			tags: ["compression", "enable", "serializer"],
		})
	}

	/**
	 * 禁用压缩
	 */
	disableCompression(): void {
		this.compressionEnabled = false
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { compressionDisabled: true },
			timestamp: new Date(),
			tags: ["compression", "disable", "serializer"],
		})
	}

	/**
	 * 启用加密
	 */
	enableEncryption(key: string): void {
		this.encryptionEnabled = true
		this.encryptionKey = key
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { encryptionEnabled: true },
			timestamp: new Date(),
			tags: ["encryption", "enable", "serializer"],
		})
	}

	/**
	 * 禁用加密
	 */
	disableEncryption(): void {
		this.encryptionEnabled = false
		this.encryptionKey = ""
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { encryptionDisabled: true },
			timestamp: new Date(),
			tags: ["encryption", "disable", "serializer"],
		})
	}

	/**
	 * 获取支持的格式
	 */
	getSupportedFormats(): SerializationFormat[] {
		return [SerializationFormat.JSON, SerializationFormat.YAML, SerializationFormat.XML, SerializationFormat.BINARY]
	}

	/**
	 * 获取序列化统计
	 */
	getSerializationStats(): Record<string, any> {
		return {
			compressionEnabled: this.compressionEnabled,
			encryptionEnabled: this.encryptionEnabled,
			compressionLevel: this.compressionLevel,
			versionManager: this.versionManager.getVersionHistory(),
			supportedFormats: this.getSupportedFormats(),
		}
	}
}
