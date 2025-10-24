# git

- 路径: `kilocode/src/utils/git.ts`
- 概述: Git 仓库信息与提交检索工具，支持转换 URL、检索提交与工作状态等。

## 导出 API（节选）
- `getGitRepositoryInfo(workspaceRoot: string): Promise<GitRepositoryInfo>`
- `convertGitUrlToHttps(url: string): string`
- `sanitizeGitUrl(url: string): string`
- `extractRepositoryName(url: string): string`
- `getWorkspaceGitInfo(): Promise<GitRepositoryInfo>`
- `checkGitInstalled(): Promise<boolean>`
- `searchCommits(query: string, cwd: string): Promise<GitCommit[]>`
- `getCommitInfo(hash: string, cwd: string): Promise<string>`
- `getWorkingState(cwd: string): Promise<string>`

## 使用示例
```ts
import { getWorkspaceGitInfo, searchCommits } from "kilocode/src/utils/git";

const info = await getWorkspaceGitInfo();
const commits = await searchCommits("fix(", info.root);
```

## 注意事项
- 调用外部 `git` 命令，需保证环境已安装且可访问。
- 对大型仓库进行搜索时，注意性能与结果分页。