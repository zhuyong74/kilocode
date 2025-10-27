# Package.json 合并冲突处理脚本 (roomerge_03_package_json.js)

## 1. 脚本概述

### 脚本名称和用途

- **脚本名称**: `roomerge_03_package_json.js`
- **主要用途**: 自动解决 `src/package.json` 文件在合并过程中的特定冲突
- **脚本类型**: Node.js 脚本

### 主要功能描述

该脚本是 Roo 合并系列脚本的第三步，负责：

- 检查 `src/package.json` 是否存在合并冲突
- 自动解决 `publisher`, `version`, `icon` 字段的冲突
- 始终保留 `HEAD` 版本的字段值
- 自动将解决后的文件添加到 Git 暂存区

### 在 Roo 合并流程中的作用和位置

```mermaid
graph TD
    A[roomerge_02_cleanup.sh] --\u003e B[roomerge_03_package_json.js]
    B --\u003e C[roomerge_80_fix_roo_in_translations.sh]
    C --\u003e D[完成合并]

    B --\u003e B1[检查冲突]
    B --\u003e B2[解析冲突块]
    B --\u003e B3[保留 HEAD 版本]
    B --\u003e B4[写入文件]
    B --\u003e B5[添加到暂存区]
```

### 适用场景和目标用户

- **目标用户**: Kilocode 项目维护者和开发者
- **适用场景**:
    - 在 Roo 代码合并后，自动处理 `package.json` 的常见冲突
    - 简化合并流程，减少手动干预
    - 确保 `publisher`, `version`, `icon` 字段的正确性

## 2. 技术架构

### 脚本执行流程

```mermaid
flowchart TD
    A[脚本启动] --\u003e B{检查 Git 仓库}
    B --\u003e|否| C[错误退出]
    B --\u003e|是| D{检查 package.json}
    D --\u003e|不存在| E[错误退出]
    D --\u003e|存在| F{获取冲突文件}
    F --\u003e|无冲突| G[正常退出]
    F --\u003e|有冲突| H[读取文件内容]
    H --\u003e I{解析冲突块}
    I --\u003e|失败| J[错误退出]
    I --\u003e|成功| K{验证冲突字段}
    K --\u003e|不匹配| L[错误退出]
    K --\u003e|匹配| M[提取 HEAD 版本]
    M --\u003e N[生成新文件内容]
    N --\u003e O[写入文件]
    O --\u003e P[添加到暂存区]
    P --\u003e Q[脚本结束]

    style A fill:#e1f5fe
    style Q fill:#c8e6c9
    style C fill:#ffcdd2
    style E fill:#ffcdd2
    style J fill:#ffcdd2
    style L fill:#ffcdd2
```

### 核心技术栈和依赖

- **运行时**: Node.js
- **模块**: `fs`, `path`, `child_process`
- **版本控制**: Git
- **系统要求**: 安装 Node.js 和 Git 的环境

### 输入输出数据流

```mermaid
graph LR
    A[src/package.json] --\u003e B[脚本处理]
    B --\u003e C[Git 操作]
    C --\u003e D[文件写入]
    D --\u003e E[暂存区更新]

    A1[冲突内容] --\u003e B
    E --\u003e E1[解决后的 package.json]
```

## 3. 功能特性

### 详细功能列表

1. **环境检查**

    - 验证脚本是否在 Git 仓库中运行
    - 检查 `src/package.json` 文件是否存在

2. **冲突检测**

    - 获取 Git 冲突文件列表
    - 检查 `src/package.json` 是否在冲突列表中
    - 读取文件内容，查找合并冲突标记

3. **冲突解析**

    - 解析文件中的冲突块 (`\u003c\u003c\u003c\u003c\u003c\u003c\u003c HEAD`, `=======`, `\u003e\u003e\u003e\u003e\u003e\u003e\u003e`)
    - 支持单个冲突块的自动处理

4. **字段验证**

    - 检查冲突块是否只包含 `publisher`, `version`, `icon` 字段
    - 如果包含其他字段，则退出并提示手动解决

5. **自动解决**

    - 提取 `HEAD` 版本的代码块
    - 用 `HEAD` 版本替换整个冲突块
    - 将解决后的内容写回 `src/package.json`

