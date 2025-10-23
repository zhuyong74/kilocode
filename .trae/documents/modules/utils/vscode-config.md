# vscode-config

- 路径: `kilocode/src/utils/vscode-config.ts`
- 概述: VS Code 用户数据目录与配置文件读取工具，提供 JSON5 解析与本地文件读取能力检测。

## 导出 API
- `getUserDataBaseDir(): string`
- `readJSON5File(filePath: string): Promise<unknown | null>`
- `canReadLocalFiles(): boolean`
- `readUserConfigFile(filename: string): Promise<Array<Record<string, unknown>>>`

## 使用示例
```ts
import { getUserDataBaseDir, readUserConfigFile } from "kilocode/src/utils/vscode-config";

const base = getUserDataBaseDir();
const configs = await readUserConfigFile("settings.json");
```

## 注意事项
- 不同平台下用户数据基础目录不同；函数已处理常见差异。
- JSON5 文件可能包含注释与尾随逗号，解析时需兼容。