---
name: npm-publish
description: >-
  为 markpress-cli 执行 npm 发布前检查与发布流程。在用户要求发布、publish、npm publish、
  上线 npm 包，或询问发布步骤时使用。包含 registry 配置、发布前检查清单与发布后验证。
---

# npm 发布（markpress-cli）

## 包信息

| 项 | 值 |
|---|---|
| 包名 | `markpress-cli` |
| 当前版本 | 见 `package.json` 的 `version` 字段 |
| npm 账号 | `magic-wrangler` |
| registry | `https://registry.npmjs.org`（项目 `.npmrc` 已配置） |
| GitHub | `https://github.com/magic-wrangler/markpress-cli.git` |
| 全局命令 | `markpress` → `./dist/cli.mjs` |

## 触发条件

仅在用户**明确要求**时执行发布，例如：

- 「发布」「publish」「npm publish」
- 「上线 npm」「发布到 npm」

未明确要求时，**不要**主动执行 `npm publish`。用户说「检查一下能否发布」时，只跑检查清单，不发布。

## 安全协议（必须遵守）

- **禁止**在未完成发布前检查时执行 `npm publish`
- **禁止**发布含敏感信息的文件（`.env`、密钥、凭证）
- **禁止**修改全局 npm config（不执行 `npm config set registry` 等）
- **禁止**使用 `--force` 覆盖已发布版本
- **禁止**发布到非官方 registry（腾讯镜像等仅用于 install，不能 publish）
- 发布前确认 `package.json` 的 `files` 仅含 `dist`、`themes`（不含源码）
- 若版本已在 npm 存在，须先 `npm version patch|minor|major` 再发布

## 发布前检查

**必须全部通过**后再发布。并行执行：

```powershell
npm whoami
npm view markpress-cli version
pnpm build
npm pack --dry-run
npm publish --dry-run
```

### 检查清单

```
- [ ] npm 已登录（whoami 返回 magic-wrangler）
- [ ] 目标版本未在 npm 上发布（view 返回 404 或版本低于 package.json）
- [ ] pnpm build 成功，dist/cli.mjs 存在
- [ ] npm pack 仅含 7 个左右文件：dist/、themes/、README.md、LICENSE、package.json
- [ ] 不含 node_modules/、scripts/、lib/、.env 等
- [ ] dist/cli.mjs 首行含 #!/usr/bin/env node
- [ ] CLI 功能验证通过（见下方）
- [ ] npm publish --dry-run 无阻断性错误
```

### CLI 功能验证

```powershell
node dist/cli.mjs --help
node dist/cli.mjs themes list
```

端到端转换（可选，推荐）：

```powershell
node dist/cli.mjs convert --md <测试.md> --theme 有底色 --out test-output/_publish-test.html
```

### 已知警告

`npm publish --dry-run` 可能出现 bin 字段 auto-correct 警告。须用 `npm pack` 解压确认 tarball 内 `package.json` 的 `bin.markpress` 仍为 `./dist/cli.mjs`；若 bin 缺失则**停止发布**并修复。

## 发布流程

按顺序执行：

### 0. 确认 Git 已同步（推荐）

发布前代码应已提交并推送到 GitHub。若用户尚未提交，先遵循 [git-commit](../git-commit/SKILL.md) skill，**不要**在未提交状态下直接发布（除非用户明确要求）。

### 1. 执行发布

项目目录：

```powershell
cd e:\my_project\markpress-cli
npm publish
```

`prepublishOnly` 会自动执行 `pnpm build`，无需手动构建。

### 2. 发布后验证

```powershell
npm view markpress-cli
npm install -g markpress-cli
markpress --help
markpress themes list
```

向用户返回 npm 包页链接：`https://www.npmjs.com/package/markpress-cli`

### 3. 更新 Progress.md（可选）

若项目使用 Progress Recorder，将待办 T007（npm link 验证与 publish）标记为 completed。

## 版本更新（非首次发布）

首次发布后，每次发布须 bump 版本：

```powershell
npm version patch   # 1.0.0 → 1.0.1（bug 修复）
npm version minor   # 1.0.0 → 1.1.0（新功能）
npm version major   # 1.0.0 → 2.0.0（破坏性变更）
```

然后重新走「发布前检查 → npm publish → 发布后验证」，并提交 `package.json` 版本变更到 Git。

## 常见场景

### 场景 A：仅检查，不发布

用户问「能发布吗」「检查一下」→ 执行发布前检查清单，汇总结果，**不执行** `npm publish`。

### 场景 B：检查通过后发布

用户说「发布吧」→ 先跑完整检查清单 → 全部通过 → `npm publish` → 发布后验证。

### 场景 C：未登录 npm

提示用户执行：

```powershell
npm login --registry=https://registry.npmjs.org
```

登录完成后再继续检查与发布。

### 场景 D：版本冲突（409）

npm 返回版本已存在 → 告知用户需 bump 版本，不 force publish。

## 输出格式

检查或发布完成后，向用户汇总：

```markdown
## npm 发布检查结果

| 检查项 | 结果 | 说明 |
|--------|------|------|
| ... | ✅/❌ | ... |

**结论**：可以发布 / 须修复后再发布
```

发布成功后补充安装说明：

```bash
npm install -g markpress-cli
markpress
```

## 快速检查清单

```
- [ ] 用户已明确要求发布（或仅要求检查）
- [ ] npm whoami 通过
- [ ] 版本号可用
- [ ] build + pack + dry-run 通过
- [ ] CLI 功能验证通过
- [ ] bin 字段在 tarball 中完整
- [ ] npm publish 已执行（若用户要求发布）
- [ ] 全局安装验证通过
- [ ] 已告知用户 npm 包链接
```
