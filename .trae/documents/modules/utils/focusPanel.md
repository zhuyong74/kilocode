# focusPanel

- 路径: `kilocode/src/utils/focusPanel.ts`
- 概述: 焦点控制工具，确保指定 Webview 或 Panel 获取焦点以提升交互体验。

## 导出 API
- `focusPanel(...args): Promise<void>`

## 使用示例
```ts
import { focusPanel } from "kilocode/src/utils/focusPanel";

await focusPanel(/* panelRef or id */);
```

## 注意事项
- 在可视化面板创建之后调用。
- 与 VS Code 窗口状态相关，需考虑面板未创建的情况。