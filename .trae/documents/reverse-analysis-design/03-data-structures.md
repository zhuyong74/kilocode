# 数据结构设计

## 1. 核心数据类型

### 1.1 基础数据类型

```typescript
// 唯一标识符类型
type UUID = string
type Timestamp = number
type FilePath = string
type DirectoryPath = string

// 版本信息
interface Version {
	major: number
	minor: number
	patch: number
	prerelease?: string
	build?: string
}

// 位置信息
interface Position {
	line: number
	column: number
}

// 范围信息
interface Range {
	start: Position
	end: Position
}

// 文件信息
interface FileInfo {
	path: FilePath
	size: number
	lastModified: Date
	checksum: string
	encoding?: string
}
```

### 1.2 配置数据结构

```typescript
// 项目配置
interface ProjectConfig {
	id: UUID
	name: string
	description?: string
	rootPath: DirectoryPath

	// 分析配置
	analysis: AnalysisConfig

	// 排除规则
	excludePatterns: string[]
	includePatterns: string[]

	// 语言设置
	languages: string[]

	// 自定义设置
	customSettings: Record<string, any>

	// 版本信息
	version: Version
	createdAt: Date
	updatedAt: Date
}

// 分析配置
interface AnalysisConfig {
	// 启用的分析器
	enabledAnalyzers: string[]

	// 分析器配置
	analyzerConfigs: Record<string, AnalyzerConfig>

	// 缓存设置
	cacheEnabled: boolean
	cacheTTL: number

	// 并发设置
	maxConcurrency: number

	// 超时设置
	timeout: number

	// 增量分析
	incrementalEnabled: boolean
}

// 分析器配置
interface AnalyzerConfig {
	enabled: boolean
	priority: number
	options: Record<string, any>
	dependencies?: string[]
}
```

## 2. 分析结果数据结构

### 2.1 分析会话

```typescript
// 分析会话
interface AnalysisSession {
	id: UUID
	projectId: UUID
	status: AnalysisStatus

	// 请求信息
	request: AnalysisRequest

	// 进度信息
	progress: AnalysisProgress

	// 结果信息
	results?: AnalysisResults
	error?: AnalysisError

	// 时间信息
	startTime: Date
	endTime?: Date
	duration?: number

	// 元数据
	metadata: AnalysisSessionMetadata
}

// 分析状态
enum AnalysisStatus {
	PENDING = "pending",
	INITIALIZING = "initializing",
	RUNNING = "running",
	PAUSED = "paused",
	COMPLETED = "completed",
	FAILED = "failed",
	CANCELLED = "cancelled",
}

// 分析请求
interface AnalysisRequest {
	projectPath: DirectoryPath
	analyzers: string[]
	options: AnalysisOptions
	priority: number
	userId?: string
}

// 分析选项
interface AnalysisOptions {
	incremental?: boolean
	forceRefresh?: boolean
	includeTests?: boolean
	includeDocumentation?: boolean
	maxDepth?: number
	customFilters?: string[]
}

// 分析进度
interface AnalysisProgress {
	totalSteps: number
	completedSteps: number
	currentStep: string
	percentage: number
	estimatedTimeRemaining?: number

	// 分析器进度
	analyzerProgress: Record<string, AnalyzerProgress>
}

// 分析器进度
interface AnalyzerProgress {
	status: AnalysisStatus
	filesProcessed: number
	totalFiles: number
	currentFile?: string
	errors: number
	warnings: number
}
```

### 2.2 分析结果

```typescript
// 分析结果
interface AnalysisResults {
	sessionId: UUID
	projectId: UUID

	// 总体统计
	summary: AnalysisSummary

	// 各分析器结果
	structureAnalysis?: ProjectStructureResult
	dependencyAnalysis?: DependencyAnalysisResult
	qualityAnalysis?: CodeQualityResult
	securityAnalysis?: SecurityAnalysisResult
	performanceAnalysis?: PerformanceAnalysisResult

	// 元数据
	metadata: AnalysisResultMetadata

	// 生成时间
	generatedAt: Date
	version: Version
}

// 分析摘要
interface AnalysisSummary {
	// 文件统计
	totalFiles: number
	analyzedFiles: number
	skippedFiles: number
	errorFiles: number

	// 代码统计
	linesOfCode: number
	linesOfComments: number
	blankLines: number

	// 语言分布
	languageDistribution: LanguageStats[]

	// 问题统计
	totalIssues: number
	criticalIssues: number
	majorIssues: number
	minorIssues: number

	// 评分
	overallScore: number
	categoryScores: Record<string, number>
}

// 语言统计
interface LanguageStats {
	language: string
	fileCount: number
	linesOfCode: number
	percentage: number
}
```

