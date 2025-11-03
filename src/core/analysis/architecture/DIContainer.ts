/**
 * Dependency Injection Container Implementation
 *
 * A comprehensive dependency injection container for the Kilocode Analysis Engine
 * that supports multiple service lifetimes, automatic dependency resolution,
 * circular dependency detection, and service scoping.
 *
 * @author Kilocode Analysis Team
 * @version 1.0.0
 */

import { EventBus } from "./EventBus"
import {
	IDIContainer,
	IServiceScope,
	ServiceToken,
	ServiceFactory,
	ServiceConstructor,
	ServiceLifetime,
	ServiceRegistration,
	ResolutionContext,
	DIContainerConfig,
	ContainerEvents,
	ServiceRegisteredData,
	ServiceResolvedData,
	ServiceUnregisteredData,
	ScopeCreatedData,
	ScopeDisposedData,
	CircularDependencyDetectedData,
	ResolutionFailedData,
	ContainerError,
	CircularDependencyError,
	ServiceNotFoundError,
	InvalidRegistrationError,
	BuiltInServices,
} from "../types/container"

/**
 * Service Scope Implementation
 */
class ServiceScope implements IServiceScope {
	public readonly id: string
	public readonly parent?: IServiceScope
	public readonly instances: Map<ServiceToken, any>
	public readonly createdAt: Date
	private _disposed = false

	constructor(id: string, parent?: IServiceScope) {
		this.id = id
		this.parent = parent
		this.instances = new Map()
		this.createdAt = new Date()
	}

	dispose(): void {
		if (this._disposed) return

		// Dispose all scoped instances that have a dispose method
		for (const [token, instance] of this.instances) {
			if (instance && typeof instance.dispose === "function") {
				try {
					instance.dispose()
				} catch (error) {
					console.warn(`Error disposing service ${String(token)}:`, error)
				}
			}
		}

		this.instances.clear()
		this._disposed = true
	}

	get isDisposed(): boolean {
		return this._disposed
	}
}

/**
 * Main Dependency Injection Container Implementation
 */
export class DIContainer implements IDIContainer {
	private readonly _registrations = new Map<ServiceToken, ServiceRegistration>()
	private readonly _singletonInstances = new Map<ServiceToken, any>()
	private readonly _scopes = new Map<string, ServiceScope>()
	private readonly _config: Required<DIContainerConfig>
	private readonly _eventBus: EventBus
	private _disposed = false
	private _scopeCounter = 0

	constructor(config: DIContainerConfig = {}, eventBus?: EventBus) {
		this._config = {
			autoInject: config.autoInject ?? true,
			throwOnCircularDependency: config.throwOnCircularDependency ?? true,
			maxResolutionDepth: config.maxResolutionDepth ?? 50,
			debug: config.debug ?? false,
			defaultLifetime: config.defaultLifetime ?? ServiceLifetime.TRANSIENT,
		}

		this._eventBus = eventBus || new EventBus()

		// Register built-in services
		this.registerInstance(BuiltInServices.CONTAINER, this)
		this.registerInstance(BuiltInServices.EVENT_BUS, this._eventBus)
	}

	/**
	 * Register a service with a factory function
	 */
	register<T>(
		token: ServiceToken<T>,
		factory: ServiceFactory<T>,
		lifetime: ServiceLifetime = this._config.defaultLifetime,
	): void {
		this._ensureNotDisposed()
		this._validateToken(token)

		if (!factory) {
			throw new InvalidRegistrationError("Factory function is required", token)
		}

		const registration: ServiceRegistration<T> = {
			token,
			lifetime,
			factory,
			dependencies: this._extractDependencies(factory),
			createdAt: new Date(),
		}

		this._registrations.set(token, registration)

		// Emit registration event
		this._eventBus.emit(ContainerEvents.SERVICE_REGISTERED, {
			token,
			lifetime,
			hasFactory: true,
			hasConstructor: false,
			hasInstance: false,
		} as ServiceRegisteredData)

		if (this._config.debug) {
			console.debug(`[DIContainer] Registered service: ${String(token)} (${lifetime})`)
		}
	}

