# fs

- 路径: `kilocode/src/utils/fs.ts`
- 概述: 文件系统辅助工具，提供安全的文件/目录检测与读取。

## 导出 API
- `createDirectoriesForFile(filePath: string): Promise<string[]>`
- `fileExistsAtPath(filePath: string): Promise<boolean>`
- `isDirectory(filePath: string): Promise<boolean>`
- `readDirectory(directoryPath: string, excludedPaths?: string[][]): Promise<string[]>`

## 使用示例
```ts
import { fileExistsAtPath, readDirectory } from "kilocode/src/utils/fs";

if (await fileExistsAtPath("/path/to/file")) {
  const entries = await readDirectory("/path/to/dir");
}
```

## 注意事项
- 异步 IO 需做好错误处理与超时控制。
- `excludedPaths` 可用于跳过大目录或无关路径。