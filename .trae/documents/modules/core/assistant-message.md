# Assistant Message 模块设计与架构

## 模块定位
- 位置：`src/core/assistant-message/`
- 目标：解析与呈现来自助手的消息（不同版本的解析管线），并适配项目的展示与路由需求。

## 目录结构
- `AssistantMessageParser.ts`：通用解析器封装
- `parseAssistantMessage.ts` / `parseAssistantMessageV2.ts`：不同版本的解析实现
- `presentAssistantMessage.ts`：呈现层适配（结构化为 UI/日志/上下文）
- `index.ts`：导出统一接口
- `kilocode/`：项目内特化适配
- `__tests__/`：解析与呈现的单元测试

## 关键职责
- 将原始助手响应转换为结构化消息（文本、代码块、引用、动作）
- 维护解析版本，提供向后兼容的策略
- 将消息投递给上层（webview/日志/上下文）

## 核心类与接口
- `AssistantMessageParser`：`parse(raw, opts)` 返回 `StructuredMessage`
- 呈现器：`present(message, channels)` 将结构化消息投递到目标渠道

## 数据流与交互
- 输入：原始响应（字符串/富文本/JSON）
- 处理：版本选择→解析→结构化→呈现适配
- 输出：统一的 `StructuredMessage` 及呈现效果

## 对外 API
- `parseAssistantMessageV1/V2(raw)`：版本化解析
- `presentAssistantMessage(message, ctx)`：呈现到 UI/日志/上下文

## 配置与扩展点
- 解析策略插件（代码块识别、引用提取）
- 呈现渠道与模板（主题/语言）

## 错误处理与日志
- 非法响应/不支持版本的降级处理
- 解析失败的诊断日志与原文保留

## 测试覆盖
- 不同格式响应的解析正确性
- 呈现层的快照与渠道路由
