# fowardingLogger

- 路径: `kilocode/src/utils/fowardingLogger.ts`
- 概述: 主线程日志转发工具，将扩展中的日志转发到统一通道或输出窗口。

## 导出 API
- `registerMainThreadForwardingLogger(context: vscode.ExtensionContext): void`

## 使用示例
```ts
import { registerMainThreadForwardingLogger } from "kilocode/src/utils/fowardingLogger";

export function activate(context: vscode.ExtensionContext) {
  registerMainThreadForwardingLogger(context);
}
```

## 注意事项
- 需在扩展主线程注册，避免子线程/Worker 环境误用。
- 注意日志量与性能开销，建议批量或按级别过滤。