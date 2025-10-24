# xml

- 路径: `kilocode/src/utils/xml.ts`
- 概述: XML 解析工具，支持按停止节点解析与 diff 友好的解析模式。

## 导出 API
- `parseXml(xmlString: string, stopNodes?: string[], options?: ParseXmlOptions): unknown`
- `parseXmlForDiff(xmlString: string, stopNodes?: string[]): unknown`

## 使用示例
```ts
import { parseXml, parseXmlForDiff } from "kilocode/src/utils/xml";

const ast = parseXml("<a><b/></a>");
const diffAst = parseXmlForDiff("<root>...</root>");
```

## 注意事项
- `stopNodes` 可用于截断深度解析以提升性能。
- diff 模式输出结构更适合比较差异，而非完全语义解析。