# logging/CompactTransport

- 路径: `kilocode/src/utils/logging/CompactTransport.ts`
- 概述: 日志传输层接口实现，负责将日志条目写入目标介质。

## 导出 API
- `class CompactTransport implements ICompactTransport`

## 使用示例
```ts
import { CompactTransport } from "kilocode/src/utils/logging/CompactTransport";

const transport = new CompactTransport(/* config */);
```

## 注意事项
- 自定义传输层需实现 `ICompactTransport` 接口。
- 关注写入性能与并发控制。