# storage

- 路径: `kilocode/src/utils/storage.ts`
- 概述: 扩展的持久化存储路径管理与用户自定义路径提示工具。

## 导出 API（节选）
- `getStorageBasePath(defaultPath: string): Promise<string>`
- `getTaskDirectoryPath(globalStoragePath: string, taskId: string): Promise<string>`
- `getSettingsDirectoryPath(globalStoragePath: string): Promise<string>`
- `getCacheDirectoryPath(globalStoragePath: string): Promise<string>`
- `promptForCustomStoragePath(): Promise<void>`

## 使用示例
```ts
import { getStorageBasePath } from "kilocode/src/utils/storage";

const base = await getStorageBasePath("~/.kilocode");
```

## 注意事项
- 用户可能设置自定义路径，需要权限与可写性校验。
- 路径变更需迁移旧数据或提示。