# Kilocode Core 入口模块设计与架构

## 模块定位

- 位置：`src/core/kilocode.ts` 与 `src/core/kilocode/`
- 目标：作为核心入口与协调层，连接状态栏、webview、包装器等组件。

## 目录结构

- `kilocode.ts`：核心入口/导出
- `kilocode/`：
    - `CreditsStatusBar.ts`：状态栏信用/额度显示
    - `wrapper.ts`：封装与桥接核心功能
    - `webview/`：与 webview 的特化交互

## 关键职责

- 初始化核心态并连接 UI（状态栏、webview）
- 提供统一的包装器以供工具与服务调用

## 核心接口

- `initKilocode(context)`：初始化与依赖连接
- `getWrapper()`：返回封装对象（方法路由）
- 状态栏 API：`updateCredits(info)`

## 数据流与交互

- 输入：扩展上下文与配置
- 处理：初始化→连接 UI/服务→暴露封装方法
- 输出：面向工具/服务的调用入口与 UI 更新

## 配置与扩展点

- 状态栏内容与刷新策略
- webview 交互事件注册

## 错误处理与日志

- 初始化失败与依赖不可用的降级
- UI 更新的失败监控

## 测试覆盖

- 入口初始化与 UI 路由的正确性
