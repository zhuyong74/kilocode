# path

- 路径: `kilocode/src/utils/path.ts`
- 概述: 工作区路径辅助，提供路径相等判断、可读路径展示与相对化工具。

## 导出 API
- `arePathsEqual(path1?: string, path2?: string): boolean`
- `getReadablePath(cwd: string, relPath?: string): string`
- `toRelativePath(filePath: string, cwd: string): string`
- `getWorkspacePath(defaultCwdPath?: string): string`
- `getWorkspacePathForContext(contextPath?: string): string`

## 使用示例
```ts
import { toRelativePath } from "kilocode/src/utils/path";

const rel = toRelativePath("/repo/src/index.ts", "/repo");
```

## 注意事项
- 路径大小写与分隔符在不同 OS 上有差异，内部已做归一。