	/**
	 * Register a service with a constructor
	 */
	registerConstructor<T>(
		token: ServiceToken<T>,
		constructor: ServiceConstructor<T>,
		lifetime: ServiceLifetime = this._config.defaultLifetime,
	): void {
		this._ensureNotDisposed()
		this._validateToken(token)

		if (!constructor) {
			throw new InvalidRegistrationError("Constructor is required", token)
		}

		const registration: ServiceRegistration<T> = {
			token,
			lifetime,
			constructor,
			dependencies: this._extractConstructorDependencies(constructor),
			createdAt: new Date(),
		}

		this._registrations.set(token, registration)

		// Emit registration event
		this._eventBus.emit(ContainerEvents.SERVICE_REGISTERED, {
			token,
			lifetime,
			hasFactory: false,
			hasConstructor: true,
			hasInstance: false,
		} as ServiceRegisteredData)

		if (this._config.debug) {
			console.debug(`[DIContainer] Registered constructor: ${String(token)} (${lifetime})`)
		}
	}

	/**
	 * Register a service instance
	 */
	registerInstance<T>(token: ServiceToken<T>, instance: T): void {
		this._ensureNotDisposed()
		this._validateToken(token)

		if (instance === null || instance === undefined) {
			throw new InvalidRegistrationError("Instance cannot be null or undefined", token)
		}

		const registration: ServiceRegistration<T> = {
			token,
			lifetime: ServiceLifetime.SINGLETON,
			instance,
			dependencies: [],
			createdAt: new Date(),
		}

		this._registrations.set(token, registration)
		this._singletonInstances.set(token, instance)

		// Emit registration event
		this._eventBus.emit(ContainerEvents.SERVICE_REGISTERED, {
			token,
			lifetime: ServiceLifetime.SINGLETON,
			hasFactory: false,
			hasConstructor: false,
			hasInstance: true,
		} as ServiceRegisteredData)

		if (this._config.debug) {
			console.debug(`[DIContainer] Registered instance: ${String(token)}`)
		}
	}

	/**
	 * Resolve a service synchronously
	 */
	resolve<T>(token: ServiceToken<T>): T {
		const startTime = performance.now()
		const context: ResolutionContext = {
			resolutionChain: [],
		}

		try {
			const result = this._resolveInternal<T>(token, context)
			const resolutionTime = performance.now() - startTime

			// Emit resolution event
			this._eventBus.emit(ContainerEvents.SERVICE_RESOLVED, {
				token,
				lifetime: this._registrations.get(token)?.lifetime || ServiceLifetime.TRANSIENT,
				resolutionTime,
				scopeId: context.scopeId,
			} as ServiceResolvedData)

			return result
		} catch (error) {
			// Emit resolution failed event
			this._eventBus.emit(ContainerEvents.RESOLUTION_FAILED, {
				token,
				error: error as Error,
				resolutionChain: context.resolutionChain,
			} as ResolutionFailedData)

			throw error
		}
	}

	/**
	 * Resolve a service asynchronously
	 */
	async resolveAsync<T>(token: ServiceToken<T>): Promise<T> {
		const startTime = performance.now()
		const context: ResolutionContext = {
			resolutionChain: [],
		}

		try {
			const result = await this._resolveInternalAsync<T>(token, context)
			const resolutionTime = performance.now() - startTime

			// Emit resolution event
			this._eventBus.emit(ContainerEvents.SERVICE_RESOLVED, {
				token,
				lifetime: this._registrations.get(token)?.lifetime || ServiceLifetime.TRANSIENT,
				resolutionTime,
				scopeId: context.scopeId,
			} as ServiceResolvedData)

			return result
		} catch (error) {
			// Emit resolution failed event
			this._eventBus.emit(ContainerEvents.RESOLUTION_FAILED, {
				token,
				error: error as Error,
				resolutionChain: context.resolutionChain,
			} as ResolutionFailedData)

			throw error
		}
	}

