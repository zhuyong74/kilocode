/**
 * Analysis Engine Module
 *
 * This module exports all analysis engine components including
 * the core analysis engine, session management, caching system,
 * and database engine framework.
 */

// Core Analysis Engine
export { AnalysisEngine } from "./AnalysisEngine"

// Analysis Cache System
export { AnalysisCache } from "./AnalysisCache"

// Session Management
export { SessionManager } from "./AnalysisSession"

// Database Engine
export { DatabaseEngine } from "./DatabaseEngine"

// Re-export types for convenience
export type {
	IAnalysisEngine,
	AnalysisEngineConfig,
	AnalysisContext,
	AnalysisResult,
	AnalysisProgress,
	EngineStatistics,
	PerformanceMetrics,
} from "../types/engine"

export type { IAnalysisCache, CacheConfig, CacheStatistics } from "../types/cache"

export type { AnalysisSession, SessionConfig, SessionStatistics, ISessionManager } from "../types/session"

export type { IDatabaseEngine, DatabaseEngineConfig, DatabaseConfig, DatabaseEngineStatistics } from "../types/database"
