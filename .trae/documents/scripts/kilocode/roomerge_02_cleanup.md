# Roo 合并清理脚本 (roomerge_02_cleanup.sh)

## 1. 脚本概述

### 脚本名称和用途

- **脚本名称**: `roomerge_02_cleanup.sh`
- **主要用途**: 在 Roo 代码合并后，清理不需要的文件和配置
- **脚本类型**: Bash Shell 脚本

### 主要功能描述

该脚本是 Roo 合并系列脚本的第二步，负责：

- 恢复 Kilocode 特有的文件（如 README.md, CHANGELOG.md）
- 移除上游仓库的特定配置文件（如 .github, .roo）
- 删除不需要的测试文件和本地化 README

### 在 Roo 合并流程中的作用和位置

```mermaid
graph TD
    A[roomerge_01_init.sh] --\u003e B[roomerge_02_cleanup.sh]
    B --\u003e C[roomerge_03_package_json.js]
    C --\u003e D[roomerge_80_fix_roo_in_translations.sh]
    D --\u003e E[完成合并]

    B --\u003e B1[恢复核心文件]
    B --\u003e B2[移除遥测测试]
    B --\u003e B3[删除本地化 README]
    B --\u003e B4[清理上游配置]
```

### 适用场景和目标用户

- **目标用户**: Kilocode 项目维护者和开发者
- **适用场景**:
    - 在 `roomerge_01_init.sh` 执行后，清理合并引入的不需要的文件
    - 保持 Kilocode 项目的独立性和配置纯净
    - 自动化合并后的文件清理工作

## 2. 技术架构

### 脚本执行流程

```mermaid
flowchart TD
    A[脚本启动] --\u003e B[恢复核心文件]
    B --\u003e C[移除遥测测试文件]
    C --\u003e D[查找并删除本地化 README]
    D --\u003e E[查找并清理 .github 配置]
    E --\u003e F[查找并清理 .roo 配置]
    F --\u003e G[移除 .roomodes 文件]
    G --\u003e H[脚本结束]

    style A fill:#e1f5fe
    style H fill:#c8e6c9
```

### 核心技术栈和依赖

