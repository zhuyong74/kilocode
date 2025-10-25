# Assistant Message 模块

## 概述

Assistant Message 模块负责处理 AI 助手消息的解析、处理和展示。

## 文档结构

- `assistant-message.md` - 模块技术文档，包含详细的功能说明和 API 文档
- `assistant-message-architecture.md` - 模块架构设计文档，包含组件架构和数据模型

## 主要功能

- 消息解析：解析 AI 助手的流式响应消息
- 工具提取：从消息中提取工具调用信息
- 内容处理：处理文本内容和工具使用块
- 流式处理：支持实时流式消息处理
- 错误处理：处理解析过程中的各种异常情况

## 核心组件

- `parseAssistantMessage`: 消息解析核心函数
- `presentAssistantMessage`: 消息展示和工具执行协调
- `AssistantMessageParser`: 消息解析器类
- `NativeToolCall`: 原生工具调用接
