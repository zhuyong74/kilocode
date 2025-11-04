/**
 * 分析模型索引
 *
 * 导出所有分析相关的模型类。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

// 核心模型
export { AnalysisConfig } from "./core/AnalysisConfig"
export { AnalysisResults } from "./core/AnalysisResults"
export { ProjectStructure } from "./core/ProjectStructure"
export { DependencyGraph } from "./core/DependencyGraph"

// 验证模型
export { DataValidator } from "./validation/DataValidator"
export { ValidationRules } from "./validation/ValidationRules"
export { ValidationResult } from "./validation/ValidationResult"

// 序列化模型
export { Serializer } from "./serialization/Serializer"
export {
	SerializationFormat,
	SerializationOptions,
	SerializationResult,
	DeserializationResult,
	DEFAULT_SERIALIZATION_OPTIONS,
} from "./serialization/SerializationFormat"
export { VersionManager } from "./serialization/VersionManager"

// 存储模型
export {
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
} from "./storage/IStorage"
export { FileStorage } from "./storage/FileStorage"
export { MemoryStorage } from "./storage/MemoryStorage"
export { DatabaseStorage } from "./storage/DatabaseStorage"

// 数据库模型
export { DatabaseSchema } from "./database/DatabaseSchema"
export { TableStructure } from "./database/TableStructure"
export { RelationshipMap } from "./database/RelationshipMap"
export { DatabaseAnalysisResult } from "./database/DatabaseAnalysisResult"
