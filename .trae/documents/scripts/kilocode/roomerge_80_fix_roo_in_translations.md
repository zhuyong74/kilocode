# 翻译文件修复脚本 (roomerge_80_fix_roo_in_translations.sh)

## 1. 脚本概述

### 脚本名称和用途

- **脚本名称**: `roomerge_80_fix_roo_in_translations.sh`
- **主要用途**: 在 Roo 代码合并后，将翻译文件中的 "Roo Code" 替换为 "Kilo Code"
- **脚本类型**: Bash Shell 脚本

### 主要功能描述

该脚本是 Roo 合并系列脚本的后期步骤，负责：

- 查找 `src/i18n/locales` 目录下的所有 JSON 文件
- 查找项目根目录下的所有 `package.nls*.json` 文件
- 使用 `sed` 命令将 "Roo Code" 替换为 "Kilo Code"

### 在 Roo 合并流程中的作用和位置

```mermaid
graph TD
    A[roomerge_03_package_json.js] --\u003e B[roomerge_80_fix_roo_in_translations.sh]
    B --\u003e C[完成合并]

    B --\u003e B1[查找 i18n 文件]
    B --\u003e B2[替换 i18n 内容]
    B --\u003e B3[查找 nls 文件]
    B --\u003e B4[替换 nls 内容]
```

### 适用场景和目标用户

- **目标用户**: Kilocode 项目维护者和开发者
- **适用场景**:
    - 在 Roo 代码合并后，统一品牌名称
    - 自动化翻译文件的批量修改

## 2. 技术架构

### 脚本执行流程

```mermaid
flowchart TD
    A[脚本启动] --\u003e B[查找 i18n JSON 文件]
    B --\u003e C[批量替换 i18n 文件内容]
    C --\u003e D[查找 package.nls JSON 文件]
    D --\u003e E[批量替换 nls 文件内容]
    E --\u003e F[脚本结束]

    style A fill:#e1f5fe
    style F fill:#c8e6c9
```

### 核心技术栈和依赖

