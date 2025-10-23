# usage-tracker

- 路径: `kilocode/src/utils/usage-tracker.ts`
- 概述: 使用统计与事件追踪工具，记录关键操作与使用频次以便分析与优化。

## 导出 API
- `class UsageTracker`（构造与方法用于记录使用事件与生成报告）

## 使用示例
```ts
import { UsageTracker } from "kilocode/src/utils/usage-tracker";

const tracker = new UsageTracker();
tracker.record("command.executed", { id: "kilocode.openPanel" });
```

## 注意事项
- 结合隐私策略与用户授权使用，避免收集敏感数据。
- 建议支持批量/节流上报，降低性能开销。