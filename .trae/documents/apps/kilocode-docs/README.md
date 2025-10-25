# Kilocode Docs - 官方文档网站

## 概述

`kilocode-docs` 是基于 Docusaurus 构建的 Kilocode 官方文档网站，提供完整的用户指南、API 参考、教程和博客内容。支持多语言（中英文），具有现代化的文档体验和强大的搜索功能。

## 技术栈

- **框架**: Docusaurus 3.8.1
- **前端**: React 19.0.0 + TypeScript
- **样式**: CSS Modules + Clsx
- **搜索**: @easyops-cn/docusaurus-search-local
- **分析**: PostHog
- **图标**: VSCode Codicons
- **语法高亮**: Prism React Renderer

## 项目结构

```
kilocode-docs/
├── docs/                   # 主要文档内容
│   ├── getting-started/    # 入门指南
│   ├── basic-usage/        # 基础使用
│   ├── advanced-usage/     # 高级用法
│   ├── features/           # 功能特性
│   ├── providers/          # 提供商配置
│   ├── extending/          # 扩展开发
│   └── seats/              # 座位管理
├── blog-posts/             # 博客文章
├── i18n/                   # 国际化文件
│   └── zh-CN/              # 中文翻译
├── src/                    # 源码文件
│   ├── components/         # 自定义组件
│   ├── css/                # 样式文件
│   └── theme/              # 主题定制
├── static/                 # 静态资源
│   ├── img/                # 图片资源
│   ├── videos/             # 视频资源
│   └── downloads/          # 下载文件
├── docusaurus.config.ts    # 主配置文件
├── sidebars.ts             # 侧边栏配置
└── package.json            # 项目依赖
```

## 核心功能

### 1. 多语言支持

- **默认语言**: 英文
- **支持语言**: 中文 (zh-CN)
- **翻译管理**: 基于 Docusaurus i18n 系统

### 2. 文档组织

- **入门指南**: 快速开始和安装说明
- **基础使用**: 核心功能和基本操作
- **高级用法**: 复杂场景和最佳实践
- **API 参考**: 详细的接口文档
- **扩展开发**: 插件和自定义开发

### 3. 搜索功能

- **本地搜索**: 基于 @easyops-cn/docusaurus-search-local
- **全文检索**: 支持中英文内容搜索
- **智能建议**: 搜索结果排序和高亮

### 4. 博客系统

- **技术博客**: 最新功能介绍和使用技巧
- **更新日志**: 版本更新和变更说明
- **社区分享**: 用户案例和经验分享

## 开发指南

### 环境要求

- Node.js 18.0+
- pnpm 包管理器
- TypeScript 支持

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm start

# 构建生产版本
pnpm build