## 3. 项目结构数据

### 3.1 项目结构

```typescript
// 项目结构结果
interface ProjectStructureResult {
	// 项目类型
	projectType: ProjectType

	// 目录结构
	directoryStructure: DirectoryNode

	// 文件分类
	fileClassification: FileClassification

	// 项目元数据
	projectMetadata: ProjectMetadata

	// 配置文件
	configFiles: ConfigFileInfo[]

	// 构建系统
	buildSystem?: BuildSystemInfo
}

// 项目类型
interface ProjectType {
	primary: string
	secondary?: string[]
	framework?: string
	language: string
	confidence: number
}

// 目录节点
interface DirectoryNode {
	name: string
	path: DirectoryPath
	type: "directory" | "file"
	size?: number

	// 子节点
	children?: DirectoryNode[]

	// 文件信息
	fileInfo?: FileInfo

	// 分类信息
	category?: FileCategory

	// 统计信息
	stats?: DirectoryStats
}

// 文件分类
interface FileClassification {
	sourceFiles: FileInfo[]
	testFiles: FileInfo[]
	configFiles: FileInfo[]
	documentationFiles: FileInfo[]
	assetFiles: FileInfo[]
	buildFiles: FileInfo[]
	otherFiles: FileInfo[]
}

// 文件类别
enum FileCategory {
	SOURCE = "source",
	TEST = "test",
	CONFIG = "config",
	DOCUMENTATION = "documentation",
	ASSET = "asset",
	BUILD = "build",
	DEPENDENCY = "dependency",
	OTHER = "other",
}

// 目录统计
interface DirectoryStats {
	fileCount: number
	directoryCount: number
	totalSize: number
	depth: number
	lastModified: Date
}

// 项目元数据
interface ProjectMetadata {
	name: string
	version?: Version
	description?: string
	author?: string
	license?: string
	homepage?: string
	repository?: RepositoryInfo

	// 依赖信息
	dependencies?: Record<string, string>
	devDependencies?: Record<string, string>

	// 脚本信息
	scripts?: Record<string, string>

	// 关键词
	keywords?: string[]
}

// 仓库信息
interface RepositoryInfo {
	type: string
	url: string
	branch?: string
	commit?: string
}
```

### 3.2 构建系统信息

```typescript
// 构建系统信息
interface BuildSystemInfo {
	type: BuildSystemType
	configFiles: string[]
	buildTargets: BuildTarget[]
	dependencies: BuildDependency[]

	// 构建配置
	buildConfig: BuildConfig

	// 输出信息
	outputConfig: OutputConfig
}

// 构建系统类型
enum BuildSystemType {
	NPM = "npm",
	YARN = "yarn",
	PNPM = "pnpm",
	WEBPACK = "webpack",
	VITE = "vite",
	ROLLUP = "rollup",
	GRADLE = "gradle",
	MAVEN = "maven",
	MAKE = "make",
	CMAKE = "cmake",
	CUSTOM = "custom",
}

// 构建目标
interface BuildTarget {
	name: string
	type: "library" | "application" | "test" | "documentation"
	sources: string[]
	outputs: string[]
	dependencies: string[]
}

// 构建依赖
interface BuildDependency {
	name: string
	version: string
	type: "runtime" | "development" | "build" | "test"
	source: string
	optional: boolean
}
```

## 4. 依赖关系数据

### 4.1 依赖图

