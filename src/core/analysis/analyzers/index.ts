/**
 * Analysis Analyzers Module
 *
 * This module exports all analyzer-related components including
 * interfaces, base classes, and registry functionality.
 */

// Base analyzer interfaces and classes
export {
	IAnalyzer,
	IStreamingAnalyzer,
	IIncrementalAnalyzer,
	IBatchAnalyzer,
	IConfigurableAnalyzer,
	ICacheableAnalyzer,
} from "./base/IAnalyzer"
export { IAnalyzerFactory, IAnalyzerLoader, AnalyzerCapabilities } from "./base/IAnalyzer"
export {
	isStreamingAnalyzer,
	isIncrementalAnalyzer,
	isBatchAnalyzer,
	isConfigurableAnalyzer,
	isCacheableAnalyzer,
} from "./base/IAnalyzer"

export { BaseAnalyzer } from "./base/BaseAnalyzer"

// Registry
export { IAnalyzerRegistry, AnalyzerRegistry, analyzerRegistry, RegistryStatistics } from "./base/AnalyzerRegistry"

// Re-export analyzer types
export {
	AnalyzerType,
	AnalyzerExecutionMode,
	AnalyzerStatus,
	AnalyzerMetadata,
	AnalyzerConfig,
	AnalyzerContext,
	ProgressReporter,
	AnalyzerProgress,
	AnalyzerLogger,
	AnalyzerValidationResult,
	AnalyzerEvents,
	AnalyzerStatistics,
} from "../types/analyzer"
