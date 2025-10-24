# Webview 模块设计与架构

## 模块定位
- 位置：`src/core/webview/`
- 目标：提供与 VS Code Webview 的交互桥接，处理消息路由、内容生成与安全。

## 目录结构
- `ClineProvider.ts`：webview 提供者
- `webviewMessageHandler.ts`：消息路由与处理
- `checkpointRestoreHandler.ts`：检查点恢复交互
- `generateSystemPrompt.ts`：系统提示生成（供 webview 展示）
- `kiloWebviewMessgeHandlerHelpers.ts`：消息处理辅助
- `kilorules.ts`：规则展示/加载
- `getUri.ts`、`getNonce.ts`：资源 URI 与安全 nonce
- `__tests__/`：交互与安全测试

## 关键职责
- 初始化与管理 webview 生命周期
- 处理来自 webview 的消息与命令，并回传结果
- 生成展示内容（系统提示、规则、状态）

## 核心接口
- `createWebviewPanel(ctx)`、`postMessage(type, payload)`
- 处理器：`onMessage(message)` 路由到对应处理函数

## 数据流与交互
- 输入：用户在 webview 的操作与消息
- 处理：消息解析→路由→调用核心/服务→结果回传
- 输出：UI 更新与反馈消息

## 配置与扩展点
- 安全策略（nonce、内容安全策略）
- 消息协议与类型扩展

## 错误处理与日志
- UI 通信失败重试与降级
- 安全校验与违规阻断

## 测试覆盖
- 消息路由的正确性
- 安全策略与资源加载
