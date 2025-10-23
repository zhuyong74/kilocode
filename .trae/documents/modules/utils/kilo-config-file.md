# kilo-config-file

- 路径: `kilocode/src/utils/kilo-config-file.ts`
- 概述: 读取并解析 Kilocode 项目配置文件，生成标准化的配置数据结构。

## 导出 API（节选）
- `KilocodeConfigProject` / `KilocodeConfig`（zod schema 与类型）
- `normalizeProjectId(projectId?: string): string | undefined`
- `getKilocodeConfig(workspaceRoot: string, ...): Promise<KilocodeConfig | null>`
- `getKilocodeConfigFile(workspaceRoot: string): Promise<KilocodeConfig | null>`
- `getProjectId(workspaceRoot: string, gitRepositoryUrl?: string): Promise<string | undefined>`
- `getWorkspaceProjectId(gitRepositoryUrl?: string): Promise<string | undefined>`

## 使用示例
```ts
import { getKilocodeConfig } from "kilocode/src/utils/kilo-config-file";

const cfg = await getKilocodeConfig(process.cwd());
```

## 注意事项
- 解析依赖 zod 校验，保证结构安全与可预测。
- 项目 ID 可来源于配置或 Git 仓库 URL，注意归一化规则。