# safeWriteJson

- 路径: `kilocode/src/utils/safeWriteJson.ts`
- 概述: 可靠写入 JSON 文件，防止数据丢失与部分写入。

## 导出 API
- `safeWriteJson(...): Promise<void>`

## 使用示例
```ts
import { safeWriteJson } from "kilocode/src/utils/safeWriteJson";

await safeWriteJson("/path/to/file.json", { a: 1 });
```

## 注意事项
- 可能采用临时文件与原子替换策略，避免写入中断。
- 建议配合 `createDirectoriesForFile` 保证目录存在。