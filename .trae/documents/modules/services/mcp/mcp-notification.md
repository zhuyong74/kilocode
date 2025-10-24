# MCP Notification 子模块设计与架构

## 模块定位
- 位置：`src/services/mcp/kilocode/NotificationService.ts`
- 目标：在 MCP 框架下提供项目内通知机制，将事件分发到 UI/日志等渠道。

## 关键职责
- 接收来自 `McpHub` 的事件/消息
- 转换并分发到编辑器通知、状态栏或日志

## 核心接口
- `notify(event)`：事件处理入口
- 渠道适配：`toStatusBar`, `toLog`, `toPopup`

## 数据流与交互
- 输入：MCP 事件
- 处理：分类→格式化→分发
- 输出：用户可见的通知或记录

## 配置与扩展点
- 通知级别与路由
- 本地化与模板

## 错误处理与日志
- 通道不可用的降级与队列
- 通知失败的重试策略
