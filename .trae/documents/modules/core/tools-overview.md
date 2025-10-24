# Tools 模块设计与架构（总览）

## 模块定位
- 位置：`src/core/tools/`
- 目标：提供核心工具集合（读写、搜索、执行、模式切换等），为任务与提示构建提供可调用的动作。

## 目录结构（节选）
- 通用工具：`readFileTool.ts`、`writeToFileTool.ts`、`searchFilesTool.ts`、`codebaseSearchTool.ts`
- 编辑/变更：`applyDiffTool.ts`、`insertContentTool.ts`、`multiApplyDiffTool.ts`
- 任务/模式：`newTaskTool.ts`、`switchModeTool.ts`
- 执行/集成：`executeCommandTool.ts`、`accessMcpResourceTool.ts`、`useMcpToolTool.ts`
- 辅助：`ToolRepetitionDetector.ts`、`validateToolUse.ts`、`helpers/`、`kilocode/`、`kilocode.ts`
- 其他：`attemptCompletionTool.ts`、`askFollowupQuestionTool.ts`、`generateImageTool.ts` 等
- `__tests__/`：工具行为测试

## 关键职责
- 为任务提供可组合、可审计的动作
- 封装跨模块能力（搜索/编辑/执行）为统一接口

## 核心接口模式
- `Tool`：`name`、`description`、`execute(args, ctx)`、`schema`
- 验证器：`validateToolUse(tool, args)`
- 重复检测：`ToolRepetitionDetector` 防止无效循环调用

## 数据流与交互
- 输入：工具调用请求（名称、参数、上下文）
- 处理：校验→执行→结果格式化→审计
- 输出：统一结果结构（成功/失败、输出、变更）

## 配置与扩展点
- 工具注册表与禁用列表
- 权限/保护策略与日志路由

## 错误处理与日志
- 参数校验失败与保护策略阻断
- 执行失败的诊断与回滚提示

## 测试覆盖
- 关键工具（读写/搜索/编辑/执行）路径测试
- 验证器与重复检测的边界案例
