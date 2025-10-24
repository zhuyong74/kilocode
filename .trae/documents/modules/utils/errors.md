# errors

- 路径: `kilocode/src/utils/errors.ts`
- 概述: 扩展内的自定义错误类型定义与统一异常封装。

## 导出 API
- `class OrganizationAllowListViolationError extends Error`

## 使用示例
```ts
import { OrganizationAllowListViolationError } from "kilocode/src/utils/errors";

throw new OrganizationAllowListViolationError("org not allowed");
```

## 注意事项
- 自定义错误可用于用户提示与埋点。
- 建议在全局错误捕获处统一处理与上报。