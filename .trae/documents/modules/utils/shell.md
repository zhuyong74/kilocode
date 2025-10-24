# shell

- 路径: `kilocode/src/utils/shell.ts`
- 概述: Shell 环境工具，用于推断用户系统的默认 Shell 与相关交互。

## 导出 API
- `getShell(): string`

## 使用示例
```ts
import { getShell } from "kilocode/src/utils/shell";

const shell = getShell();
```

## 注意事项
- 不同平台返回值不同（如 `bash`, `zsh`, `powershell`）。
- 在命令执行模块中可据此选择参数与语法。