```typescript
// 依赖分析结果
interface DependencyAnalysisResult {
	// 依赖图
	dependencyGraph: DependencyGraph

	// 循环依赖
	circularDependencies: CircularDependency[]

	// 依赖指标
	metrics: DependencyMetrics

	// 优化建议
	optimizations: OptimizationSuggestion[]

	// 风险评估
	risks: DependencyRisk[]
}

// 依赖图
interface DependencyGraph {
	nodes: DependencyNode[]
	edges: DependencyEdge[]

	// 图统计
	stats: GraphStats

	// 层级信息
	layers: DependencyLayer[]
}

// 依赖节点
interface DependencyNode {
	id: string
	name: string
	type: DependencyType
	version?: string

	// 文件信息
	filePath?: FilePath

	// 统计信息
	inDegree: number
	outDegree: number

	// 属性
	isExternal: boolean
	isOptional: boolean

	// 元数据
	metadata: DependencyNodeMetadata
}

// 依赖类型
enum DependencyType {
	MODULE = "module",
	PACKAGE = "package",
	FILE = "file",
	CLASS = "class",
	FUNCTION = "function",
	VARIABLE = "variable",
	TYPE = "type",
}

// 依赖边
interface DependencyEdge {
	id: string
	source: string
	target: string
	type: DependencyRelationType

	// 权重信息
	weight: number

	// 位置信息
	locations: DependencyLocation[]

	// 属性
	isCircular: boolean
	isOptional: boolean

	// 元数据
	metadata: DependencyEdgeMetadata
}

// 依赖关系类型
enum DependencyRelationType {
	IMPORT = "import",
	REQUIRE = "require",
	INCLUDE = "include",
	EXTENDS = "extends",
	IMPLEMENTS = "implements",
	CALLS = "calls",
	REFERENCES = "references",
	USES = "uses",
}

// 依赖位置
interface DependencyLocation {
	filePath: FilePath
	range: Range
	context: string
}
```

### 4.2 循环依赖

```typescript
// 循环依赖
interface CircularDependency {
	id: string
	cycle: string[]
	length: number
	severity: CircularDependencySeverity

	// 影响分析
	impact: CircularDependencyImpact

	// 解决建议
	suggestions: CircularDependencySuggestion[]

	// 位置信息
	locations: DependencyLocation[]
}

// 循环依赖严重程度
enum CircularDependencySeverity {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}

// 循环依赖影响
interface CircularDependencyImpact {
	affectedFiles: number
	affectedModules: number
	buildComplexity: number
	testComplexity: number
	maintainabilityScore: number
}

// 循环依赖解决建议
interface CircularDependencySuggestion {
	type: "extract_interface" | "dependency_injection" | "merge_modules" | "refactor_architecture"
	description: string
	effort: "low" | "medium" | "high"
	impact: "low" | "medium" | "high"
	steps: string[]
}
```

## 5. 代码质量数据

### 5.1 质量报告

```typescript
// 代码质量结果
interface CodeQualityResult {
	// 总体评分
	overallScore: number

	// 分类评分
	categoryScores: QualityCategoryScores

	// 质量问题
	issues: QualityIssue[]

	// 复杂度指标
	complexity: ComplexityMetrics

	// 代码异味
	codeSmells: CodeSmell[]

	// 重构建议
	refactoringSuggestions: RefactoringSuggestion[]

	// 趋势分析
	trends?: QualityTrends
}

// 质量分类评分
interface QualityCategoryScores {
	maintainability: number
	reliability: number
	security: number
	performance: number
	testability: number
	readability: number
}

// 质量问题
interface QualityIssue {
	id: string
	type: QualityIssueType
	severity: IssueSeverity
	category: QualityCategory

	// 描述信息
	title: string
	description: string

	// 位置信息
	location: IssueLocation

	// 修复信息
	fixSuggestion?: string
	fixEffort: FixEffort

	// 规则信息
	rule: QualityRule

	// 元数据
	metadata: QualityIssueMetadata
}

// 质量问题类型
enum QualityIssueType {
	CODE_SMELL = "code_smell",
	BUG = "bug",
	VULNERABILITY = "vulnerability",
	PERFORMANCE = "performance",
	MAINTAINABILITY = "maintainability",
	TESTABILITY = "testability",
}

// 问题严重程度
enum IssueSeverity {
	INFO = "info",
	MINOR = "minor",
	MAJOR = "major",
	CRITICAL = "critical",
	BLOCKER = "blocker",
}

// 质量类别
enum QualityCategory {
	COMPLEXITY = "complexity",
	DUPLICATION = "duplication",
	NAMING = "naming",
	STRUCTURE = "structure",
	DOCUMENTATION = "documentation",
	TESTING = "testing",
	SECURITY = "security",
	PERFORMANCE = "performance",
}
```

