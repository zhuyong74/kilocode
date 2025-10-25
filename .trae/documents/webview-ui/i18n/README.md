# I18n 国际化系统

## 概述

I18n 模块提供完整的国际化支持，基于 i18next 和 react-i18next 构建，支持多语言切换、动态加载翻译资源、复数形式处理等功能。

## 核心组件

### TranslationContext

**功能**: 提供全局翻译上下文和语言管理

```typescript
interface TranslationContextValue {
	// 当前语言
	language: string

	// 翻译函数
	t: TFunction

	// 语言切换
	changeLanguage: (lng: string) => Promise<void>

	// 可用语言
	languages: string[]

	// 加载状态
	ready: boolean

	// 错误状态
	error: Error | null
}

const TranslationContext = createContext<TranslationContextValue | null>(null)
```

### setup.ts

**功能**: i18next 初始化配置

```typescript
import i18n from "i18next"
import Backend from "i18next-http-backend"
import { initReactI18next } from "react-i18next"

i18n.use(Backend)
	.use(initReactI18next)
	.init({
		// 默认语言
		lng: "en",

		// 回退语言
		fallbackLng: "en",

		// 调试模式
		debug: process.env.NODE_ENV === "development",

		// 插值配置
		interpolation: {
			escapeValue: false, // React 已经处理了 XSS
		},

		// 后端配置
		backend: {
			loadPath: "/locales/{{lng}}/{{ns}}.json",
		},

		// 命名空间
		defaultNS: "common",
		ns: ["common", "chat", "settings", "errors"],

		// 检测选项
		detection: {
			order: ["localStorage", "navigator", "htmlTag"],
			caches: ["localStorage"],
		},
	})

export default i18n
```

## 语言资源结构

### 目录结构

```
locales/
├── en/
│   ├── common.json
│   ├── chat.json
│   ├── settings.json
│   └── errors.json
├── zh/
│   ├── common.json
│   ├── chat.json
│   ├── settings.json
│   └── errors.json
└── ja/
    ├── common.json
    ├── chat.json
    ├── settings.json
    └── errors.json
```

### 翻译资源示例

**common.json**:

```json
{
	"buttons": {
		"save": "Save",
		"cancel": "Cancel",
		"delete": "Delete",
		"edit": "Edit",
		"copy": "Copy",
		"paste": "Paste"
	},
	"labels": {
		"name": "Name",
		"description": "Description",
		"created": "Created",
		"modified": "Modified"
	},
	"messages": {
		"loading": "Loading...",
		"success": "Operation completed successfully",
		"error": "An error occurred"
	}
}
```

**chat.json**:

```json
{
	"title": "Chat",
	"placeholder": "Type your message...",
	"send": "Send",
	"clear": "Clear Chat",
	"export": "Export Chat",
	"messages": {
		"thinking": "Thinking...",
		"typing": "Typing...",
		"error": "Failed to send message"
	},
	"commands": {
		"help": "Show available commands",
		"clear": "Clear the chat history",
		"export": "Export chat to file"
	}
}
```

**settings.json**:

```json
{
	"title": "Settings",
	"sections": {
		"general": "General",
		"appearance": "Appearance",
		"language": "Language",
		"advanced": "Advanced"
	},
	"theme": {
		"light": "Light",
		"dark": "Dark",
		"auto": "Auto"
	},
	"language": {
		"english": "English",
		"chinese": "中文",
		"japanese": "日本語"
	}
}
```

## 使用方式

### 1. Hook 使用

```typescript
import { useTranslation } from 'react-i18next'

const ChatView = () => {
  const { t, i18n } = useTranslation('chat')

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language)
  }

  return (
    <div>
      <h1>{t('title')}</h1>
      <input placeholder={t('placeholder')} />
      <button>{t('send')}</button>
    </div>
  )
}
```

### 2. 命名空间使用

```typescript
// 使用特定命名空间
const { t } = useTranslation("settings")
const title = t("title") // 从 settings.json 获取

// 使用多个命名空间
const { t } = useTranslation(["common", "chat"])
const saveButton = t("common:buttons.save")
const chatTitle = t("chat:title")
```

### 3. 插值和复数

```typescript
// 插值
const { t } = useTranslation()
const welcome = t("welcome", { name: "John" })
// 翻译: "Welcome, {{name}}!" -> "Welcome, John!"

// 复数形式
const itemCount = t("items", { count: 5 })
// 翻译: "{{count}} item" / "{{count}} items"
```