- **Shell 环境**: Bash (#!/bin/bash)
- **文件查找**: `find`
- **文本替换**: `sed`
- **系统要求**: Unix-like 系统 (Linux/macOS)

### 输入输出数据流

```mermaid
graph LR
    A[翻译文件] --\u003e B[脚本处理]
    B --\u003e C[文件内容修改]

    A1[i18n JSON 文件] --\u003e B
    A2[package.nls JSON 文件] --\u003e B
    C --\u003e C1[更新后的翻译文件]
```

## 3. 功能特性

### 详细功能列表

1. **i18n 文件处理**

    - 递归查找 `src/i18n/locales` 目录下的所有 `.json` 文件
    - 对每个文件执行内容替换

2. **nls 文件处理**

    - 在项目根目录下查找所有 `package.nls*.json` 文件
    - 对每个文件执行内容替换

3. **精确替换**
    - 使用正则表达式 `(^|[^a-zA-Z])Roo Code([^a-zA-Z]|$)` 确保只替换完整的单词 "Roo Code"，避免替换 "RooCoder" 等情况

### 支持的参数和选项

- **无参数**: 该脚本不接受任何命令行参数

### 配置文件和环境变量

- **无配置**: 脚本不依赖任何外部配置文件

## 4. 使用指南

### 安装和配置步骤

1. **确保环境**

    - 确保 `find` 和 `sed` 命令可用

2. **设置脚本权限**
    ```bash
    chmod +x scripts/kilocode/roomerge_80_fix_roo_in_translations.sh
    ```

### 基本使用示例

```bash
# 在合并流程的后期运行
./scripts/kilocode/roomerge_80_fix_roo_in_translations.sh
```

## 5. 技术实现

### 核心算法和逻辑

```bash
# 1. 修复 i18n locale JSON 文件
find src/i18n/locales -name "*.json" -type f -exec sed -i '' -E 's/(^|[^a-zA-Z])Roo Code([^a-zA-Z]|$)/\1Kilo Code\2/g' {} \;

# 2. 修复 package.nls JSON 文件
find . -name "package.nls*.json" -type f -exec sed -i '' -E 's/(^|[^a-zA-Z])Roo Code([^a-zA-Z]|$)/\1Kilo Code\2/g' {} \;
```

### 关键代码片段分析

1. **`find` 命令**

    - `find [path] -name "[pattern]" -type f`: 查找指定路径下符合模式的文件

2. **`sed` 命令**

    - `sed -i '' -E 's/regex/replacement/g'`:
        - `-i ''`: 直接在原文件上修改 (macOS/BSD 语法)
        - `-E`: 使用扩展正则表达式
        - `s/regex/replacement/g`: 全局替换

3. **正则表达式**
    - `(^|[^a-zA-Z])`: 匹配字符串开头或非字母字符
    - `Roo Code`: 匹配目标字符串
    - `([^a-zA-Z]|$)`: 匹配非字母字符或字符串结尾
    - `\1` 和 `\2`: 保留捕获组的内容

### 错误处理机制

- **无显式错误处理**: 脚本依赖 `find` 和 `sed` 命令的执行结果。如果文件不存在或命令失败，可能会静默失败或由 shell 报告错误。

## 6. 集成指南

### 在 Roo 合并流程中的集成

```bash
#!/bin/bash
# 完整的 Roo 合并流程

# ... 前续步骤 ...

# 步骤 4: 修复翻译文件
./scripts/kilocode/roomerge_80_fix_roo_in_translations.sh

echo "合并流程完成"
```

### CI/CD 集成方法

```yaml
# GitHub Actions 示例
- name: Fix Translations
  run: |
      ./scripts/kilocode/roomerge_80_fix_roo_in_translations.sh
```

## 7. 故障排除

### 常见问题和解决方案

#### 问题 1: `sed` 命令在 Linux 和 macOS 上的差异

- **问题**: `sed -i` 的语法在 GNU `sed` (Linux) 和 BSD `sed` (macOS) 上不同。
- **脚本中的实现**: `sed -i ''` 是 BSD `sed` 的语法。在 GNU `sed` 上，应该使用 `sed -i`。
- **解决方案**:
    ```bash
    # 跨平台兼容的写法
    if [[ "$(uname)" == "Darwin" ]]; then
      find . -name "*.json" -exec sed -i '' -E 's/Roo Code/Kilo Code/g' {} \;
    else
      find . -name "*.json" -exec sed -i -E 's/Roo Code/Kilo Code/g' {} \;
    fi
    ```
    (注意：当前脚本未做此兼容处理，可能在 Linux 上需要修改)

#### 问题 2: 文件权限问题

- **问题**: 如果脚本没有权限读取或写入文件，`sed` 命令会失败。
- **解决方案**: 确保执行脚本的用户对目标文件有读写权限。

## 8. 最佳实践

### 使用建议和注意事项

1. **备份**: 在运行脚本前，确保对项目进行了备份。
2. **验证**: 运行脚本后，随机抽查几个文件，确认替换是否正确。
3. **平台兼容性**: 注意 `sed` 命令在不同平台上的差异。

## 9. 版本兼容性

### 支持的操作系统

- **macOS**: 默认支持
- **Linux**: 可能需要修改 `sed -i` 的语法
- **Windows**: 需要在 WSL 或类似环境运行

### 依赖版本要求

- **Bash**: 4.0+
- **find**: 标准 Unix 版本
- **sed**: BSD `sed` (默认) 或 GNU `sed` (需修改脚本)

## 10. 参考资料

### 相关文档链接

- [`find` 命令文档](https://man7.org/linux/man-pages/man1/find.1.html)
- [`sed` 命令文档](https://www.gnu.org/software/sed/manual/sed.html)
