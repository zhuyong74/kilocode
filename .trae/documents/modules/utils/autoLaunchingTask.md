# autoLaunchingTask

- 路径: `kilocode/src/utils/autoLaunchingTask.ts`
- 概述: 在扩展激活时检查并自动执行预配置的启动任务（如诊断、自检或必要的初始化操作）。

## 导出 API
- `checkAndRunAutoLaunchingTask(context: vscode.ExtensionContext): Promise<void>`

## 使用示例
```ts
import { checkAndRunAutoLaunchingTask } from "kilocode/src/utils/autoLaunchingTask";

export async function activate(context: vscode.ExtensionContext) {
  await checkAndRunAutoLaunchingTask(context);
}
```

## 注意事项
- 需在扩展激活阶段使用，并确保任务配置存在。
- 自动任务的副作用需谨慎，避免干扰用户当前工作流。