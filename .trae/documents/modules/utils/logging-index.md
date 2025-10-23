# logging/index

- 路径: `kilocode/src/utils/logging/index.ts`
- 概述: 日志模块入口，提供默认 `logger` 实例并根据环境切换实现。

## 导出 API
- `const logger: ILogger`

## 使用示例
```ts
import { logger } from "kilocode/src/utils/logging";

logger.info("started");
```

## 注意事项
- 测试环境使用紧凑记录器，生产环境可能使用空实现或完整实现。
- 根据 `NODE_ENV` 控制行为，注意在打包与运行时的一致性。