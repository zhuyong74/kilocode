# keybindings

- 路径: `kilocode/src/utils/keybindings.ts`
- 概述: 查询用户或默认命令的快捷键绑定，支持批量查询与默认值回退。

## 导出 API
- `getKeybindingsForCommands(commandIds: string[]): Promise<Record<string, string>>`
- `getKeybindingForCommand(commandId: string): Promise<string | undefined>`
- `getDefaultKeybindingForCommand(commandId: string): string`

## 使用示例
```ts
import { getKeybindingForCommand } from "kilocode/src/utils/keybindings";

const kb = await getKeybindingForCommand("kilocode.openPanel");
```

## 注意事项
- 用户设置可能覆盖默认绑定；结果可能为空。
- 建议在 UI 提示中回退到默认值以提升可用性。