	/**
	 * Try to resolve a service, returning undefined if not found
	 */
	tryResolve<T>(token: ServiceToken<T>): T | undefined {
		try {
			return this.resolve<T>(token)
		} catch (error) {
			if (error instanceof ServiceNotFoundError) {
				return undefined
			}
			throw error
		}
	}

	/**
	 * Check if a service is registered
	 */
	isRegistered<T>(token: ServiceToken<T>): boolean {
		return this._registrations.has(token)
	}

	/**
	 * Unregister a service
	 */
	unregister<T>(token: ServiceToken<T>): boolean {
		this._ensureNotDisposed()

		const registration = this._registrations.get(token)
		if (!registration) {
			return false
		}

		// Remove from registrations
		this._registrations.delete(token)

		// Remove singleton instance if exists
		this._singletonInstances.delete(token)

		// Remove from all scopes
		for (const scope of this._scopes.values()) {
			scope.instances.delete(token)
		}

		// Emit unregistration event
		this._eventBus.emit(ContainerEvents.SERVICE_UNREGISTERED, {
			token,
		} as ServiceUnregisteredData)

		if (this._config.debug) {
			console.debug(`[DIContainer] Unregistered service: ${String(token)}`)
		}

		return true
	}

	/**
	 * Get all registered service tokens
	 */
	getRegisteredTokens(): ServiceToken[] {
		return Array.from(this._registrations.keys())
	}

	/**
	 * Create a new service scope
	 */
	createScope(): IServiceScope {
		this._ensureNotDisposed()

		const scopeId = `scope_${++this._scopeCounter}_${Date.now()}`
		const scope = new ServiceScope(scopeId)
		this._scopes.set(scopeId, scope)

		// Emit scope created event
		this._eventBus.emit(ContainerEvents.SCOPE_CREATED, {
			scopeId,
		} as ScopeCreatedData)

		if (this._config.debug) {
			console.debug(`[DIContainer] Created scope: ${scopeId}`)
		}

		return scope
	}

	/**
	 * Resolve services within a specific scope
	 */
	resolveInScope<T>(token: ServiceToken<T>, scope: IServiceScope): T {
		this._ensureNotDisposed()

		if (scope.isDisposed) {
			throw new ContainerError(`Cannot resolve in disposed scope: ${scope.id}`)
		}

		const context: ResolutionContext = {
			resolutionChain: [],
			scopeId: scope.id,
		}

		return this._resolveInternal<T>(token, context, scope)
	}

	/**
	 * Get service registration information
	 */
	getRegistration<T>(token: ServiceToken<T>): ServiceRegistration<T> | undefined {
		return this._registrations.get(token) as ServiceRegistration<T> | undefined
	}

	/**
	 * Clear all registrations
	 */
	clear(): void {
		this._ensureNotDisposed()

		// Dispose all scopes
		for (const scope of this._scopes.values()) {
			scope.dispose()
		}
		this._scopes.clear()

		// Clear all registrations and instances
		this._registrations.clear()
		this._singletonInstances.clear()

		// Re-register built-in services
		this.registerInstance(BuiltInServices.CONTAINER, this)
		this.registerInstance(BuiltInServices.EVENT_BUS, this._eventBus)

		if (this._config.debug) {
			console.debug("[DIContainer] Cleared all registrations")
		}
	}

	/**
	 * Dispose of the container
	 */
	dispose(): void {
		if (this._disposed) return

		// Dispose all scopes
		for (const scope of this._scopes.values()) {
			scope.dispose()
		}

		// Dispose singleton instances that have a dispose method
		for (const [token, instance] of this._singletonInstances) {
			if (instance && typeof instance.dispose === "function") {
				try {
					instance.dispose()
				} catch (error) {
					console.warn(`Error disposing singleton ${String(token)}:`, error)
				}
			}
		}

		this._scopes.clear()
		this._registrations.clear()
		this._singletonInstances.clear()
		this._disposed = true

		if (this._config.debug) {
			console.debug("[DIContainer] Container disposed")
		}
	}

