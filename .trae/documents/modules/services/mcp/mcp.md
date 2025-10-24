# MCP 服务设计与架构（Model Context Protocol）

## 模块定位
- 位置：`src/services/mcp/`
- 目标：实现 MCP 协议的连接、消息分发与服务管理，支撑多服务协作。

## 目录结构
- `McpHub.ts`：协议事件总线与路由
- `McpServerManager.ts`：服务器生命周期管理
- `kilocode/NotificationService.ts`：项目内通知集成
- `__tests__/McpHub.spec.ts`：消息分发测试

## 关键职责
- 维护 MCP 连接，管理服务注册与路由
- 分发请求与事件，提供订阅/发布机制
- 与本地通知/状态系统集成

## 核心组件
- `McpHub`：`subscribe(topic, handler)`、`publish(event)`、`request(service, payload)`
- `McpServerManager`：`start(config)`、`stop()`、健康检查与重连

## 数据流与交互
- 输入：外部/内部消息（请求、事件）
- 处理：路由解析→权限与状态校验→分发给服务→聚合结果
- 输出：统一响应与通知事件

## 配置与扩展点
- 连接参数（端口、认证、重连策略）
- 主题路由与权限模型

## 错误处理与日志
- 连接中断与重试策略
- 未注册服务/未知主题的防御

## 测试覆盖
- 路由与订阅的正确性
- 服务管理的生命周期与异常分支
