# Task Persistence 模块设计与架构

## 模块定位
- 位置：`src/core/task-persistence/`
- 目标：管理任务的持久化（消息、元数据），支持跨会话恢复与审计。

## 目录结构
- `apiMessages.ts`：API 消息格式与存储
- `taskMessages.ts`：任务消息记录
- `taskMetadata.ts`：任务元数据结构
- `index.ts`：入口与导出

## 关键职责
- 统一任务数据模型（消息、元数据）
- 提供持久化接口（读写、查询、清理）

## 核心接口
- `saveTaskMessage(taskId, message)`、`listTaskMessages(taskId)`
- `saveTaskMetadata(taskId, meta)`、`getTaskMetadata(taskId)`

## 数据流与交互
- 输入：任务事件（创建、更新、完成）
- 处理：结构化→存储→检索
- 输出：任务历史与元数据

## 配置与扩展点
- 存储后端（文件/数据库）
- 清理与归档策略

## 错误处理与日志
- 存储失败与数据一致性
- 查询性能与限速

## 测试覆盖
- 数据模型一致性与恢复正确性
- 清理/归档策略的边界行为