### 5.2 复杂度指标

```typescript
// 复杂度指标
interface ComplexityMetrics {
	// 圈复杂度
	cyclomaticComplexity: ComplexityMeasure

	// 认知复杂度
	cognitiveComplexity: ComplexityMeasure

	// 嵌套深度
	nestingDepth: ComplexityMeasure

	// 函数长度
	functionLength: ComplexityMeasure

	// 类复杂度
	classComplexity: ComplexityMeasure

	// 文件复杂度
	fileComplexity: ComplexityMeasure
}

// 复杂度测量
interface ComplexityMeasure {
	average: number
	maximum: number
	minimum: number
	median: number
	standardDeviation: number

	// 分布信息
	distribution: ComplexityDistribution

	// 高复杂度项目
	highComplexityItems: ComplexityItem[]
}

// 复杂度分布
interface ComplexityDistribution {
	low: number // 0-5
	medium: number // 6-10
	high: number // 11-20
	veryHigh: number // 21+
}

// 复杂度项目
interface ComplexityItem {
	name: string
	type: "function" | "class" | "file"
	complexity: number
	location: IssueLocation
	suggestion?: string
}
```

## 6. 安全分析数据

### 6.1 安全报告

```typescript
// 安全分析结果
interface SecurityAnalysisResult {
	// 总体安全评分
	securityScore: number

	// 漏洞统计
	vulnerabilityStats: VulnerabilityStats

	// 安全问题
	securityIssues: SecurityIssue[]

	// 依赖漏洞
	dependencyVulnerabilities: DependencyVulnerability[]

	// 安全建议
	recommendations: SecurityRecommendation[]

	// 合规性检查
	complianceChecks: ComplianceCheck[]
}

// 漏洞统计
interface VulnerabilityStats {
	total: number
	critical: number
	high: number
	medium: number
	low: number

	// 分类统计
	byCategory: Record<SecurityCategory, number>

	// 趋势信息
	trend: SecurityTrend
}

// 安全问题
interface SecurityIssue {
	id: string
	type: SecurityIssueType
	severity: SecuritySeverity
	category: SecurityCategory

	// 描述信息
	title: string
	description: string

	// 位置信息
	location: IssueLocation

	// 影响分析
	impact: SecurityImpact

	// 修复信息
	remediation: SecurityRemediation

	// CWE/CVE 信息
	cwe?: string
	cve?: string

	// 元数据
	metadata: SecurityIssueMetadata
}

// 安全问题类型
enum SecurityIssueType {
	INJECTION = "injection",
	XSS = "xss",
	CSRF = "csrf",
	AUTHENTICATION = "authentication",
	AUTHORIZATION = "authorization",
	CRYPTOGRAPHY = "cryptography",
	DATA_EXPOSURE = "data_exposure",
	INSECURE_COMMUNICATION = "insecure_communication",
	CONFIGURATION = "configuration",
}

// 安全严重程度
enum SecuritySeverity {
	CRITICAL = "critical",
	HIGH = "high",
	MEDIUM = "medium",
	LOW = "low",
	INFO = "info",
}

// 安全类别
enum SecurityCategory {
	INPUT_VALIDATION = "input_validation",
	OUTPUT_ENCODING = "output_encoding",
	AUTHENTICATION = "authentication",
	SESSION_MANAGEMENT = "session_management",
	ACCESS_CONTROL = "access_control",
	CRYPTOGRAPHY = "cryptography",
	ERROR_HANDLING = "error_handling",
	DATA_PROTECTION = "data_protection",
	COMMUNICATION = "communication",
	CONFIGURATION = "configuration",
}
```

## 6. 数据库数据结构

### 6.1 数据库配置

```typescript
interface DatabaseConfig {
	id: string
	name: string
	type: DatabaseType
	connection: ConnectionConfig
	credentials: DatabaseCredentials
	ssl?: SSLConfig
	options?: DatabaseOptions
}

interface ConnectionConfig {
	host: string
	port: number
	database: string
	schema?: string
	connectionTimeout?: number
	queryTimeout?: number
	poolSize?: number
}

interface DatabaseCredentials {
	username: string
	password: string // 加密存储
	authMethod?: AuthMethod
	token?: string // 用于某些云数据库
}

interface SSLConfig {
	enabled: boolean
	ca?: string
	cert?: string
	key?: string
	rejectUnauthorized?: boolean
}
```

