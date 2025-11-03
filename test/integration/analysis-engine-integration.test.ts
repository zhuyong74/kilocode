/**
 * Analysis Engine Integration Test
 *
 * This test verifies that all analysis engine components can be
 * properly imported, initialized, and integrated with the core architecture.
 */

import { DIContainer } from "../../src/core/analysis/architecture/DIContainer"
import { EventBus } from "../../src/core/analysis/architecture/EventBus"
import { AnalysisEngine } from "../../src/core/analysis/engine/AnalysisEngine"
import { AnalysisCache } from "../../src/core/analysis/engine/AnalysisCache"
import { SessionManager } from "../../src/core/analysis/engine/AnalysisSession"
import { DatabaseEngine } from "../../src/core/analysis/engine/DatabaseEngine"
import { AnalyzerRegistry } from "../../src/core/analysis/analyzers/base/AnalyzerRegistry"
import { DatabaseDriverRegistry } from "../../src/core/analysis/database/drivers/DriverRegistry"
import { ConnectionPool } from "../../src/core/analysis/database/connections/ConnectionPool"
import { BuiltInServices } from "../../src/core/analysis/types/container"

// Import types
import type { AnalysisEngineConfig, AnalysisContext } from "../../src/core/analysis/types/engine"
import { AnalysisTargetType, AnalysisMode } from "../../src/core/analysis/types/engine"
import type { CacheConfig } from "../../src/core/analysis/types/cache"
import { CacheStorageType } from "../../src/core/analysis/types/cache"
import type { SessionConfig } from "../../src/core/analysis/types/session"
import type { DatabaseEngineConfig } from "../../src/core/analysis/types/database"

/**
 * Test integration of analysis engine components
 */
