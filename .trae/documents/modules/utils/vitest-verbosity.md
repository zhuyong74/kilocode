# vitest-verbosity

- 路径: `kilocode/src/utils/vitest-verbosity.ts`
- 概述: 根据命令行参数与环境变量解析 Vitest 的输出详细等级，便于在 CI 或本地调整日志量。

## 导出 API
- `resolveVerbosity(argv?: string[], env?: NodeJS.ProcessEnv): "quiet" | "default" | "verbose"`

## 使用示例
```ts
import { resolveVerbosity } from "kilocode/src/utils/vitest-verbosity";

const level = resolveVerbosity(process.argv, process.env);
```

## 注意事项
- 支持通过环境变量与 CLI 标志决定详细程度。
- 在 CI 中可降低冗余输出以加速日志查看。