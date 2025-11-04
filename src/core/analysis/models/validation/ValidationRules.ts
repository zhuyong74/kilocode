/**
 * 验证规则类
 *
 * 提供数据验证规则的定义和管理。
 *
 * @version 1.0.0
 * @author Kilocode Team
 */

import { BaseModel, Serializable, Validatable, Cloneable, Observable, ModelEvent, ModelEventType } from "../../types"
import {
	ValidationRule,
	ValidationContext,
	ValidationOptions,
	ValidationRuleGroup,
	ValidationRuleSet,
	BuiltinValidationRuleType,
} from "../../types/validation"
import { ValidationResult } from "./ValidationResult"
import { EventEmitter } from "events"

export class ValidationRules implements Serializable, Validatable, Cloneable, Observable {
	id: string
	name: string
	description?: string
	version: string
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
	enabled: boolean
	tags?: string[]

	// 验证规则特定属性
	rules: Map<string, ValidationRule>
	ruleGroups: Map<string, ValidationRuleGroup>
	ruleSets: Map<string, ValidationRuleSet>
	builtinRules: Map<BuiltinValidationRuleType, ValidationRule>
	customRules: Map<string, ValidationRule>

	private observers: Observer[] = []
	private eventEmitter: EventEmitter

	constructor(rules?: Partial<ValidationRules>) {
		const now = new Date()

		// 基础属性
		this.id = rules?.id || this.generateId()
		this.name = rules?.name || "validation-rules"
		this.description = rules?.description
		this.version = rules?.version || "1.0.0"
		this.createdAt = rules?.createdAt || now
		this.updatedAt = rules?.updatedAt || now
		this.metadata = rules?.metadata || {}
		this.enabled = rules?.enabled ?? true
		this.tags = rules?.tags || []

		// 验证规则特定属性
		this.rules = new Map()
		this.ruleGroups = new Map()
		this.ruleSets = new Map()
		this.builtinRules = new Map()
		this.customRules = new Map()

		this.eventEmitter = new EventEmitter()
		this.setupEventListeners()
		this.initializeBuiltinRules()
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `validation-rules-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		this.eventEmitter.on("rules:changed", (event: ModelEvent) => {
			this.notifyObservers(event)
		})
	}

	/**
	 * 初始化内置规则
	 */
	private initializeBuiltinRules(): void {
		// 基本类型验证规则
		this.addBuiltinRule("required", {
			name: "required",
			description: "字段必填",
			type: "validation",
			category: "basic",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const isValid = value !== undefined && value !== null && value !== ""
				return {
					isValid,
					message: isValid ? "" : "此字段为必填项",
					details: { field: context.field, value },
				}
			},
		})

		this.addBuiltinRule("string", {
			name: "string",
			description: "字符串类型验证",
			type: "validation",
			category: "basic",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const isValid = typeof value === "string"
				return {
					isValid,
					message: isValid ? "" : "此字段必须是字符串类型",
					details: { field: context.field, value, type: typeof value },
				}
			},
		})

		this.addBuiltinRule("number", {
			name: "number",
			description: "数字类型验证",
			type: "validation",
			category: "basic",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const isValid = typeof value === "number" && !isNaN(value)
				return {
					isValid,
					message: isValid ? "" : "此字段必须是数字类型",
					details: { field: context.field, value, type: typeof value },
				}
			},
		})

		this.addBuiltinRule("boolean", {
			name: "boolean",
			description: "布尔类型验证",
			type: "validation",
			category: "basic",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const isValid = typeof value === "boolean"
				return {
					isValid,
					message: isValid ? "" : "此字段必须是布尔类型",
					details: { field: context.field, value, type: typeof value },
				}
			},
		})

		this.addBuiltinRule("array", {
			name: "array",
			description: "数组类型验证",
			type: "validation",
			category: "basic",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const isValid = Array.isArray(value)
				return {
					isValid,
					message: isValid ? "" : "此字段必须是数组类型",
					details: { field: context.field, value, isArray: Array.isArray(value) },
				}
			},
		})

		this.addBuiltinRule("object", {
			name: "object",
			description: "对象类型验证",
			type: "validation",
			category: "basic",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const isValid = typeof value === "object" && value !== null && !Array.isArray(value)
				return {
					isValid,
					message: isValid ? "" : "此字段必须是对象类型",
					details: { field: context.field, value, type: typeof value },
				}
			},
		})

		// 字符串长度验证规则
		this.addBuiltinRule("minLength", {
			name: "minLength",
			description: "最小长度验证",
			type: "validation",
			category: "string",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const minLength = context.options?.minLength
				if (typeof value !== "string" || minLength === undefined) {
					return { isValid: true, message: "" }
				}

				const isValid = value.length >= minLength
				return {
					isValid,
					message: isValid ? "" : `字符串长度不能少于 ${minLength} 个字符`,
					details: { field: context.field, value, length: value.length, minLength },
				}
			},
		})

		this.addBuiltinRule("maxLength", {
			name: "maxLength",
			description: "最大长度验证",
			type: "validation",
			category: "string",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const maxLength = context.options?.maxLength
				if (typeof value !== "string" || maxLength === undefined) {
					return { isValid: true, message: "" }
				}

				const isValid = value.length <= maxLength
				return {
					isValid,
					message: isValid ? "" : `字符串长度不能超过 ${maxLength} 个字符`,
					details: { field: context.field, value, length: value.length, maxLength },
				}
			},
		})

		// 数值范围验证规则
		this.addBuiltinRule("min", {
			name: "min",
			description: "最小值验证",
			type: "validation",
			category: "number",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const min = context.options?.min
				if (typeof value !== "number" || min === undefined) {
					return { isValid: true, message: "" }
				}

				const isValid = value >= min
				return {
					isValid,
					message: isValid ? "" : `数值不能小于 ${min}`,
					details: { field: context.field, value, min },
				}
			},
		})

		this.addBuiltinRule("max", {
			name: "max",
			description: "最大值验证",
			type: "validation",
			category: "number",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const max = context.options?.max
				if (typeof value !== "number" || max === undefined) {
					return { isValid: true, message: "" }
				}

				const isValid = value <= max
				return {
					isValid,
					message: isValid ? "" : `数值不能大于 ${max}`,
					details: { field: context.field, value, max },
				}
			},
		})

		// 格式验证规则
		this.addBuiltinRule("email", {
			name: "email",
			description: "邮箱格式验证",
			type: "validation",
			category: "format",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				if (typeof value !== "string") {
					return { isValid: true, message: "" }
				}

				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
				const isValid = emailRegex.test(value)
				return {
					isValid,
					message: isValid ? "" : "邮箱格式不正确",
					details: { field: context.field, value },
				}
			},
		})

		this.addBuiltinRule("url", {
			name: "url",
			description: "URL格式验证",
			type: "validation",
			category: "format",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				if (typeof value !== "string") {
					return { isValid: true, message: "" }
				}

				try {
					new URL(value)
					return { isValid: true, message: "" }
				} catch {
					return {
						isValid: false,
						message: "URL格式不正确",
						details: { field: context.field, value },
					}
				}
			},
		})

		// 数组验证规则
		this.addBuiltinRule("minItems", {
			name: "minItems",
			description: "最小项目数验证",
			type: "validation",
			category: "array",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const minItems = context.options?.minItems
				if (!Array.isArray(value) || minItems === undefined) {
					return { isValid: true, message: "" }
				}

				const isValid = value.length >= minItems
				return {
					isValid,
					message: isValid ? "" : `数组项目数不能少于 ${minItems} 个`,
					details: { field: context.field, value, length: value.length, minItems },
				}
			},
		})

		this.addBuiltinRule("maxItems", {
			name: "maxItems",
			description: "最大项目数验证",
			type: "validation",
			category: "array",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const maxItems = context.options?.maxItems
				if (!Array.isArray(value) || maxItems === undefined) {
					return { isValid: true, message: "" }
				}

				const isValid = value.length <= maxItems
				return {
					isValid,
					message: isValid ? "" : `数组项目数不能超过 ${maxItems} 个`,
					details: { field: context.field, value, length: value.length, maxItems },
				}
			},
		})

		// 自定义业务规则
		this.addBuiltinRule("unique", {
			name: "unique",
			description: "唯一性验证",
			type: "validation",
			category: "business",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const values = context.options?.values
				if (!Array.isArray(values)) {
					return { isValid: true, message: "" }
				}

				const isValid = !values.includes(value)
				return {
					isValid,
					message: isValid ? "" : "此值已存在，必须唯一",
					details: { field: context.field, value, values },
				}
			},
		})

		this.addBuiltinRule("pattern", {
			name: "pattern",
			description: "正则表达式模式验证",
			type: "validation",
			category: "format",
			severity: "error",
			enabled: true,
			validator: (value: any, context: ValidationContext) => {
				const pattern = context.options?.pattern
				if (typeof value !== "string" || !pattern) {
					return { isValid: true, message: "" }
				}

				const regex = new RegExp(pattern)
				const isValid = regex.test(value)
				return {
					isValid,
					message: isValid ? "" : "格式不符合要求",
					details: { field: context.field, value, pattern },
				}
			},
		})
	}

	/**
	 * 添加内置规则
	 */
	private addBuiltinRule(type: BuiltinValidationRuleType, rule: ValidationRule): void {
		this.builtinRules.set(type, rule)
		this.rules.set(rule.name, rule)
	}

	/**
	 * 验证规则（自验证）
	 */
	async validate(): Promise<boolean> {
		try {
			// 基本的自验证逻辑
			const isValid = this.rules.size > 0

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
				field: "rules",
				rules: ["required", "object"],
			},
			{
				field: "ruleGroups",
				rules: ["required", "object"],
			},
			{
				field: "ruleSets",
				rules: ["required", "object"],
			},
		]
	}

	/**
	 * 获取验证结果（自验证）
	 */
	getValidationResult(): any {
		return new ValidationResult({
			name: "ValidationRules Self Validation",
			description: "验证规则的自验证结果",
		})
	}

	/**
	 * 序列化规则
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
				rules: Array.from(this.rules.values()),
				ruleGroups: Array.from(this.ruleGroups.values()),
				ruleSets: Array.from(this.ruleSets.values()),
				builtinRules: Array.from(this.builtinRules.values()),
				customRules: Array.from(this.customRules.values()),
			}

			this.notifyObservers({
				type: ModelEventType.SERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["serialization", "validation"],
			})

			return JSON.stringify(data, null, 2)
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["serialization", "error", "validation"],
			})
			throw error
		}
	}

	/**
	 * 反序列化规则
	 */
	deserialize(data: string): void {
		try {
			const parsed = JSON.parse(data)

			// 基础属性
			this.id = parsed.id || this.generateId()
			this.name = parsed.name || "validation-rules"
			this.description = parsed.description
			this.version = parsed.version || "1.0.0"
			this.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date()
			this.updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
			this.metadata = parsed.metadata || {}
			this.enabled = parsed.enabled ?? true
			this.tags = parsed.tags || []

			// 验证规则特定属性
			this.rules = new Map()
			this.ruleGroups = new Map()
			this.ruleSets = new Map()
			this.builtinRules = new Map()
			this.customRules = new Map()

			// 重新填充规则
			if (parsed.rules) {
				parsed.rules.forEach((rule: ValidationRule) => {
					this.rules.set(rule.name, rule)
				})
			}

			if (parsed.ruleGroups) {
				parsed.ruleGroups.forEach((group: ValidationRuleGroup) => {
					this.ruleGroups.set(group.name, group)
				})
			}

			if (parsed.ruleSets) {
				parsed.ruleSets.forEach((set: ValidationRuleSet) => {
					this.ruleSets.set(set.name, set)
				})
			}

			if (parsed.builtinRules) {
				parsed.builtinRules.forEach((rule: ValidationRule) => {
					this.builtinRules.set(rule.name as BuiltinValidationRuleType, rule)
				})
			}

			if (parsed.customRules) {
				parsed.customRules.forEach((rule: ValidationRule) => {
					this.customRules.set(rule.name, rule)
				})
			}

			this.notifyObservers({
				type: ModelEventType.DESERIALIZED,
				source: this.id,
				data: { format: "json" },
				timestamp: new Date(),
				tags: ["deserialization", "validation"],
			})
		} catch (error) {
			this.notifyObservers({
				type: ModelEventType.ERROR,
				source: this.id,
				data: { error: error.message },
				timestamp: new Date(),
				tags: ["deserialization", "error", "validation"],
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
	 * 克隆规则
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
			tags: ["clone", "validation"],
		})

		return cloned
	}

	/**
	 * 深度克隆规则
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
	 * 添加规则
	 */
	addRule(rule: ValidationRule): void {
		this.rules.set(rule.name, rule)
		this.customRules.set(rule.name, rule)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { ruleAdded: rule.name },
			timestamp: new Date(),
			tags: ["rule", "add", "validation"],
		})
	}

	/**
	 * 移除规则
	 */
	removeRule(name: string): boolean {
		const removed = this.rules.delete(name)
		this.customRules.delete(name)
		this.updatedAt = new Date()

		if (removed) {
			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { ruleRemoved: name },
				timestamp: new Date(),
				tags: ["rule", "remove", "validation"],
			})
		}

		return removed
	}

	/**
	 * 获取规则
	 */
	getRule(name: string): ValidationRule | undefined {
		return this.rules.get(name)
	}

	/**
	 * 获取所有规则
	 */
	getAllRules(): ValidationRule[] {
		return Array.from(this.rules.values())
	}

	/**
	 * 按类型获取规则
	 */
	getRulesByType(type: string): ValidationRule[] {
		return this.getAllRules().filter((rule) => rule.type === type)
	}

	/**
	 * 按类别获取规则
	 */
	getRulesByCategory(category: string): ValidationRule[] {
		return this.getAllRules().filter((rule) => rule.category === category)
	}

	/**
	 * 按严重性获取规则
	 */
	getRulesBySeverity(severity: string): ValidationRule[] {
		return this.getAllRules().filter((rule) => rule.severity === severity)
	}

	/**
	 * 添加规则组
	 */
	addRuleGroup(group: ValidationRuleGroup): void {
		this.ruleGroups.set(group.name, group)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { groupAdded: group.name },
			timestamp: new Date(),
			tags: ["group", "add", "validation"],
		})
	}

	/**
	 * 移除规则组
	 */
	removeRuleGroup(name: string): boolean {
		const removed = this.ruleGroups.delete(name)
		this.updatedAt = new Date()

		if (removed) {
			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { groupRemoved: name },
				timestamp: new Date(),
				tags: ["group", "remove", "validation"],
			})
		}

		return removed
	}

	/**
	 * 获取规则组
	 */
	getRuleGroup(name: string): ValidationRuleGroup | undefined {
		return this.ruleGroups.get(name)
	}

	/**
	 * 获取所有规则组
	 */
	getAllRuleGroups(): ValidationRuleGroup[] {
		return Array.from(this.ruleGroups.values())
	}

	/**
	 * 添加规则集
	 */
	addRuleSet(set: ValidationRuleSet): void {
		this.ruleSets.set(set.name, set)
		this.updatedAt = new Date()

		this.notifyObservers({
			type: ModelEventType.UPDATED,
			source: this.id,
			data: { setAdded: set.name },
			timestamp: new Date(),
			tags: ["set", "add", "validation"],
		})
	}

	/**
	 * 移除规则集
	 */
	removeRuleSet(name: string): boolean {
		const removed = this.ruleSets.delete(name)
		this.updatedAt = new Date()

		if (removed) {
			this.notifyObservers({
				type: ModelEventType.UPDATED,
				source: this.id,
				data: { setRemoved: name },
				timestamp: new Date(),
				tags: ["set", "remove", "validation"],
			})
		}

		return removed
	}

	/**
	 * 获取规则集
	 */
	getRuleSet(name: string): ValidationRuleSet | undefined {
		return this.ruleSets.get(name)
	}

	/**
	 * 获取所有规则集
	 */
	getAllRuleSets(): ValidationRuleSet[] {
		return Array.from(this.ruleSets.values())
	}

	/**
	 * 验证数据
	 */
	async validateData(data: any, context?: ValidationContext): Promise<ValidationResult> {
		const result = new ValidationResult({
			name: "Data Validation Result",
			description: "数据验证结果",
		})

		const validationContext: ValidationContext = {
			field: context?.field || "root",
			data,
			options: context?.options || {},
			metadata: context?.metadata || {},
		}

		// 执行规则验证
		for (const rule of this.getAllRules()) {
			if (!rule.enabled) continue

			try {
				const validationResult = await rule.validator(data, validationContext)

				if (!validationResult.isValid) {
					const error = result.createError(
						rule.name,
						validationResult.message,
						validationContext.field,
						validationResult.details,
					)
					result.addError(error)
				}
			} catch (error) {
				const validationError = result.createError(
					"validation_error",
					`规则 ${rule.name} 执行失败: ${error.message}`,
					validationContext.field,
					{ rule: rule.name, error: error.message },
				)
				result.addError(validationError)
			}
		}

		return result
	}

	/**
	 * 验证字段
	 */
	async validateField(
		field: string,
		value: any,
		ruleNames: string[],
		context?: ValidationContext,
	): Promise<ValidationResult> {
		const result = new ValidationResult({
			name: "Field Validation Result",
			description: `字段 ${field} 的验证结果`,
		})

		const validationContext: ValidationContext = {
			field,
			data: value,
			options: context?.options || {},
			metadata: context?.metadata || {},
		}

		// 执行指定规则的验证
		for (const ruleName of ruleNames) {
			const rule = this.getRule(ruleName)
			if (!rule || !rule.enabled) continue

			try {
				const validationResult = await rule.validator(value, validationContext)

				if (!validationResult.isValid) {
					const error = result.createError(
						rule.name,
						validationResult.message,
						field,
						validationResult.details,
					)
					result.addError(error)
				}
			} catch (error) {
				const validationError = result.createError(
					"validation_error",
					`规则 ${rule.name} 执行失败: ${error.message}`,
					field,
					{ rule: rule.name, error: error.message },
				)
				result.addError(validationError)
			}
		}

		return result
	}

	/**
	 * 执行规则集
	 */
	async executeRuleSet(setName: string, data: any, context?: ValidationContext): Promise<ValidationResult> {
		const ruleSet = this.getRuleSet(setName)
		if (!ruleSet) {
			throw new Error(`规则集 ${setName} 不存在`)
		}

		const result = new ValidationResult({
			name: `Rule Set ${setName} Result`,
			description: `规则集 ${setName} 的验证结果`,
		})

		// 执行规则集中的所有规则
		for (const ruleName of ruleSet.rules) {
			const rule = this.getRule(ruleName)
			if (!rule || !rule.enabled) continue

			try {
				const validationResult = await rule.validator(data, context || {})

				if (!validationResult.isValid) {
					const error = result.createError(
						rule.name,
						validationResult.message,
						context?.field || "root",
						validationResult.details,
					)
					result.addError(error)
				}
			} catch (error) {
				const validationError = result.createError(
					"validation_error",
					`规则 ${rule.name} 执行失败: ${error.message}`,
					context?.field || "root",
					{ rule: rule.name, error: error.message },
				)
				result.addError(validationError)
			}
		}

		return result
	}

	/**
	 * 创建规则组
	 */
	createRuleGroup(name: string, description: string, rules: string[]): ValidationRuleGroup {
		return {
			name,
			description,
			rules,
			enabled: true,
			metadata: {},
		}
	}

	/**
	 * 创建规则集
	 */
	createRuleSet(name: string, description: string, rules: string[]): ValidationRuleSet {
		return {
			name,
			description,
			rules,
			enabled: true,
			metadata: {},
		}
	}

	/**
	 * 获取规则统计
	 */
	getRuleStats(): Record<string, number> {
		const stats: Record<string, number> = {
			total: this.rules.size,
			builtin: this.builtinRules.size,
			custom: this.customRules.size,
			enabled: 0,
			disabled: 0,
			groups: this.ruleGroups.size,
			sets: this.ruleSets.size,
		}

		this.getAllRules().forEach((rule) => {
			if (rule.enabled) {
				stats.enabled++
			} else {
				stats.disabled++
			}
		})

		return stats
	}

	/**
	 * 获取规则分类统计
	 */
	getRuleCategoryStats(): Record<string, number> {
		const stats: Record<string, number> = {}

		this.getAllRules().forEach((rule) => {
			const category = rule.category || "unknown"
			stats[category] = (stats[category] || 0) + 1
		})

		return stats
	}

	/**
	 * 启用规则
	 */
	enableRule(name: string): boolean {
		const rule = this.getRule(name)
		if (rule) {
			rule.enabled = true
			this.updatedAt = new Date()
			return true
		}
		return false
	}

	/**
	 * 禁用规则
	 */
	disableRule(name: string): boolean {
		const rule = this.getRule(name)
		if (rule) {
			rule.enabled = false
			this.updatedAt = new Date()
			return true
		}
		return false
	}

	/**
	 * 启用所有规则
	 */
	enableAllRules(): void {
		this.getAllRules().forEach((rule) => {
			rule.enabled = true
		})
		this.updatedAt = new Date()
	}

	/**
	 * 禁用所有规则
	 */
	disableAllRules(): void {
		this.getAllRules().forEach((rule) => {
			rule.enabled = false
		})
		this.updatedAt = new Date()
	}
}
