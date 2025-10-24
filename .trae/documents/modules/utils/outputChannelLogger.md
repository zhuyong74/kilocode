# outputChannelLogger

- 路径: `kilocode/src/utils/outputChannelLogger.ts`
- 概述: 基于 VS Code 输出通道的日志记录器，支持单通道与双通道输出。

## 导出 API
- `type LogFunction = (...args: unknown[]) => void`
- `createOutputChannelLogger(outputChannel: vscode.OutputChannel): LogFunction`
- `createDualLogger(outputChannelLog: LogFunction): LogFunction`

## 使用示例
```ts
import { createOutputChannelLogger } from "kilocode/src/utils/outputChannelLogger";

const log = createOutputChannelLogger(vscode.window.createOutputChannel("Kilocode"));
log("initializing...");
```

## 注意事项
- 输出通道需在扩展生命周期管理，避免泄露。
- 双通道记录器可同时写到控制台与 Channel。