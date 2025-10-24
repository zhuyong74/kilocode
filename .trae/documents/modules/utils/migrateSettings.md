# migrateSettings

- 路径: `kilocode/src/utils/migrateSettings.ts`
- 概述: 将历史版本的设置迁移到新版本格式，保持向后兼容与数据安全。

## 导出 API
- `migrateSettings(...): Promise<void>`

## 使用示例
```ts
import { migrateSettings } from "kilocode/src/utils/migrateSettings";

await migrateSettings(/* options */);
```

## 注意事项
- 迁移前建议备份或提示用户。
- 涉及键重命名、默认值填充与无效项清理。