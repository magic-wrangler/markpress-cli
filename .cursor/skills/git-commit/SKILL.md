---
name: git-commit
description: >-
  为 markpress-cli 仓库执行规范的 Git 提交与推送。在用户要求提交、commit、推送、
  初始化远程仓库，或需要撰写中文提交信息时使用。包含仓库地址、提交者身份与安全协议。
---

# Git 提交（markpress-cli）

## 仓库信息

| 项 | 值 |
|---|---|
| 远程地址 | `https://github.com/magic-wrangler/markpress-cli.git` |
| 提交用户名 | `magic-wrangler` |
| 提交邮箱 | `2085649039@qq.com` |

## 触发条件

仅在用户**明确要求**时执行提交或推送，例如：

- 「提交」「commit」「git commit」
- 「推送到远程」「push」
- 「创建提交并推送」

未明确要求时，**不要**主动提交。

## 安全协议（必须遵守）

- **禁止**修改全局或本地 `git config`（不执行 `git config user.name` 等）
- **禁止**破坏性命令：`push --force`、`reset --hard` 等，除非用户明确要求
- **禁止**跳过钩子：`--no-verify`、`--no-gpg-sign`
- **禁止**对 `main`/`master` 执行 force push；若用户要求，须先警告
- **禁止**提交敏感文件：`.env`、密钥、凭证等；若用户要求提交，须警告
- **禁止**空提交（无变更时不提交）
- **禁止**使用 `-i` 交互式命令（`git rebase -i`、`git add -i`）
- amend 仅当**全部**满足：用户明确要求、HEAD 由本会话创建、尚未 push

提交身份通过 `-c` 参数传入，不写入 config：

```powershell
git -c user.name="magic-wrangler" -c user.email="2085649039@qq.com" commit ...
```

## 提交前检查

并行执行以下命令了解当前状态：

```powershell
git status
git diff
git diff --staged
git log --oneline -5
```

若 `master`/`main` 尚无提交，跳过 `git log`。

分析要点：

1. 区分已暂存与未暂存变更
2. 确认不包含 `node_modules/`、`dist/`、`test-output/` 等应忽略文件
3. 若无任何可提交变更，告知用户并停止

## 提交信息规范

- **语言**：必须使用**中文**
- **格式**：Conventional Commits 风格

```
<type>(<scope>): <简短标题>

<可选正文：说明为什么改，而非罗列改了什么>
```

### type 对照

| type | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | 缺陷修复 |
| `refactor` | 重构（不改变外部行为） |
| `docs` | 文档 |
| `chore` | 构建、依赖、配置等杂项 |
| `test` | 测试 |
| `style` | 格式调整（不影响逻辑） |

### 示例

```
feat(cli): 添加交互式转换命令

支持通过 @clack/prompts 引导用户选择主题与输出路径
```

```
fix(convert): 修复表格在无底色主题下边框丢失的问题
```

标题一行概括「为什么」，正文补充必要上下文；避免无意义前缀如「更新代码」。

## 提交流程

按顺序执行：

### 1. 暂存相关文件

```powershell
git add <相关文件>
```

不要 `git add .` 除非用户明确要求且已确认无敏感/忽略文件。

### 2. 创建提交（PowerShell）

单行消息：

```powershell
git -c user.name="magic-wrangler" -c user.email="2085649039@qq.com" commit -m "feat(cli): 添加交互式转换命令"
```

多行消息（标题 + 正文）：

```powershell
git -c user.name="magic-wrangler" -c user.email="2085649039@qq.com" commit -m "feat(cli): 添加交互式转换命令" -m "支持通过 @clack/prompts 引导用户选择主题与输出路径"
```

### 3. 验证

```powershell
git status
git log -1 --format="%an <%ae>%n%s%n%b"
```

确认作者为 `magic-wrangler <2085649039@qq.com>`。

### 4. 钩子失败处理

若 pre-commit 钩子失败并自动修改了文件：

- **不要** amend
- 修复问题后重新 `git add`，创建**新提交**

## 推送流程

仅在用户**明确要求 push** 时执行。

### 首次推送（远程未配置或无 upstream）

检查远程：

```powershell
git remote -v
```

若无 `origin`，添加并推送：

```powershell
git remote add origin https://github.com/magic-wrangler/markpress-cli.git
git push -u origin HEAD
```

### 常规推送

```powershell
git push
```

推送前确认分支状态；若落后远程，先 `git pull --rebase`（无冲突时），不要 force push。

## 常见场景

### 场景 A：仅提交，不推送

完成「提交前检查 → 暂存 → 提交 → 验证」即可，不执行 `git push`。

### 场景 B：提交并推送

完成提交流程后，执行推送流程。

### 场景 C：用户要求创建 PR

推送后使用 `gh pr create`（遵循 create-pull-requests 规则），不在本 skill 内重复 PR 细节。

## 快速检查清单

```
- [ ] 用户已明确要求提交/推送
- [ ] 已检查 status 与 diff
- [ ] 未包含敏感文件或应忽略目录
- [ ] 提交信息为中文 Conventional Commits
- [ ] 使用 -c 传入 magic-wrangler / 2085649039@qq.com
- [ ] 提交后 git log -1 验证作者正确
- [ ] 推送仅在用户要求时执行
```
