# VSCode Nightly - VSCode 扩展夜间构建版本

## 概述

`vscode-nightly` 是 Kilocode VSCode 扩展的夜间构建版本，包含最新的实验性功能和改进。它为用户提供了体验最新功能的机会，同时为开发团队提供了早期反馈。

## 技术栈

- **构建工具**: ESBuild (通过 esbuild.mjs)
- **打包工具**: VSCE (Visual Studio Code Extension)
- **包管理**: pnpm 10.8.1
- **构建配置**: @roo-code/build (workspace)

## 项目结构

```
vscode-nightly/
├── build/                  # 构建输出目录
├── esbuild.mjs            # ESBuild 配置文件
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 核心功能

### 1. 夜间构建

- **自动构建**: 定期自动构建最新代码
- **实验功能**: 包含尚未发布的实验性功能
- **快速迭代**: 提供快速的功能验证和反馈循环

### 2. 独立打包

- **独立版本**: 与正式版本并行存在
- **VSIX 打包**: 生成可安装的 VSIX 文件
- **版本管理**: 独立的版本号和发布周期

### 3. 测试平台

- **功能验证**: 在发布前验证新功能
- **用户反馈**: 收集早期用户反馈
- **问题发现**: 提前发现潜在问题

## 开发指南

### 环境要求

- Node.js
- pnpm 包管理器
- VSCode (用于测试)

### 构建流程

```bash
# 安装依赖
pnpm install

# 构建夜间版本
pnpm bundle:nightly

# 打包 VSIX 文件
pnpm vsix:nightly

# 清理构建文件
pnpm clean
```

### 构建配置

#### ESBuild 配置 (esbuild.mjs)

```javascript
// 示例配置结构
import { build } from "esbuild"

await build({
	entryPoints: ["src/extension.ts"],
	bundle: true,
	outfile: "build/extension.js",
	external: ["vscode"],
	format: "cjs",
	platform: "node",
	minify: true,
	sourcemap: false,
	define: {
		"process.env.NODE_ENV": '"production"',
		"process.env.BUILD_TYPE": '"nightly"',
	},
})
```

## 发布流程

### 1. 自动化构建

- **触发条件**: 主分支代码更新
- **构建频率**: 每日夜间构建
- **构建产物**: VSIX 文件

### 2. 版本管理

- **版本格式**: `x.y.z-nightly.YYYYMMDD`
- **版本递增**: 基于构建日期自动递增
- **标签管理**: 使用 Git 标签标记构建版本

### 3. 分发渠道

- **内部测试**: 开发团队内部使用
- **Beta 用户**: 向 Beta 用户群体分发
- **反馈收集**: 通过专门渠道收集反馈

## 配置说明

### 包配置 (package.json)

```json
{
	"name": "@roo-code/vscode-nightly",
	"description": "Nightly build for the Kilo Code VSCode extension.",
	"private": true,
	"scripts": {
		"bundle:nightly": "node esbuild.mjs",
		"vsix:nightly": "cd build && mkdirp ../../../bin && npx vsce package --no-dependencies --out ../../../bin"
	}
}
```

### 构建特性

- **无依赖打包**: 使用 `--no-dependencies` 标志
- **输出目录**: 构建产物输出到 `../../../bin` 目录
- **目录创建**: 自动创建必要的输出目录

## 使用指南

### 安装夜间版本

```bash
# 从 VSIX 文件安装
code --install-extension path/to/kilocode-nightly.vsix

# 或通过 VSCode 界面安装
# 1. 打开 VSCode
# 2. 按 Ctrl+Shift+P 打开命令面板
# 3. 输入 "Extensions: Install from VSIX..."
# 4. 选择夜间构建的 VSIX 文件
```

### 功能差异

- **实验功能**: 包含正式版本中没有的实验性功能
- **性能优化**: 可能包含未完全测试的性能优化
- **UI 改进**: 新的用户界面改进和调整

## 维护指南

### 定期任务

- **构建监控**: 监控夜间构建的成功率
- **反馈处理**: 及时处理用户反馈和问题报告
- **版本清理**: 定期清理旧的夜间构建版本

### 故障排除

- **构建失败**: 检查 ESBuild 配置和依赖
- **打包问题**: 验证 VSCE 配置和权限
- **安装问题**: 确保 VSIX 文件完整性

### 质量保证

- **基本测试**: 确保基本功能正常工作
- **兼容性**: 验证与不同 VSCode 版本的兼容性
- **性能监控**: 监控扩展的性能表现

---

_最后更新: 2024年12月_
