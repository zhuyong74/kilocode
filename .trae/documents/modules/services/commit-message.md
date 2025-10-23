# Commit Message 服务设计与架构

## 模块定位
- 位置：`src/services/commit-message/`
- 目标：生成合规、上下文相关的 Git 提交信息，集成 VS Code Git 扩展。

## 目录结构
- `CommitMessageProvider.ts`：核心消息生成器
- `GitExtensionService.ts`：与 VS Code Git 扩展交互
- `exclusionUtils.ts`：排除规则（文件/路径/前缀）
- `index.ts`：入口与导出
- `__tests__/`：生成与进度反馈测试

## 关键职责
- 聚合变更摘要、文件列表、工作树状态
- 依据规范（如 Conventional Commits）生成消息
- 与编辑器/扩展交互，写入或建议消息

## 核心类与接口
- `CommitMessageProvider`：`generate(context)` 返回消息草稿
- `GitExtensionService`：`getRepoState()`、`applyCommitMessage(msg)`

## 数据流与交互
- 输入：变更集合、用户偏好、排除规则
- 处理：提取影响范围 → 分类 → 生成消息 → 校验规范
- 输出：建议消息、最终写入状态

## 配置与扩展点
- 消息模板与规范适配器
- 排除规则与文件类型过滤
- 进度与回滚策略

## 错误处理与日志
- 扩展不可用/仓库未打开/空变更的提示
- 生成失败的降级与手动模式

## 测试覆盖
- 各类变更组合的消息生成
- 排除规则与规范校验
