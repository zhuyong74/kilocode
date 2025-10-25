# Storybook - UI 组件开发和测试环境

## 概述

`storybook` 是一个用于开发、测试和文档化 Kilocode UI 组件的环境。它提供了一个隔离的沙箱，使开发者能够独立于主应用构建和测试组件。

## 技术栈

- **框架**: Storybook 9.0.18
- **构建工具**: Vite 6.3.5
- **前端**: React 18.3.1 + TypeScript 5.4.5
- **样式**: Tailwind CSS 4.0.0 + Styled Components
- **视觉测试**: Chromatic
- **图标**: Lucide React, VSCode Codicons

## 项目结构

```
storybook/
├── stories/                # 组件故事
│   ├── Button.stories.tsx  # 按钮组件故事
│   ├── ChatView.stories.tsx # 聊天视图故事
│   └── ...                 # 其他组件故事
├── src/                    # 源码文件
│   ├── components/         # 可复用组件
│   ├── decorators/         # Storybook 装饰器
│   └── lib/                # 辅助函数
├── .storybook/             # Storybook 配置文件
│   ├── main.ts             # 主配置
│   ├── preview.ts          # 预览配置
│   └── theme-variables.css # 主题变量
├── scripts/                # 脚本文件
│   └── generate-playwright-screenshot-stories.js
└── package.json            # 项目依赖
```

## 核心功能

### 1. 组件开发

- **隔离环境**: 独立开发和测试 UI 组件
- **热重载**: 实时预览组件变化
- **多种状态**: 通过 Controls 插件模拟不同 props

### 2. 组件文档

- **自动生成**: 从 JSDoc 和 TypeScript 类型生成文档
- **交互式示例**: 在文档中直接与组件交互
- **MDX 支持**: 编写更丰富的文档内容

### 3. 视觉测试

- **Chromatic 集成**: 自动进行视觉回归测试
- **UI 审查**: 在 PR 中审查 UI 变化
- **基线管理**: 维护组件的视觉基线

## 开发指南

### 环境要求

- Node.js
- pnpm 包管理器

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动 Storybook
pnpm storybook

# 构建 Storybook
pnpm build-storybook

# 运行视觉测试
pnpm chromatic
```

### 编写故事

#### 1. 创建故事文件

```typescript
// stories/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from '../src/components/MyComponent';

const meta: Meta\u003ctypeof MyComponent\u003e = {
  component: MyComponent,
};

export default meta;
type Story = StoryObj\u003ctypeof MyComponent\u003e;

export const Default: Story = {
  args: {
    // 默认 props
  },
};
```

#### 2. 使用装饰器

```typescript
// .storybook/preview.ts
import { Decorator } from '@storybook/react';

export const decorators: Decorator[] = [
  (Story) =\u003e (
    \u003cdiv style={{ margin: '3em' }}\u003e
      \u003cStory /\u003e
    \u003c/div\u003e
  ),
];
```

## 配置说明

### Storybook 配置 (.storybook/main.ts)

```typescript
import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
	stories: ["../stories/**/*.stories.@(js|jsx|ts|tsx)"],
	addons: ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions"],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	docs: {
		autodocs: "tag",
	},
}

export default config
```

### Chromatic 配置

Chromatic 的配置通常在 `package.json` 的 `scripts` 中完成，或者通过项目根目录的 `chromatic.config.json` 文件。

## 维护指南

### 定期任务

- **更新 Storybook**: 跟进最新版本
- **审查视觉变化**: 定期审查 Chromatic 上的 UI 变化
- **优化组件故事**: 确保故事覆盖所有重要的组件状态

### 故障排除

- **构建失败**: 检查 Vite 和 Storybook 配置
- **视觉测试失败**: 审查 Chromatic 上的 UI diff，并接受或拒绝更改

---

_最后更新: 2024年12月_
