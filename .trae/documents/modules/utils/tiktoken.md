# tiktoken

- 路径: `kilocode/src/utils/tiktoken.ts`
- 概述: 通过供应商协议对消息块进行 token 估算，配合 `countTokens` 使用。

## 导出 API
- `tiktoken(content: Anthropic.Messages.ContentBlockParam[]): Promise<number>`

## 使用示例
```ts
import { tiktoken } from "kilocode/src/utils/tiktoken";

const tokens = await tiktoken([{ type: "text", text: "hello" }]);
```

## 注意事项
- 需与具体模型保持一致的编码规则。
- 结果用于配额控制与费用评估。