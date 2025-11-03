# 核心接口定义

## 1. 基础接口

### 1.1 通用接口

```typescript
// 基础实体接口
interface BaseEntity {
	readonly id: string
	readonly createdAt: Date
	readonly updatedAt: Date
}

// 可配置接口
interface Configurable {
	configure(config: Record<string, any>): void
	getConfiguration(): Record<string, any>
}

// 生命周期接口
interface Lifecycle {
	initialize(): Promise<void>
	start(): Promise<void>
	stop(): Promise<void>
	dispose(): Promise<void>
}

// 事件发射器接口
interface EventEmitter<T = any> {
	on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void
	off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void
	emit<K extends keyof T>(event: K, data: T[K]): void
}
```

### 1.2 错误处理接口

```typescript
// 错误类型枚举
enum ErrorType {
	VALIDATION_ERROR = "VALIDATION_ERROR",
	ANALYSIS_ERROR = "ANALYSIS_ERROR",
	IO_ERROR = "IO_ERROR",
	NETWORK_ERROR = "NETWORK_ERROR",
	PERMISSION_ERROR = "PERMISSION_ERROR",
	TIMEOUT_ERROR = "TIMEOUT_ERROR",
	UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// 结构化错误接口
interface StructuredError extends Error {
	readonly type: ErrorType
	readonly code: string
	readonly details?: Record<string, any>
	readonly timestamp: Date
	readonly context?: string
}

// 错误处理器接口
interface ErrorHandler {
	handle(error: StructuredError): Promise<void>
	canHandle(error: Error): boolean
	getRecoveryStrategy(error: StructuredError): RecoveryStrategy | null
}

// 恢复策略接口
interface RecoveryStrategy {
	readonly name: string
	execute(context: ErrorContext): Promise<boolean>
}
```

## 2. 分析引擎接口

### 2.1 核心分析引擎

```typescript
// 分析引擎主接口
interface IAnalysisEngine extends EventEmitter<AnalysisEngineEvents>, Lifecycle {
	// 分析方法
	analyzeProject(request: AnalysisRequest): Promise<AnalysisSession>
	getAnalysisStatus(sessionId: string): Promise<AnalysisStatus>
	cancelAnalysis(sessionId: string): Promise<void>

	// 分析器管理
	registerAnalyzer(analyzer: IAnalyzer): void
	unregisterAnalyzer(analyzerId: string): void
	getAvailableAnalyzers(): IAnalyzer[]

	// 缓存管理
	clearCache(projectPath?: string): Promise<void>
	getCacheStats(): Promise<CacheStats>
}

// 分析引擎事件
interface AnalysisEngineEvents {
	"session.started": AnalysisSession
	"session.progress": AnalysisProgress
	"session.completed": AnalysisResults
	"session.failed": AnalysisError
	"analyzer.registered": IAnalyzer
	"analyzer.unregistered": string
}
```

### 2.2 分析器基础接口

```typescript
// 分析器接口
interface IAnalyzer extends Configurable {
	readonly metadata: AnalyzerMetadata

	// 核心分析方法
	analyze(context: AnalysisContext): Promise<AnalysisResult>
	canAnalyze(target: AnalysisTarget): boolean

	// 依赖管理
	getDependencies(): string[]
	validateDependencies(): Promise<ValidationResult>

	// 性能优化
	supportsIncremental(): boolean
	getIncrementalKey(target: AnalysisTarget): string
}

// 分析器元数据
interface AnalyzerMetadata {
	readonly id: string
	readonly name: string
	readonly version: string
	readonly description: string
	readonly author: string
	readonly supportedLanguages: string[]
	readonly supportedFileTypes: string[]
	readonly category: AnalyzerCategory
	readonly priority: number
}

// 分析器类别
enum AnalyzerCategory {
	STRUCTURE = "structure",
	DEPENDENCY = "dependency",
	QUALITY = "quality",
	SECURITY = "security",
	PERFORMANCE = "performance",
	DOCUMENTATION = "documentation",
	TESTING = "testing",
}
```

### 2.3 具体分析器接口

