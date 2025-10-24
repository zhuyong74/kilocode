# globalContext

- 路径: `kilocode/src/utils/globalContext.ts`
- 概述: 管理扩展的全局文件路径与设置目录，确保必要目录存在。

## 导出 API
- `getGlobalFsPath(context: ExtensionContext): Promise<string>`
- `ensureSettingsDirectoryExists(context: ExtensionContext): Promise<string>`

## 使用示例
```ts
import { getGlobalFsPath, ensureSettingsDirectoryExists } from "kilocode/src/utils/globalContext";

const base = await getGlobalFsPath(context);
const settingsDir = await ensureSettingsDirectoryExists(context);
```

## 注意事项
- 需使用扩展上下文，路径通常位于 VS Code 的全局存储区。
- 目录创建失败时需进行错误提示与降级处理。