6. **Git 集成**
    - 自动将解决后的 `src/package.json` 添加到 Git 暂存区

### 支持的参数和选项

- **无参数**: 该脚本不接受任何命令行参数

### 配置文件和环境变量

- **无配置**: 脚本不依赖任何外部配置文件
- **环境变量**: 依赖 `process.cwd()` 获取当前工作目录

## 4. 使用指南

### 安装和配置步骤

1. **确保 Node.js 环境**

    ```bash
    # 检查 Node.js 版本
    node -v
    ```

2. **设置脚本权限**
    ```bash
    chmod +x scripts/kilocode/roomerge_03_package_json.js
    ```

### 基本使用示例

```bash
# 在 package.json 出现特定冲突后运行
./scripts/kilocode/roomerge_03_package_json.js
```

### 高级使用场景

```bash
# 1. 组合使用
./scripts/kilocode/roomerge_01_init.sh v3.15.5 \u0026\u0026 \
./scripts/kilocode/roomerge_02_cleanup.sh \u0026\u0026 \
./scripts/kilocode/roomerge_03_package_json.js

# 2. 调试模式
node --inspect-brk scripts/kilocode/roomerge_03_package_json.js
```

## 5. 技术实现

### 核心算法和逻辑

```javascript
// 1. 获取冲突文件列表
function getConflictedFiles() {
    const output = execSync("git diff --name-only --diff-filter=U", { encoding: "utf8" });
    return output.trim().split("\n");
}

// 2. 解析冲突块
for (let i = 0; i \u003c lines.length; i++) {
    if (line.includes("\u003c\u003c\u003c\u003c\u003c\u003c\u003c HEAD")) { /* ... */ }
    else if (line.includes("=======")) { /* ... */ }
    else if (line.includes("\u003e\u003e\u003e\u003e\u003e\u003e\u003e")) { /* ... */ }
}

// 3. 验证冲突字段
const expectedFields = ["publisher", "version", "icon"];
const hasOnlyExpectedFields = fieldsInHead.length === expectedFields.length \u0026\u0026 expectedFields.every(field =\u003e fieldsInHead.includes(field));

// 4. 提取 HEAD 版本并替换
const headLines = lines.slice(block.start + 1, block.separator);
const newLines = [...lines.slice(0, block.start), ...headLines, ...lines.slice(block.end + 1)];

// 5. 写入文件并添加到暂存区
fs.writeFileSync(PACKAGE_JSON_PATH, newLines.join("\n"));
execSync(`git add ${PACKAGE_JSON_PATH}`);
```

### 关键代码片段分析

1. **执行 Git 命令**

    ```javascript
    const { execSync } = require("child_process")
    execSync("git diff --name-only --diff-filter=U")
    ```

    - 使用 `execSync` 同步执行 Git 命令并获取输出

2. **文件读写**

    ```javascript
    const fs = require("fs")
    const content = fs.readFileSync(PACKAGE_JSON_PATH, "utf8")
    fs.writeFileSync(PACKAGE_JSON_PATH, newContent)
    ```

    - 使用 `fs` 模块进行文件同步读写

3. **冲突块解析**
    - 通过遍历文件行，识别 `\u003c\u003c\u003c\u003c\u003c\u003c\u003c`, `=======`, `\u003e\u003e\u003e\u003e\u003e\u003e\u003e` 标记，从而确定冲突块的起始、分隔和结束位置

### 错误处理机制

- **环境检查**: 脚本开始时检查 Git 仓库和文件是否存在
- **冲突验证**: 严格验证冲突块的内容，只处理特定字段的冲突
- **明确的错误信息**: 在无法自动解决时，提供清晰的错误信息，要求手动干预
- **try-catch**: 使用 `try-catch` 块捕获 `execSync` 可能抛出的异常

### 性能优化策略

- **同步操作**: 使用同步 I/O 和子进程执行，简化逻辑，适用于单文件操作
- **内存处理**: 将文件内容读入内存进行处理，对于 `package.json` 这样的小文件是高效的
- **最小化 Git 操作**: 只执行必要的 Git 命令

## 6. 集成指南

### 在 Roo 合并流程中的集成