```typescript
// 项目结构分析器
interface IProjectStructureAnalyzer extends IAnalyzer {
	analyzeDirectoryStructure(projectPath: string): Promise<DirectoryStructure>
	identifyProjectType(projectPath: string): Promise<ProjectType>
	extractProjectMetadata(projectPath: string): Promise<ProjectMetadata>
	validateProjectStructure(structure: DirectoryStructure): ValidationResult
}

// 依赖关系分析器
interface IDependencyAnalyzer extends IAnalyzer {
	analyzeDependencies(projectPath: string): Promise<DependencyGraph>
	detectCircularDependencies(graph: DependencyGraph): CircularDependency[]
	calculateDependencyMetrics(graph: DependencyGraph): DependencyMetrics
	suggestOptimizations(graph: DependencyGraph): OptimizationSuggestion[]
}

// 代码质量分析器
interface ICodeQualityAnalyzer extends IAnalyzer {
	analyzeCodeQuality(filePath: string): Promise<QualityReport>
	calculateComplexity(code: string): ComplexityMetrics
	detectCodeSmells(code: string): CodeSmell[]
	suggestRefactoring(issues: QualityIssue[]): RefactoringSuggestion[]
}

// 安全漏洞分析器
interface ISecurityAnalyzer extends IAnalyzer {
	scanForVulnerabilities(projectPath: string): Promise<SecurityReport>
	checkDependencyVulnerabilities(dependencies: Dependency[]): Promise<VulnerabilityReport>
	validateSecurityPractices(code: string): SecurityIssue[]
	generateSecurityRecommendations(issues: SecurityIssue[]): SecurityRecommendation[]
}
```

## 3. 项目管理接口

### 3.1 项目管理器

```typescript
// 项目管理器主接口
interface IProjectManager extends EventEmitter<ProjectManagerEvents>, Lifecycle {
	// 项目管理
	createProject(config: ProjectConfig): Promise<IProject>
	openProject(projectPath: string): Promise<IProject>
	closeProject(projectId: string): Promise<void>
	getActiveProjects(): IProject[]

	// 任务管理
	createTask(projectId: string, taskConfig: TaskConfig): Promise<ITask>
	getProjectTasks(projectId: string): Promise<ITask[]>
	updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>

	// 工作流管理
	createWorkflow(workflowConfig: WorkflowConfig): Promise<IWorkflow>
	executeWorkflow(workflowId: string, context: WorkflowContext): Promise<WorkflowResult>
	getAvailableWorkflows(): IWorkflow[]
}

// 项目管理器事件
interface ProjectManagerEvents {
	"project.created": IProject
	"project.opened": IProject
	"project.closed": string
	"task.created": ITask
	"task.updated": ITask
	"workflow.started": IWorkflow
	"workflow.completed": WorkflowResult
}
```

### 3.2 项目接口

```typescript
// 项目接口
interface IProject extends BaseEntity, EventEmitter<ProjectEvents> {
	readonly config: ProjectConfig
	readonly metadata: ProjectMetadata
	readonly status: ProjectStatus

	// 分析管理
	startAnalysis(options?: AnalysisOptions): Promise<AnalysisSession>
	getLatestAnalysis(): Promise<AnalysisResults | null>
	getAnalysisHistory(): Promise<AnalysisResults[]>

	// 任务管理
	getTasks(): Promise<ITask[]>
	createTask(config: TaskConfig): Promise<ITask>

	// 报告生成
	generateReport(type: ReportType, options?: ReportOptions): Promise<IReport>
	getReports(): Promise<IReport[]>

	// 配置管理
	updateConfig(config: Partial<ProjectConfig>): Promise<void>
	exportConfig(): ProjectConfig
}

// 项目事件
interface ProjectEvents {
	"analysis.started": AnalysisSession
	"analysis.completed": AnalysisResults
	"task.added": ITask
	"task.completed": ITask
	"config.updated": ProjectConfig
}
```

### 3.3 任务管理接口

