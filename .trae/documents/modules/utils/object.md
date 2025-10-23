# object

- 路径: `kilocode/src/utils/object.ts`
- 概述: 对象工具方法的集合，提供空对象判断等常用操作。

## 导出 API
- `isEmpty(obj: unknown): boolean`

## 使用示例
```ts
import { isEmpty } from "kilocode/src/utils/object";

if (isEmpty({})) {
  // ...
}
```

## 注意事项
- 区分 `null/undefined` 与空对象结构的语义。