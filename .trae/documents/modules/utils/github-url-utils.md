# github-url-utils

- 路径: `kilocode/src/utils/github-url-utils.ts`
- 概述: GitHub 相关的 URL 生成与打开工具，支持自动填充 issue 参数并在浏览器打开。

## 导出 API（节选）
- `createGitHubIssueUrl(baseUrl: string, params: Map<string, string>): string`
- `openUrlInBrowser(url: string): Promise<void>`
- `createAndOpenGitHubIssue(...): Promise<void>`

## 使用示例
```ts
import { createGitHubIssueUrl, openUrlInBrowser } from "kilocode/src/utils/github-url-utils";

const url = createGitHubIssueUrl("https://github.com/org/repo/issues/new", new Map([
  ["title", "Bug report"],
  ["labels", "bug"],
]));
await openUrlInBrowser(url);
```

## 注意事项
- 在 VS Code 环境下可能使用 `vscode.env.openExternal` 打开 URL。
- 参数可能包含敏感信息，注意在 URL 中的编码与隐私。