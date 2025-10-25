# Playwright E2E - 端到端测试框架

## 概述

`playwright-e2e` 是基于 Playwright 的端到端测试框架，用于对 Kilocode 的 VSCode 扩展和 Web 应用进行自动化测试。支持在 Docker 容器中运行，确保测试环境的一致性。

## 技术栈

- **测试框架**: Playwright 1.53.1
- **语言**: TypeScript 5.8.3
- **环境**: Node.js, Docker
- **断言库**: Playwright Test
- **辅助工具**: Chalk, Signale, fs-extra

## 项目结构

```
playwright-e2e/
├── tests/                  # 测试用例
│   ├── chat.test.ts        # 聊天功能测试
│   ├── settings.test.ts    # 设置功能测试
│   ├── sanity.test.ts      # 基本功能测试
│   └── playwright-base-test.ts # 测试基类
├── helpers/                # 辅助函数
│   ├── chat-helpers.ts     # 聊天辅助
│   ├── vscode-helpers.ts   # VSCode 辅助
│   └── webview-helpers.ts  # Webview 辅助
├── scripts/                # 脚本文件
│   └── extract-vscode-variables.js # 提取变量
├── playwright.config.ts    # Playwright 配置文件
├── playwright.globalSetup.ts # 全局设置
├── Dockerfile.playwright-ci # Docker 配置文件
└── package.json            # 项目依赖
```

## 核心功能

### 1. VSCode 扩展测试

- **启动 VSCode**: 使用 `@vscode/test-electron` 启动 VSCode 实例
- **操作 Webview**: 通过 Playwright 控制 Webview 中的 UI
- **验证功能**: 模拟用户操作并验证结果

### 2. Web 应用测试

- **浏览器支持**: Chrome, Firefox, WebKit
- **多设备模拟**: 支持不同视口和设备
- **并行测试**: 同时运行多个测试用例

### 3. Docker 支持

- **一致环境**: 在 Docker 容器中运行测试
- **CI/CD 集成**: 方便在 CI/CD 流水线中集成
- **隔离性**: 每个测试都在独立的环境中运行

## 开发指南

### 环境要求

- Node.js 22+
- pnpm 包管理器
- Docker (可选)

### 本地开发

```bash
# 安装依赖
pnpm install

# 运行所有测试
pnpm playwright

# 在 Docker 中运行测试
pnpm playwright:docker

# 运行特定测试文件
pnpm playwright tests/chat.test.ts

# 开启详细日志
pnpm playwright:verbose
```

### 编写测试用例

#### 1. 创建测试文件

```typescript
// tests/new-feature.test.ts
import { test, expect } from './playwright-base-test';

test('新功能测试', async ({ page, roo }) =\u003e {
  // 测试逻辑
});
```

#### 2. 使用辅助函数

```typescript
import { openChatView, sendChatMessage } from '../helpers';

test('发送消息测试', async ({ page, roo }) =\u003e {
  await openChatView(page);
  await sendChatMessage(page, '你好');
  // 验证结果
});
```

#### 3. 调试测试

```bash
# 使用 Playwright Inspector
pnpm playwright --debug

# 查看 Trace
pnpm playwright --trace on
```

## 配置说明

### Playwright 配置 (playwright.config.ts)

```typescript
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",

	use: {
		trace: "on-first-retry",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
})
```

### 全局设置 (playwright.globalSetup.ts)

```typescript
import { FullConfig } from "@playwright/test"

async function globalSetup(config: FullConfig) {
	// 全局设置逻辑，如登录、数据准备等
}

export default globalSetup
```

### Docker 配置 (Dockerfile.playwright-ci)

```dockerfile
FROM mcr.microsoft.com/playwright:v1.53.1

WORKDIR /app

COPY . .

RUN pnpm install

CMD ["pnpm", "playwright"]
```

## 测试策略

### 1. 测试分类

- **Sanity Tests**: 基本功能冒烟测试
- **Chat Tests**: 聊天功能完整测试
- **Settings Tests**: 设置和配置功能测试

### 2. 测试环境

- **本地环境**: 快速开发和调试
- **CI 环境**: 每次提交触发
- **Docker 环境**: 确保环境一致性

### 3. 报告和日志

- **HTML 报告**: 生成详细的测试报告
- **Trace Viewer**: 查看每个操作的截图和日志
- **详细日志**: 通过 `PLAYWRIGHT_VERBOSE_LOGS` 开启

## 维护指南

### 定期任务

- **更新 Playwright**: 跟进最新版本
- **优化测试用例**: 提高测试稳定性和效率
- **清理测试数据**: 定期清理测试产生的数据

### 故障排除

- **测试失败**: 查看 HTML 报告和 Trace
- **环境问题**: 使用 Docker 容器进行测试
- **性能问题**: 分析测试执行时间和资源占用

---

_最后更新: 2024年12月_
