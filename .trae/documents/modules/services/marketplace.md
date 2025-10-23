# Marketplace 服务设计与架构

## 模块定位
- 位置：`src/services/marketplace/`
- 目标：与扩展市场集成，支持远程配置加载、安装与版本管理。

## 目录结构
- `MarketplaceManager.ts`：市场协作的统一入口
- `RemoteConfigLoader.ts`：远程配置加载与校验
- `SimpleInstaller.ts`：简单安装器（下载、解压、注册）
- `index.ts`：导出入口
- `__tests__/`：配置解析、安装流程与参数边界测试

## 关键职责
- 加载与解析远程配置，支持嵌套/可选参数
- 执行安装与更新流程，写入本地配置
- 检查市场设置与兼容性

## 核心类与接口
- `MarketplaceManager`：`install(pkg)`、`update(pkg)`、`remove(name)`
- `RemoteConfigLoader`：`load(url)`、`validate(config)`
- `SimpleInstaller`：`apply(config)`、进度与回滚

## 数据流与交互
- 输入：包名/URL、版本约束、用户设置
- 处理：配置加载→校验→下载/安装→注册
- 输出：安装结果与状态报告

## 配置与扩展点
- 远端源适配器（HTTP、Git、私有源）
- 安装策略（覆盖/并存/迁移）

## 错误处理与日志
- 网络与校验错误分类
- 安装失败的回滚与提示

## 测试覆盖
- 参数嵌套与可选项解析
- 设置检查与安装流程回归
