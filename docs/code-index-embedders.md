# Code Index Embedders 模块技术文档

## 作用与定位

- 模块位置：`src/services/code-index/embedders/`
- 核心作用：将代码块文本批量转换为向量表示，供向量库（Qdrant）进行相似性检索；同时负责连接各嵌入模型提供方并统一错误治理与配置校验。
- 在 Code Index 中的角色：
    - 目录扫描（Scanner）与文件监视（FileWatcher）会将解析得到的 `CodeBlock.content` 批量发送到 `IEmbedder.createEmbeddings`，再与向量库点位 `vector` 绑定。
    - 查询服务（SearchService）在用户搜索时调用嵌入器为查询文本生成单向量，再进行向量检索。

## 接口与实现

- 抽象接口：`IEmbedder`（`createEmbeddings(texts: string[], model?: string): Promise<EmbeddingResponse>`、`validateConfiguration()`、`embedderInfo`）[interfaces/embedder.ts](file:///d:/zyhome_work/kilocode/src/services/code-index/interfaces/embedder.ts)
- 实现种类：
    - `openai.ts`：基于 OpenAI Embeddings API，支持批处理与指数退避重试
    - `ollama.ts`：本地 Ollama 服务的嵌入接口；支持超时与服务可达性校验
    - `openai-compatible.ts`：兼容 OpenAI Embeddings 的自定义网关（baseUrl + apiKey）
    - `gemini.ts`：Google Gemini Embeddings
    - `mistral.ts`：Mistral Embeddings
    - `vercel-ai-gateway.ts`：Vercel AI Gateway 接入
- 选择与创建：由 `CodeIndexServiceFactory.createEmbedder()` 根据 `CodeIndexConfigManager` 当前配置（provider、model、鉴权）进行选择与实例化 [service-factory.ts](file:///d:/zyhome_work/kilocode/src/services/code-index/service-factory.ts#L35-L87)

## 工作流程（文本 → 向量）

1. 解析器切分代码：`Parser.parseFile(file)` 生成 `CodeBlock[]`（其中 `content` 是代码块文本）
2. 累积批次：`Scanner` 将块内容累积到 `batchTexts`，当达到阈值（`embeddingBatchSize` 或默认值）触发嵌入与写库
3. 生成嵌入：`IEmbedder.createEmbeddings(batchTexts)` 返回向量数组（与输入文本顺序对齐）
4. 构造点位：将每个代码块向量与 payload 绑定为向量库点位（`id`、`vector`、`payload`）
5. Upsert：批量 `upsertPoints(points)` 写入 Qdrant，并更新缓存

## 关键实现细节

- OpenAI 嵌入器（示例）[embedders/openai.ts](file:///d:/zyhome_work/kilocode/src/services/code-index/embedders/openai.ts#L21-L127)
    - 批处理令牌上限：`MAX_BATCH_TOKENS`，单项上限：`MAX_ITEM_TOKENS`
    - 模型前缀：根据 provider/model 决定 `getModelQueryPrefix`，用于兼容不同语义模型需要的输入前缀（如 `embedding-compat:`）；超过令牌上限时自动回退为原文本
    - 重试机制：429 限流时指数退避，最多 `MAX_RETRIES` 次 [openai.ts:134-187](file:///d:/zyhome_work/kilocode/src/services/code-index/embedders/openai.ts#L134-L187)
    - 校验：`validateConfiguration()` 进行最小嵌入请求以确认密钥与服务可用性 [openai.ts:193-229](file:///d:/zyhome_work/kilocode/src/services/code-index/embedders/openai.ts#L193-L229)
- Ollama 嵌入器（示例）[embedders/ollama.ts](file:///d:/zyhome_work/kilocode/src/services/code-index/embedders/ollama.ts#L17-L138)
    - 本地服务：`POST /api/embed`，请求体包含 `model` 与 `input: string[]`
    - 超时与服务检查：为嵌入与模型列表请求设置超时；无法连接/未运行时返回明确错误
    - 错误治理：统一清洗消息并上报遥测，Abort/ENOTFOUND/ECONNREFUSED 等错误统一归类
- 其他提供方（兼容）
    - `openai-compatible.ts`：以 baseUrl+apiKey 连接；工作流与 OpenAI 类似，简化错误治理
    - `gemini.ts`、`mistral.ts`、`vercel-ai-gateway.ts`：鉴权与调用方式不同，但均实现相同接口以保持流程一致性

## 错误治理与健壮性

- 统一错误清洗：使用 `validation-helpers` 将 URL/路径/IP/邮箱等敏感信息替换为占位，便于日志与遥测 [shared/validation-helpers.ts](file:///d:/zyhome_work/kilocode/src/services/code-index/shared/validation-helpers.ts)
- 状态上报：嵌入失败/限流重试/配置校验失败等统一上报遥测，并由上层状态管理进行错误展示与恢复
- 前缀与令牌安全：在添加模型前缀时估算令牌量；超过单项上限则回退以避免 API 错误

## 与上下游的接口关系

- 上游：`DirectoryScanner` 与 `FileWatcher` 将 `CodeBlock.content` 批量送入 `createEmbeddings`
- 下游：`QdrantVectorStore` 将返回的向量与 payload 组装为点位并 upsert；`SearchService` 为查询生成向量
- 配置：`CodeIndexConfigManager` 提供 provider、model、baseUrl、apiKey 等；`ServiceFactory` 按配置返回 `IEmbedder` 实例

## 流程图（批处理嵌入）

```mermaid
flowchart TD
  P[Parser CodeBlock] --> S[Scanner Batch Accumulator]
  S -->|batchTexts| E[IEmbedder.createEmbeddings]
  E --> V[Vectors[]]
  V --> U[QdrantVectorStore.upsertPoints]
  U --> C[CacheManager.updateHash]
```

## 架构图（依赖与协作）

```mermaid
flowchart TD
  subgraph Config
    CM[CodeIndexConfigManager]
  end
  subgraph Factory
    SF[ServiceFactory]
  end
  subgraph Runtime
    E[IEmbedder (OpenAI/Ollama/...)]
    VS[QdrantVectorStore]
    SC[DirectoryScanner]
    FW[FileWatcher]
    SS[SearchService]
  end

  CM --> SF
  SF --> E
  SC --> E
  FW --> E
  E --> VS
  SS --> E
  VS -->|search/upsert/delete| Runtime
```

## 配置与调优建议

- 选择 provider：本地开发可用 Ollama；生产使用 OpenAI/Gemini 等；OpenAI-Compatible 适用于自建网关或代理
- 模型维度：与向量库维度一致；通过 `CodeIndexConfigManager` 指定或从嵌入模型档案自动获取
- 批量大小与重试：根据吞吐与限流策略调整 `embeddingBatchSize` 与重试上限；必要时在服务端开启网关限流与缓存

## 示例

```ts
const embedder = factory.createEmbedder() // 根据配置返回 IEmbedder
const { embeddings } = await embedder.createEmbeddings(blocks.map((b) => b.content))
// 将 embeddings 与 blocks 绑定，构造向量库点位并 upsert
```
