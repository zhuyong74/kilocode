# text-normalization

- 路径: `kilocode/src/utils/text-normalization.ts`
- 概述: 文本归一化工具，支持空白压缩、全角半角转换与 HTML 实体反转义。

## 导出 API（节选）
- `NORMALIZATION_MAPS`
- `interface NormalizeOptions`
- `normalizeString(str: string, options?: NormalizeOptions): string`
- `unescapeHtmlEntities(text: string): string`

## 使用示例
```ts
import { normalizeString } from "kilocode/src/utils/text-normalization";

const cleaned = normalizeString("Ｈｅｌｌｏ　Ｗｏｒｌｄ！");
```

## 注意事项
- 针对不同语言与字符集可调整归一化策略。
- 归一化可能影响用户输入显示，需谨慎在 UI 场景使用。