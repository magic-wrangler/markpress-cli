# Markpress CLI 知识库

> 维护说明：直接编辑本目录下的 `.md` 文件即可，`mpr ai` 启动时会自动读取，无需改代码。

## 工具定位

- **markpress-cli**：将 Markdown + 主题 JSON 转为带样式的 **HTML**（可独立打开）
- **不支持 PDF 导出**，不要建议 PDF 方案
- Windows 短命令用 `mpr`（`mp` 与 PowerShell 内置别名冲突）

## 常用命令

| 命令 | 作用 |
|------|------|
| `mpr` / `markpress` | 交互式批量转换（选主题 → 多选 md → 输出 html） |
| `mpr convert --md <文件> --theme <主题>` | 非交互单文件转换 |
| `mpr themes list` | 列出内置主题 |
| `mpr template` | 复制内置 Markdown 模板到当前目录 |
| `mpr template list` | 列出内置模板 |
| `mpr ai` | AI 对话创建/修改主题 JSON |
| `mpr ai config` | 配置 DeepSeek API 密钥与模型（含自定义模型名） |

## 如何转换 Markdown

1. **交互转换**：在文档目录执行 `mpr`，选择主题和多选 .md 文件，输出到 `./output/`
2. **命令行转换**：
   ```bash
   mpr convert --md 协议.md --theme 有底色 --out output/协议.html
   ```
3. **使用 AI 生成的主题**：
   ```bash
   mpr convert --md 协议.md --theme ./我的主题.json
   ```
4. **在 AI 对话中**：可直接粘贴 `convert --md ... --theme ...` 命令执行转换
5. **无现成 md**：`mpr template` 复制内置 `转换模板.md` 到当前目录，编辑后再转换

## 内置 Markdown 模板

npm 包内置 `templates/转换模板.md`（含标题、表格、代码块等示例）：

```bash
cd my-docs
mpr template              # → ./转换模板.md
mpr template list         # 查看可用模板
mpr template copy --out 我的文档.md
```

模板复制到**用户当前目录**，不会修改 npm 安装目录内的原文件。

## 内置主题

- 当前内置：`RULE_蓝色底`、`RULE_无底色`、`正式版`（`--theme 有底色` / `无底色` 仍可用，为别名）
- 可直接作为 `--theme` 参数，无需生成 JSON
- `RULE_蓝色底`（别名 `有底色`）：表头深蓝，适合正式文档、赛事规则
- `RULE_无底色`（别名 `无底色`）：简洁白底（历史 Web 导出配置）
- `正式版`：白底深字，h1–h6 按语雀/飞书标准递减
- AI 生成新主题时，默认以「正式版」完整 JSON 为基准修改；可说「基于RULE_蓝色底」「基于无底色」等换基准

## 主题配置字段说明

完整 StyleConfig 各字段含义见 **[style-config.md](./style-config.md)**（global / typography / table / customElements 等）。

## AI 对话（mpr ai）专用指令

> DeepSeek **模型**配置详见 **[ai-config.md](./ai-config.md)**。`模型` / `配置` 等是 **CLI 本地指令**，不是主题样式描述。

- `保存`：将当前主题 JSON 写入文件
- **模型指定命令**（详见 [ai-config.md](./ai-config.md)）：
  - `模型列表` / `model list` — 查看
  - `模型新增` / `model add` — 新增（可多次）
  - `模型修改` / `model switch` — 修改当前使用的模型
  - `模型删除` / `model delete` — 删除
  - `模型使用1` / `model use 1` — 按序号快速切换
  - `模型帮助` / `model help` — 命令说明
- `配置`：完整 API 设置子菜单
- `退出` 或 Ctrl+C：结束对话
- `内置主题`：查看内置主题列表
- `如何转换`：查看转换说明
- `@` / **转换** / **转成 html** / **生成 html** / **帮我转换** 等：向导选 md + 主题并转换（说法灵活，不必固定一句）
- **修复** / **检查**：修复 Markdown 格式（`#1212`、`\*\*` 等），详见 [markdown-fix.md](./markdown-fix.md)
- `@`：两条路径 — **选 Markdown**（可多选 → 再选主题）或 **先选主题**（内置 + 本地 JSON → 再多选 md）
- 描述风格：如「表头再深一点」→ 生成/修改主题 JSON

## 环境变量

| 变量 | 说明 |
|------|------|
| `MARKPRESS_INPUT` | 交互模式扫描的文档目录 |
| `MARKPRESS_OUTPUT` | HTML 输出目录（默认 `./output`） |
| `DEEPSEEK_API_KEY` | AI 功能所需（可用 `mpr ai config` 保存） |
| `DEEPSEEK_MODEL` | 默认 `deepseek-v4-flash`；也可用 `mpr ai config` →「自定义输入…」 |
| `MARKPRESS_MD_NO_PREPROCESS` | 跳过转换前 Markdown 规则预处理 |
| `MARKPRESS_KNOWLEDGE_DIR` | 自定义知识库目录（覆盖默认 `knowledge/`） |

## AI 回答原则

1. 用户问**功能、用法、如何转换** → 用中文简洁说明，**不要输出 JSON**
2. 用户问**内置主题有哪些** → 列出内置主题名和 convert 示例，**不要输出 JSON**
3. 用户输入 **`模型`、`配置`、`新增模型`、`切换模型`、`删除模型`** → 这是 **DeepSeek 大模型配置**的本地 CLI 指令，**不是**改主题样式；告知用户直接发送该指令或见 [ai-config.md](./ai-config.md)，**不要输出主题 JSON**
4. 用户**描述风格或要求改主题**（如「标题改深蓝」「表头加深」）→ 基于内置主题完整 JSON 修改，**输出完整 JSON**
5. 不要声称「没有内置主题库」；不要编造 markpress 不存在的功能
6. **「模型」≠ 主题模板**：主题用「内置主题」「正式版」等；DeepSeek 模型用 `模型` / `配置` 指令
7. 用户问 **Markdown 格式、反斜杠、标题/加粗不生效** → 见 [markdown-fix.md](./markdown-fix.md)，引导 **修复** / **检查**；生成 md 时**不要**过度转义

## StyleConfig 主题 JSON 结构

顶层必填字段（各字段详细说明见 [style-config.md](./style-config.md)）：

- `global`：页面背景、内容区、字体、宽度、对齐
- `typography`：h1–h6、p、custom1–custom5
- `table`：表头/表体、边框、斑马纹
- `codeBlock`、`blockquote`、`link`、`list`
- `customElements`（可选）

生成主题时必须输出**完整 JSON**，颜色用 hex，字号用数字。
