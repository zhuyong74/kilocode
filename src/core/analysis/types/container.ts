/**
 * Dependency Injection Container Type Definitions
 *
 * Defines all types and interfaces for the dependency injection system
 * used in the Kilocode Analysis Engine.
 *
 * @author Kilocode Analysis Team
 * @version 1.0.0
 */

/**
 * Service lifecycle management types
 */
export enum ServiceLifetime {
	/** New instance created every time */
	TRANSIENT = "transient",

	/** Single instance per container */
	SINGLETON = "singleton",

	/** Single instance per scope */
	SCOPED = "scoped",
}

/**
 * Service registration token type
 */
export type ServiceToken<T = any> = string | symbol | (new (...args: any[]) => T)

/**
 * Service factory function type
 */
export type ServiceFactory<T = any> = (container: IDIContainer) => T | Promise<T>

/**
 * Service constructor type
 */
export type ServiceConstructor<T = any> = new (...args: any[]) => T

/**
 * Service registration options
 */
export interface ServiceRegistration<T = any> {
	/** Service token/identifier */
	token: ServiceToken<T>

	/** Service lifetime */
	lifetime: ServiceLifetime

	/** Service factory function */
	factory?: ServiceFactory<T>

	/** Service constructor */
	constructor?: ServiceConstructor<T>

	/** Service instance (for singleton pre-registration) */
	instance?: T

	/** Service dependencies */
	dependencies?: ServiceToken[]

	/** Registration metadata */
	metadata?: Record<string, any>

	/** When this registration was created */
	createdAt: Date
}

/**
 * Service resolution context
 */
export interface ResolutionContext {
	/** Current resolution chain to detect circular dependencies */
	resolutionChain: ServiceToken[]

	/** Current scope identifier */
	scopeId?: string

	/** Resolution metadata */
	metadata?: Record<string, any>
}

/**
 * Container configuration
 */
export interface DIContainerConfig {
	/** Whether to enable automatic constructor injection */
	autoInject?: boolean

	/** Whether to throw on circular dependencies */
	throwOnCircularDependency?: boolean

	/** Maximum resolution depth */
	maxResolutionDepth?: number

	/** Whether to enable debug logging */
	debug?: boolean

	/** Default service lifetime */
	defaultLifetime?: ServiceLifetime
}

/**
 * Service scope interface
 */
export interface IServiceScope {
	/** Scope identifier */
	id: string

	/** Parent scope */
	parent?: IServiceScope

	/** Scoped service instances */
	instances: Map<ServiceToken, any>

	/** When this scope was created */
	createdAt: Date

	/** Dispose of the scope and all scoped services */
	dispose(): void
}

/**
 * Main Dependency Injection Container interface
 */
export interface IDIContainer {
	/**
	 * Register a service with the container
	 */
	register<T>(token: ServiceToken<T>, factory: ServiceFactory<T>, lifetime?: ServiceLifetime): void

	/**
	 * Register a service constructor with the container
	 */
	registerConstructor<T>(token: ServiceToken<T>, constructor: ServiceConstructor<T>, lifetime?: ServiceLifetime): void

	/**
	 * Register a service instance with the container
	 */
	registerInstance<T>(token: ServiceToken<T>, instance: T): void

	/**
	 * Resolve a service from the container
	 */
	resolve<T>(token: ServiceToken<T>): T

	/**
	 * Resolve a service asynchronously
	 */
	resolveAsync<T>(token: ServiceToken<T>): Promise<T>

	/**
	 * Try to resolve a service, returning undefined if not found
	 */
	tryResolve<T>(token: ServiceToken<T>): T | undefined

	/**
	 * Check if a service is registered
	 */
	isRegistered<T>(token: ServiceToken<T>): boolean

	/**
	 * Unregister a service
	 */
	unregister<T>(token: ServiceToken<T>): boolean

	/**
	 * Get all registered service tokens
	 */
	getRegisteredTokens(): ServiceToken[]

