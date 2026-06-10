# markpress-cli

将 **Markdown** + **主题 JSON** 转为可独立打开的 **带样式 HTML**。

- 用户自备 `.md` 文档
- 主题可用**内置**（`有底色` / `无底色`）或**本地 JSON**（从 Markpress Web 编辑器导出）

需要 Node.js 18+。

---

## 安装

```bash
npm install -g markpress-cli
```

安装后新开终端，执行 `markpress --help` 验证。

---

## 快速开始

```bash
cd my-docs          # 放入待转换的 .md 文件
markpress           # 交互：选主题 → 多选 md → 批量转换
```

输出默认写入 `./output/`（与 md 同名 `.html`，如 `协议.md` → `output/协议.html`）。

推荐目录结构：

```text
my-docs/
├── 协议.md
├── 赛事规则.md
└── output/              # 自动创建
    ├── 协议.html
    └── 赛事规则.html
```

---

## 命令

| 命令 | 说明 |
|------|------|
| `markpress` | 交互式批量转换 |
| `markpress convert --md ... --theme ...` | 非交互单文件/脚本转换 |
| `markpress themes list` | 列出内置主题 |
| `markpress --help` | 显示帮助 |

### 非交互转换参数

| 参数 | 必需 | 说明 |
|------|------|------|
| `--md` | 是 | Markdown 文件路径 |
| `--theme` | 是 | 内置主题名（`有底色`）或 `.json` 路径 |
| `--out` | 否 | 输出 HTML 路径（默认同目录同名 `.html`） |
| `--custom-js` | 否 | 注入到 `</body>` 前的 JS 文件 |

---

## 内置主题

| 名称 | 说明 |
|------|------|
| `有底色` | 表头深蓝，适合正式文档、赛事规则 |
| `无底色` | 简洁白底 |

```bash
markpress themes list
```

---

## 使用示例

### 交互模式

```bash
cd my-docs
markpress
```

流程：选择主题 → 空格多选 Markdown → 确认 → 批量转换 → 可继续转换。

### 命令行模式

```bash
# 内置主题
markpress convert --md 协议.md --theme 有底色 --out output/协议.html

# 本地主题 JSON
markpress convert --md 协议.md --theme ./我的主题.json --out output/协议.html

# 省略 --out（输出到 md 同目录）
markpress convert --md 协议.md --theme 无底色
```

### 指定输入/输出目录（交互模式）

**Windows PowerShell：**

```powershell
$env:MARKPRESS_INPUT = "D:\docs"
$env:MARKPRESS_OUTPUT = "D:\docs\output"
markpress
```

**Windows CMD：**

```bat
set MARKPRESS_INPUT=D:\docs
set MARKPRESS_OUTPUT=D:\docs\output
markpress
```

**macOS / Linux：**

```bash
MARKPRESS_INPUT=./docs MARKPRESS_OUTPUT=./docs/output markpress
```

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MARKPRESS_INPUT` | 交互模式扫描的文档目录 | 当前目录 |
| `MARKPRESS_OUTPUT` | HTML 输出目录 | `./output` |
| `MARKPRESS_EXAMPLES` | 同 `MARKPRESS_INPUT`（兼容旧名） | — |

---

## 扫描规则说明

交互模式自动扫描目录时：

**会列入 Markdown 列表：**

- 业务文档，如 `协议.md`、`赛事规则.md`

**不会列入（已自动排除）：**

- 项目元数据：`README.md`、`Progress.md`、`Progress.archive.md`、`CLAUDE.md` 等
- 非主题 JSON：`package.json`、`tsconfig.json` 等（仅识别含 `global` / `typography` / `table` 等字段的主题 JSON）

建议在专用文档目录运行，或通过 `MARKPRESS_INPUT` 指定目录，避免与项目配置文件混在一起。

---

## 本地开发与调试

```bash
git clone <markpress-cli 仓库>
cd markpress-cli
pnpm install
```

### 方式一：开发模式（推荐，改代码后无需 build）

```bash
# 交互
pnpm dev:cli

# 非交互
pnpm convert -- --md 协议.md --theme 有底色 --out test-output/协议.html

# 查看内置主题
pnpm dev:cli themes list
```

也可使用封装脚本：

```bash
pnpm convert:interactive
pnpm convert -- --md 协议.md --theme 有底色 --out test-output/协议.html
```

### 方式二：验证构建产物（模拟 npm 安装后）

```bash
pnpm build
node dist/cli.mjs themes list
node dist/cli.mjs convert --md 协议.md --theme 有底色 --out test-output/协议.html
```

### 方式三：全局命令调试（模拟用户 `npm install -g`）

```bash
# 首次一次
npm link

# 每次改完代码后
pnpm build

# 然后直接使用（无需重新 npm link）
markpress
markpress convert --md 协议.md --theme 有底色 --out output/协议.html
```

若全局命令行为未更新：

```bash
pnpm build
where markpress          # Windows，确认指向本地 link
npm unlink -g markpress-cli && npm link   # 重新 link
```

### 指定目录调试（PowerShell）

```powershell
$env:MARKPRESS_INPUT = "D:\path\to\examples"
$env:MARKPRESS_OUTPUT = "D:\path\to\output"
pnpm dev:cli
```

---

## 构建与发布（维护者）

```bash
pnpm build
npm pack --dry-run     # 检查发布内容（仅 dist + themes）
npm publish --access public
```

---

## License

MIT
