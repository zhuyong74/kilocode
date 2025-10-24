# single-completion-handler

- 路径: `kilocode/src/utils/single-completion-handler.ts`
- 概述: 单次补全/回答处理工具，根据给定的提供商配置与提示文本生成一条响应。

## 导出 API
- `singleCompletionHandler(apiConfiguration: ProviderSettings, promptText: string): Promise<string>`

## 使用示例
```ts
import { singleCompletionHandler } from "kilocode/src/utils/single-completion-handler";

const reply = await singleCompletionHandler(providerSettings, "Explain binary search");
```

## 注意事项
- 需传入有效的 `ProviderSettings`，包含模型、密钥等必需信息。
- 返回为字符串响应，如需结构化解析请在上层进行格式约定。