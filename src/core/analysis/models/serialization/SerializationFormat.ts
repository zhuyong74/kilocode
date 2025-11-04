/**
 * 序列化格式枚举和配置
 *
 * 提供序列化格式的定义和配置管理。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

export enum SerializationFormat {
	JSON = "json",
	YAML = "yaml",
	XML = "xml",
	BINARY = "binary",
	PROTOBUF = "protobuf",
	MESSAGEPACK = "msgpack",
	AVRO = "avro",
}

export interface SerializationOptions {
	format: SerializationFormat
	prettyPrint?: boolean
	compression?: boolean
	encryption?: boolean
	compressionLevel?: number
	encryptionKey?: string
	encoding?: BufferEncoding
	maxDepth?: number
	circularReferenceHandling?: "error" | "skip" | "replace"
	dateHandling?: "iso" | "timestamp" | "custom"
	bigintHandling?: "string" | "number" | "error"
	undefinedHandling?: "skip" | "null" | "error"
	functionHandling?: "skip" | "error" | "string"
	symbolHandling?: "skip" | "error" | "string"
	maxStringLength?: number
	maxArrayLength?: number
	maxObjectKeys?: number
	customSerializers?: Map<string, (value: any) => any>
	customDeserializers?: Map<string, (value: any) => any>
}

export interface SerializationResult {
	success: boolean
	data?: string | Buffer
	error?: Error
	metadata?: {
		format: SerializationFormat
		size: number
		compressedSize?: number
		compressionRatio?: number
		encodingTime: number
		encryptionTime?: number
		version: string
		timestamp: Date
	}
}

export interface DeserializationResult {
	success: boolean
	data?: any
	error?: Error
	metadata?: {
		format: SerializationFormat
		size: number
		decompressionTime?: number
		decryptionTime?: number
		decodingTime: number
		version: string
		timestamp: Date
	}
}

export const DEFAULT_SERIALIZATION_OPTIONS: SerializationOptions = {
	format: SerializationFormat.JSON,
	prettyPrint: true,
	compression: false,
	encryption: false,
	compressionLevel: 6,
	encoding: "utf8",
	maxDepth: 100,
	circularReferenceHandling: "replace",
	dateHandling: "iso",
	bigintHandling: "string",
	undefinedHandling: "skip",
	functionHandling: "skip",
	symbolHandling: "skip",
	maxStringLength: 1024 * 1024, // 1MB
	maxArrayLength: 10000,
	maxObjectKeys: 1000,
	customSerializers: new Map(),
	customDeserializers: new Map(),
}

export const SERIALIZATION_FORMAT_CONFIGS = {
	[SerializationFormat.JSON]: {
		name: "JSON",
		description: "JavaScript Object Notation",
		mimeType: "application/json",
		fileExtension: ".json",
		supportsCompression: true,
		supportsEncryption: true,
		humanReadable: true,
		schemaSupport: false,
		performance: "medium",
		sizeEfficiency: "medium",
	},
	[SerializationFormat.YAML]: {
		name: "YAML",
		description: "YAML Ain't Markup Language",
		mimeType: "application/yaml",
		fileExtension: ".yaml",
		supportsCompression: true,
		supportsEncryption: true,
		humanReadable: true,
		schemaSupport: false,
		performance: "slow",
		sizeEfficiency: "medium",
	},
	[SerializationFormat.XML]: {
		name: "XML",
		description: "Extensible Markup Language",
		mimeType: "application/xml",
		fileExtension: ".xml",
		supportsCompression: true,
		supportsEncryption: true,
		humanReadable: true,
		schemaSupport: true,
		performance: "slow",
		sizeEfficiency: "low",
	},
	[SerializationFormat.BINARY]: {
		name: "Binary",
		description: "Custom binary format",
		mimeType: "application/octet-stream",
		fileExtension: ".bin",
		supportsCompression: true,
		supportsEncryption: true,
		humanReadable: false,
		schemaSupport: false,
		performance: "fast",
		sizeEfficiency: "high",
	},
	[SerializationFormat.PROTOBUF]: {
		name: "Protocol Buffers",
		description: "Google Protocol Buffers",
		mimeType: "application/x-protobuf",
		fileExtension: ".pb",
		supportsCompression: true,
		supportsEncryption: true,
		humanReadable: false,
		schemaSupport: true,
		performance: "fast",
		sizeEfficiency: "high",
	},
	[SerializationFormat.MESSAGEPACK]: {
		name: "MessagePack",
		description: "MessagePack binary serialization",
		mimeType: "application/msgpack",
		fileExtension: ".msgpack",
		supportsCompression: true,
		supportsEncryption: true,
		humanReadable: false,
		schemaSupport: false,
		performance: "fast",
		sizeEfficiency: "high",
	},
	[SerializationFormat.AVRO]: {
		name: "Apache Avro",
		description: "Apache Avro serialization",
		mimeType: "application/avro",
		fileExtension: ".avro",
		supportsCompression: true,
		supportsEncryption: true,
		humanReadable: false,
		schemaSupport: true,
		performance: "fast",
		sizeEfficiency: "high",
	},
}

export function getSerializationFormatConfig(format: SerializationFormat) {
	return SERIALIZATION_FORMAT_CONFIGS[format]
}

export function isFormatSupported(format: SerializationFormat): boolean {
	return format in SERIALIZATION_FORMAT_CONFIGS
}

export function getSupportedFormats(): SerializationFormat[] {
	return Object.keys(SERIALIZATION_FORMAT_CONFIGS) as SerializationFormat[]
}

export function getHumanReadableFormats(): SerializationFormat[] {
	return Object.entries(SERIALIZATION_FORMAT_CONFIGS)
		.filter(([_, config]) => config.humanReadable)
		.map(([format]) => format as SerializationFormat)
}

export function getBinaryFormats(): SerializationFormat[] {
	return Object.entries(SERIALIZATION_FORMAT_CONFIGS)
		.filter(([_, config]) => !config.humanReadable)
		.map(([format]) => format as SerializationFormat)
}

export function getSchemaSupportedFormats(): SerializationFormat[] {
	return Object.entries(SERIALIZATION_FORMAT_CONFIGS)
		.filter(([_, config]) => config.schemaSupport)
		.map(([format]) => format as SerializationFormat)
}

export function validateSerializationOptions(options: SerializationOptions): boolean {
	if (!options.format || !isFormatSupported(options.format)) {
		throw new Error(`Unsupported serialization format: ${options.format}`)
	}

	if (options.compression && !getSerializationFormatConfig(options.format).supportsCompression) {
		throw new Error(`Format ${options.format} does not support compression`)
	}

	if (options.encryption && !getSerializationFormatConfig(options.format).supportsEncryption) {
		throw new Error(`Format ${options.format} does not support encryption`)
	}

	if (options.compressionLevel !== undefined && (options.compressionLevel < 0 || options.compressionLevel > 9)) {
		throw new Error("Compression level must be between 0 and 9")
	}

	if (options.maxDepth !== undefined && options.maxDepth < 1) {
		throw new Error("Max depth must be at least 1")
	}

	return true
}

export function mergeSerializationOptions(
	defaultOptions: SerializationOptions,
	customOptions: Partial<SerializationOptions>,
): SerializationOptions {
	return {
		...defaultOptions,
		...customOptions,
		customSerializers: new Map([
			...(defaultOptions.customSerializers || new Map()),
			...(customOptions.customSerializers || new Map()),
		]),
		customDeserializers: new Map([
			...(defaultOptions.customDeserializers || new Map()),
			...(customOptions.customDeserializers || new Map()),
		]),
	}
}
