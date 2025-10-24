# commands

- 路径: `kilocode/src/utils/commands.ts`
- 概述: 统一生成扩展命令 ID，避免硬编码并保持命名一致性。

## 导出 API
- `getCommand(id: CommandId): string`
- `getCodeActionCommand(id: CodeActionId): string`
- `getTerminalCommand(id: TerminalActionId): string`

## 使用示例
```ts
import { getCommand } from "kilocode/src/utils/commands";

const CMD_OPEN_PANEL = getCommand("openPanel");
```

## 注意事项
- 与 `package.json` 中命令注册保持一致。
- 命令 ID 类型需在扩展内统一维护，避免错拼。