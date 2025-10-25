# Common 通用组件

## 概述

`common/` 目录是 webview-ui 的核心基础组件库，提供了一系列可复用的、与业务逻辑解耦的 UI 组件。这些组件遵循统一的设计规范和开发标准，旨在提高开发效率、保证界面一致性，并支持主题切换和国际化。

## 设计原则

### 1. 原子化设计

- **单一职责**: 每个组件专注于一个核心功能
- **可组合性**: 复杂组件由简单组件组合而成
- **可配置性**: 通过 Props 提供丰富的配置选项

### 2. 样式解耦

- **Tailwind CSS**: 使用原子化 CSS 类进行样式定义
- **CSS 变量**: 支持主题切换和动态样式
- **`className` 覆盖**: 允许父组件覆盖默认样式

### 3. 可访问性 (a11y)

- **语义化 HTML**: 使用正确的 HTML 标签
- **ARIA 属性**: 提供完整的 ARIA 支持
- **键盘导航**: 确保所有组件都支持键盘操作

## 核心组件详解

### 1. CodeBlock.tsx - 代码块

**功能职责**: 用于展示代码片段，支持语法高亮、行号显示和复制功能。

```typescript
interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  onCopy?: () =\u003e void;
  className?: string;
}
```

**核心实现**:

- **语法高亮**: 集成 `shiki` 库，支持多种语言高亮。
- **行号显示**: 可选的行号展示功能。
- **复制功能**: 一键复制全部代码到剪贴板。
- **主题支持**: 自动适应 VSCode 的明暗主题。

### 2. Modal.tsx - 模态对话框

**功能职责**: 提供一个覆盖在主内容之上的对话框，用于展示重要信息或需要用户交互的场景。

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () =\u003e void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

**核心实现**:

- **焦点管理**: 打开时自动聚焦到对话框内，关闭时恢复焦点。
- **键盘导航**: 支持 `Escape` 键关闭对话框。
- **可访问性**: 使用 `role="dialog"` 和 `aria-modal="true"`。
- **动画效果**: 平滑的淡入淡出动画。

### 3. MermaidBlock.tsx - Mermaid 图表

**功能职责**: 用于渲染基于文本的 Mermaid 图表，支持流程图、序列图、甘特图等。

```typescript
interface MermaidBlockProps {
  content: string;
  isStreaming?: boolean;
  onRender?: (svg: string) =\u003e void;
}
```

**核心实现**:

- **动态渲染**: 在客户端动态渲染 Mermaid 语法。
- **错误处理**: 优雅地处理语法错误，并提供修复建议。
- **SVG 导出**: 支持将图表导出为 SVG 格式。
- **主题适配**: 自动适配当前 VSCode 主题。

### 4. ImageViewer.tsx - 图片查看器

**功能职责**: 提供一个支持缩放、平移和旋转的图片查看器。

```typescript
interface ImageViewerProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () =\u003e void;
}
```

**核心实现**:

- **缩放功能**: 支持鼠标滚轮和按钮缩放。
- **平移功能**: 支持拖拽平移图片。
- **旋转功能**: 支持按步长旋转图片。
- **键盘支持**: 支持键盘快捷键操作。

### 5. ToolUseBlock.tsx - 工具使用块

**功能职责**: 用于展示 AI 任务执行过程中工具调用的信息。

```typescript
interface ToolUseBlockProps {
	toolName: string
	toolInput: any
	toolOutput?: any
	isRunning: boolean
	error?: string
}
```

**核心实现**:

- **状态展示**: 清晰展示工具的调用状态（运行中、成功、失败）。
- **输入/输出展示**: 格式化展示工具的输入和输出数据。
- **错误提示**: 醒目地展示工具调用过程中的错误信息。

## UI 基础组件

### 1. Button 组件

- **VSCodeButton**: 基础按钮，样式与 VSCode 统一。
- **DangerButton**: 用于危险操作的警示按钮。
- **IconButton**: 只包含图标的按钮。

```typescript
// 示例
\u003cVSCodeButton onClick={handleClick}\u003e保存\u003c/VSCodeButton\u003e
\u003cDangerButton onClick={handleDelete}\u003e删除\u003c/DangerButton\u003e
\u003cIconButton icon={\u003cTrashIcon /\u003e} onClick={handleClear} /\u003e
```

### 2. 输入组件

- **DecoratedVSCodeTextField**: 带装饰（如图标）的文本输入框。
- **FormattedTextField**: 支持特定格式输入的文本框。

```typescript
// 示例
\u003cDecoratedVSCodeTextField
  icon={\u003cSearchIcon /\u003e}
  placeholder="搜索..."
/\u003e
```

### 3. 导航组件

- **Tab**: 选项卡容器。
- **TabButton**: 单个选项卡按钮。

```typescript
// 示例
\u003cTab\u003e
  \u003cTabButton title="常规"\u003e内容一\u003c/TabButton\u003e
  \u003cTabButton title="高级"\u003e内容二\u003c/TabButton\u003e
\u003c/Tab\u003e
```

## 状态管理和 Hooks

`common/` 目录下的组件通常是无状态的（Stateless），其行为由父组件通过 Props 控制。但部分复杂组件可能包含内部状态管理。

### 内部状态管理

```typescript
// ImageViewer.tsx 内部状态示例
const [scale, setScale] = useState(1)
const [position, setPosition] = useState({ x: 0, y: 0 })
const [rotation, setRotation] = useState(0)
```

### 自定义 Hooks

`common/` 目录不包含复杂的自定义 Hooks，相关 Hooks 通常定义在 `src/hooks/` 目录下。

## 样式和主题

### 1. Tailwind CSS + `cn` 工具函数

```typescript
import { cn } from "@/lib/utils"

const buttonClasses = cn(
	"px-4 py-2 rounded-md",
	{
		"bg-blue-500 text-white": variant === "primary",
		"bg-gray-200 text-black": variant === "secondary",
	},
	className,
)
```

### 2. CSS 变量主题

所有组件的颜色、字体等都使用 VSCode 提供的 CSS 变量，以确保与编辑器主题保持一致。

```css
.modal-content {
	background-color: var(--vscode-editor-background);
	color: var(--vscode-editor-foreground);
	border: 1px solid var(--vscode-panel-border);
}
```

## 测试策略

### 1. 单元测试

使用 `Vitest` 和 `React Testing Library` 对每个组件进行单元测试。

```typescript
describe('CodeBlock', () =\u003e {
  it('should render code with syntax highlighting', () =\u003e {
    render(\u003cCodeBlock code="const a = 1;" language="javascript" /\u003e);
    expect(screen.getByText('const')).toHaveClass('shiki-keyword');
  });

  it('should copy code to clipboard when copy button is clicked', async () =\u003e {
    const user = userEvent.setup();
    render(\u003cCodeBlock code="Hello" language="text" /\u003e);

    await user.click(screen.getByRole('button', { name: /copy/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello');
  });
});
```

### 2. 快照测试

对于样式复杂的组件，使用快照测试来确保 UI 的一致性。

```typescript
it('should match snapshot', () =\u003e {
  const { container } = render(\u003cModal title="Test"\u003eContent\u003c/Modal\u003e);
  expect(container).toMatchSnapshot();
});
```

## 未来展望

- **组件文档**: 完善每个组件的 Storybook 文档。
- **动画效果**: 引入 `framer-motion` 增强组件的交互动画。
- **可访问性审计**: 定期进行可访问性审计，确保符合 WCAG 标准。
