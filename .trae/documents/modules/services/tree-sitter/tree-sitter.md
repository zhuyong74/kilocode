# Tree-sitter 服务设计与架构

## 模块定位
- 位置：`src/services/tree-sitter/`
- 目标：通过 Tree-sitter 提供多语言语法解析、AST 构建与语义抽取。

## 目录结构
- `index.ts`：对外统一入口
- `languageParser.ts`：语言解析器封装
- `markdownParser.ts`：Markdown 特化解析
- `queries/`：查询脚本与模式
- `__tests__/`：多语言解析、定义抽取与 Markdown 集成测试

## 关键职责
- 支持多语言解析与节点查询
- 对上层提供统一的解析结果结构
- 为 code-index 等服务提供语义数据

## 核心接口
- `parse(source, lang)`：返回 AST/定义/引用等结构
- `query(ast, pattern)`：节点查询与匹配

## 数据流与交互
- 输入：源码文本、语言标识
- 处理：解析→查询→结构化结果
- 输出：节点树与语义摘要

## 配置与扩展点
- 新语言语法支持的加载
- 查询模式的维护与版本化

## 错误处理与日志
- 解析失败与不支持语言提示
- AST 大小与查询耗时记录

## 测试覆盖
- 多语言一致性与定义抽取
- Markdown 集成与边界案例