```typescript
// 任务接口
interface ITask extends BaseEntity, EventEmitter<TaskEvents> {
	readonly config: TaskConfig
	readonly status: TaskStatus
	readonly progress: TaskProgress
	readonly result?: TaskResult

	// 任务执行
	execute(context?: TaskContext): Promise<TaskResult>
	pause(): Promise<void>
	resume(): Promise<void>
	cancel(): Promise<void>

	// 依赖管理
	addDependency(taskId: string): void
	removeDependency(taskId: string): void
	getDependencies(): string[]

	// 状态管理
	updateProgress(progress: TaskProgress): void
	setStatus(status: TaskStatus): void
}

// 任务状态枚举
enum TaskStatus {
	PENDING = "pending",
	RUNNING = "running",
	PAUSED = "paused",
	COMPLETED = "completed",
	FAILED = "failed",
	CANCELLED = "cancelled",
}

// 任务事件
interface TaskEvents {
	"status.changed": TaskStatus
	"progress.updated": TaskProgress
	"execution.started": TaskContext
	"execution.completed": TaskResult
	"execution.failed": Error
}
```

### 3.4 工作流接口

```typescript
// 工作流接口
interface IWorkflow extends BaseEntity, Configurable {
	readonly metadata: WorkflowMetadata
	readonly steps: IWorkflowStep[]

	// 工作流执行
	execute(context: WorkflowContext): Promise<WorkflowResult>
	validate(): ValidationResult

	// 步骤管理
	addStep(step: IWorkflowStep): void
	removeStep(stepId: string): void
	reorderSteps(stepIds: string[]): void

	// 条件控制
	addCondition(condition: WorkflowCondition): void
	evaluateConditions(context: WorkflowContext): boolean
}

// 工作流步骤接口
interface IWorkflowStep extends BaseEntity {
	readonly type: WorkflowStepType
	readonly config: WorkflowStepConfig

	execute(context: WorkflowContext): Promise<WorkflowStepResult>
	canExecute(context: WorkflowContext): boolean
	getRequiredInputs(): string[]
	getOutputs(): string[]
}

// 工作流步骤类型
enum WorkflowStepType {
	ANALYSIS = "analysis",
	TASK_CREATION = "task_creation",
	NOTIFICATION = "notification",
	REPORT_GENERATION = "report_generation",
	FILE_OPERATION = "file_operation",
	CUSTOM_SCRIPT = "custom_script",
}
```

## 4. 可视化接口

### 4.1 可视化引擎

```typescript
// 可视化引擎接口
interface IVisualizationEngine extends Lifecycle {
	// 图表管理
	createChart(config: ChartConfig): Promise<IChart>
	updateChart(chartId: string, data: ChartData): Promise<void>
	removeChart(chartId: string): Promise<void>

	// 仪表板管理
	createDashboard(config: DashboardConfig): Promise<IDashboard>
	updateDashboard(dashboardId: string, layout: DashboardLayout): Promise<void>

	// 主题管理
	setTheme(theme: VisualizationTheme): void
	getAvailableThemes(): VisualizationTheme[]

	// 导出功能
	exportChart(chartId: string, format: ExportFormat): Promise<Buffer>
	exportDashboard(dashboardId: string, format: ExportFormat): Promise<Buffer>
}
```

### 4.1.1 图表生成器接口

```typescript
interface IChartGenerator {
	// 生成依赖关系图
	generateDependencyChart(dependencies: DependencyGraph): Promise<ChartData>

	// 生成代码质量图表
	generateQualityChart(metrics: QualityMetrics): Promise<ChartData>

	// 生成项目结构图
	generateStructureChart(structure: ProjectStructure): Promise<ChartData>

	// 生成ER图
	generateERDiagram(schema: DatabaseSchema): Promise<ChartData>

	// 生成数据流图
	generateDataFlowChart(dataFlow: DataFlowAnalysis): Promise<ChartData>

	// 生成趋势图
	generateTrendChart(data: TrendData[]): Promise<ChartData>
}
```

### 4.2 图表接口

