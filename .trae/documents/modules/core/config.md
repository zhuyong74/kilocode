# Config 模块设计与架构

## 模块定位
- 位置：`src/core/config/`
- 目标：管理核心配置（上下文代理、模式、供应商设置、导入导出），为核心与工具模块提供统一访问。

## 目录结构
- `ContextProxy.ts`：核心上下文代理配置
- `CustomModesManager.ts`：自定义模式管理
- `ProviderSettingsManager.ts`：模型/供应商设置管理
- `importExport.ts`：配置导入/导出
- `kilocode/`：项目特化配置
- `index.ts`、`__tests__/`

## 关键职责
- 维护模式与供应商配置的一致性与校验
- 暴露类型安全的获取/设置接口
- 支持配置的导入导出与版本兼容

## 核心接口
- `getMode(name)`、`setMode(name, config)`
- `getProviderSettings()`、`updateProviderSettings(partial)`
- `exportConfig()`、`importConfig(blob)`

## 数据流与交互
- 输入：用户/项目配置更新
- 处理：校验→合并→应用到核心上下文/工具链
- 输出：更新后的配置与状态

## 错误处理与日志
- 非法配置/缺失字段的校验错误分类
- 变更审计与回滚

## 测试覆盖
- 模式切换与供应商设置的组合测试
- 导入导出与兼容性边界
