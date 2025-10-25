# Web Evals - Web 评估和测试平台

## 概述

`web-evals` 是一个基于 Next.js 的 Web 应用程序，用于评估和测试 Kilocode 的各种功能和性能。它提供了一个直观的 Web 界面来运行、监控和分析评估任务。

## 技术栈

- **框架**: Next.js 15.2.5
- **前端**: React 18.3.1 + TypeScript
- **样式**: Tailwind CSS 4.0 + Tailwind CSS Animate
- **UI 组件**: Radix UI 组件库
- **状态管理**: TanStack React Query 5.69.0
- **表单**: React Hook Form 7.57.0 + Zod 3.25.61
- **数据库**: Redis 5.5.5
- **主题**: next-themes 0.4.6

## 项目结构

```
web-evals/
├── src/                    # 源码目录
│   ├── app/                # Next.js App Router
│   │   ├── layout.tsx      # 根布局
│   │   ├── page.tsx        # 首页
│   │   └── ...             # 其他页面
│   ├── components/         # React 组件
│   │   ├── ui/             # UI 基础组件
│   │   ├── forms/          # 表单组件
│   │   └── ...             # 业务组件
│   ├── lib/                # 工具函数和配置
│   ├── hooks/              # 自定义 React Hooks
│   └── types/              # TypeScript 类型定义
├── scripts/                # 脚本文件
│   └── check-services.sh   # 服务检查脚本
├── public/                 # 静态资源
├── next.config.js          # Next.js 配置
├── tailwind.config.js      # Tailwind CSS 配置
└── package.json            # 项目依赖
```

## 核心功能

### 1. 评估管理

- **任务创建**: 创建和配置评估任务
- **任务执行**: 运行各种类型的评估
- **结果展示**: 可视化评估结果和统计数据
- **历史记录**: 查看历史评估记录

### 2. 数据可视化

- **图表展示**: 使用图表展示评估数据
- **实时监控**: 实时监控评估进度
- **性能指标**: 展示关键性能指标
- **对比分析**: 对比不同评估结果

### 3. 用户界面

- **响应式设计**: 支持桌面和移动设备
- **主题切换**: 支持明暗主题切换
- **交互式组件**: 丰富的交互式 UI 组件
- **搜索和过滤**: 强大的搜索和过滤功能

## 开发指南

### 环境要求

- Node.js
- pnpm 包管理器
- Redis 服务器

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

# 代码格式化
pnpm format
```

### 环境配置

#### 1. Redis 配置

确保 Redis 服务器正在运行，默认连接配置：

```bash
# 启动 Redis 服务器
redis-server

# 检查 Redis 连接
redis-cli ping
```

#### 2. 环境变量

创建 `.env.local` 文件：

```bash
# Redis 配置
REDIS_URL=redis://localhost:6379

# Next.js 配置
NEXT_PUBLIC_APP_URL=http://localhost:3446

# 其他配置
NODE_ENV=development
```

## 组件开发

### 1. UI 组件

使用 Radix UI 作为基础组件库：

```typescript
// components/ui/button.tsx
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva("inline-flex items-center justify-center rounded-md text-sm font-medium", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
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

### 2. 表单处理

使用 React Hook Form + Zod 进行表单验证：

```typescript
// components/forms/eval-form.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const evalSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  type: z.enum(["performance", "accuracy", "quality"]),
  config: z.object({
    iterations: z.number().min(1).max(1000),
  }),
});

type EvalFormData = z.infer<typeof evalSchema>;

export function EvalForm() {
  const form = useForm<EvalFormData>({
    resolver: zodResolver(evalSchema),
  });

  const onSubmit = (data: EvalFormData) => {
    // 处理表单提交
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* 表单字段 */}
    </form>
  );
}
```

## API 设计

### 1. 评估 API

```typescript
// app/api/evals/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
	// 获取评估列表
}

export async function POST(request: NextRequest) {
	// 创建新评估
}
```

### 2. 数据查询

使用 TanStack React Query 进行数据管理：

```typescript
// hooks/use-evals.ts
import { useQuery, useMutation } from "@tanstack/react-query"

export function useEvals() {
	return useQuery({
		queryKey: ["evals"],
		queryFn: () => fetch("/api/evals").then((res) => res.json()),
	})
}

export function useCreateEval() {
	return useMutation({
		mutationFn: (data: EvalData) =>
			fetch("/api/evals", {
				method: "POST",
				body: JSON.stringify(data),
			}),
	})
}
```

## 部署配置

### 1. 生产构建

```bash
# 构建应用
pnpm build

# 启动生产服务器
pnpm start
```

### 2. Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3446
CMD ["pnpm", "start"]
```

## 维护指南

### 定期任务

- **依赖更新**: 定期更新 npm 依赖
- **性能监控**: 监控应用性能和响应时间
- **数据清理**: 定期清理过期的评估数据

### 故障排除

- **构建失败**: 检查 TypeScript 类型错误
- **Redis 连接**: 确保 Redis 服务正常运行
- **性能问题**: 使用 Next.js 内置的性能分析工具

---

_最后更新: 2024年12月_