```typescript
// 图表接口
interface IChart extends BaseEntity, EventEmitter<ChartEvents> {
	readonly type: ChartType
	readonly config: ChartConfig

	// 数据管理
	setData(data: ChartData): Promise<void>
	updateData(data: Partial<ChartData>): Promise<void>
	getData(): ChartData

	// 渲染控制
	render(container: HTMLElement): Promise<void>
	update(): Promise<void>
	destroy(): void

	// 交互功能
	addInteraction(interaction: ChartInteraction): void
	removeInteraction(interactionId: string): void

	// 配置管理
	updateConfig(config: Partial<ChartConfig>): Promise<void>
	resetConfig(): void
}

// 图表类型
enum ChartType {
	LINE = "line",
	BAR = "bar",
	PIE = "pie",
	SCATTER = "scatter",
	HEATMAP = "heatmap",
	TREE = "tree",
	NETWORK = "network",
	SANKEY = "sankey",
}

// 图表事件
interface ChartEvents {
	"data.updated": ChartData
	"config.changed": ChartConfig
	interaction: ChartInteractionEvent
	"render.completed": void
	"render.failed": Error
}
```

### 4.3 仪表板接口

```typescript
// 仪表板接口
interface IDashboard extends BaseEntity, EventEmitter<DashboardEvents> {
	readonly config: DashboardConfig
	readonly layout: DashboardLayout
	readonly widgets: IDashboardWidget[]

	// 布局管理
	addWidget(widget: IDashboardWidget): Promise<void>
	removeWidget(widgetId: string): Promise<void>
	updateLayout(layout: DashboardLayout): Promise<void>

	// 数据绑定
	bindData(dataSource: DataSource): Promise<void>
	refreshData(): Promise<void>

	// 渲染控制
	render(container: HTMLElement): Promise<void>
	refresh(): Promise<void>

	// 导出功能
	export(format: ExportFormat): Promise<Buffer>
	getSnapshot(): Promise<DashboardSnapshot>
}

// 仪表板组件接口
interface IDashboardWidget extends BaseEntity {
	readonly type: WidgetType
	readonly config: WidgetConfig
	readonly position: WidgetPosition

	render(container: HTMLElement): Promise<void>
	update(data: any): Promise<void>
	resize(size: WidgetSize): Promise<void>

	getRequiredData(): DataRequirement[]
	validateData(data: any): ValidationResult
}
```

## 5. 数据库引擎接口

### 5.1 数据库分析器接口

```typescript
interface IDatabaseAnalyzer {
	// 连接数据库
	connect(config: DatabaseConfig): Promise<DatabaseConnection>

	// 分析数据库结构
	analyzeStructure(connection: DatabaseConnection): Promise<DatabaseStructure>

	// 分析表关系
	analyzeRelationships(connection: DatabaseConnection): Promise<RelationshipAnalysis>

	// 分析性能
	analyzePerformance(connection: DatabaseConnection): Promise<PerformanceAnalysis>

	// 安全审计
	auditSecurity(connection: DatabaseConnection): Promise<SecurityAudit>

	// 断开连接
	disconnect(connection: DatabaseConnection): Promise<void>
}
```

### 5.2 数据库设计器接口

```typescript
interface IDatabaseDesigner {
	// 创建ER图
	createERDiagram(schema: DatabaseSchema): Promise<ERDiagram>

	// 设计表结构
	designTable(tableDesign: TableDesign): Promise<TableSchema>

	// 生成迁移脚本
	generateMigration(changes: SchemaChange[]): Promise<Migration>

	// 生成ORM模型
	generateORMModel(schema: DatabaseSchema, config: ORMConfig): Promise<GeneratedCode>

	// 验证设计
	validateDesign(design: DatabaseDesign): Promise<ValidationResult>
}
```

### 5.3 数据库集成分析器接口

```typescript
interface IDatabaseIntegrationAnalyzer {
	// 分析代码-数据库关联
	analyzeCodeDatabaseCorrelation(
		codeAnalysis: CodeAnalysis,
		dbAnalysis: DatabaseAnalysis,
	): Promise<CorrelationAnalysis>

	// 评估变更影响
	assessChangeImpact(changes: Change[], context: AnalysisContext): Promise<ImpactAssessment>

	// 检查一致性
	checkConsistency(codeAnalysis: CodeAnalysis, dbAnalysis: DatabaseAnalysis): Promise<ConsistencyReport>

	// 生成优化建议
	generateOptimizations(fullStackAnalysis: FullStackAnalysis): Promise<OptimizationRecommendation[]>
}
```

## 6. 数据服务接口

### 6.1 缓存服务

