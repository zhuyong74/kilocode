# Mocking 服务设计与架构

## 模块定位
- 位置：`src/services/mocking/`
- 目标：为测试提供编辑器文档/游标等对象的模拟，实现可预测的测试环境。

## 目录结构
- `MockTextDocument.ts`：文档对象模拟
- `MockTextEditor.ts`：编辑器对象模拟
- `__tests__/`：对应的行为与边界测试

## 关键职责
- 提供与真实编辑器 API 对齐的模拟实现
- 支持常见操作（读取、写入、选择、光标移动）

## 核心接口
- `MockTextDocument`：`getText(range)`、`update(content)`
- `MockTextEditor`：`setSelection(range)`、`applyEdit(edits)`

## 数据流与交互
- 测试驱动输入 → Mock 接收并变更内部状态 → 提供断言所需的输出

## 错误处理与日志
- 边界输入的异常与保护
- 状态不一致的断言辅助日志

## 测试覆盖
- 基本编辑操作与选择逻辑
- 与真实 API 的兼容性快照