### 6.2 数据库结构

```typescript
interface DatabaseStructure {
	id: string
	databaseName: string
	schemas: DatabaseSchema[]
	version: string
	charset: string
	collation: string
	size: number
	createdAt: Date
	lastModified: Date
}

interface DatabaseSchema {
	name: string
	tables: TableSchema[]
	views: ViewSchema[]
	procedures: ProcedureSchema[]
	functions: FunctionSchema[]
	triggers: TriggerSchema[]
	indexes: IndexSchema[]
}

interface TableSchema {
	name: string
	schema: string
	columns: ColumnSchema[]
	primaryKey: PrimaryKeySchema
	foreignKeys: ForeignKeySchema[]
	indexes: IndexSchema[]
	constraints: ConstraintSchema[]
	rowCount: number
	dataSize: number
	indexSize: number
	createdAt: Date
	lastModified: Date
}

interface ColumnSchema {
	name: string
	dataType: string
	nullable: boolean
	defaultValue?: any
	autoIncrement: boolean
	length?: number
	precision?: number
	scale?: number
	comment?: string
}
```

### 6.3 数据库分析结果

```typescript
interface DatabaseAnalysisResult {
	id: string
	databaseId: string
	timestamp: Date
	structure: DatabaseStructure
	relationships: RelationshipAnalysis
	performance: PerformanceAnalysis
	security: SecurityAnalysis
	quality: QualityAnalysis
	recommendations: Recommendation[]
}

interface RelationshipAnalysis {
	foreignKeys: ForeignKeyRelation[]
	implicitRelations: ImplicitRelation[]
	orphanedTables: string[]
	circularReferences: CircularReference[]
	relationshipStrength: RelationshipStrength[]
}

interface PerformanceAnalysis {
	slowQueries: SlowQuery[]
	missingIndexes: MissingIndex[]
	unusedIndexes: UnusedIndex[]
	tableStats: TableStatistics[]
	queryPatterns: QueryPattern[]
	bottlenecks: PerformanceBottleneck[]
}

interface SecurityAnalysis {
	vulnerabilities: SecurityVulnerability[]
	permissions: PermissionAnalysis[]
	sensitiveData: SensitiveDataLocation[]
	encryptionStatus: EncryptionStatus[]
	auditTrail: AuditTrailStatus
}
```

### 6.4 数据库设计结构

```typescript
interface DatabaseDesign {
	id: string
	name: string
	version: string
	description: string
	erDiagram: ERDiagram
	tables: TableDesign[]
	relationships: RelationshipDesign[]
	constraints: ConstraintDesign[]
	indexes: IndexDesign[]
	metadata: DesignMetadata
}

interface ERDiagram {
	id: string
	entities: Entity[]
	relationships: Relationship[]
	layout: DiagramLayout
	style: DiagramStyle
}

interface TableDesign {
	id: string
	name: string
	displayName: string
	description: string
	columns: ColumnDesign[]
	primaryKey: PrimaryKeyDesign
	position: Position
	color: string
	tags: string[]
}

interface ColumnDesign {
	id: string
	name: string
	displayName: string
	dataType: DataType
	nullable: boolean
	defaultValue?: any
	description: string
	constraints: ColumnConstraint[]
	tags: string[]
}
```

### 6.5 关联分析结构

```typescript
interface CorrelationAnalysis {
	id: string
	projectId: string
	timestamp: Date
	codeDatabaseCorrelations: CodeDatabaseCorrelation[]
	apiDatabaseMappings: APIDatabaseMapping[]
	ormTableMappings: ORMTableMapping[]
	queryCodeCorrelations: QueryCodeCorrelation[]
	dataFlowAnalysis: DataFlowAnalysis
	consistencyIssues: ConsistencyIssue[]
}

interface CodeDatabaseCorrelation {
	id: string
	type: CorrelationType
	confidence: number
	codeElement: CodeElement
	databaseElement: DatabaseElement
	correlationDetails: CorrelationDetails
	impactAnalysis: ImpactAnalysis
}

interface APIDatabaseMapping {
	apiEndpoint: APIEndpoint
	databaseOperations: DatabaseOperation[]
	dataFlow: DataFlowPath[]
	performanceMetrics: PerformanceMetrics
	securityConsiderations: SecurityConsideration[]
}

interface DataFlowAnalysis {
	flows: DataFlow[]
	sources: DataSource[]
	sinks: DataSink[]
	transformations: DataTransformation[]
	dependencies: DataDependency[]
}
```

