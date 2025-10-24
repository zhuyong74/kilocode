# Ghost 服务设计与架构（智能补全）

## 模块定位
- 位置：`src/services/ghost/`
- 目标：提供流式、上下文感知的代码智能补全与可视化反馈。

## 目录结构
- 基础：`GhostProvider.ts`、`GhostModel.ts`、`GhostContext.ts`、`GhostCursor.ts`
- 渲染：`GhostDecorations.ts`、`GhostGutterAnimation.ts`、`GhostStatusBar.ts`
- 解析：`GhostStreamingParser.ts`、`GhostSuggestions.ts`
- 存储与编辑：`GhostDocumentStore.ts`、`GhostWorkspaceEdit.ts`
- 配置与常量：`EditorConfiguration.ts`、`ghostConstants.ts`、`types.ts`
- 策略：`strategies/`（自动触发、诊断辅助等）
- 工具：`utils/`（高亮、SVG 渲染、diff、文本测量、HTML 解析）
- `index.ts`：入口导出
- `__tests__/`：覆盖解析、性能、渲染、集成等

## 关键职责
- 监听编辑器上下文，进行实时请求与流式解析
- 渲染补全预览与状态反馈（状态栏、gutter 动画）
- 管理建议的生命周期（生成、接受、取消、恢复）

## 核心组件
- `GhostProvider`：主控制器，连接模型与编辑器
- `GhostStreamingParser`：边接收边解析，处理分块/去噪/合并
- `GhostDecorations`：可视化与主题映射
- `GhostDocumentStore`：缓存文档、建议与操作历史

## 数据流与交互
- 触发：光标/编辑事件 → Provider 决策策略 → 请求模型
- 渲染：解析流 → decorations/gutter/statusbar → 用户交互（接受/忽略）
- 编辑：应用建议 → WorkspaceEdit → 回写存储与上下文

## 对外 API
- `start(context)`、`stop()`、`requestSuggestion(editorState)`
- 事件：`onSuggestion`, `onAccepted`, `onCancelled`

## 配置与扩展点
- 触发策略（自动/手动/延迟）
- 渲染主题与动画参数
- 解析降噪插件与语言高亮

## 错误处理与日志
- 流式解析错误隔离与恢复
- 渲染失败降级（简化高亮/隐藏动画）

## 性能与体验
- 减少重绘与批量更新 decorations
- 低延迟流式合并与去重

## 测试覆盖
- 流式解析与边界案例
- 渲染快照与主题映射
- 集成性能与用户交互路径
