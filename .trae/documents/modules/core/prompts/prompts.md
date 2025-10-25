# Prompts 模块设计与架构

## 模块定位

- 位置：`src/core/prompts/`
- 目标：管理系统/工具/响应等提示词的生成、组织与组合，服务于任务与工具链调用。

## 目录结构

- `commands.ts`：命令提示
- `instructions/`：指令模板
- `responses.ts`：响应模板
- `sections/`：提示结构片段
- `system.ts`：系统提示
- `tools/`：工具提示
- `types.ts`：类型定义
- `utilities/`：辅助函数
- `__tests__/`

## 关键职责

- 统一管理提示词结构与模板
- 根据模式/任务/上下文组合提示词

## 核心接口

- `buildSystemPrompt(mode)`、`buildToolPrompt(tool, ctx)`
- `composePrompt(sections, ctx)`：拼接并渲染模板

## 数据流与交互

- 输入：上下文、模式、工具需求
- 处理：选择模板→注入上下文→组合→渲染
- 输出：最终提示词字符串/结构

## 配置与扩展点

- 模板版本与本地化
- 片段库与组合策略

## 错误处理与日志

- 模板缺失/字段不匹配的提示
- 渲染耗时与结果质量评估

## 测试覆盖

- 各模板组合的正确性
- 模式切换下的一致性
