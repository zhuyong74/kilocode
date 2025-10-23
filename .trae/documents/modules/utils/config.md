# config

- 路径: `kilocode/src/utils/config.ts`
- 概述: 注入环境变量与变量占位，支持在运行时将 `.env` 与上下文变量写入到配置对象。

## 导出 API
- `injectEnv<C extends InjectableConfigType>(config: C, notFoundValue?: any): Promise<C>`
- `injectVariables<C extends InjectableConfigType>(config: C, variables: Record<string, unknown>): Promise<C>`

## 使用示例
```ts
import { injectEnv, injectVariables } from "kilocode/src/utils/config";

const cfg = await injectEnv({ token: "${ENV:OPENAI_API_KEY}" });
const resolved = await injectVariables(cfg, { projectId: "abc" });
```

## 注意事项
- 支持对象、数组与原始类型的递归替换，复杂结构需留意。
- 未找到的变量可用 `notFoundValue` 回填，避免抛错。