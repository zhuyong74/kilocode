# xml-matcher

- 路径: `kilocode/src/utils/xml-matcher.ts`
- 概述: XML 匹配器，用于在解析后的 XML 结构中进行模式匹配并返回匹配结果描述。

## 导出 API
- `interface XmlMatcherResult`（匹配结果结构）
- `class XmlMatcher<Result = XmlMatcherResult>`（匹配器类，支持自定义结果类型）

## 使用示例
```ts
import { XmlMatcher } from "kilocode/src/utils/xml-matcher";

const matcher = new XmlMatcher();
const result = matcher.match("<node attr=\"1\"/>", {/* pattern */});
```

## 注意事项
- 需先将 XML 文本解析为结构或由匹配器内部处理解析。
- 模式设计需考虑节点属性、层次结构与文本内容。