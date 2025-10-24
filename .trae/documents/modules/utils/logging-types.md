# logging/types

- 路径: `kilocode/src/utils/logging/types.ts`
- 概述: 日志模块的类型定义，包括条目结构、等级与传输接口。

## 导出 API（节选）
- `interface CompactLogEntry`
- `const LOG_LEVELS: readonly ["debug", "info", "warn", "error", "fatal"]`
- `type LogLevel`
- `interface LogMeta`
- `interface CompactTransportConfig`
- `interface ICompactTransport`
- `interface ILogger`

## 使用示例
```ts
import type { LogLevel, ILogger } from "kilocode/src/utils/logging/types";
```

## 注意事项
- 等级枚举需与实现保持一致。
- 在公共 API 中暴露的类型可用于第三方扩展集成。