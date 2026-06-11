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

安装后新开终端，执行 `mpr --help` 验证。

---

## 快速开始

```bash
cd my-docs
mpr template          # 无 md 时：复制内置「转换模板.md」
# 编辑 转换模板.md 后：
mpr                   # 交互：选主题 → 多选 md → 批量转换
```

`mpr` 与 `markpress` 完全等价，任选其一即可。

> **Windows 说明**：PowerShell 中 `mp` 是系统内置别名（`Move-ItemProperty`），会冲突，因此短命令使用 `mpr`。

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
| `mpr` / `markpress` | 交互式批量转换 |
| `mpr ai` | AI 对话创建主题（DeepSeek，首次自动引导配置） |
| `mpr ai config` | 修改 API 密钥、模型等 |
| `mpr convert --md ... --theme ...` | 非交互单文件/脚本转换 |
| `mpr template` | 复制内置 Markdown 模板到当前目录 |
| `mpr template list` | 列出内置模板 |
| `mpr themes list` | 列出内置主题 |
| `mpr --help` | 显示帮助 |

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
mpr themes list
```

---

## AI 创建主题

通过 DeepSeek 对话生成主题 JSON，保存后可直接用于转换。

### 首次使用（交互配置，推荐）

```bash
mpr ai
```

若尚未配置，会自动引导你完成：

1. **API 密钥** — 在 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 创建
2. **模型** — `deepseek-v4-flash`（推荐）或 `deepseek-v4-pro`（更强）；`deepseek-chat` / `deepseek-reasoner` 将于 2026/07/24 弃用
3. **API 地址** — 默认 `https://api.deepseek.com`，一般无需修改
4. **创造性** — temperature 0.3 / 0.7 / 1.0

配置保存到 `~/.markpress/ai-config.json`，下次无需重复输入。

修改配置：

```bash
mpr ai config
```

对话中输入「配置」也可随时重新设置。

### 环境变量（可选，优先级高于配置文件）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DEEPSEEK_API_KEY` | API 密钥 | — |
| `DEEPSEEK_MODEL` | 模型 | `deepseek-v4-flash` |
| `DEEPSEEK_BASE_URL` | API 地址 | `https://api.deepseek.com` |

### 知识库（AI 自动读取）

`mpr ai` 启动时会读取 [`knowledge/`](knowledge/) 目录下所有 `.md` 文件，拼入 AI 上下文。直接编辑 Markdown 即可更新 AI 所知的功能说明，**无需改代码或重新编译逻辑**。

```text
knowledge/
  markpress.md    # 命令、转换流程、回答原则等
```

自定义目录：

```bash
MARKPRESS_KNOWLEDGE_DIR=./my-knowledge mpr ai
```

### 对话流程

1. 描述想要的风格（如「深蓝表头、白字正文、适合赛事规则」）
2. AI 返回设计说明和完整主题 JSON
3. 可继续对话微调（如「表头再深一点」）
4. 输入「保存」写入当前目录的 `.json` 文件
5. 输入「退出」结束

### 试用生成的主题

```bash
mpr convert --md 协议.md --theme ./我的主题.json --out output/协议.html
```

---

## 使用示例

### 交互模式

```bash
cd my-docs
mpr
```

流程：选择主题 → 空格多选 Markdown → 确认 → 批量转换 → 可继续转换。

### 命令行模式

```bash
# 内置主题
mpr convert --md 协议.md --theme 有底色 --out output/协议.html

# 本地主题 JSON
mpr convert --md 协议.md --theme ./我的主题.json --out output/协议.html

# 省略 --out（输出到 md 同目录）
mpr convert --md 协议.md --theme 无底色
```

### 指定输入/输出目录（交互模式）

**Windows PowerShell：**

```powershell
$env:MARKPRESS_INPUT = "D:\docs"
$env:MARKPRESS_OUTPUT = "D:\docs\output"
mpr
```

**Windows CMD：**

```bat
set MARKPRESS_INPUT=D:\docs
set MARKPRESS_OUTPUT=D:\docs\output
mpr
```

**macOS / Linux：**

```bash
MARKPRESS_INPUT=./docs MARKPRESS_OUTPUT=./docs/output mpr
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

# AI 创建主题
pnpm ai
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
mpr
mpr convert --md 协议.md --theme 有底色 --out output/协议.html
mpr ai
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