### 4. 嵌套键值

```typescript
// 访问嵌套的翻译键
const { t } = useTranslation("common")
const saveButton = t("buttons.save")
const errorMessage = t("messages.error")
```

## 高级功能

### 1. 动态命名空间加载

```typescript
const DynamicComponent = () => {
  const { t, ready } = useTranslation('dynamic', {
    useSuspense: false
  })

  if (!ready) return <div>Loading translations...</div>

  return <div>{t('content')}</div>
}
```

### 2. 条件翻译

```typescript
const ConditionalText = ({ isError }: { isError: boolean }) => {
  const { t } = useTranslation()

  return (
    <div>
      {t(isError ? 'errors.general' : 'messages.success')}
    </div>
  )
}
```

### 3. 格式化函数

```typescript
// 日期格式化
const formatDate = (date: Date, lng: string) => {
  return new Intl.DateTimeFormat(lng).format(date)
}

// 数字格式化
const formatNumber = (num: number, lng: string) => {
  return new Intl.NumberFormat(lng).format(num)
}

// 在组件中使用
const FormattedContent = () => {
  const { i18n } = useTranslation()
  const currentLang = i18n.language

  return (
    <div>
      <p>{formatDate(new Date(), currentLang)}</p>
      <p>{formatNumber(1234.56, currentLang)}</p>
    </div>
  )
}
```

## 语言检测

### 1. 自动检测

```typescript
// 浏览器语言检测
const detectBrowserLanguage = () => {
	return navigator.language || navigator.languages[0] || "en"
}

// VSCode 语言检测
const detectVSCodeLanguage = () => {
	// 从 VSCode API 获取语言设置
	return vscode.env.language || "en"
}
```

### 2. 用户偏好存储

```typescript
const LanguageSelector = () => {
  const { i18n } = useTranslation()

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language)
    localStorage.setItem('preferred-language', language)
  }

  return (
    <select
      value={i18n.language}
      onChange={(e) => handleLanguageChange(e.target.value)}
    >
      <option value="en">English</option>
      <option value="zh">中文</option>
      <option value="ja">日本語</option>
    </select>
  )
}
```

## 性能优化

### 1. 懒加载翻译

```typescript
// 按需加载翻译资源
const LazyTranslatedComponent = lazy(() =>
	import("./Component").then((module) => ({
		default: withTranslation("specific-namespace")(module.default),
	})),
)
```

### 2. 翻译缓存

```typescript
// 缓存翻译结果
const useCachedTranslation = (key: string, options?: any) => {
	const { t } = useTranslation()

	return useMemo(() => t(key, options), [t, key, options])
}
```

### 3. 预加载关键翻译

```typescript
// 预加载重要的翻译资源
const preloadTranslations = async (languages: string[], namespaces: string[]) => {
	const promises = languages.flatMap((lng) => namespaces.map((ns) => i18n.loadNamespaces(ns, lng)))

	await Promise.all(promises)
}
```

## 测试策略

### 1. 翻译测试

```typescript
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../setup'

const renderWithI18n = (component: ReactElement, language = 'en') => {
  i18n.changeLanguage(language)

  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

test('renders translated text', () => {
  renderWithI18n(<ChatView />)
  expect(screen.getByText('Chat')).toBeInTheDocument()
})

test('changes language correctly', async () => {
  renderWithI18n(<ChatView />, 'zh')
  expect(screen.getByText('聊天')).toBeInTheDocument()
})
```

### 2. 翻译完整性测试

```typescript
// 检查翻译键是否存在
const checkTranslationKeys = (namespace: string, keys: string[]) => {
	keys.forEach((key) => {
		expect(i18n.exists(`${namespace}:${key}`)).toBe(true)
	})
}

test("all required keys exist", () => {
	checkTranslationKeys("chat", ["title", "placeholder", "send", "clear"])
})
```

## 最佳实践

### 1. 翻译键命名

- 使用层次化的键名结构
- 保持键名简洁明了
- 使用一致的命名约定
- 避免过深的嵌套

### 2. 翻译内容

- 提供上下文信息
- 考虑文本长度变化
- 处理复数形式
- 支持参数插值

### 3. 性能优化

- 按需加载翻译资源
- 缓存翻译结果
- 预加载关键翻译
- 使用 Suspense 处理加载状态

### 4. 维护管理

- 定期检查翻译完整性
- 使用翻译管理工具
- 建立翻译审核流程
- 保持翻译资源同步
