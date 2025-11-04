/**
 * 版本管理器类
 *
 * 提供数据模型的版本化和迁移功能。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent, ModelEventType } from "../../types"
import { ValidationResult } from "../validation/ValidationResult"
import { EventEmitter } from "events"

export interface VersionInfo {
	version: string
	major: number
	minor: number
	patch: number
	preRelease?: string
	build?: string
	date: Date
	changes: string[]
	migrationScript?: string
	breakingChanges: boolean
	deprecatedFields: string[]
	newFields: string[]
}

export interface MigrationStep {
	fromVersion: string
	toVersion: string
	migrationFunction: (data: any) => any
	rollbackFunction?: (data: any) => any
	description: string
	breakingChanges: boolean
	validationRules?: any[]
}

export interface VersionCompatibility {
	compatible: boolean
	issues: string[]
	migrationRequired: boolean
	migrationSteps: MigrationStep[]
	breakingChanges: boolean
	deprecatedFields: string[]
	newFields: string[]
}

export class VersionManager implements Serializable, Validatable, Cloneable, Observable {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]

	// 版本管理器特定属性
	currentVersion: string
	versionHistory: VersionInfo[]
	migrations: Map<string, MigrationStep>
	compatibilityMatrix: Map<string, Map<string, VersionCompatibility>>
	supportedVersions: Set<string>
	deprecatedVersions: Set<string>

	private observers: Observer[] = []
	private eventEmitter: EventEmitter

	constructor(versionManager?: Partial<VersionManager>) {
		const now = new Date()

		// 基础属性
		this.id = versionManager?.id || this.generateId()
		this.name = versionManager?.name || "version-manager"
		this.description = versionManager?.description
		this.version = versionManager?.version || "1.0.0"
		this.createdAt = versionManager?.createdAt || now
		this.updatedAt = versionManager?.updatedAt || now
		this.metadata = versionManager?.metadata || {}
		this.enabled = versionManager?.enabled ?? true
		this.tags = versionManager?.tags || []

		// 版本管理器特定属性
		this.currentVersion = versionManager?.currentVersion || "1.0.0"
		this.versionHistory = versionManager?.versionHistory || []
		this.migrations = new Map()
		this.compatibilityMatrix = new Map()
		this.supportedVersions = new Set()
		this.deprecatedVersions = new Set()

		this.eventEmitter = new EventEmitter()
		this.setupEventListeners()
		this.initializeBuiltinMigrations()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `version-manager-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("version:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	/**
	 * 初始化内置迁移
	 */
	private initializeBuiltinMigrations(): void {
		// 这里可以添加内置的版本迁移逻辑
		// 例如：从1.0.0到1.1.0的迁移
	}

	/**
	 * 验证版本管理器（自验证）
	 */
	async validate(): Promise<boolean> {
		try {
			// 基本的自验证逻辑
			const isValid = this.currentVersion && this.versionHistory.length >= 0

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
				field: "currentVersion",
				rules: ["required", "string"],
			},
		]
	}

	/**
	 * 获取验证结果（自验证）
	 */
	getValidationResult(): any {
		return new ValidationResult({
			name: "VersionManager Self Validation",
			description: "版本管理器的自验证结果",
		})
	}

	/**
	 * 序列化版本管理器
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
				currentVersion: this.currentVersion,
				versionHistory: this.versionHistory,
				migrations: Array.from(this.migrations.entries()),
				supportedVersions: Array.from(this.supportedVersions),
				deprecatedVersions: Array.from(this.deprecatedVersions),
			}

			this.notifyObservers({
				type: ModelEventType.SERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["serialization", "version-manager"],
			})

			return JSON.stringify(data, null, 2)
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["serialization", "error", "version-manager"],
			})
			throw error
		}
	}

	/**
	 * 反序列化版本管理器
	 */
	deserialize(data: string): void {
		try {
			const parsed = JSON.parse(data)

			// 基础属性
			this.id = parsed.id || this.generateId()
			this.name = parsed.name || "version-manager"
			this.description = parsed.description
			this.version = parsed.version || "1.0.0"
			this.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date()
			this.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
			this.metadata = parsed.metadata || {}
			this.enabled = parsed.enabled ?? true
			this.tags = parsed.tags || []

			// 版本管理器特定属性
			this.currentVersion = parsed.currentVersion || "1.0.0"
			this.versionHistory = parsed.versionHistory || []
			this.migrations = new Map(parsed.migrations || [])
			this.supportedVersions = new Set(parsed.supportedVersions || [])
			this.deprecatedVersions = new Set(parsed.deprecatedVersions || [])

			this.notifyObservers({
				type: ModelEventType.DESERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["deserialization", "version-manager"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["deserialization", "error", "version-manager"],
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
	 * 克隆版本管理器
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
			tags: ["clone", "version-manager"],
		})

		return cloned
	}

	/**
	 * 深度克隆版本管理器
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
	 * 解析版本号
	 */
	parseVersion(version: string): VersionInfo {
		const semverRegex =
			/^(\d+)\.(\d+)\.(\d+)(?:-([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?$/
		const match = version.match(semverRegex)

		if (!match) {
			throw new Error(`Invalid version format: ${version}`)
		}

		const [, major, minor, patch, preRelease, build] = match

		return {
			version,
			major: parseInt(major, 10),
			minor: parseInt(minor, 10),
			patch: parseInt(patch, 10),
			preRelease,
			build,
			date: new Date(),
			changes: [],
			breakingChanges: false,
			deprecatedFields: [],
			newFields: [],
		}
	}

	/**
	 * 比较版本
	 */
	compareVersions(version1: string, version2: string): number {
		const v1 = this.parseVersion(version1)
		const v2 = this.parseVersion(version2)

		if (v1.major !== v2.major) {
			return v1.major - v2.major
		}

		if (v1.minor !== v2.minor) {
			return v1.minor - v2.minor
		}

		if (v1.patch !== v2.patch) {
			return v1.patch - v2.patch
		}

		// 预发布版本的处理
		if (v1.preRelease && !v2.preRelease) {
			return -1
		}

		if (!v1.preRelease && v2.preRelease) {
			return 1
		}

		if (v1.preRelease && v2.preRelease) {
			return v1.preRelease.localeCompare(v2.preRelease)
		}

		return 0
	}

	/**
	 * 检查版本兼容性
	 */
	checkCompatibility(fromVersion: string, toVersion: string): VersionCompatibility {
		const compatibility: VersionCompatibility = {
			compatible: true,
			issues: [],
			migrationRequired: false,
			migrationSteps: [],
			breakingChanges: false,
			deprecatedFields: [],
			newFields: [],
		}

		const fromInfo = this.parseVersion(fromVersion)
		const toInfo = this.parseVersion(toVersion)

		const comparison = this.compareVersions(fromVersion, toVersion)

		if (comparison === 0) {
			// 相同版本，无需迁移
			return compatibility
		}

		if (comparison > 0) {
			// 降级，通常需要特殊处理
			compatibility.issues.push(`Downgrading from ${fromVersion} to ${toVersion} may not be supported`)
			compatibility.compatible = false
			return compatibility
		}

		// 升级，检查是否有破坏性变更
		if (toInfo.major > fromInfo.major) {
			compatibility.breakingChanges = true
			compatibility.issues.push(
				`Major version upgrade from ${fromVersion} to ${toVersion} contains breaking changes`,
			)
		}

		if (toInfo.minor > fromInfo.minor) {
			compatibility.issues.push(
				`Minor version upgrade from ${fromVersion} to ${toVersion} may contain new features`,
			)
		}

		// 查找迁移步骤
		const migrationSteps = this.findMigrationPath(fromVersion, toVersion)

		if (migrationSteps.length > 0) {
			compatibility.migrationRequired = true
			compatibility.migrationSteps = migrationSteps
		}

		return compatibility
	}

	/**
	 * 查找迁移路径
	 */
	findMigrationPath(fromVersion: string, toVersion: string): MigrationStep[] {
		const steps: MigrationStep[] = []

		// 简化的实现：直接查找是否存在迁移
		const migrationKey = `${fromVersion}->${toVersion}`
		const migration = this.migrations.get(migrationKey)

		if (migration) {
			steps.push(migration)
		}

		return steps
	}

	/**
	 * 迁移数据
	 */
	async migrateData(data: any, fromVersion: string, toVersion: string): Promise<any> {
		const compatibility = this.checkCompatibility(fromVersion, toVersion)

		if (!compatibility.compatible && !compatibility.migrationRequired) {
			throw new Error(`Cannot migrate from ${fromVersion} to ${toVersion}: ${compatibility.issues.join(", ")}`)
		}

		let migratedData = { ...data }

		// 应用迁移步骤
		for (const step of compatibility.migrationSteps) {
			try {
				migratedData = await step.migrationFunction(migratedData)

				// 验证迁移结果
				if (step.validationRules) {
					// 这里可以添加验证逻辑
				}
			} catch (error) {
				throw new Error(`Migration step failed: ${step.description} - ${error.message}`)
			}
		}

		return migratedData
	}

	/**
	 * 回滚数据
	 */
	async rollbackData(data: any, fromVersion: string, toVersion: string): Promise<any> {
		const compatibility = this.checkCompatibility(toVersion, fromVersion)

		if (!compatibility.compatible) {
			throw new Error(`Cannot rollback from ${fromVersion} to ${toVersion}: ${compatibility.issues.join(", ")}`)
		}

		let rolledBackData = { ...data }

		// 反向应用迁移步骤
		const rollbackSteps = [...compatibility.migrationSteps].reverse()

		for (const step of rollbackSteps) {
			if (step.rollbackFunction) {
				try {
					rolledBackData = await step.rollbackFunction(rolledBackData)
				} catch (error) {
					throw new Error(`Rollback step failed: ${step.description} - ${error.message}`)
				}
			}
		}

		return rolledBackData
	}

	/**
	 * 添加版本信息
	 */
	addVersionInfo(versionInfo: VersionInfo): void {
		this.versionHistory.push(versionInfo)
		this.supportedVersions.add(versionInfo.version)

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { versionAdded: versionInfo.version },
			timestamp: new Date(),
			tags: ["version", "add"],
		})
	}

	/**
	 * 添加迁移步骤
	 */
	addMigrationStep(step: MigrationStep): void {
		const migrationKey = `${step.fromVersion}->${step.toVersion}`
		this.migrations.set(migrationKey, step)

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { migrationAdded: migrationKey },
			timestamp: new Date(),
			tags: ["migration", "add"],
		})
	}

	/**
	 * 弃用版本
	 */
	deprecateVersion(version: string, reason?: string): void {
		this.deprecatedVersions.add(version)

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { versionDeprecated: version, reason },
			timestamp: new Date(),
			tags: ["version", "deprecate"],
		})
	}

	/**
	 * 获取最新版本
	 */
	getLatestVersion(): string {
		if (this.versionHistory.length === 0) {
			return this.currentVersion
		}

		return this.versionHistory[this.versionHistory.length - 1].version
	}

	/**
	 * 获取支持的版本
	 */
	getSupportedVersions(): string[] {
		return Array.from(this.supportedVersions)
	}

	/**
	 * 获取弃用的版本
	 */
	getDeprecatedVersions(): string[] {
		return Array.from(this.deprecatedVersions)
	}

	/**
	 * 获取版本历史
	 */
	getVersionHistory(): VersionInfo[] {
		return [...this.versionHistory]
	}

	/**
	 * 获取版本信息
	 */
	getVersionInfo(version: string): VersionInfo | undefined {
		return this.versionHistory.find((info) => info.version === version)
	}

	/**
	 * 生成版本报告
	 */
	generateVersionReport(): Record<string, any> {
		return {
			currentVersion: this.currentVersion,
			latestVersion: this.getLatestVersion(),
			supportedVersions: this.getSupportedVersions(),
			deprecatedVersions: this.getDeprecatedVersions(),
			versionHistory: this.versionHistory,
			migrationCount: this.migrations.size,
			compatibilityIssues: this.analyzeCompatibilityIssues(),
		}
	}

	/**
	 * 分析兼容性问题
	 */
	private analyzeCompatibilityIssues(): Record<string, any> {
		const issues: Record<string, any> = {}

		this.supportedVersions.forEach((version) => {
			const compatibility = this.checkCompatibility(version, this.currentVersion)
			if (!compatibility.compatible || compatibility.breakingChanges) {
				issues[version] = compatibility
			}
		})

		return issues
	}
}
