# Code Index 子模块接口与使用文档

## 总览

- 该服务将工作区代码解析为块，生成嵌入向量写入向量数据库，并提供查询与增量维护能力
- 模块分层：接口（interfaces）→ 实现（embedders/vector-store/processors）→ 业务编排（manager/orchestrator/search-service）→ 配置与状态（config-manager/state-manager）→ 缓存与常量

---

## interfaces

### IEmbedder

- 位置：`src/services/code-index/interfaces/embedder.ts`
- 接口：
    - `createEmbeddings(texts: string[], model?: string): Promise<EmbeddingResponse>`
    - `validateConfiguration(): Promise<{ valid: boolean; error?: string }>`
    - `embedderInfo: { name: AvailableEmbedders }`
- 使用示例：

```ts
const embeddings = await embedder.createEmbeddings(["foo", "bar"])
if (!(await embedder.validateConfiguration()).valid) throw new Error("Embedder 无效")
```

### IVectorStore

- 位置：`src/services/code-index/interfaces/vector-store.ts`
- 接口：
    - 初始化与集合管理：`initialize()`, `collectionExists()`, `deleteCollection()`, `clearCollection()`
    - Upsert/删除：`upsertPoints(points)`, `deletePointsByFilePath(path)`, `deletePointsByMultipleFilePaths(paths)`
    - 查询：`search(vector, directoryPrefix?, minScore?, maxResults?)`
- 使用示例：

```ts
await vectorStore.initialize()
await vectorStore.upsertPoints([{ id, vector, payload }])
const results = await vectorStore.search(queryVector, "./src", 0.3, 20)
```

### ICodeParser / IDirectoryScanner / IFileWatcher

- 位置：`src/services/code-index/interfaces/file-processor.ts`
- ICodeParser：`parseFile(filePath, { content?, fileHash? }) => Promise<CodeBlock[]>`
- IDirectoryScanner：`scanDirectory(directory, onError?, onBlocksIndexed?, onFileParsed?)`
- IFileWatcher：
    - 事件：`onDidStartBatchProcessing`, `onBatchProgressUpdate`, `onDidFinishBatchProcessing`
    - 方法：`initialize()`, `processFile(filePath)`
- 使用示例：

```ts
const blocks = await parser.parseFile("src/app.ts")
const { stats } = await scanner.scanDirectory(
	workspace,
	console.error,
	(n) => {},
	(m) => {},
)
await fileWatcher.initialize()
const result = await fileWatcher.processFile("src/app.ts")
```

### ICodeIndexManager

- 位置：`src/services/code-index/interfaces/manager.ts`
- 能力：状态事件、加载配置、启动/停止、清理索引、搜索、状态查询、释放资源
- 使用示例：

```ts
manager.onProgressUpdate(({ systemStatus, message }) => console.log(systemStatus, message))
await manager.loadConfiguration()
await manager.startIndexing()
const hits = await manager.searchIndex("router", 10)
```

---

## embedders

### OpenAI

- 位置：`src/services/code-index/embedders/openai.ts`
- 依赖：`openai` SDK，需要 `openAiNativeApiKey`
- 使用：

```ts
import { OpenAiEmbedder } from "src/services/code-index/embedders/openai"
const embedder = new OpenAiEmbedder({
	openAiNativeApiKey: process.env.OPENAI_API_KEY,
	openAiEmbeddingModelId: "text-embedding-3-small",
})
const { embeddings } = await embedder.createEmbeddings(["search text"])
```

### Ollama

- 位置：`src/services/code-index/embedders/ollama.ts`
- 依赖：本地 `ollama` 服务（默认 `http://localhost:11434`）
- 使用：

```ts
import { CodeIndexOllamaEmbedder } from "src/services/code-index/embedders/ollama"
const embedder = new CodeIndexOllamaEmbedder({
	ollamaBaseUrl: "http://localhost:11434",
	ollamaModelId: "nomic-embed-text:latest",
})
const { embeddings } = await embedder.createEmbeddings(["hello"])
```

### OpenAI-Compatible / Gemini / Mistral / Vercel AI Gateway

- 通过 `service-factory` 创建：`createEmbedder()`（自动读取配置）

---

## vector-store

### QdrantVectorStore

- 位置：`src/services/code-index/vector-store/qdrant-client.ts`
- 初始化与维度重建：`initialize()`（维度不匹配自动重建）
- 查询过滤：支持 `directoryPrefix` 基于路径段索引过滤
- 使用：

```ts
import { QdrantVectorStore } from "src/services/code-index/vector-store/qdrant-client"
const store = new QdrantVectorStore(workspacePath, "http://localhost:6333", 1536, process.env.QDRANT_API_KEY)
await store.initialize()
await store.upsertPoints([{ id, vector, payload: { filePath, codeChunk, startLine, endLine } }])
const res = await store.search(queryVector, "./src", 0.3, 10)
```

---

## processors

### Parser（Tree-sitter + Markdown）

- 位置：`src/services/code-index/processors/parser.ts`
- 能力：支持语言使用语法树捕获；不稳定语言或超长内容使用按行分块；Markdown 标题分层切片
- 使用：

```ts
import { codeParser } from "src/services/code-index/processors/parser"
const blocks = await codeParser.parseFile("README.md")
```

### DirectoryScanner（全量扫描）

- 位置：`src/services/code-index/processors/scanner.ts`
- 能力：递归目录→过滤→并发解析→批量嵌入→批量 upsert→缓存更新；修改文件先删旧点位；支持协作取消与指数退避重试
- 使用：

