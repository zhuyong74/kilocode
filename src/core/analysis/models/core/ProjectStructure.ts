/**
 * 项目结构类
 *
 * 提供项目结构的管理，支持文件和目录的组织结构分析。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent, ModelEventType } from "../../types"
import { ProjectStructure as IProjectStructure, FileNode, ModuleNode, CodeOrganization } from "../../types/models"
import { DataValidator } from "../validation/DataValidator"
import { ValidationResult } from "../validation/ValidationResult"
import { EventEmitter } from "events"
import * as path from "path"

export class ProjectStructure implements IProjectStructure, Serializable, Validatable, Cloneable, Observable {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]

	// 项目结构特定属性
	rootPath: string
	files: FileNode[]
	modules: ModuleNode[]
	totalFiles: number
	totalDirectories: number
	totalSize: number
	organization: CodeOrganization
	languageDistribution: Record<string, number>
	complexity: number
	depth: number

	private observers: Observer[] = []
	private eventEmitter: EventEmitter
	private validator: DataValidator
	private fileMap: Map<string, FileNode>
	private moduleMap: Map<string, ModuleNode>

	constructor(structure?: Partial<IProjectStructure>) {
		const now = new Date()

		// 基础属性
		this.id = structure?.id || this.generateId()
		this.name = structure?.name || "project-structure"
		this.description = structure?.description
		this.version = structure?.version || "1.0.0"
		this.createdAt = structure?.createdAt || now
		this.updatedAt = structure?.updatedAt || now
		this.metadata = structure?.metadata || {}
		this.enabled = structure?.enabled ?? true
		this.tags = structure?.tags || []

		// 项目结构特定属性
		this.rootPath = structure?.rootPath || ""
		this.files = structure?.files || []
		this.modules = structure?.modules || []
		this.totalFiles = structure?.totalFiles || 0
		this.totalDirectories = structure?.totalDirectories || 0
		this.totalSize = structure?.totalSize || 0
		this.organization = structure?.organization || CodeOrganization.FLAT
		this.languageDistribution = structure?.languageDistribution || {}
		this.complexity = structure?.complexity || 0
		this.depth = structure?.depth || 0

		this.eventEmitter = new EventEmitter()
		this.validator = new DataValidator()
		this.fileMap = new Map()
		this.moduleMap = new Map()

		this.buildMaps()
		this.setupEventListeners()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `structure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 构建映射
	 */
	private buildMaps(): void {
		this.fileMap.clear()
		this.moduleMap.clear()

		this.files.forEach((file) => {
			this.fileMap.set(file.path, file)
		})

		this.modules.forEach((module) => {
			this.moduleMap.set(module.name, module)
		})
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("structure:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	/**
	 * 验证结构
	 */
	async validate(): Promise<boolean> {
		try {
			const validationResult = await this.validator.validate(this)

			this.notifyObservers({
				type: ModelEventType.VALIDATED,
				source: this.id,
				data: { validationResult },
				timestamp: new Date(),
				tags: ["validation", "structure"],
			})

			return validationResult.isValid
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["validation", "error", "structure"],
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
				field: "rootPath",
				rules: ["required", "string"],
			},
			{
				field: "files",
				rules: ["required", "array"],
			},
			{
				field: "totalFiles",
				rules: ["required", "number", "min:0"],
			},
			{
				field: "totalDirectories",
				rules: ["required", "number", "min:0"],
			},
			{
				field: "totalSize",
				rules: ["required", "number", "min:0"],
			},
			{
				field: "organization",
				rules: ["required", "enum:FLAT,HIERARCHICAL,MODULAR,HYBRID"],
			},
			{
				field: "complexity",
				rules: ["required", "number", "min:0"],
			},
			{
				field: "depth",
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
	 * 序列化结构
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
				rootPath: this.rootPath,
				files: this.files,
				modules: this.modules,
				totalFiles: this.totalFiles,
				totalDirectories: this.totalDirectories,
				totalSize: this.totalSize,
				organization: this.organization,
				languageDistribution: this.languageDistribution,
				complexity: this.complexity,
				depth: this.depth,
			}

			this.notifyObservers({
				type: ModelEventType.SERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["serialization", "structure"],
			})

			return JSON.stringify(data, null, 2)
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["serialization", "error", "structure"],
			})
			throw error
		}
	}

	/**
	 * 反序列化结构
	 */
	deserialize(data: string): void {
		try {
			const parsed = JSON.parse(data)

			// 基础属性
			this.id = parsed.id || this.generateId()
			this.name = parsed.name || "project-structure"
			this.description = parsed.description
			this.version = parsed.version || "1.0.0"
			this.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date()
			this.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
			this.metadata = parsed.metadata || {}
			this.enabled = parsed.enabled ?? true
			this.tags = parsed.tags || []

			// 项目结构特定属性
			this.rootPath = parsed.rootPath || ""
			this.files = parsed.files || []
			this.modules = parsed.modules || []
			this.totalFiles = parsed.totalFiles || 0
			this.totalDirectories = parsed.totalDirectories || 0
			this.totalSize = parsed.totalSize || 0
			this.organization = parsed.organization || CodeOrganization.FLAT
			this.languageDistribution = parsed.languageDistribution || {}
			this.complexity = parsed.complexity || 0
			this.depth = parsed.depth || 0

			this.buildMaps()

			this.notifyObservers({
				type: ModelEventType.DESERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["deserialization", "structure"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["deserialization", "error", "structure"],
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
	 * 克隆结构
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
			tags: ["clone", "structure"],
		})

		return cloned
	}

	/**
	 * 深度克隆结构
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
	 * 添加文件
	 */
	addFile(file: FileNode): void {
		this.files.push(file)
		this.fileMap.set(file.path, file)
		this.totalFiles++
		this.totalSize += file.size || 0
		this.updateLanguageDistribution(file)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { fileAdded: file.path },
			timestamp: new Date(),
			tags: ["file", "add", "structure"],
		})
	}

	/**
	 * 移除文件
	 */
	removeFile(filePath: string): boolean {
		const file = this.fileMap.get(filePath)
		if (file) {
			const index = this.files.indexOf(file)
			if (index > -1) {
				this.files.splice(index, 1)
				this.fileMap.delete(filePath)
				this.totalFiles--
				this.totalSize -= file.size || 0
				this.updatedAt = new Date()

				this.notifyObservers({
					type: ModelEventType.UPDATED,
					source: this.id,
					data: { fileRemoved: filePath },
					timestamp: new Date(),
					tags: ["file", "remove", "structure"],
				})

				return true
			}
		}
		return false
	}

	/**
	 * 获取文件
	 */
	getFile(filePath: string): FileNode | undefined {
		return this.fileMap.get(filePath)
	}

	/**
	 * 添加模块
	 */
	addModule(module: ModuleNode): void {
		this.modules.push(module)
		this.moduleMap.set(module.name, module)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { moduleAdded: module.name },
			timestamp: new Date(),
			tags: ["module", "add", "structure"],
		})
	}

	/**
	 * 移除模块
	 */
	removeModule(moduleName: string): boolean {
		const module = this.moduleMap.get(moduleName)
		if (module) {
			const index = this.modules.indexOf(module)
			if (index > -1) {
				this.modules.splice(index, 1)
				this.moduleMap.delete(moduleName)
				this.updatedAt = new Date()

				this.notifyObservers({
					type: ModelEventType.UPDATED,
					source: this.id,
					data: { moduleRemoved: moduleName },
					timestamp: new Date(),
					tags: ["module", "remove", "structure"],
				})

				return true
			}
		}
		return false
	}

	/**
	 * 获取模块
	 */
	getModule(moduleName: string): ModuleNode | undefined {
		return this.moduleMap.get(moduleName)
	}

	/**
	 * 更新语言分布
	 */
	private updateLanguageDistribution(file: FileNode): void {
		const extension = path.extname(file.path).toLowerCase()
		const language = this.getLanguageFromExtension(extension)

		if (language) {
			this.languageDistribution[language] = (this.languageDistribution[language] || 0) + 1
		}
	}

	/**
	 * 从扩展名获取语言
	 */
	private getLanguageFromExtension(extension: string): string {
		const languageMap: Record<string, string> = {
			".js": "JavaScript",
			".ts": "TypeScript",
			".jsx": "JavaScript",
			".tsx": "TypeScript",
			".py": "Python",
			".java": "Java",
			".cpp": "C++",
			".c": "C",
			".cs": "C#",
			".php": "PHP",
			".rb": "Ruby",
			".go": "Go",
			".rs": "Rust",
			".swift": "Swift",
			".kt": "Kotlin",
			".scala": "Scala",
			".html": "HTML",
			".css": "CSS",
			".scss": "SCSS",
			".sass": "SASS",
			".less": "LESS",
			".json": "JSON",
			".xml": "XML",
			".yaml": "YAML",
			".yml": "YAML",
			".md": "Markdown",
			".txt": "Text",
		}

		return languageMap[extension] || "Unknown"
	}

	/**
	 * 计算复杂度
	 */
	calculateComplexity(): number {
		let complexity = 0

		// 基于文件数量的复杂度
		complexity += this.totalFiles * 0.1

		// 基于目录深度的复杂度
		complexity += this.depth * 0.5

		// 基于模块数量的复杂度
		complexity += this.modules.length * 2

		// 基于语言多样性的复杂度
		const languageCount = Object.keys(this.languageDistribution).length
		complexity += languageCount * 0.5

		this.complexity = Math.round(complexity * 100) / 100

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { complexity: this.complexity },
			timestamp: new Date(),
			tags: ["complexity", "structure"],
		})

		return this.complexity
	}

	/**
	 * 计算深度
	 */
	calculateDepth(): number {
		let maxDepth = 0

		this.files.forEach((file) => {
			const depth = file.path.split(path.sep).length - 1
			maxDepth = Math.max(maxDepth, depth)
		})

		this.depth = maxDepth

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { depth: this.depth },
			timestamp: new Date(),
			tags: ["depth", "structure"],
		})

		return this.depth
	}

	/**
	 * 按类型获取文件
	 */
	getFilesByType(type: string): FileNode[] {
		return this.files.filter((file) => file.type === type)
	}

	/**
	 * 按扩展名获取文件
	 */
	getFilesByExtension(extension: string): FileNode[] {
		return this.files.filter((file) => path.extname(file.path).toLowerCase() === extension.toLowerCase())
	}

	/**
	 * 按语言获取文件
	 */
	getFilesByLanguage(language: string): FileNode[] {
		return this.files.filter((file) => {
			const ext = path.extname(file.path).toLowerCase()
			return this.getLanguageFromExtension(ext) === language
		})
	}

	/**
	 * 按模式搜索文件
	 */
	searchFiles(pattern: string): FileNode[] {
		const regex = new RegExp(pattern, "i")
		return this.files.filter((file) => regex.test(file.path))
	}

	/**
	 * 获取目录结构
	 */
	getDirectoryStructure(): Record<string, any> {
		const structure: Record<string, any> = {}

		this.files.forEach((file) => {
			const parts = file.path.split(path.sep)
			let current = structure

			parts.forEach((part, index) => {
				if (index === parts.length - 1) {
					// 文件
					current[part] = {
						type: "file",
						size: file.size,
						language: this.getLanguageFromExtension(path.extname(part)),
					}
				} else {
					// 目录
					if (!current[part]) {
						current[part] = {
							type: "directory",
							children: {},
						}
					}
					current = current[part].children
				}
			})
		})

		return structure
	}

	/**
	 * 获取统计信息
	 */
	getStats(): Record<string, any> {
		return {
			totalFiles: this.totalFiles,
			totalDirectories: this.totalDirectories,
			totalSize: this.totalSize,
			averageFileSize: this.totalFiles > 0 ? this.totalSize / this.totalFiles : 0,
			languageDistribution: this.languageDistribution,
			languageCount: Object.keys(this.languageDistribution).length,
			moduleCount: this.modules.length,
			complexity: this.complexity,
			depth: this.depth,
			organization: this.organization,
		}
	}

	/**
	 * 获取结构摘要
	 */
	getSummary(): Record<string, any> {
		return {
			id: this.id,
			name: this.name,
			rootPath: this.rootPath,
			totalFiles: this.totalFiles,
			totalDirectories: this.totalDirectories,
			totalSize: this.totalSize,
			complexity: this.complexity,
			depth: this.depth,
			organization: this.organization,
			languageCount: Object.keys(this.languageDistribution).length,
			moduleCount: this.modules.length,
		}
	}
}
