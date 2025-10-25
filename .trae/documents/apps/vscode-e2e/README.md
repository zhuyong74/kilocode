# VSCode E2E - VSCode 扩展端到端测试

## 概述

`vscode-e2e` 是专门为 Kilocode VSCode 扩展设计的端到端测试套件。它使用 VSCode Test Runner 来测试扩展的完整功能，确保扩展在真实的 VSCode 环境中正常工作。

## 技术栈

- **测试框架**: Mocha 11.1.0
- **VSCode 测试**: @vscode/test-electron 2.4.0
- **测试运行器**: @vscode/test-cli 0.0.11
- **语言**: TypeScript 5.8.3
- **文件匹配**: glob 11.0.1

## 项目结构

```
vscode-e2e/
├── src/                    # 测试源码
│   ├── test/               # 测试文件
│   │   ├── suite/          # 测试套件
│   │   └── index.ts        # 测试入口
│   └── runTest.ts          # 测试运行器
├── out/                    # 编译输出
├── .env.local              # 环境变量配置
├── tsconfig.json           # TypeScript 配置
├── tsconfig.esm.json       # ESM TypeScript 配置
└── package.json            # 项目依赖
```

## 核心功能

### 1. 扩展功能测试

- **命令测试**: 测试扩展注册的所有命令
- **UI 交互**: 测试扩展的用户界面交互
- **配置测试**: 测试扩展配置项的功能

### 2. 集成测试

- **Webview 集成**: 测试扩展与 Webview 的交互
- **文件系统**: 测试扩展对文件系统的操作
- **编辑器集成**: 测试与 VSCode 编辑器的集成

### 3. 自动化测试

- **CI/CD 集成**: 在持续集成中自动运行测试
- **回归测试**: 确保新功能不破坏现有功能
- **性能测试**: 监控扩展的性能表现

## 开发指南

### 环境要求

- Node.js
- VSCode (用于测试环境)
- pnpm 包管理器

### 本地开发

```bash
# 安装依赖
pnpm install

# 类型检查
pnpm check-types

# 代码格式化
pnpm format

# 运行测试
pnpm test:run

# CI 测试 (包含构建)
pnpm test:ci
```

### 编写测试

#### 1. 基本测试结构

```typescript
// src/test/suite/extension.test.ts
import * as assert from "assert"
import * as vscode from "vscode"

suite("Extension Test Suite", () => {
	vscode.window.showInformationMessage("Start all tests.")

	test("Sample test", () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5))
		assert.strictEqual(-1, [1, 2, 3].indexOf(0))
	})
})
```

#### 2. 扩展命令测试

```typescript
test("Extension should be present", () => {
	assert.ok(vscode.extensions.getExtension("roo-code.kilocode"))
})

test("Should register commands", async () => {
	const commands = await vscode.commands.getCommands(true)
	assert.ok(commands.includes("kilocode.start"))
})
```

## 配置说明

### 测试运行器配置 (runTest.ts)

```typescript
import { runTests } from "@vscode/test-electron"
import * as path from "path"

async function main() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, "../../")
		const extensionTestsPath = path.resolve(__dirname, "./suite/index")

		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
		})
	} catch (err) {
		console.error("Failed to run tests")
		process.exit(1)
	}
}

main()
```

### 环境变量配置 (.env.local)

```bash
# VSCode 测试配置
VSCODE_TEST_VERSION=stable
DISPLAY=:99.0

# 测试超时设置
TEST_TIMEOUT=30000

# 调试模式
DEBUG_MODE=false
```

## 测试策略

### 1. 单元测试

- **工具函数**: 测试独立的工具函数
- **数据处理**: 测试数据转换和处理逻辑
- **配置解析**: 测试配置文件的解析

### 2. 集成测试

- **扩展激活**: 测试扩展的激活流程
- **命令执行**: 测试命令的完整执行流程
- **事件处理**: 测试事件监听和处理

### 3. 端到端测试

- **用户工作流**: 模拟完整的用户操作流程
- **多文件操作**: 测试跨文件的操作
- **错误处理**: 测试异常情况的处理

## 维护指南

### 定期任务

- **更新测试**: 跟进扩展功能的变化
- **性能监控**: 监控测试执行时间
- **覆盖率检查**: 确保测试覆盖率

### 故障排除

- **测试失败**: 检查 VSCode 版本兼容性
- **超时问题**: 调整测试超时设置
- **环境问题**: 确保测试环境配置正确

---

_最后更新: 2024年12月_
