# Kilocode 技术栈

## 1. 技术栈概览

Kilocode 项目采用现代化的技术栈，支持多平台开发和部署。以下是项目中使用的主要技术和工具。

## 2. 前端技术栈

### 2.1 Web UI (webview-ui/)

- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **组件库**: 自定义组件 + VSCode Webview UI Toolkit
- **状态管理**: React Context + Hooks
- **国际化**: i18next

### 2.2 VSCode 扩展界面

- **API**: VSCode Extension API
- **Webview**: VSCode Webview API
- **主题**: VSCode 主题系统集成
- **图标**: Codicons

## 3. 后端技术栈

### 3.1 核心运行时

- **运行时**: Node.js 20.19.2+
- **语言**: TypeScript
- **包管理**: pnpm 10.8.1
- **构建工具**: esbuild, Turbo

### 3.2 VSCode 扩展核心 (src/)

```typescript
// 主要依赖
{
  "vscode": "^1.85.0",
  "@types/node": "^24.1.0",
  "@dotenvx/dotenvx": "^1.34.0"
}
```

### 3.3 CLI 工具 (cli/)

```typescript
// 核心依赖
{
  "commander": "^12.0.0",
  "inquirer": "^12.0.0",
  "chalk": "^5.3.0",
  "ora": "^8.1.1"
}
```

## 4. JetBrains 技术栈

### 4.1 插件开发

- **语言**: Kotlin
- **平台**: IntelliJ Platform SDK
- **构建工具**: Gradle
- **API**: IntelliJ Platform API

### 4.2 主机进程

- **语言**: TypeScript/Node.js
- **通信**: IPC (Inter-Process Communication)
- **协议**: RPC (Remote Procedure Call)

## 5. 构建和部署

### 5.1 构建工具

- **主构建**: Turbo (Monorepo 构建系统)
- **打包**: esbuild (快速 JavaScript 打包)
- **类型检查**: TypeScript Compiler
- **代码格式化**: Prettier
- **代码检查**: ESLint

### 5.2 包管理

- **包管理器**: pnpm (性能优化的 npm)
- **Workspace**: pnpm workspace (Monorepo 管理)
- **版本管理**: Changesets

### 5.3 CI/CD

- **平台**: GitHub Actions
- **测试**: Vitest, Playwright
- **发布**: VS Code Marketplace, JetBrains Marketplace

## 6. 开发工具

### 6.1 代码质量

```json
{
	"prettier": "^3.4.2",
	"eslint": "^9.27.0",
	"husky": "^9.1.7",
	"lint-staged": "^16.0.0"
}
```

### 6.2 测试框架

```json
{
	"vitest": "^2.0.0",
	"playwright": "^1.40.0",
	"@types/jest": "^29.5.0"
}
```

### 6.3 开发环境

- **容器**: Docker + DevContainer
- **包管理**: Nix (可选)
- **版本控制**: Git + Git LFS

## 7. 外部服务集成

### 7.1 AI 服务

- **多模型支持**: OpenAI, Anthropic, Google, 等
- **本地模型**: Ollama 支持
- **协议**: OpenAI API 兼容

### 7.2 云服务

- **遥测**: PostHog
- **错误追踪**: 内置错误收集
- **用户认证**: 自定义认证系统

### 7.3 扩展协议

- **MCP**: Model Context Protocol
- **LSP**: Language Server Protocol (部分功能)

## 8. 数据存储

### 8.1 本地存储

- **配置**: VSCode Settings API
- **缓存**: 文件系统缓存
- **索引**: 本地代码索引数据库

### 8.2 用户数据

- **设置**: JSON 配置文件
- **历史**: 本地 SQLite (计划中)
- **缓存**: LRU 缓存策略

## 9. 安全技术

### 9.1 代码执行安全

- **沙箱**: 进程隔离
- **权限控制**: 最小权限原则
- **命令白名单**: 可配置的安全命令列表

### 9.2 数据安全

- **加密**: 敏感数据本地加密
- **传输**: HTTPS/TLS
- **API 密钥**: 安全存储和管理

## 10. 性能优化技术

### 10.1 前端优化

- **代码分割**: 动态导入
- **懒加载**: 组件按需加载
- **虚拟化**: 大列表性能优化
- **缓存**: 智能缓存策略

### 10.2 后端优化

- **异步处理**: Promise/async-await
- **流处理**: Node.js Streams
- **内存管理**: 垃圾回收优化
- **并发控制**: 任务队列管理

## 11. 国际化支持

### 11.1 多语言

- **框架**: i18next
- **语言包**: JSON 格式
- **支持语言**: 20+ 种语言
- **动态切换**: 运行时语言切换

### 11.2 本地化

- **日期时间**: 本地化格式
- **数字格式**: 地区特定格式
- **文本方向**: RTL 支持

## 12. 监控和调试

### 12.1 日志系统

- **结构化日志**: JSON 格式
- **日志级别**: Debug, Info, Warn, Error
- **输出通道**: VSCode Output Channel

### 12.2 性能监控

- **指标收集**: 关键性能指标
- **内存监控**: 内存使用追踪
- **响应时间**: API 调用时间统计

## 13. 版本兼容性

### 13.1 平台支持

- **VSCode**: 1.85.0+
- **Node.js**: 20.19.2+
- **JetBrains**: 2023.1+

### 13.2 操作系统

- **Windows**: Windows 10+
- **macOS**: macOS 10.15+
- **Linux**: Ubuntu 18.04+

---

_本文档详细描述了 Kilocode 项目使用的技术栈，为开发者提供了技术选型的参考。_