- **Shell 环境**: Bash (#!/bin/bash)
- **版本控制**: Git
- **文本处理**: Perl, grep, xargs
- **系统要求**: Unix-like 系统 (Linux/macOS)
- **外部依赖**:
    - Git 命令行工具
    - Perl 解释器
    - 标准 Unix 工具 (grep, xargs)

### 输入输出数据流

```mermaid
graph LR
    A[Git 仓库状态] --\u003e B[脚本处理]
    B --\u003e C[Git 操作]
    C --\u003e D[文件删除]
    D --\u003e E[文件恢复]

    A1[合并后的文件] --\u003e B
    E --\u003e E1[README.md]
    E --\u003e E2[CHANGELOG.md]
    E --\u003e E3[.github 目录]
```

## 3. 功能特性

### 详细功能列表

1. **核心文件恢复**

    - 从 `origin/main` 分支恢复 `README.md`, `CHANGELOG.md`, `.github`

2. **遥测测试移除**

    - 删除与遥测相关的测试文件

3. **本地化 README 清理**

    - 查找并删除所有本地化的 README 文件

4. **上游配置清理**
    - 移除合并引入的 `.github` 和 `.roo` 目录下的文件
    - 删除 `.roomodes` 文件

### 支持的参数和选项

- **无参数**: 该脚本不接受任何命令行参数

### 配置文件和环境变量

- **Git 配置**: 依赖本地 Git 配置
- **远程仓库**: 需要配置 `origin` 远程仓库
- **权限要求**: 需要对仓库的读写权限

## 4. 使用指南

### 安装和配置步骤

1. **确保 Git 环境**

    ```bash
    # 检查 Git 版本
    git --version

    # 确保 origin 远程仓库已配置
    git remote -v
    ```

2. **设置脚本权限**
    ```bash
    chmod +x scripts/kilocode/roomerge_02_cleanup.sh
    ```

### 基本使用示例

```bash
# 在执行 roomerge_01_init.sh 后运行
./scripts/kilocode/roomerge_02_cleanup.sh
```

### 高级使用场景

```bash
# 1. 组合使用
./scripts/kilocode/roomerge_01_init.sh v3.15.5 \u0026\u0026 \
./scripts/kilocode/roomerge_02_cleanup.sh

# 2. 调试模式
bash -x ./scripts/kilocode/roomerge_02_cleanup.sh
```

## 5. 技术实现

### 核心算法和逻辑

```bash
# 1. 恢复核心文件
git checkout origin/main README.md CHANGELOG.md .github

# 2. 移除遥测测试
git rm "webview-ui/src/__tests__/TelemetryClient.spec.ts"
git rm "webview-ui/src/utils/__tests__/TelemetryClient.spec.ts"

# 3. 清理本地化 README
git status | grep 'deleted by us' | perl -pe 's/.*?://' | grep README.md | xargs -n1 -I{} git rm "{}"

# 4. 清理上游配置
git status | grep 'deleted by us' | perl -pe 's/.*?://' | grep ".github/" | xargs -n1 -I{} git rm "{}"
git status | grep 'deleted by us' | perl -pe 's/.*?://' | grep ".roo/" | xargs -n1 -I{} git rm "{}"
git rm .roomodes
```

### 关键代码片段分析

1. **文件恢复**

    ```bash
    git checkout origin/main README.md CHANGELOG.md .github
    ```

    - 从 `origin/main` 分支检出指定文件，覆盖当前工作目录中的版本

2. **文件删除**

    ```bash
    git rm "path/to/file"
    ```

    - 从 Git 仓库中删除指定文件

3. **动态文件查找和删除**
    ```bash
    git status | grep 'deleted by us' | perl -pe 's/.*?://' | grep README.md | xargs -n1 -I{} git rm "{}"
    ```
    - `git status`: 获取文件状态
    - `grep 'deleted by us'`: 筛选出被我们删除的文件
    - `perl -pe 's/.*?://'`: 提取文件名
    - `grep README.md`: 筛选出 README 文件
    - `xargs -n1 -I{} git rm "{}"`: 对每个文件执行 `git rm`

### 错误处理机制

- **无 `set -e`**: 脚本会继续执行，即使某个命令失败
- **依赖 Git**: 依赖 Git 命令的内置错误处理
- **手动干预**: 如果脚本执行失败，需要手动检查和修复

### 性能优化策略

- **批量操作**: 使用 `xargs` 进行批量文件删除
- **Git 优化**: 依赖 Git 的高效文件操作
- **最小化命令**: 尽量使用单个命令完成多个操作

## 6. 集成指南

### 在 Roo 合并流程中的集成

```bash
#!/bin/bash
# 完整的 Roo 合并流程

TAG="v3.15.5"

# 步骤 1: 初始化合并
./scripts/kilocode/roomerge_01_init.sh $TAG

# 步骤 2: 清理不需要的文件
./scripts/kilocode/roomerge_02_cleanup.sh

echo "清理完成，请继续下一步操作"
```

### CI/CD 集成方法

```yaml
# GitHub Actions 示例
- name: Cleanup After Merge
  run: |
      ./scripts/kilocode/roomerge_02_cleanup.sh
```

### Docker 容器化支持

```dockerfile
FROM alpine/git:latest

# 安装必要工具
RUN apk add --no-cache bash perl

# 复制脚本
COPY scripts/kilocode/roomerge_02_cleanup.sh /usr/local/bin/

# 设置工作目录
WORKDIR /workspace

# 设置入口点
ENTRYPOINT ["/usr/local/bin/roomerge_02_cleanup.sh"]
```

## 7. 故障排除

### 常见问题和解决方案

#### 问题 1: `origin/main` 不存在

```bash
# 错误信息
fatal: 'origin/main' is not a commit and a branch 'main' cannot be created from it

# 解决方案
git fetch origin
git remote -v  # 检查远程仓库配置
```

#### 问题 2: `perl` 命令未找到

```bash
# 错误信息
-bash: perl: command not found

# 解决方案 (Ubuntu)
sudo apt update \u0026\u0026 sudo apt install perl

# 解决方案 (macOS)
brew install perl
```

#### 问题 3: 文件删除失败

```bash
# 错误信息
fatal: pathspec 'path/to/file' did not match any files

# 解决方案
- 检查文件路径是否正确
- 确保文件存在于 Git 仓库中
- 手动执行 `git rm` 命令进行调试
```

### 错误代码和含义

| 退出代码 | 含义         | 解决方法          |
| -------- | ------------ | ----------------- |
| 128      | Git 操作失败 | 检查 Git 仓库状态 |
| 1        | `xargs` 错误 | 检查输入数据流    |

### 调试技巧和工具

```bash
# 1. 启用详细输出
bash -x scripts/kilocode/roomerge_02_cleanup.sh

# 2. 分步执行命令
git status | grep 'deleted by us'
git status | grep 'deleted by us' | perl -pe 's/.*?://'

# 3. 检查 Git 状态
git status
git diff --cached
```

### 日志分析方法

```bash
# 创建日志文件
./scripts/kilocode/roomerge_02_cleanup.sh 2\u003e\u00261 | tee cleanup.log

# 分析关键信息
grep -E "(error|fatal|warning)" cleanup.log
grep "git rm" cleanup.log
```

## 8. 最佳实践

### 使用建议和注意事项

1. **执行时机**: 必须在 `roomerge_01_init.sh` 成功执行后运行
2. **备份**: 执行前确保有可靠的备份
3. **代码审查**: 检查脚本逻辑是否符合预期
4. **环境一致性**: 确保所有开发者环境都安装了必要的工具 (Perl, xargs)

### 性能优化建议

- **Git 索引**: 确保 Git 索引是最新的
- **文件系统**: 在高性能文件系统上运行
- **并行处理**: 如果文件数量巨大，可以考虑并行处理

### 安全考虑

- **权限控制**: 限制对脚本的执行权限
- **输入验证**: 脚本不接受输入，减少了注入风险
- **代码审计**: 定期审计脚本，防止恶意代码注入

### 维护和更新指南

1. **定期更新**

    - 检查 `grep` 和 `perl` 命令的兼容性
    - 更新文件路径和名称
    - 适配新的项目结构

2. **版本控制**
    - 所有脚本更改都应通过版本控制系统进行管理
    - 每次更改都应有清晰的提交信息

## 9. 版本兼容性

### 支持的操作系统

- **Linux**: Ubuntu 18.04+, CentOS 7+, Debian 9+
- **macOS**: 10.14+
- **Windows**: WSL 2 环境

### 依赖版本要求

- **Git**: 2.20.0+
- **Bash**: 4.0+
- **Perl**: 5.20+
- **grep, xargs**: 标准 Unix 版本

### 向后兼容性说明

- 兼容 Git 2.x 所有版本
- 兼容 Perl 5.x 版本
- 适配不同的项目结构

### 升级指南

```bash
# 检查 Perl 版本
perl -v

# 升级 Perl (Ubuntu)
sudo apt update \u0026\u0026 sudo apt upgrade perl

# 升级 Perl (macOS)
brew upgrade perl
```

## 10. 参考资料

### 相关文档链接

- [Git 官方文档](https://git-scm.com/doc)
- [Perl 官方文档](https://www.perl.org/docs.html)
- [Shell 脚本编程指南](https://www.gnu.org/software/bash/manual/)

### 外部依赖文档

- [Git 命令参考](https://git-scm.com/docs)
- [Perl 正则表达式教程](https://perldoc.perl.org/perlre)
- [xargs 命令参考](https://man7.org/linux/man-pages/man1/xargs.1.html)

### 社区资源

- [Kilocode 项目 GitHub](https://github.com/kilocode/kilocode)
- [Git 工作流讨论](https://github.com/kilocode/kilocode/discussions)
- [问题反馈](https://github.com/kilocode/kilocode/issues)

### 更新日志

- **v1.0.0**: 初始版本，支持基本清理功能
- **v1.1.0**: 改进文件查找逻辑
- **v1.2.0**: 增加对 `.roomodes` 文件的清理
- **v1.3.0**: 优化性能和错误处理