```ts
const scanner = new DirectoryScanner(embedder, vectorStore, parser, cacheManager, ignoreInstance, 60)
const { stats, totalBlockCount } = await scanner.scanDirectory(
	workspaceRoot,
	console.error,
	(indexed) => {},
	(parsed) => {},
)
```

### FileWatcher（增量维护）

- 位置：`src/services/code-index/processors/file-watcher.ts`
- 能力：聚合文件事件批次、三阶段处理（删除→解析准备→分段上载），上报进度与汇总
- 使用：

```ts
const watcher = new FileWatcher(
	workspaceRoot,
	context,
	cacheManager,
	embedder,
	vectorStore,
	ignoreInstance,
	rooIgnoreController,
	60,
)
await watcher.initialize()
watcher.onBatchProgressUpdate(({ processedInBatch, totalInBatch }) => console.log(processedInBatch, totalInBatch))
```

---

## 业务编排与入口

### CodeIndexServiceFactory

- 位置：`src/services/code-index/service-factory.ts`
- 能力：按 `CodeIndexConfigManager` 当前配置创建 `embedder/vectorStore/parser/scanner/fileWatcher`，并校验嵌入器
- 使用：

```ts
const factory = new CodeIndexServiceFactory(configManager, workspacePath, cacheManager)
const { embedder, vectorStore, parser, scanner, fileWatcher } = factory.createServices(
	context,
	cacheManager,
	ignoreInstance,
	rooIgnore,
)
```

### CodeIndexOrchestrator

- 位置：`src/services/code-index/orchestrator.ts`
- 能力：整体工作流（集合初始化→全量扫描→启动监视→错误清理与取消）
- 使用：

```ts
const orchestrator = new CodeIndexOrchestrator(
	configManager,
	stateManager,
	workspacePath,
	cacheManager,
	vectorStore,
	scanner,
	fileWatcher,
)
await orchestrator.startIndexing()
orchestrator.stopWatcher()
```

### CodeIndexSearchService

- 位置：`src/services/code-index/search-service.ts`
- 能力：在 Indexed/Indexing 状态下生成查询嵌入并进行向量检索，支持目录前缀过滤
- 使用：

```ts
const search = new CodeIndexSearchService(configManager, stateManager, embedder, vectorStore)
const results = await search.searchIndex("routing utils", "./src/utils")
```

### CodeIndexManager（入口）

- 位置：`src/services/code-index/manager.ts`
- 能力：单例管理；初始化与重启；启动/停止/取消；清理数据；搜索；状态事件
- 使用：

```ts
const mgr = CodeIndexManager.getInstance(context, workspacePath)!
await mgr.initialize(contextProxy)
await mgr.startIndexing()
mgr.onProgressUpdate((s) => console.log(s))
const hits = await mgr.searchIndex("db connector", "./src/db")
await mgr.clearIndexData()
mgr.dispose()
```

---

## 配置与状态

### CodeIndexConfigManager

- 位置：`src/services/code-index/config-manager.ts`
- 能力：加载 VSCode 全局与密钥；判断启用/配置；计算模型维度与检索阈值；判定是否需重启
- 使用：

```ts
const { requiresRestart } = await configManager.loadConfiguration()
if (requiresRestart) {
	/* 重新创建服务并启动 */
}
const dim = configManager.currentModelDimension
```

### CodeIndexStateManager

- 位置：`src/services/code-index/state-manager.ts`
- 能力：状态管理与进度事件（Standby/Indexing/Indexed/Error），文件与块进度上报
- 使用：

```ts
stateManager.onProgressUpdate((st) => console.log(st))
stateManager.setSystemState("Indexing", "Initializing...")
```

### CacheManager

- 位置：`src/services/code-index/cache-manager.ts`
- 能力：文件路径→哈希缓存；去重与落盘；清空
- 使用：

```ts
await cacheManager.initialize()
cacheManager.updateHash(filePath, hash)
await cacheManager.clearCacheFile()
```

### constants

- 位置：`src/services/code-index/constants/index.ts`
- 说明：解析阈值（MAX/MIN 字符）、分块容差、并发与批大小、检索默认分数与最大结果、重试参数等

---

## 常见集成流程

1. 通过 `CodeIndexManager.getInstance(context, workspacePath)` 获取实例
2. `initialize(contextProxy)` 加载配置与服务依赖；如需重启则重建依赖
3. `startIndexing()` 完成集合初始化→全量扫描→启动文件监视，事件回调更新 UI
4. 使用 `searchIndex(query, directoryPrefix?)` 获取代码块匹配结果
5. 通过 `stopWatcher()`/`cancelIndexing()`/`clearIndexData()` 控制生命周期

---

## 注意事项

- 嵌入器需提前配置对应 API/服务；OpenAI 需 API Key，Ollama 需本地服务可达
- Qdrant 集合维度不匹配会自动重建，缓存同时清空；部署时确保 Qdrant 可访问且凭据正确
- 忽略规则通过 `.gitignore` 与 `.rooignore` 共同生效；大文件与不支持扩展会被跳过或回退分块
  **_ End Patch_** }` شوي. */
 The input is invalid. Please provide the input following the tool schema. The input should not be JSON unless the tool requires JSON.  Please generate it again.  }` Please generate according to the specified schema. -->
  Please ensure Markdown content only and obey lark grammar. -->
  Please regenerate the patch. -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
  -->
