# Code Index 服务设计与架构

## 模块定位
- 位置：`src/services/code-index/`
- 目标：构建可查询的代码索引与向量检索能力，支撑语义搜索与导航。

## 目录结构
- 管理层：`manager.ts`、`orchestrator.ts`、`service-factory.ts`、`state-manager.ts`
- 配置与缓存：`config-manager.ts`、`cache-manager.ts`
- 接口与常量：`interfaces/`、`constants/`
- 向量存储：`vector-store/qdrant-client.ts`
- 嵌入器：`embedders/`（openai、mistral、ollama、vercel-ai-gateway、gemini 等）
- 处理器：`processors/`（`scanner.ts`、`parser.ts`、`file-watcher.ts`、`index.ts`）
- 查询服务：`search-service.ts`
- 共享工具：`shared/`
- 测试：`__tests__/`

## 关键职责
- 维护项目级代码索引与状态
- 提供语义嵌入生成与向量检索
- 扫描/解析/监听文件变化并增量更新索引

## 核心组件
- `Orchestrator`：协调扫描、解析、嵌入、存储的流水线
- `Manager`：面向外部的统一入口，管理会话与策略
- `ServiceFactory`：按配置生产不同后端/嵌入器组合
- `StateManager`：索引状态与统计信息
- `Embedders/*`：不同供应商的嵌入器适配
- `VectorStore(QdrantClient)`：向量数据的写入/查询
- `Processors(scanner|parser|watcher)`：文件收集、语法解析、变更监听
- `SearchService`：统一查询接口（关键词+语义）

## 流程与数据流
- 初始化：载入配置 → 构建流水线 → 连接向量存储
- 建索引：扫描→解析→生成嵌入→写入向量库→记录元数据
- 查询：关键词检索→语义检索→融合排序→返回代码片段与路径

## 对外 API
- `init(config)`、`reindex(paths)`、`updateOnChange(events)`
- `search(query, options)`：关键词/语义混合搜索
- `getStats()`：索引规模与健康度

## 配置与扩展点
- 嵌入器选择与参数（维度、模型、批量大小）
- 向量存储后端（Qdrant 可替换）
- 解析器与语言支持（Tree-sitter 等）

## 错误处理与日志
- 嵌入/存储失败重试与降级
- 处理流水线阶段耗时与失败率跟踪

## 性能与可扩展性
- 批量嵌入与分片写入
- 监听增量更新避免全量重建
- 并发与背压控制

## 测试覆盖
- 配置/缓存/管理器的单元测试
- 处理器流水线集成测试
- 检索质量与性能基准测试