	/**
	 * Internal resolution method
	 */
	private _resolveInternal<T>(token: ServiceToken<T>, context: ResolutionContext, scope?: IServiceScope): T {
		this._ensureNotDisposed()

		// Check resolution depth
		if (context.resolutionChain.length >= this._config.maxResolutionDepth) {
			throw new ContainerError(
				`Maximum resolution depth exceeded (${this._config.maxResolutionDepth}): ${String(token)}`,
			)
		}

		// Check for circular dependencies
		if (context.resolutionChain.includes(token)) {
			const error = new CircularDependencyError([...context.resolutionChain, token])

			this._eventBus.emit(ContainerEvents.CIRCULAR_DEPENDENCY_DETECTED, {
				resolutionChain: context.resolutionChain,
				currentToken: token,
			} as CircularDependencyDetectedData)

			if (this._config.throwOnCircularDependency) {
				throw error
			} else {
				console.warn("[DIContainer] Circular dependency detected but ignored:", error.message)
			}
		}

		const registration = this._registrations.get(token)
		if (!registration) {
			throw new ServiceNotFoundError(token)
		}

		// Add to resolution chain
		context.resolutionChain.push(token)

		try {
			return this._createInstance<T>(registration, context, scope)
		} finally {
			// Remove from resolution chain
			context.resolutionChain.pop()
		}
	}

	/**
	 * Internal async resolution method
	 */
	private async _resolveInternalAsync<T>(
		token: ServiceToken<T>,
		context: ResolutionContext,
		scope?: IServiceScope,
	): Promise<T> {
		this._ensureNotDisposed()

		// Check resolution depth
		if (context.resolutionChain.length >= this._config.maxResolutionDepth) {
			throw new ContainerError(
				`Maximum resolution depth exceeded (${this._config.maxResolutionDepth}): ${String(token)}`,
			)
		}

		// Check for circular dependencies
		if (context.resolutionChain.includes(token)) {
			const error = new CircularDependencyError([...context.resolutionChain, token])

			this._eventBus.emit(ContainerEvents.CIRCULAR_DEPENDENCY_DETECTED, {
				resolutionChain: context.resolutionChain,
				currentToken: token,
			} as CircularDependencyDetectedData)

			if (this._config.throwOnCircularDependency) {
				throw error
			} else {
				console.warn("[DIContainer] Circular dependency detected but ignored:", error.message)
			}
		}

		const registration = this._registrations.get(token)
		if (!registration) {
			throw new ServiceNotFoundError(token)
		}

		// Add to resolution chain
		context.resolutionChain.push(token)

		try {
			return await this._createInstanceAsync<T>(registration, context, scope)
		} finally {
			// Remove from resolution chain
			context.resolutionChain.pop()
		}
	}

	/**
	 * Create service instance based on registration
	 */
	private _createInstance<T>(
		registration: ServiceRegistration<T>,
		context: ResolutionContext,
		scope?: IServiceScope,
	): T {
		const { token, lifetime } = registration

		// Handle singleton lifetime
		if (lifetime === ServiceLifetime.SINGLETON) {
			if (this._singletonInstances.has(token)) {
				return this._singletonInstances.get(token)
			}

			const instance = this._instantiateService<T>(registration, context, scope)
			this._singletonInstances.set(token, instance)
			return instance
		}

		// Handle scoped lifetime
		if (lifetime === ServiceLifetime.SCOPED && scope) {
			if (scope.instances.has(token)) {
				return scope.instances.get(token)
			}

			const instance = this._instantiateService<T>(registration, context, scope)
			scope.instances.set(token, instance)
			return instance
		}

		// Handle transient lifetime (or scoped without scope)
		return this._instantiateService<T>(registration, context, scope)
	}

