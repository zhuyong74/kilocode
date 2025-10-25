# Ignore 模块设计与架构

## 模块定位

- 位置：`src/core/ignore/`
- 目标：管理 RooIgnore 规则并为核心数据流与工具链提供统一的忽略策略。

## 目录结构

- `RooIgnoreController.ts`：忽略控制器
- `__mocks__/`、`__tests__/`：测试与模拟

## 关键职责

- 聚合来自配置/项目文件的忽略规则
- 提供路径与内容过滤接口（对搜索/索引/编辑生效）

## 核心接口

- `loadRules(sources)`、`shouldIgnore(path)`、`filter(paths)`

## 数据流与交互

- 输入：规则来源（配置、.rooignore、临时规则）
- 处理：合并→编译→过滤
- 输出：过滤后的路径集与统计

## 配置与扩展点

- 规则优先级与来源权重
- 与 services/glob 与 search 的协作

## 错误处理与日志

- 非法规则的诊断与忽略
- 过滤命中统计与性能日志

## 测试覆盖

- 复杂规则合并与边界匹配
