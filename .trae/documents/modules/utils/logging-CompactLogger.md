# logging/CompactLogger

- 路径: `kilocode/src/utils/logging/CompactLogger.ts`
- 概述: 轻量日志记录器，实现紧凑格式与可插拔传输层。

## 导出 API
- `class CompactLogger implements ILogger`

## 使用示例
```ts
import { CompactLogger } from "kilocode/src/utils/logging/CompactLogger";

const logger = new CompactLogger();
logger.info("hello");
```

## 注意事项
- 与 `CompactTransport` 配合以输出到不同目标（控制台、文件、Channel）。
- 生产与测试环境可采用不同实例或等级策略。