async function testAnalysisEngineIntegration(): Promise<void> {
	console.log("🧪 Testing Analysis Engine Integration...")

	try {
		// 1. Create EventBus first
		console.log("📡 Creating EventBus...")
		const eventBus = new EventBus()

		// 2. Create DI Container with EventBus
		console.log("📦 Creating DI Container...")
		const container = new DIContainer({}, eventBus)

		// Register EventBus with string token for compatibility
		container.registerInstance("eventBus", eventBus)

		// 3. Register analyzer registry
		console.log("📋 Creating Analyzer Registry...")
		const analyzerRegistry = new AnalyzerRegistry(container)
		container.registerInstance("analyzerRegistry", analyzerRegistry)

		// 4. Register database driver registry
		console.log("🗄️ Creating Database Driver Registry...")
		const driverRegistry = new DatabaseDriverRegistry(container)
		container.registerInstance("databaseDriverRegistry", driverRegistry)

		// 5. Register connection pool class
		console.log("🏊 Registering Connection Pool...")
		container.registerConstructor("ConnectionPool", ConnectionPool)

		// 6. Create and test Analysis Cache
		console.log("💾 Testing Analysis Cache...")
		const cacheConfig: CacheConfig = {
			storageType: CacheStorageType.MEMORY,
			maxSize: 1000,
			ttl: 3600,
			persistent: false,
			compressionThreshold: 1024,
		}

		const analysisCache = new AnalysisCache(cacheConfig, container)
		container.registerInstance("analysisCache", analysisCache)

		await analysisCache.initialize()
		console.log("✅ Analysis Cache initialized successfully")

		// 7. Create and test Session Manager
		console.log("📊 Testing Session Manager...")
		const sessionManager = new SessionManager(container)

		const sessionConfig: SessionConfig = {
			maxConcurrentAnalyses: 5,
			analysisTimeout: 30000,
			enableCheckpoints: true,
			maxCheckpoints: 50,
		}

		const session = await sessionManager.createSession(sessionConfig, {
			name: "Test Session",
			description: "Integration test session",
		})

		console.log(`✅ Session created with ID: ${session.id}`)

		// 8. Create and test Database Engine
		console.log("🗃️ Testing Database Engine...")
		const dbEngineConfig: DatabaseEngineConfig = {
			poolConfig: {
				minConnections: 2,
				maxConnections: 10,
			},
			queryConfig: {
				defaultTimeout: 30000,
				maxRetries: 3,
			},
			monitoring: {
				enabled: true,
				metricsInterval: 60000,
			},
		}

		const databaseEngine = new DatabaseEngine(dbEngineConfig, container)
		container.registerInstance("databaseEngine", databaseEngine)

		await databaseEngine.initialize()
		console.log("✅ Database Engine initialized successfully")

		// 9. Create and test Analysis Engine
		console.log("🚀 Testing Analysis Engine...")
		const engineConfig: AnalysisEngineConfig = {
			maxConcurrentAnalyses: 5,
			analysisTimeout: 30000,
			parallelExecution: true,
			enableCaching: true,
		}

		const analysisEngine = new AnalysisEngine(engineConfig, container)

		await analysisEngine.initialize()
		console.log("✅ Analysis Engine initialized successfully")

		// 10. Test basic functionality
		console.log("🔍 Testing basic functionality...")

		// Test engine status
		console.log(`Engine Status: ${analysisEngine.status}`)

		// Test statistics
		const stats = analysisEngine.getStatistics()
		console.log(`Engine Statistics: ${JSON.stringify(stats, null, 2)}`)

		// Test performance metrics
		const metrics = analysisEngine.getPerformanceMetrics()
		console.log(`Performance Metrics: ${JSON.stringify(metrics, null, 2)}`)

		// Test cache statistics
		const cacheStats = analysisCache.getStatistics()
		console.log(`Cache Statistics: ${JSON.stringify(cacheStats, null, 2)}`)

		// Test session statistics
		const sessionStats = sessionManager.getStatistics()
		console.log(`Session Manager Statistics: ${JSON.stringify(sessionStats, null, 2)}`)

		// Test database engine statistics
		const dbStats = databaseEngine.getStatistics()
		console.log(`Database Engine Statistics: ${JSON.stringify(dbStats, null, 2)}`)

		// 11. Test event system integration
		console.log("📡 Testing event system integration...")
		let eventReceived = false

		eventBus.on("test-event", () => {
			eventReceived = true
			console.log("✅ Event received successfully")
		})

		eventBus.emit("test-event")

		if (!eventReceived) {
			throw new Error("Event system integration failed")
		}

		// 12. Cleanup
		console.log("🧹 Cleaning up...")
		await analysisEngine.dispose()
		await databaseEngine.dispose()
		await analysisCache.dispose()
		await sessionManager.dispose()

		console.log("✅ All components disposed successfully")
		console.log("🎉 Analysis Engine Integration Test PASSED!")
	} catch (error) {
		console.error("❌ Analysis Engine Integration Test FAILED:", error)
		throw error
	}
}

/**
 * Test type compatibility
 */
function testTypeCompatibility(): void {
	console.log("🔍 Testing type compatibility...")

	// Test that all types can be imported and used
	const analysisContext: AnalysisContext = {
		target: {
			type: AnalysisTargetType.FILE,
			id: "test-file",
			path: "/test/path",
		},
		options: {
			mode: AnalysisMode.STANDARD,
			depth: 3,
		},
	}

	console.log("✅ AnalysisContext type works correctly")

	const cacheConfig: CacheConfig = {
		storageType: CacheStorageType.MEMORY,
		maxSize: 1000,
	}

	console.log("✅ CacheConfig type works correctly")

	const sessionConfig: SessionConfig = {
		maxConcurrentAnalyses: 5,
	}

	console.log("✅ SessionConfig type works correctly")

	console.log("✅ Type compatibility test PASSED!")
}

/**
 * Main test function
 */
async function runIntegrationTests(): Promise<void> {
	console.log("🚀 Starting Analysis Engine Integration Tests...\n")

	try {
		// Test type compatibility first
		testTypeCompatibility()
		console.log("")

		// Test component integration
		await testAnalysisEngineIntegration()
		console.log("")

		console.log("🎉 All Integration Tests PASSED!")
	} catch (error) {
		console.error("❌ Integration Tests FAILED:", error)
		process.exit(1)
	}
}

// Export for use in other tests
export { testAnalysisEngineIntegration, testTypeCompatibility }

// Run tests if this file is executed directly
if (require.main === module) {
	runIntegrationTests()
}
