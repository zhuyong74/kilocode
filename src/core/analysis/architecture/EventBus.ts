/**
 * Event Bus System for Kilocode Analysis Engine
 *
 * Provides a centralized event management system with support for:
 * - Event publishing and subscription
 * - Event priority handling
 * - Asynchronous event processing
 * - Type-safe event handling
 *
 * @author Kilocode Analysis Team
 * @version 1.0.0
 */

import { EventEmitter } from "events"
import {
	IEventBus,
	EventHandler,
	EventSubscription,
	EventPriority,
	EventMetadata,
	EventBusConfig,
} from "../types/events"

/**
 * Implementation of the Event Bus system
 */
export class EventBus implements IEventBus {
	private emitter: EventEmitter
	private subscriptions: Map<string, Set<EventSubscription>>
	private config: EventBusConfig
	private eventHistory: EventMetadata[]
	private maxHistorySize: number

	constructor(config: EventBusConfig = {}) {
		this.emitter = new EventEmitter()
		this.subscriptions = new Map()
		this.config = {
			maxListeners: 100,
			enableHistory: true,
			historySize: 1000,
			...config,
		}
		this.eventHistory = []
		this.maxHistorySize = this.config.historySize || 1000

		// Set max listeners to prevent memory leak warnings
		this.emitter.setMaxListeners(this.config.maxListeners || 100)
	}

	/**
	 * Subscribe to an event with optional priority
	 */
	subscribe<T = any>(
		eventName: string,
		handler: EventHandler<T>,
		priority: EventPriority = EventPriority.NORMAL,
	): EventSubscription {
		const subscription: EventSubscription = {
			id: this.generateSubscriptionId(),
			eventName,
			handler: handler as EventHandler<any>,
			priority,
			createdAt: new Date(),
		}

		// Get or create subscription set for this event
		if (!this.subscriptions.has(eventName)) {
			this.subscriptions.set(eventName, new Set())
		}

		const eventSubscriptions = this.subscriptions.get(eventName)!
		eventSubscriptions.add(subscription)

		// Sort subscriptions by priority (higher priority first)
		const sortedSubscriptions = Array.from(eventSubscriptions).sort((a, b) => b.priority - a.priority)

		// Clear and re-add in priority order
		eventSubscriptions.clear()
		sortedSubscriptions.forEach((sub) => eventSubscriptions.add(sub))

		// Register with EventEmitter
		this.emitter.on(eventName, subscription.handler)

		return subscription
	}

	/**
	 * Unsubscribe from an event
	 */
	unsubscribe(subscription: EventSubscription): boolean {
		const eventSubscriptions = this.subscriptions.get(subscription.eventName)
		if (!eventSubscriptions) {
			return false
		}

		const removed = eventSubscriptions.delete(subscription)
		if (removed) {
			this.emitter.removeListener(subscription.eventName, subscription.handler)

			// Clean up empty subscription sets
			if (eventSubscriptions.size === 0) {
				this.subscriptions.delete(subscription.eventName)
			}
		}

		return removed
	}

	/**
	 * Publish an event synchronously
	 */
	publish<T = any>(eventName: string, data: T, metadata?: Partial<EventMetadata>): void {
		const eventMetadata: EventMetadata = {
			eventName,
			timestamp: new Date(),
			async: false,
			...metadata,
		}

		// Add to history if enabled
		if (this.config.enableHistory) {
			this.addToHistory(eventMetadata)
		}

		// Emit the event
		this.emitter.emit(eventName, data, eventMetadata)
	}

	/**
	 * Publish an event asynchronously
	 */
	async publishAsync<T = any>(eventName: string, data: T, metadata?: Partial<EventMetadata>): Promise<void> {
		const eventMetadata: EventMetadata = {
			eventName,
			timestamp: new Date(),
			async: true,
			...metadata,
		}

		// Add to history if enabled
		if (this.config.enableHistory) {
			this.addToHistory(eventMetadata)
		}

		// Process subscriptions asynchronously
		const subscriptions = this.subscriptions.get(eventName)
		if (!subscriptions) {
			return
		}

		const promises = Array.from(subscriptions).map(async (subscription) => {
			try {
				const result = subscription.handler(data, eventMetadata)
				if (result instanceof Promise) {
					await result
				}
			} catch (error) {
				console.error(`Error in event handler for ${eventName}:`, error)
				// Emit error event
				this.emitter.emit("error", {
					eventName,
					subscription,
					error,
					originalData: data,
				})
			}
		})

		await Promise.all(promises)
	}

	/**
	 * Get all active subscriptions for an event
	 */
	getSubscriptions(eventName: string): EventSubscription[] {
		const subscriptions = this.subscriptions.get(eventName)
		return subscriptions ? Array.from(subscriptions) : []
	}

	/**
	 * Get event history
	 */
	getEventHistory(): EventMetadata[] {
		return [...this.eventHistory]
	}

	/**
	 * Clear event history
	 */
	clearHistory(): void {
		this.eventHistory = []
	}

	/**
	 * Get all registered event names
	 */
	getEventNames(): string[] {
		return Array.from(this.subscriptions.keys())
	}

	/**
	 * Check if there are any subscriptions for an event
	 */
	hasSubscriptions(eventName: string): boolean {
		const subscriptions = this.subscriptions.get(eventName)
		return subscriptions ? subscriptions.size > 0 : false
	}

	/**
	 * Remove all subscriptions for an event
	 */
	removeAllSubscriptions(eventName: string): boolean {
		const subscriptions = this.subscriptions.get(eventName)
		if (!subscriptions) {
			return false
		}

		// Remove all listeners from EventEmitter
		this.emitter.removeAllListeners(eventName)

		// Clear subscriptions
		this.subscriptions.delete(eventName)

		return true
	}

	/**
	 * Dispose of the event bus and clean up resources
	 */
	dispose(): void {
		// Remove all listeners
		this.emitter.removeAllListeners()

		// Clear subscriptions
		this.subscriptions.clear()

		// Clear history
		this.eventHistory = []
	}

	/**
	 * Generate a unique subscription ID
	 */
	private generateSubscriptionId(): string {
		return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * Add event to history with size management
	 */
	private addToHistory(metadata: EventMetadata): void {
		this.eventHistory.push(metadata)

		// Maintain history size limit
		if (this.eventHistory.length > this.maxHistorySize) {
			this.eventHistory = this.eventHistory.slice(-this.maxHistorySize)
		}
	}
}

/**
 * Create a new EventBus instance with default configuration
 */
export function createEventBus(config?: EventBusConfig): EventBus {
	return new EventBus(config)
}

/**
 * Singleton EventBus instance for global use
 */
let globalEventBus: EventBus | null = null

/**
 * Get the global EventBus instance
 */
export function getGlobalEventBus(): EventBus {
	if (!globalEventBus) {
		globalEventBus = new EventBus()
	}
	return globalEventBus
}

/**
 * Set a custom global EventBus instance
 */
export function setGlobalEventBus(eventBus: EventBus): void {
	globalEventBus = eventBus
}