## 7. 任务和工作流数据

### 7.1 任务数据

```typescript
// 任务配置
interface TaskConfig {
	id: UUID
	name: string
	description?: string
	type: TaskType

	// 执行配置
	executor: TaskExecutor
	parameters: TaskParameters

	// 依赖配置
	dependencies: TaskDependency[]

	// 调度配置
	schedule?: TaskSchedule

	// 超时配置
	timeout?: number

	// 重试配置
	retry?: RetryConfig
}

// 任务类型
enum TaskType {
	ANALYSIS = "analysis",
	REFACTORING = "refactoring",
	TESTING = "testing",
	DOCUMENTATION = "documentation",
	BUILD = "build",
	DEPLOYMENT = "deployment",
	NOTIFICATION = "notification",
	CUSTOM = "custom",
}

// 任务执行器
interface TaskExecutor {
	type: ExecutorType
	config: ExecutorConfig
}

// 执行器类型
enum ExecutorType {
	BUILT_IN = "built_in",
	SCRIPT = "script",
	COMMAND = "command",
	API = "api",
	WORKFLOW = "workflow",
}

// 任务参数
interface TaskParameters {
	[key: string]: any
}

// 任务依赖
interface TaskDependency {
	taskId: string
	type: DependencyType
	condition?: DependencyCondition
}

// 任务进度
interface TaskProgress {
	percentage: number
	currentStep: string
	totalSteps: number
	completedSteps: number

	// 时间信息
	startTime: Date
	estimatedEndTime?: Date

	// 状态信息
	status: TaskStatus
	message?: string
}

// 任务结果
interface TaskResult {
	success: boolean
	output?: any
	error?: Error

	// 执行信息
	executionTime: number
	resourceUsage: ResourceUsage

	// 输出文件
	outputFiles?: string[]

	// 日志信息
	logs: TaskLog[]
}
```

### 7.2 工作流数据

```typescript
// 工作流配置
interface WorkflowConfig {
	id: UUID
	name: string
	description?: string
	version: Version

	// 步骤配置
	steps: WorkflowStepConfig[]

	// 触发器配置
	triggers: WorkflowTrigger[]

	// 变量配置
	variables: WorkflowVariable[]

	// 条件配置
	conditions: WorkflowCondition[]

	// 错误处理
	errorHandling: ErrorHandlingConfig
}

// 工作流步骤配置
interface WorkflowStepConfig {
	id: string
	name: string
	type: WorkflowStepType

	// 执行配置
	action: WorkflowAction

	// 条件配置
	condition?: WorkflowCondition

	// 输入输出
	inputs: WorkflowInput[]
	outputs: WorkflowOutput[]

	// 错误处理
	onError?: ErrorAction

	// 超时配置
	timeout?: number
}

// 工作流触发器
interface WorkflowTrigger {
	type: TriggerType
	config: TriggerConfig
	enabled: boolean
}

// 触发器类型
enum TriggerType {
	MANUAL = "manual",
	SCHEDULE = "schedule",
	FILE_CHANGE = "file_change",
	ANALYSIS_COMPLETE = "analysis_complete",
	TASK_COMPLETE = "task_complete",
	WEBHOOK = "webhook",
	API = "api",
}

// 工作流变量
interface WorkflowVariable {
	name: string
	type: VariableType
	defaultValue?: any
	required: boolean
	description?: string
}

// 变量类型
enum VariableType {
	STRING = "string",
	NUMBER = "number",
	BOOLEAN = "boolean",
	ARRAY = "array",
	OBJECT = "object",
	FILE_PATH = "file_path",
	DIRECTORY_PATH = "directory_path",
}
```

## 8. 报告和可视化数据

### 8.1 报告数据

