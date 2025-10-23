# terminalCommandGenerator

- 路径: `kilocode/src/utils/terminalCommandGenerator.ts`
- 概述: 生成并在终端执行命令的工具，支持多选项控制。

## 导出 API
- `interface TerminalCommandGeneratorOptions`
- `generateTerminalCommand(options: TerminalCommandGeneratorOptions): Promise<void>`

## 使用示例
```ts
import { generateTerminalCommand } from "kilocode/src/utils/terminalCommandGenerator";

await generateTerminalCommand({ cwd: process.cwd(), command: "npm run build" });
```

## 注意事项
- 需考虑不同 Shell 的命令兼容性。
- 执行命令可能带来副作用，建议先提示用户。