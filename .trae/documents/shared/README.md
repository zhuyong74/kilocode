# Kilocode Shared 模块技术文档

## 概述

`src/shared` 目录包含了 Kilocode 项目中所有共享的工具模块和类型定义，这些模块为整个项目提供了基础的功能支持和通用工具。该目录的设计遵循了模块化和可复用的原则，确保代码的一致性和可维护性。

## 目录结构

```
src/shared/
├── api.ts                      # API 相关工具和配置
├── array.ts                    # 数组操作工具函数
├── combineApiRequests.ts       # API 请求合并工具
├── combineCommandSequences.ts  # 命令序列合并工具
├── context-mentions.ts         # 上下文提及处理
├── cost.ts                     # 成本计算工具
├── embeddingModels.ts          # 嵌入模型配置
├── experiments.ts              # 实验功能管理
├── getApiMetrics.ts            # API 指标获取
├── globalFileNames.ts          # 全局文件名管理
├── language.ts                 # 语言处理工具
├── mcp.ts                      # MCP 协议支持
├── modes.ts                    # 模式管理系统
├── package.ts                  # 包信息管理
├── safeJsonParse.ts           # 安全 JSON 解析
├── support-prompt.ts          # 支持提示工具
├── todo.ts                    # Todo 管理工具
├── tools.ts                   # 工具定义和管理
├── vsCodeSelectorUtils.ts     # VSCode 选择器工具
├── ExtensionMessage.ts        # 扩展消息类型定义
├── WebviewMessage.ts          # Webview 消息类型定义
├── ProfileValidator.ts        # 配置验证器
├── checkExistApiConfig.ts     # API 配置检查
├── cline-rules.ts            # Cline 规则管理
├── kilocode/                  # Kilocode 特定工具子目录
│   ├── error.ts              # 错误处理工具
│   ├── task-history.ts       # 任务历史管理
│   ├── headers.ts            # HTTP 头部处理
│   ├── language.ts           # 语言相关工具
│   ├── mcp.ts               # MCP 协议实现
│   ├── rules.ts             # 规则管理
│   └── wrapper.ts           # 包装器工具
└── utils/                     # 通用工具函数
    ├── escapeHtml.ts         # HTML 转义工具
    └── requesty.ts           # HTTP 请求工具
```

## 核心功能模块

### 1. 类型定义模块

- **ExtensionMessage.ts**: 定义扩展与外部系统通信的消息类型
- **WebviewMessage.ts**: 定义 Webview 与主进程通信的消息类型
- **ProfileValidator.ts**: 提供配置文件验证功能

### 2. API 和网络模块

- **api.ts**: 核心 API 配置和路由管理
- **combineApiRequests.ts**: API 请求优化和合并
- **getApiMetrics.ts**: API 性能监控和指标收集
- **checkExistApiConfig.ts**: API 配置验证

### 3. 工具和模式管理

- **tools.ts**: 工具定义、分组和权限管理
- **modes.ts**: 模式系统的核心实现
- **experiments.ts**: 实验性功能的开关管理

### 4. 数据处理模块

- **array.ts**: 数组操作的通用函数
- **safeJsonParse.ts**: 安全的 JSON 解析工具
- **context-mentions.ts**: 上下文引用处理

### 5. 业务逻辑模块

- **todo.ts**: Todo 项目管理
- **cost.ts**: 成本计算和预算管理
- **language.ts**: 多语言支持
- **mcp.ts**: MCP 协议集成

### 6. 系统集成模块

- **vsCodeSelectorUtils.ts**: VSCode 编辑器集成工具
- **globalFileNames.ts**: 全局文件名管理
- **package.ts**: 包管理和依赖处理

## 设计原则

### 1. 模块化设计

每个模块都有明确的职责边界，避免功能重叠和循环依赖。

### 2. 类型安全

广泛使用 TypeScript 类型定义，确保编译时类型检查。

### 3. 可扩展性

通过配置驱动和插件化设计，支持功能的动态扩展。

### 4. 错误处理

统一的错误处理机制，提供详细的错误信息和恢复策略。

### 5. 性能优化

通过缓存、批处理和异步处理等技术优化性能。

## 依赖关系

### 外部依赖

- `@anthropic-ai/sdk`: Anthropic AI SDK
- `@roo-code/types`: 项目类型定义
- `vscode`: VSCode 扩展 API
- `zod`: 运行时类型验证

### 内部依赖

- 各模块之间通过明确的接口进行通信
- 避免循环依赖，保持清晰的依赖层次

## 使用指南

### 1. 导入模块

```typescript
import { getModeBySlug } from "../shared/modes"
import { findLastIndex } from "../shared/array"
import { safeJsonParse } from "../shared/safeJsonParse"
```

### 2. 类型定义

```typescript
import type { ExtensionMessage } from "../shared/ExtensionMessage"
import type { WebviewMessage } from "../shared/WebviewMessage"
```

### 3. 工具使用

```typescript
import { TOOL_GROUPS, getToolsForMode } from "../shared/tools"
import { EXPERIMENT_IDS } from "../shared/experiments"
```

## 开发注意事项

1. **向后兼容性**: 修改共享模块时需要考虑对现有代码的影响
2. **文档更新**: 添加新功能时及时更新相关文档
3. **测试覆盖**: 确保新增功能有相应的单元测试
4. **性能考虑**: 共享模块的性能问题会影响整个项目
5. **安全性**: 特别注意 API 密钥和敏感信息的处理

## 扩展指南

### 添加新工具

1. 在 `tools.ts` 中定义工具类型和参数
2. 在相应的工具组中注册新工具
3. 实现工具的具体逻辑
4. 添加相应的测试用例

### 添加新模式

1. 在 `modes.ts` 中定义模式配置
2. 配置模式的工具组和权限
3. 添加模式的描述和使用说明
4. 测试模式的功能完整性

### 添加新实验功能

1. 在 `experiments.ts` 中注册实验 ID
2. 实现实验功能的开关逻辑
3. 添加实验功能的配置选项
4. 提供实验功能的使用文档

这个共享模块系统为 Kilocode 项目提供了坚实的基础架构，支持项目的持续发展和功能扩展。