```typescript
// 报告配置
interface ReportConfig {
	id: UUID
	name: string
	type: ReportType
	template: ReportTemplate

	// 数据源配置
	dataSources: DataSourceConfig[]

	// 过滤配置
	filters: ReportFilter[]

	// 格式配置
	format: ReportFormat

	// 调度配置
	schedule?: ReportSchedule
}

// 报告类型
enum ReportType {
	ANALYSIS_SUMMARY = "analysis_summary",
	QUALITY_REPORT = "quality_report",
	SECURITY_REPORT = "security_report",
	DEPENDENCY_REPORT = "dependency_report",
	PROGRESS_REPORT = "progress_report",
	CUSTOM_REPORT = "custom_report",
}

// 报告数据
interface ReportData {
	id: UUID
	config: ReportConfig

	// 生成信息
	generatedAt: Date
	generatedBy: string

	// 数据内容
	sections: ReportSection[]

	// 统计信息
	statistics: ReportStatistics

	// 附件
	attachments: ReportAttachment[]
}

// 报告章节
interface ReportSection {
	id: string
	title: string
	type: SectionType
	content: SectionContent
	order: number
}

// 章节类型
enum SectionType {
	TEXT = "text",
	TABLE = "table",
	CHART = "chart",
	IMAGE = "image",
	CODE = "code",
	LIST = "list",
}
```

### 8.2 可视化数据

```typescript
// 图表配置
interface ChartConfig {
	id: UUID
	type: ChartType
	title: string

	// 数据配置
	dataSource: DataSourceConfig

	// 样式配置
	style: ChartStyle

	// 交互配置
	interactions: ChartInteraction[]

	// 布局配置
	layout: ChartLayout
}

// 图表数据
interface ChartData {
	labels: string[]
	datasets: ChartDataset[]

	// 元数据
	metadata: ChartDataMetadata
}

// 图表数据集
interface ChartDataset {
	label: string
	data: number[]

	// 样式
	backgroundColor?: string | string[]
	borderColor?: string | string[]
	borderWidth?: number

	// 类型特定配置
	[key: string]: any
}

// 仪表板配置
interface DashboardConfig {
	id: UUID
	name: string
	description?: string

	// 布局配置
	layout: DashboardLayout

	// 组件配置
	widgets: DashboardWidgetConfig[]

	// 主题配置
	theme: DashboardTheme

	// 刷新配置
	refreshInterval?: number
}

// 仪表板布局
interface DashboardLayout {
	type: LayoutType
	columns: number
	rows: number

	// 响应式配置
	responsive: ResponsiveConfig

	// 间距配置
	spacing: SpacingConfig
}

// 布局类型
enum LayoutType {
	GRID = "grid",
	FLEX = "flex",
	ABSOLUTE = "absolute",
	MASONRY = "masonry",
}
```

## 9. 数据持久化策略

### 9.1 存储模型

```typescript
// 存储配置
interface StorageConfig {
	// 主存储
	primary: StorageBackend

	// 缓存存储
	cache: CacheBackend

	// 备份存储
	backup?: BackupBackend

	// 压缩配置
	compression: CompressionConfig

	// 加密配置
	encryption?: EncryptionConfig
}

// 存储后端
interface StorageBackend {
	type: StorageType
	config: StorageBackendConfig
}

// 存储类型
enum StorageType {
	FILE_SYSTEM = "file_system",
	SQLITE = "sqlite",
	INDEXEDDB = "indexeddb",
	MEMORY = "memory",
	REMOTE = "remote",
}

// 数据分区策略
interface PartitionStrategy {
	type: PartitionType
	config: PartitionConfig
}

// 分区类型
enum PartitionType {
	BY_PROJECT = "by_project",
	BY_DATE = "by_date",
	BY_SIZE = "by_size",
	BY_TYPE = "by_type",
}
```

### 9.2 数据验证

```typescript
// 验证规则
interface ValidationRule {
	field: string
	type: ValidationType
	config: ValidationConfig
	message?: string
}

// 验证类型
enum ValidationType {
	REQUIRED = "required",
	TYPE_CHECK = "type_check",
	RANGE = "range",
	PATTERN = "pattern",
	CUSTOM = "custom",
}

// 验证结果
interface ValidationResult {
	valid: boolean
	errors: ValidationError[]
	warnings: ValidationWarning[]
}

// 验证错误
interface ValidationError {
	field: string
	rule: string
	message: string
	value?: any
}
```

---

_这些数据结构定义为逆向项目分析和项目管理功能提供了完整的数据模型基础，确保数据的一致性、完整性和可扩展性。_
