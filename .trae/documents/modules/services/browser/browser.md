# Browser 服务设计与架构

## 模块定位
- 位置：`src/services/browser/`
- 目标：提供浏览器集成能力，用于网页内容获取与自动化交互，支撑知识检索、网页解析等场景。

## 目录结构
- `BrowserSession.ts`：封装浏览器会话管理与状态
- `UrlContentFetcher.ts`：URL 内容抓取与解析
- `browserDiscovery.ts`：浏览器可用性探测与运行环境发现
- `__tests__/`：单元测试覆盖核心功能

## 关键职责
- 管理浏览器会话生命周期（创建、复用、销毁）
- 请求网页内容并进行基本清洗与解析
- 提供通用的自动化操作接口（可扩展）

## 核心类与接口
- `BrowserSession`：维护会话、cookie、headers、超时策略
- `UrlContentFetcher`：实现 `fetch(url, options)`，支持重试、速率限制、内容类型识别

## 数据流与交互
- 输入：URL 或操作指令
- 处理：会话层统一注入配置 → 抓取器发起请求 → 解析文本/HTML → 返回结构化结果
- 输出：正文文本、元数据（标题、content-type、响应码等）

## 对外 API
- `createSession(config)`：创建会话实例
- `fetchContent(url, opts)`：获取并解析内容
- 约定：返回统一的 `ContentResult { text, metadata }`

## 配置与扩展点
- 会话配置：并发、超时、代理、User-Agent
- 抓取策略：重试次数、退避策略、内容清洗管线（可插拔）

## 错误处理与日志
- 明确的错误分类：网络错误、解析错误、超时
- 关键路径日志：请求耗时、重试次数、最终结果大小

## 性能考虑
- 连接复用与并发控制
- 响应流式解析，避免一次性载入巨量内容

## 测试覆盖
- 会话生命周期测试
- 抓取重试与错误分支测试
- 常见内容类型解析快照测试
