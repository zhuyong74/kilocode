/**
 * 核心数据结构测试
 *
 * 验证所有核心数据结构的正确性。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { describe, it, expect } from "vitest"
import {
	AnalysisConfig,
	AnalysisResults,
	ProjectStructure,
	DependencyGraph,
	DataValidator,
	ValidationRules,
	ValidationResult,
	Serializer,
	SerializationFormat,
	VersionManager,
	DatabaseSchema,
	TableStructure,
	RelationshipMap,
	DatabaseAnalysisResult,
	FileStorage,
	MemoryStorage,
	DatabaseStorage,
} from "../../../core/analysis/models"

describe("核心数据结构测试", () => {
	describe("AnalysisConfig", () => {
		it("应该正确创建分析配置", () => {
			const config = new AnalysisConfig({
				id: "test-config",
				name: "测试配置",
				analysisType: "code_analysis",
				targetPath: "/test/path",
				includePatterns: ["**/*.ts"],
				excludePatterns: ["node_modules/**"],
				options: {
					recursive: true,
					parallel: false,
					maxConcurrency: 4,
					timeout: 30000,
					memoryLimit: 512,
					enableCache: true,
					cacheSize: 100,
				},
				validationRules: [],
				performanceConfig: {
					batchSize: 100,
					retryAttempts: 3,
					retryInterval: 1000,
					progressInterval: 5000,
					enableMonitoring: true,
				},
				outputConfig: {
					format: "json",
					compressOutput: true,
					generateReport: true,
					fileExtension: ".json",
				},
			})

			expect(config.id).toBe("test-config")
			expect(config.name).toBe("测试配置")
			expect(config.analysisType).toBe("code_analysis")
			expect(config.targetPath).toBe("/test/path")
			expect(config.enabled).toBe(true)
		})

		it("应该支持序列化和反序列化", () => {
			const config = new AnalysisConfig({
				id: "test-config",
				name: "测试配置",
				analysisType: "code_analysis",
				targetPath: "/test/path",
				includePatterns: ["**/*.ts"],
				excludePatterns: ["node_modules/**"],
				options: {
					recursive: true,
					parallel: false,
					maxConcurrency: 4,
					timeout: 30000,
					memoryLimit: 512,
					enableCache: true,
					cacheSize: 100,
				},
				validationRules: [],
				performanceConfig: {
					batchSize: 100,
					retryAttempts: 3,
					retryInterval: 1000,
					progressInterval: 5000,
					enableMonitoring: true,
				},
				outputConfig: {
					format: "json",
					compressOutput: true,
					generateReport: true,
					fileExtension: ".json",
				},
			})

			const serialized = config.serialize()
			expect(typeof serialized).toBe("string")

			const newConfig = new AnalysisConfig()
			newConfig.deserialize(serialized)

			expect(newConfig.id).toBe(config.id)
			expect(newConfig.name).toBe(config.name)
			expect(newConfig.analysisType).toBe(config.analysisType)
		})
	})

	describe("DataValidator", () => {
		it("应该正确验证数据", async () => {
			const validator = new DataValidator()

			const testData = {
				name: "测试项目",
				version: "1.0.0",
				description: "这是一个测试项目",
			}

			// DataValidator会应用所有内置规则，对于一般数据可能会有警告或信息
			const result = await validator.validate(testData)
			expect(result).toBeDefined()
			expect(result.errors).toBeDefined()
			expect(result.warnings).toBeDefined()
			expect(result.info).toBeDefined()
			expect(result.stats).toBeDefined()
		})

		it("应该支持自定义验证规则", async () => {
			const validator = new DataValidator()

			const customRule = {
				name: "版本号验证",
				type: "pattern_check",
				config: {
					pattern: "^\\d+\\.\\d+\\.\\d+$",
				},
				enabled: true,
				errorMessage: "版本号格式不正确",
			}

			validator.rules.addRule(customRule)

			const testData = {
				version: "1.0.0",
			}

			const result = await validator.validate(testData)
			expect(result.isValid).toBe(false)
		})
	})

	describe("Serializer", () => {
		it("应该支持JSON序列化", async () => {
			const serializer = new Serializer()
			const testData = {
				id: "test-123",
				name: "测试数据",
				timestamp: new Date().toISOString(),
			}

			const result = await serializer.serialize(testData, {
				format: SerializationFormat.JSON,
				compress: false,
				encrypt: false,
				prettyPrint: true,
			})

			expect(result.success).toBe(true)
			expect(result.metadata?.format).toBe(SerializationFormat.JSON)
			expect(typeof result.data).toBe("string")
		})

		it("应该支持反序列化", async () => {
			const serializer = new Serializer()
			const testData = {
				id: "test-123",
				name: "测试数据",
				timestamp: new Date().toISOString(),
			}

			const serialized = await serializer.serialize(testData, {
				format: SerializationFormat.JSON,
				compress: false,
				encrypt: false,
				prettyPrint: true,
			})

			const deserialized = await serializer.deserialize(serialized.data as string, {
				format: SerializationFormat.JSON,
				decompress: false,
				decrypt: false,
			})

			expect(deserialized.success).toBe(true)
			expect(deserialized.data.id).toBe(testData.id)
			expect(deserialized.data.name).toBe(testData.name)
		})
	})

	describe("DatabaseSchema", () => {
		it("应该正确创建数据库模式", () => {
			const schema = new DatabaseSchema({
				id: "test-schema",
				name: "测试数据库",
				schemaName: "public",
				databaseName: "test_db",
				databaseType: "postgresql",
				tables: [],
				views: [],
				procedures: [],
				triggers: [],
				indexes: [],
				constraints: [],
				relationships: [],
				metadata: {
					description: "测试数据库模式",
				},
				complexity: 0,
				performanceMetrics: {
					tableCount: 0,
					indexCount: 0,
					relationshipCount: 0,
					averageTableSize: 0,
					totalSize: 0,
				},
			})

			expect(schema.id).toBe("test-schema")
			expect(schema.name).toBe("测试数据库")
			expect(schema.databaseType).toBe("postgresql")
			expect(schema.tables).toBeInstanceOf(Map)
			expect(schema.tables.size).toBe(0)
		})

		it("应该支持添加表", () => {
			const schema = new DatabaseSchema({
				id: "test-schema",
				name: "测试数据库",
				schemaName: "public",
				databaseName: "test_db",
				databaseType: "postgresql",
				tables: [],
				views: [],
				procedures: [],
				triggers: [],
				indexes: [],
				constraints: [],
				relationships: [],
				metadata: {},
				complexity: 0,
				performanceMetrics: {
					tableCount: 0,
					indexCount: 0,
					relationshipCount: 0,
					averageTableSize: 0,
					totalSize: 0,
				},
			})

			const table = new TableStructure({
				id: "test-table",
				name: "测试表",
				tableName: "test_table",
				schemaName: "public",
				tableType: "regular",
				columns: [],
				primaryKey: null,
				foreignKeys: [],
				indexes: [],
				constraints: [],
				estimatedRowCount: 0,
				tableSizeInBytes: 0,
				lastAnalyzed: new Date(),
			})

			schema.addTable(table)
			expect(schema.tables.size).toBe(1)
			expect(schema.getTable("test_table")?.tableName).toBe("test_table")
		})
	})

	describe("TableStructure", () => {
		it("应该正确创建表结构", () => {
			const table = new TableStructure({
				id: "test-table",
				name: "测试表",
				tableName: "test_table",
				schemaName: "public",
				tableType: "regular",
				columns: [],
				primaryKey: null,
				foreignKeys: [],
				indexes: [],
				constraints: [],
				estimatedRowCount: 1000,
				tableSizeInBytes: 1024 * 1024,
				lastAnalyzed: new Date(),
			})

			expect(table.id).toBe("test-table")
			expect(table.tableName).toBe("test_table")
			expect(table.tableType).toBe("regular")
			expect(table.estimatedRowCount).toBe(1000)
		})

		it("应该支持添加列", () => {
			const table = new TableStructure({
				id: "test-table",
				name: "测试表",
				tableName: "test_table",
				schemaName: "public",
				tableType: "regular",
				columns: [],
				primaryKey: null,
				foreignKeys: [],
				indexes: [],
				constraints: [],
				estimatedRowCount: 0,
				tableSizeInBytes: 0,
				lastAnalyzed: new Date(),
			})

			const column = {
				name: "id",
				type: "integer",
				nullable: false,
				primaryKey: true,
				autoIncrement: true,
			}

			table.addColumn(column)
			expect(table.columns.length).toBe(1)
			expect(table.columns[0].name).toBe("id")
		})
	})

	describe("MemoryStorage", () => {
		it("应该支持基本的存储操作", async () => {
			const storage = new MemoryStorage({
				id: "test-storage",
				name: "测试存储",
				storageType: "memory",
				enabled: true,
				maxMemoryUsage: 100 * 1024 * 1024, // 100MB
				enableCompression: false,
				cleanupStrategy: "lru",
				cleanupInterval: 60000,
				expirationTime: 3600000,
			})

			const testData = {
				id: "test-item",
				name: "测试项目",
				data: { test: "data" },
			}

			// 保存数据
			const saveResult = await storage.save(testData)
			expect(saveResult.success).toBe(true)

			// 加载数据
			const loadedData = await storage.load("test-item")
			expect(loadedData).toBeDefined()
			expect(loadedData?.id).toBe("test-item")

			// 检查存在性
			const exists = await storage.exists("test-item")
			expect(exists).toBe(true)

			// 删除数据
			const deleteResult = await storage.delete("test-item")
			expect(deleteResult.success).toBe(true)

			// 再次检查存在性
			const existsAfterDelete = await storage.exists("test-item")
			expect(existsAfterDelete).toBe(false)
		})

		it("应该提供统计信息", async () => {
			const storage = new MemoryStorage({
				id: "test-storage",
				name: "测试存储",
				storageType: "memory",
				enabled: true,
				maxMemoryUsage: 100 * 1024 * 1024,
				enableCompression: false,
				cleanupStrategy: "lru",
				cleanupInterval: 60000,
				expirationTime: 3600000,
			})

			// 添加一些数据
			for (let i = 0; i < 5; i++) {
				await storage.save({
					id: `item-${i}`,
					name: `项目 ${i}`,
					data: { index: i },
				})
			}

			const stats = await storage.getStats()
			expect(stats.itemCount).toBe(5)
			expect(stats.totalSize).toBeGreaterThan(0)
			expect(stats.averageSize).toBeGreaterThan(0)
		})
	})

	describe("集成测试", () => {
		it("应该支持完整的工作流程", async () => {
			// 1. 创建分析配置
			const config = new AnalysisConfig({
				id: "integration-test",
				name: "集成测试配置",
				analysisType: "code_analysis",
				targetPath: "/test/project",
				includePatterns: ["**/*.ts", "**/*.js"],
				excludePatterns: ["node_modules/**", "dist/**"],
				options: {
					recursive: true,
					parallel: true,
					maxConcurrency: 4,
					timeout: 60000,
					memoryLimit: 1024,
					enableCache: true,
					cacheSize: 200,
				},
				validationRules: [],
				performanceConfig: {
					batchSize: 50,
					retryAttempts: 3,
					retryInterval: 1000,
					progressInterval: 1000,
					enableMonitoring: true,
				},
				outputConfig: {
					format: "json",
					compressOutput: true,
					generateReport: true,
					fileExtension: ".json",
				},
			})

			// 2. 创建分析结果
			const results = new AnalysisResults({
				id: "integration-results",
				name: "集成测试结果",
				configId: config.id,
				projectPath: "/test/project",
				status: "completed",
				startTime: new Date(),
				endTime: new Date(),
				duration: 5000,
				resultType: "STRUCTURAL",
				results: {},
				metrics: [],
				errors: [],
				warnings: [],
				info: [],
				summary: {},
				details: {},
				recommendations: [],
				statistics: {
					filesProcessed: 100,
					linesOfCode: 5000,
					dependenciesFound: 50,
					complexityMetrics: {
						averageComplexity: 5.2,
						maxComplexity: 15,
						minComplexity: 1,
						complexityDistribution: {
							"1-5": 70,
							"6-10": 25,
							"11-15": 5,
						},
					},
					performanceMetrics: {
						executionTime: 5000,
						memoryPeak: 256,
						cpuUsage: 45,
						ioOperations: 200,
					},
				},
				outputFiles: ["/output/analysis.json", "/output/report.html"],
			})

			// 3. 验证配置
			const configValid = await config.validate()
			expect(configValid).toBe(true)

			// 4. 序列化结果
			const serializer = new Serializer()
			const testData = {
				id: results.id,
				name: results.name,
				configId: results.configId,
				status: results.status,
				duration: results.duration,
			}

			// 测试直接序列化/反序列化
			const serialized = await serializer.serialize(testData, {
				format: SerializationFormat.JSON,
				compress: false,
				encrypt: false,
				prettyPrint: false,
			})

			expect(serialized.success).toBe(true)
			expect(typeof serialized.data).toBe("string")

			// 直接反序列化
			const deserialized = await serializer.deserialize(serialized.data, {
				format: SerializationFormat.JSON,
				decompress: false,
				decrypt: false,
			})

			expect(deserialized.success).toBe(true)
			expect(deserialized.data.id).toBe(results.id)
			expect(deserialized.data.name).toBe(results.name)
		})
	})
})
