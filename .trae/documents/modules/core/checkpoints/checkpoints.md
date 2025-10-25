# Core Checkpoints 模块设计与架构

## 模块定位

- 位置：`src/core/checkpoints/`
- 目标：在核心流程中协调检查点相关逻辑（与 services/checkpoints 互补），面向核心调用方提供便捷入口。

## 目录结构

- `index.ts`：核心入口与导出
- `kilocode/`：项目内的特化适配
- `__tests__/`：核心交互测试

## 关键职责

- 将检查点能力适配到核心数据流（任务、webview、工具链）
- 提供统一的调用接口，简化上层使用

## 核心接口

- `createCheckpoint(ctx, options)`、`restoreCheckpoint(id)` 等对 service 的薄封装
- 与核心事件路由/状态系统的集成

## 数据流与交互

- 输入：任务上下文与文件集合
- 处理：参数适配→调用 service 层→回传与状态更新
- 输出：检查点元信息、恢复结果

## 配置与扩展点

- 统一核心级的排除规则与策略
- 与 webview 的交互事件（如恢复提示）

## 错误处理与日志

- 跨层调用的错误分类与提示
- 状态一致性检查

## 测试覆盖

- 核心入口的集成与边界行为
