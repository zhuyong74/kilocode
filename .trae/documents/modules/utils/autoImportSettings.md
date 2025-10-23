# autoImportSettings

- 路径: `kilocode/src/utils/autoImportSettings.ts`
- 概述: 自动导入或迁移扩展相关设置项，在启动或命令触发时同步到 VS Code 用户/工作区设置。

## 导出 API
- `autoImportSettings(context: vscode.ExtensionContext): Promise<void>`

## 使用示例
```ts
import { autoImportSettings } from "kilocode/src/utils/autoImportSettings";

export async function activate(context: vscode.ExtensionContext) {
  await autoImportSettings(context);
}
```

## 注意事项
- 依赖 VS Code 扩展上下文，需在 `activate` 生命周期中调用。
- 异步操作可能涉及文件读写或设置更新，注意错误处理与用户提示。