```bash
#!/bin/bash
# 完整的 Roo 合并流程

# ... 前续步骤 ...

# 步骤 3: 处理 package.json 冲突
./scripts/kilocode/roomerge_03_package_json.js

# ... 后续步骤 ...
```

### CI/CD 集成方法

```yaml
# GitHub Actions 示例
- name: Resolve package.json Conflicts
  run: |
      ./scripts/kilocode/roomerge_03_package_json.js
```

### Docker 容器化支持

```dockerfile
FROM node:18-alpine

# 安装 Git
RUN apk add --no-cache git

# 复制脚本
COPY scripts/kilocode/roomerge_03_package_json.js /usr/local/bin/

# 设置工作目录
WORKDIR /workspace

# 设置入口点
ENTRYPOINT ["node", "/usr/local/bin/roomerge_03_package_json.js"]
```

## 7. 故障排除

### 常见问题和解决方案

#### 问题 1: "Not in a git repository"

```bash
# 错误信息
Error: Not in a git repository

# 解决方案
- 确保在 Git 仓库的根目录下运行脚本
- 检查 `.git` 目录是否存在
```

#### 问题 2: "src/package.json not found"

```bash
# 错误信息
Error: src/package.json not found

# 解决方案
- 检查 `src/package.json` 文件路径是否正确
- 确保脚本在项目根目录运行
```

#### 问题 3: "Multiple conflict blocks found"

```bash
# 错误信息
Multiple conflict blocks found in package.json

# 解决方案
- 手动打开 `src/package.json`
- 解决所有冲突，或只保留一个与 `publisher`, `version`, `icon` 相关的冲突块
```

#### 问题 4: "Conflict block contains fields other than..."

```bash
# 错误信息
Conflict block contains fields other than publisher, version, and icon

# 解决方案
- 手动解决 `src/package.json` 中的冲突
- 该脚本只处理特定字段的冲突，其他冲突需要手动干预
```

### 错误代码和含义

| 退出代码 | 含义             | 解决方法                     |
| -------- | ---------------- | ---------------------------- |
| 1        | 脚本执行失败     | 查看控制台错误信息，手动解决 |
| 0        | 成功执行或无冲突 | 无需操作                     |

### 调试技巧和工具

```bash
# 1. 使用 Node.js 调试器
node --inspect-brk scripts/kilocode/roomerge_03_package_json.js

# 2. 添加日志输出
console.log("Conflicted files:", conflictedFiles);
console.log("Conflict block content:", blockContent);

# 3. 检查 Git 状态
git status
git diff src/package.json
```

## 8. 最佳实践

### 使用建议和注意事项

1. **执行时机**: 在 `roomerge_02_cleanup.sh` 之后，处理 `package.json` 冲突时运行
2. **限制**: 仅适用于 `publisher`, `version`, `icon` 三个字段的冲突
3. **手动验证**: 脚本执行后，建议再次检查 `package.json` 的内容是否正确

### 性能优化建议

- **无需优化**: 对于小文件和简单逻辑，当前实现已足够高效

### 安全考虑

- **命令注入**: 脚本内部执行的 Git 命令是固定的，不存在命令注入风险
- **文件操作**: 脚本只修改 `src/package.json`，影响范围可控

### 维护和更新指南

1. **字段扩展**: 如果需要自动解决其他字段的冲突，可以修改 `expectedFields` 数组
2. **逻辑更新**: 随着 `package.json` 结构的变化，可能需要更新冲突解析逻辑

## 9. 版本兼容性

### 支持的操作系统

- 任何支持 Node.js 和 Git 的操作系统

### 依赖版本要求

- **Node.js**: 14.x+
- **Git**: 2.x+

### 向后兼容性说明

- 脚本逻辑不依赖特定的 Node.js 或 Git 次要版本

## 10. 参考资料

### 相关文档链接

- [Node.js `child_process` 文档](https://nodejs.org/api/child_process.html)
- [Node.js `fs` 文档](https://nodejs.org/api/fs.html)
- [Git 合并冲突解决](https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging)

### 社区资源

- [Kilocode 项目 GitHub](https://github.com/kilocode/kilocode)
- [问题反馈](https://github.com/kilocode/kilocode/issues)