# 本地预览构建结果
pnpm serve
```

### 开发服务器配置

- **端口**: 默认 3000
- **主机**: 0.0.0.0（支持外部访问）
- **热重载**: 自动刷新和实时预览
- **环境变量**: 通过 dotenv 加载

### 内容编写

#### 1. 添加新文档

```bash
# 在 docs/ 目录下创建 .md 或 .mdx 文件
docs/new-feature/index.md
```

#### 2. 更新侧边栏

```typescript
// sidebars.ts
export default {
	tutorialSidebar: [
		"intro",
		{
			type: "category",
			label: "新功能",
			items: ["new-feature/index"],
		},
	],
}
```

#### 3. 添加博客文章

```bash
# 在 blog-posts/ 目录下创建文章
blog-posts/2024-12-new-feature.md
```

### 国际化

#### 1. 提取翻译字符串

```bash
pnpm write-translations --locale zh-CN
```

#### 2. 翻译文档内容

```bash
# 复制文档到对应语言目录
i18n/zh-CN/docusaurus-plugin-content-docs/current/
```

#### 3. 构建多语言版本

```bash
pnpm build --locale zh-CN
```

## 配置说明

### Docusaurus 配置 (docusaurus.config.ts)

```typescript
const config: Config = {
	title: "Kilocode",
	tagline: "AI-powered coding assistant",
	favicon: "img/favicon.ico",

	// 部署配置
	url: "https://kilocode.dev",
	baseUrl: "/",

	// 国际化
	i18n: {
		defaultLocale: "en",
		locales: ["en", "zh-CN"],
	},

	// 插件配置
	plugins: ["@easyops-cn/docusaurus-search-local", "@docusaurus/plugin-client-redirects"],
}
```

### 搜索配置

```typescript
;[
	"@easyops-cn/docusaurus-search-local",
	{
		hashed: true,
		language: ["en", "zh"],
		highlightSearchTermsOnTargetPage: true,
		explicitSearchResultPath: true,
	},
]
```

### 主题配置

```typescript
themeConfig: {
  navbar: {
    title: 'Kilocode',
    logo: {
      alt: 'Kilocode Logo',
      src: 'img/logo.svg',
    },
    items: [
      {
        type: 'docSidebar',
        sidebarId: 'tutorialSidebar',
        position: 'left',
        label: 'Docs',
      },
      {
        to: '/blog',
        label: 'Blog',
        position: 'left'
      },
    ],
  },
}
```

## 部署流程

### 1. 自动部署

- **触发条件**: 推送到 main 分支
- **构建环境**: GitHub Actions
- **部署目标**: 文档托管平台

### 2. 手动部署

```bash
# 构建生产版本
pnpm build

# 部署到 GitHub Pages
pnpm deploy
```

### 3. 环境变量

```bash
# .env
DOCUSAURUS_URL=https://kilocode.dev
DOCUSAURUS_BASE_URL=/
```

## 内容管理

### 文档结构规范

- **文件命名**: 使用 kebab-case
- **目录组织**: 按功能模块分类
- **元数据**: 包含 title、description、keywords

### 图片资源

- **存放位置**: `static/img/`
- **命名规范**: 描述性文件名
- **格式要求**: 优先使用 WebP，备选 PNG/JPG
- **尺寸优化**: 适配不同设备分辨率

### 视频资源

- **存放位置**: `static/videos/`
- **格式支持**: MP4, WebM
- **压缩优化**: 平衡质量和文件大小

## 性能优化

### 1. 构建优化

- **代码分割**: 自动按路由分割
- **资源压缩**: CSS/JS 自动压缩
- **图片优化**: 自动生成不同尺寸

### 2. 加载优化

- **懒加载**: 图片和组件按需加载
- **预加载**: 关键资源预先加载
- **缓存策略**: 静态资源长期缓存

### 3. SEO 优化

- **元标签**: 自动生成 meta 信息
- **结构化数据**: JSON-LD 格式
- **站点地图**: 自动生成 sitemap.xml

## 监控和分析

### 1. 访问统计

- **工具**: PostHog
- **指标**: 页面浏览量、用户行为、转化率
- **报告**: 定期生成访问报告

### 2. 性能监控

- **Core Web Vitals**: LCP, FID, CLS
- **加载时间**: 页面和资源加载性能
- **错误监控**: JavaScript 错误和网络错误

### 3. 搜索分析

- **搜索词统计**: 用户搜索行为分析
- **结果质量**: 搜索结果点击率
- **内容优化**: 基于搜索数据优化内容

## 维护指南

### 定期任务

- **依赖更新**: 每月检查和更新依赖包
- **内容审核**: 定期检查文档准确性
- **链接检查**: 验证外部链接有效性
- **性能检测**: 监控网站性能指标

### 故障排除

- **构建失败**: 检查依赖版本和配置
- **搜索问题**: 重建搜索索引
- **样式异常**: 检查 CSS 冲突和主题配置

### 备份策略

- **内容备份**: Git 版本控制
- **配置备份**: 定期导出配置文件
- **资源备份**: 静态资源云存储

---

_最后更新: 2024年12月_
