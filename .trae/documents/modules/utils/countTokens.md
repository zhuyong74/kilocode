# countTokens

- 路径: `kilocode/src/utils/countTokens.ts`
- 概述: 统计模型输入的 token 数量（结合 tiktoken 或供应商协议）。

## 导出 API
- `type CountTokensOptions`
- `countTokens(blocks: ContentBlockParam[], options?: CountTokensOptions): Promise<number>`

## 使用示例
```ts
import { countTokens } from "kilocode/src/utils/countTokens";

const tokens = await countTokens([{ type: "text", text: "hello" }]);
```

## 注意事项
- 计数依赖具体模型与编码规则，结果用于限流或费用估算。
- 建议与 `tiktoken` 辅助工具搭配使用以保持一致性。