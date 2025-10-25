# Web Roo Code - Roo Code 的 Web 版本

## 概述

`web-roo-code` 是 Roo Code 的 Web 版本，基于 Next.js 构建的现代化 Web 应用程序。它提供了完整的 Roo Code 功能体验，包括代码生成、AI 辅助编程和项目管理等核心功能。

## 技术栈

- **框架**: Next.js 15.2.5
- **前端**: React 18.3.1 + TypeScript
- **样式**: Tailwind CSS 3.4.17 + Tailwind CSS Animate
- **UI 组件**: Radix UI 组件库
- **动画**: Framer Motion 12.15.0
- **图表**: Recharts 2.15.3
- **轮播**: Embla Carousel 8.6.0
- **状态管理**: TanStack React Query 5.79.0
- **分析**: PostHog 1.248.1
- **主题**: next-themes 0.4.6

## 项目结构

```
web-roo-code/
├── src/                    # 源码目录
│   ├── app/                # Next.js App Router
│   │   ├── layout.tsx      # 根布局
│   │   ├── page.tsx        # 首页
│   │   ├── globals.css     # 全局样式
│   │   └── ...             # 其他页面和路由
│   ├── components/         # React 组件
│   │   ├── ui/             # UI 基础组件
│   │   ├── layout/         # 布局组件
│   │   ├── features/       # 功能组件
│   │   └── ...             # 其他组件
│   ├── lib/                # 工具函数和配置
│   ├── hooks/              # 自定义 React Hooks
│   ├── types/              # TypeScript 类型定义
│   └── styles/             # 样式文件
├── public/                 # 静态资源
│   ├── images/             # 图片资源
│   ├── icons/              # 图标文件
│   └── ...                 # 其他静态文件
├── next.config.js          # Next.js 配置
├── next-sitemap.config.cjs # 站点地图配置
├── tailwind.config.js      # Tailwind CSS 配置
└── package.json            # 项目依赖
```

## 核心功能

### 1. 代码生成

- **AI 驱动**: 基于 AI 的智能代码生成
- **多语言支持**: 支持多种编程语言
- **模板系统**: 丰富的代码模板库
- **自定义配置**: 可自定义生成规则

### 2. 项目管理

- **项目创建**: 快速创建新项目
- **文件管理**: 在线文件编辑和管理
- **版本控制**: 集成版本控制功能
- **协作功能**: 支持团队协作开发

### 3. 用户界面

- **现代设计**: 现代化的用户界面设计
- **响应式布局**: 支持各种设备尺寸
- **主题切换**: 支持明暗主题
- **动画效果**: 流畅的动画和过渡效果

### 4. 数据可视化

- **图表展示**: 使用 Recharts 展示数据
- **实时更新**: 实时数据更新和展示
- **交互式图表**: 支持用户交互的图表
- **多种图表类型**: 支持柱状图、折线图、饼图等

## 开发指南

### 环境要求

- Node.js 18+
- pnpm 包管理器

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 类型检查
pnpm check-types

# 代码检查
pnpm lint
```

### 环境配置

#### 1. 环境变量

创建 `.env.local` 文件：

```bash
# Next.js 配置
NEXT_PUBLIC_APP_URL=http://localhost:3000

# PostHog 配置
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# 其他配置
NODE_ENV=development
```

#### 2. PostHog 分析配置

```typescript
// lib/posthog.ts
import posthog from "posthog-js"

if (typeof window !== "undefined") {
	posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
		api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
	})
}
```

## 组件开发

### 1. UI 组件

使用 Radix UI 和 Tailwind CSS：

```typescript
// components/ui/button.tsx
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/90",
			secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
		},
		size: {
			default: "h-10 px-4 py-2",
			sm: "h-9 rounded-md px-3",
			lg: "h-11 rounded-md px-8",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
})
```

### 2. 动画组件

使用 Framer Motion 创建动画：

```typescript
// components/animated-section.tsx
import { motion } from "framer-motion";

export function AnimatedSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
```

### 3. 轮播组件

使用 Embla Carousel：

```typescript
// components/carousel.tsx
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

export function Carousel({ children }: { children: React.ReactNode }) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 3000 })]
  );

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {children}
      </div>
    </div>
  );
}
```

## 性能优化

### 1. 图片优化

使用 Next.js Image 组件：

```typescript
import Image from 'next/image';

export function OptimizedImage() {
  return (
    <Image
      src="/hero-image.jpg"
      alt="Hero"
      width={800}
      height={600}
      priority
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

### 2. 代码分割

使用动态导入：

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

## SEO 优化

### 1. 站点地图生成

配置 `next-sitemap.config.cjs`：

```javascript
/** @type {import('next-sitemap').IConfig} */
module.exports = {
	siteUrl: process.env.SITE_URL || "https://roo-code.com",
	generateRobotsTxt: true,
	exclude: ["/admin/*", "/api/*"],
	robotsTxtOptions: {
		policies: [
			{
				userAgent: "*",
				allow: "/",
			},
		],
	},
}
```

### 2. 元数据配置

```typescript
// app/layout.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
	title: "Roo Code - AI-Powered Code Generation",
	description: "Generate high-quality code with AI assistance",
	keywords: ["AI", "code generation", "programming", "development"],
}
```

## 部署配置

### 1. Vercel 部署

```json
// vercel.json
{
	"buildCommand": "pnpm build",
	"outputDirectory": ".next",
	"framework": "nextjs",
	"env": {
		"NEXT_PUBLIC_APP_URL": "@app-url"
	}
}
```

### 2. Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
```

## 维护指南

### 定期任务

- **依赖更新**: 定期更新 npm 依赖
- **性能监控**: 使用 PostHog 监控用户行为
- **SEO 优化**: 定期检查和优化 SEO 设置
- **安全更新**: 及时应用安全补丁

### 故障排除

- **构建失败**: 检查 TypeScript 类型错误和依赖冲突
- **性能问题**: 使用 Next.js 内置的性能分析工具
- **SEO 问题**: 检查站点地图和元数据配置

---

_最后更新: 2024年12月_