```typescript
// 缓存服务接口
interface ICacheService {
	// 基础缓存操作
	get<T>(key: string): Promise<T | null>
	set<T>(key: string, value: T, ttl?: number): Promise<void>
	delete(key: string): Promise<boolean>
	clear(): Promise<void>

	// 批量操作
	mget<T>(keys: string[]): Promise<(T | null)[]>
	mset<T>(entries: Array<[string, T, number?]>): Promise<void>

	// 缓存统计
	getStats(): Promise<CacheStats>
	getSize(): Promise<number>

	// 缓存策略
	setEvictionPolicy(policy: EvictionPolicy): void
	setCompressionEnabled(enabled: boolean): void
}

// 缓存统计
interface CacheStats {
	hits: number
	misses: number
	hitRate: number
	size: number
	memoryUsage: number
}
```

### 6.2 存储服务

```typescript
// 存储服务接口
interface IStorageService {
	// 文件操作
	readFile(path: string): Promise<Buffer>
	writeFile(path: string, data: Buffer): Promise<void>
	deleteFile(path: string): Promise<void>
	exists(path: string): Promise<boolean>

	// 目录操作
	createDirectory(path: string): Promise<void>
	listDirectory(path: string): Promise<string[]>
	deleteDirectory(path: string): Promise<void>

	// 元数据操作
	getMetadata(path: string): Promise<FileMetadata>
	setMetadata(path: string, metadata: FileMetadata): Promise<void>

	// 搜索功能
	search(pattern: string, options?: SearchOptions): Promise<string[]>

	// 监听功能
	watch(path: string, callback: FileChangeCallback): Promise<FileWatcher>
}

// 文件变更回调
type FileChangeCallback = (event: FileChangeEvent) => void

// 文件变更事件
interface FileChangeEvent {
	type: "created" | "modified" | "deleted"
	path: string
	timestamp: Date
}
```

## 7. 集成接口

### 7.1 ClineProvider 集成

```typescript
// ClineProvider 集成接口
interface IClineProviderIntegration {
	// 工具注册
	registerAnalysisTools(): Promise<void>
	unregisterAnalysisTools(): Promise<void>

	// WebView 集成
	registerWebViewProvider(): Promise<void>
	sendMessageToWebView(message: WebViewMessage): Promise<void>

	// 状态同步
	syncProjectState(projectId: string): Promise<void>
	getProjectState(projectId: string): Promise<ProjectState>

	// 事件转发
	forwardAnalysisEvents(events: AnalysisEngineEvents): void
	handleClineProviderEvents(events: ClineProviderEvents): void
}
```

### 7.2 MCP 协议扩展

```typescript
// MCP 协议扩展接口
interface IMCPExtension {
	// 协议扩展
	registerAnalysisProtocol(): Promise<void>
	handleAnalysisRequest(request: MCPAnalysisRequest): Promise<MCPAnalysisResponse>

	// 工具扩展
	registerAnalysisTools(): Promise<MCPTool[]>
	executeAnalysisTool(toolName: string, params: any): Promise<any>

	// 资源扩展
	registerAnalysisResources(): Promise<MCPResource[]>
	getAnalysisResource(uri: string): Promise<MCPResourceContent>
}
```

## 8. 配置接口

### 8.1 配置管理

```typescript
// 配置管理器接口
interface IConfigurationManager {
	// 配置读取
	get<T>(key: string, defaultValue?: T): T
	getSection<T>(section: string): T

	// 配置写入
	set<T>(key: string, value: T): Promise<void>
	setSection<T>(section: string, value: T): Promise<void>

	// 配置验证
	validate(config: any, schema: ConfigSchema): ValidationResult

	// 配置监听
	onChange(callback: ConfigChangeCallback): void
	offChange(callback: ConfigChangeCallback): void

	// 配置导入导出
	export(): Promise<ConfigurationData>
	import(data: ConfigurationData): Promise<void>
}

// 配置变更回调
type ConfigChangeCallback = (change: ConfigChange) => void

// 配置变更事件
interface ConfigChange {
	key: string
	oldValue: any
	newValue: any
	timestamp: Date
}
```

---

_这些核心接口定义为逆向项目分析和项目管理功能提供了完整的类型安全保障和清晰的契约定义，确保各模块间的协作和系统的可维护性。_