	/**
	 * Create a new service scope
	 */
	createScope(): IServiceScope

	/**
	 * Resolve services within a specific scope
	 */
	resolveInScope<T>(token: ServiceToken<T>, scope: IServiceScope): T

	/**
	 * Get service registration information
	 */
	getRegistration<T>(token: ServiceToken<T>): ServiceRegistration<T> | undefined

	/**
	 * Clear all registrations
	 */
	clear(): void

	/**
	 * Dispose of the container
	 */
	dispose(): void
}

/**
 * Decorator metadata for dependency injection
 */
export interface InjectableMetadata {
	/** Service token */
	token?: ServiceToken

	/** Service lifetime */
	lifetime?: ServiceLifetime

	/** Service dependencies */
	dependencies?: ServiceToken[]
}

/**
 * Parameter injection metadata
 */
export interface InjectMetadata {
	/** Parameter index */
	parameterIndex: number

	/** Service token to inject */
	token: ServiceToken

	/** Whether the dependency is optional */
	optional?: boolean
}

/**
 * Container events
 */
export const ContainerEvents = {
	SERVICE_REGISTERED: "container.service.registered",
	SERVICE_RESOLVED: "container.service.resolved",
	SERVICE_UNREGISTERED: "container.service.unregistered",
	SCOPE_CREATED: "container.scope.created",
	SCOPE_DISPOSED: "container.scope.disposed",
	CIRCULAR_DEPENDENCY_DETECTED: "container.circular.dependency.detected",
	RESOLUTION_FAILED: "container.resolution.failed",
} as const

/**
 * Container event data types
 */
export interface ServiceRegisteredData {
	token: ServiceToken
	lifetime: ServiceLifetime
	hasFactory: boolean
	hasConstructor: boolean
	hasInstance: boolean
}

export interface ServiceResolvedData {
	token: ServiceToken
	lifetime: ServiceLifetime
	resolutionTime: number
	scopeId?: string
}

export interface ServiceUnregisteredData {
	token: ServiceToken
}

export interface ScopeCreatedData {
	scopeId: string
	parentScopeId?: string
}

export interface ScopeDisposedData {
	scopeId: string
	instanceCount: number
}

export interface CircularDependencyDetectedData {
	resolutionChain: ServiceToken[]
	currentToken: ServiceToken
}

export interface ResolutionFailedData {
	token: ServiceToken
	error: Error
	resolutionChain: ServiceToken[]
}

/**
 * Container error types
 */
export class ContainerError extends Error {
	constructor(
		message: string,
		public token?: ServiceToken,
	) {
		super(message)
		this.name = "ContainerError"
	}
}

export class CircularDependencyError extends ContainerError {
	constructor(resolutionChain: ServiceToken[]) {
		const chainStr = resolutionChain.map((token) => String(token)).join(" -> ")
		super(`Circular dependency detected: ${chainStr}`, resolutionChain[0])
		this.name = "CircularDependencyError"
	}
}

export class ServiceNotFoundError extends ContainerError {
	constructor(token: ServiceToken) {
		super(`Service not found: ${String(token)}`, token)
		this.name = "ServiceNotFoundError"
	}
}

export class InvalidRegistrationError extends ContainerError {
	constructor(message: string, token?: ServiceToken) {
		super(message, token)
		this.name = "InvalidRegistrationError"
	}
}

/**
 * Service tokens for built-in services
 */
export const BuiltInServices = {
	CONTAINER: Symbol("DIContainer"),
	EVENT_BUS: Symbol("EventBus"),
	CONFIG_MANAGER: Symbol("ConfigManager"),
	LOGGER: Symbol("Logger"),
} as const

/**
 * Utility type for extracting constructor parameters
 */
export type ConstructorParameters<T> = T extends new (...args: infer P) => any ? P : never

/**
 * Utility type for extracting instance type from constructor
 */
export type InstanceType<T> = T extends new (...args: any[]) => infer R ? R : any