	/**
	 * Create service instance asynchronously
	 */
	private async _createInstanceAsync<T>(
		registration: ServiceRegistration<T>,
		context: ResolutionContext,
		scope?: IServiceScope,
	): Promise<T> {
		const { token, lifetime } = registration

		// Handle singleton lifetime
		if (lifetime === ServiceLifetime.SINGLETON) {
			if (this._singletonInstances.has(token)) {
				return this._singletonInstances.get(token)
			}

			const instance = await this._instantiateServiceAsync<T>(registration, context, scope)
			this._singletonInstances.set(token, instance)
			return instance
		}

		// Handle scoped lifetime
		if (lifetime === ServiceLifetime.SCOPED && scope) {
			if (scope.instances.has(token)) {
				return scope.instances.get(token)
			}

			const instance = await this._instantiateServiceAsync<T>(registration, context, scope)
			scope.instances.set(token, instance)
			return instance
		}

		// Handle transient lifetime (or scoped without scope)
		return await this._instantiateServiceAsync<T>(registration, context, scope)
	}

	/**
	 * Instantiate service using factory or constructor
	 */
	private _instantiateService<T>(
		registration: ServiceRegistration<T>,
		context: ResolutionContext,
		scope?: IServiceScope,
	): T {
		// Use pre-registered instance
		if (registration.instance !== undefined) {
			return registration.instance
		}

		// Use factory function
		if (registration.factory) {
			return registration.factory(this)
		}

		// Use constructor
		if (registration.constructor) {
			const dependencies = this._resolveDependencies(registration.dependencies || [], context, scope)
			return new registration.constructor(...dependencies)
		}

		throw new InvalidRegistrationError(
			`No factory, constructor, or instance provided for service: ${String(registration.token)}`,
			registration.token,
		)
	}

	/**
	 * Instantiate service asynchronously
	 */
	private async _instantiateServiceAsync<T>(
		registration: ServiceRegistration<T>,
		context: ResolutionContext,
		scope?: IServiceScope,
	): Promise<T> {
		// Use pre-registered instance
		if (registration.instance !== undefined) {
			return registration.instance
		}

		// Use factory function
		if (registration.factory) {
			const result = registration.factory(this)
			return result instanceof Promise ? await result : result
		}

		// Use constructor
		if (registration.constructor) {
			const dependencies = await this._resolveDependenciesAsync(registration.dependencies || [], context, scope)
			return new registration.constructor(...dependencies)
		}

		throw new InvalidRegistrationError(
			`No factory, constructor, or instance provided for service: ${String(registration.token)}`,
			registration.token,
		)
	}

	/**
	 * Resolve service dependencies
	 */
	private _resolveDependencies(
		dependencies: ServiceToken[],
		context: ResolutionContext,
		scope?: IServiceScope,
	): any[] {
		return dependencies.map((dep) => this._resolveInternal(dep, context, scope))
	}

	/**
	 * Resolve service dependencies asynchronously
	 */
	private async _resolveDependenciesAsync(
		dependencies: ServiceToken[],
		context: ResolutionContext,
		scope?: IServiceScope,
	): Promise<any[]> {
		const promises = dependencies.map((dep) => this._resolveInternalAsync(dep, context, scope))
		return await Promise.all(promises)
	}

	/**
	 * Extract dependencies from factory function (basic implementation)
	 */
	private _extractDependencies(factory: ServiceFactory): ServiceToken[] {
		// This is a simplified implementation
		// In a real-world scenario, you might use reflection or decorators
		return []
	}

	/**
	 * Extract dependencies from constructor (basic implementation)
	 */
	private _extractConstructorDependencies(constructor: ServiceConstructor): ServiceToken[] {
		// This is a simplified implementation
		// In a real-world scenario, you might use reflection or decorators
		return []
	}

	/**
	 * Validate service token
	 */
	private _validateToken(token: ServiceToken): void {
		if (token === null || token === undefined) {
			throw new InvalidRegistrationError("Service token cannot be null or undefined")
		}
	}

	/**
	 * Ensure container is not disposed
	 */
	private _ensureNotDisposed(): void {
		if (this._disposed) {
			throw new ContainerError("Container has been disposed")
		}
	}

	/**
	 * Get container configuration
	 */
	get config(): Readonly<Required<DIContainerConfig>> {
		return { ...this._config }
	}

	/**
	 * Get container statistics
	 */
	get stats() {
		return {
			registrationCount: this._registrations.size,
			singletonCount: this._singletonInstances.size,
			scopeCount: this._scopes.size,
			isDisposed: this._disposed,
		}
	}
}
