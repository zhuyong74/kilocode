# Checkpoints 服务设计与架构

## 模块定位
- 位置：`src/services/checkpoints/`
- 目标：提供任务/仓库级别的检查点能力，用于快照、回滚与变更追踪。

## 目录结构
- `RepoPerTaskCheckpointService.ts`：按任务维度的仓库检查点管理
- `ShadowCheckpointService.ts`：影子检查点实现，不影响真实仓库状态
- `excludes.ts`：排除规则与路径过滤
- `types.ts`：类型定义与检查点元数据
- `index.ts`：服务入口与导出
- `__tests__/`：覆盖排除规则、影子实现等逻辑

## 关键职责
- 生成/恢复代码快照
- 管理检查点元数据（作者、时间、范围）
- 支持排除规则，避免无关文件进入快照

## 核心类与接口
- `RepoPerTaskCheckpointService`：面向任务粒度的检查点操作 API
- `ShadowCheckpointService`：面向试验/临时变更的轻量快照
- `CheckpointMeta`：通用元数据结构

## 数据流与交互
- 输入：任务上下文、文件集合、排除规则
- 处理：文件筛选 → 快照生成/应用 → 元数据记录
- 输出：`Checkpoint` 标识与状态报告

## 对外 API
- `createCheckpoint(context, options)`
- `restoreCheckpoint(id)`
- `listCheckpoints(filters)`

## 配置与扩展点
- 排除规则配置（匹配模式、多级目录）
- 存储后端（本地/远端）可插拔

## 错误处理与日志
- 冲突检测与回滚失败分类
- 快照校验与完整性检查日志

## 性能考虑
- 增量快照（diff）减少存储
- 并发操作的锁与一致性

## 测试覆盖
- 排除规则边界测试
- 影子快照正确性与隔离性测试
- 回滚流程与冲突分支测试
