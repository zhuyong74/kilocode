# pathUtils

- 路径: `kilocode/src/utils/pathUtils.ts`
- 概述: 路径安全辅助，识别路径是否位于工作区之外以避免越界访问。

## 导出 API
- `isPathOutsideWorkspace(filePath: string): boolean`

## 使用示例
```ts
import { isPathOutsideWorkspace } from "kilocode/src/utils/pathUtils";

if (isPathOutsideWorkspace("/etc/hosts")) {
  // block access
}
```

## 注意事项
- 用于限制潜在危险路径访问，配合权限策略使用。