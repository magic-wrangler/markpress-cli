# markpress-cli

[中文 README](README.md)

Convert **Markdown** + **theme JSON** into standalone **styled HTML**.

- Bring your own `.md` files
- Use **built-in themes** (`有底色` / `无底色` / `正式版`) or a **local JSON** exported from the Markpress Web editor

Requires Node.js 18+.

---

## Install

```bash
npm install -g markpress-cli
```

Open a new terminal and run `mpr --help` to verify.

---

## Quick start

```bash
cd my-docs
mpr template          # No md yet? Copy the built-in template
# Edit 转换模板.md, then:
mpr                   # Interactive: pick theme → multi-select md → batch convert
```

`mpr` and `markpress` are equivalent.

> **Windows:** PowerShell reserves `mp` as an alias for `Move-ItemProperty`, so the short command is `mpr`.

Output goes to `./output/` by default (same basename as the md file, e.g. `agreement.md` → `output/agreement.html`).

Suggested layout:

```text
my-docs/
├── agreement.md
├── guide.md
└── output/              # created automatically
    ├── agreement.html
    └── guide.html
```

---

## Commands

| Command | Description |
|---------|-------------|
| `mpr` / `markpress` | Interactive batch convert (startup menu) |
| `mpr c` / `mpr -c` | Quick convert wizard (select md → theme) |
| `mpr ai` | AI chat to create themes (DeepSeek; guided setup on first run) |
| `mpr ai -c` / `mpr ai --convert` | Quick convert without entering AI chat |
| `mpr ai config` | Edit API key, model, etc. |
| `mpr convert --md ... --theme ...` | Non-interactive single-file / script convert |
| `mpr convert --all -t <theme>` | Convert all md files in the current directory |
| `mpr template` | Copy the built-in Markdown template to cwd |
| `mpr template list` | List built-in templates |
| `mpr themes list` | List built-in themes |
| `mpr --help` | Show help |
| `mpr -v` / `-version` | Show version |

### Non-interactive convert flags

| Flag | Required | Description |
|------|----------|-------------|
| `--md` | Yes* | Markdown file path (*not required with `--all`) |
| `--theme` / `-t` | Yes | Built-in theme name or `.json` path |
| `--all` | No | Convert every Markdown file in cwd |
| `--out` | No | Output HTML path (default: same dir, same basename) |
| `--output-dir` | No | Batch output directory (default: `./output`) |
| `--no-ai-fix` | No | Skip AI Markdown fix (rule-based fix still runs) |
| `--no-write-md` | No | Do not write fixes back to source `.md` |
| `--custom-js` | No | JS file injected before `</body>` |

---

## Built-in themes

| Name | Description |
|------|-------------|
| `有底色` | Dark blue table header; good for formal documents (alias: `RULE_蓝色底`) |
| `无底色` | Clean white background (alias: `RULE_无底色`) |
| `正式版` | White background, standard heading hierarchy |

```bash
mpr themes list
```

---

## Markdown fix (on convert)

Before HTML generation, the pipeline runs:

1. **Rule-based fix** — unescape `\#`, `\*\*`, fix heading spacing, normalize blank lines, beautify tables
2. **AI fix** (optional) — when DeepSeek is configured, enabled by default on convert
3. **Write back** — fixed content is saved to the source `.md` by default (`--no-write-md` to disable)

In `mpr ai` chat, say **「修复」** (fix) or **「检查」** (check) to run the fix wizard.

Quick batch convert:

```bash
mpr -c --all -t 正式版
```

---

## AI theme creation

Generate theme JSON via DeepSeek chat; save and use it in convert.

### First-time setup (interactive, recommended)

```bash
mpr ai
```

If not configured yet, you will be guided through:

1. **API key** — create at [DeepSeek Platform](https://platform.deepseek.com/api_keys)
2. **Model** — `deepseek-v4-flash` (recommended) or `deepseek-v4-pro`; `deepseek-chat` / `deepseek-reasoner` deprecated 2026/07/24; or choose **custom input** for new official model names
3. **API URL** — default `https://api.deepseek.com`
4. **Temperature** — 0.3 / 0.7 / 1.0

Saved to `~/.markpress/ai-config.json`.

Change settings:

```bash
mpr ai config
```

In chat, type **「配置」** (config) or use:

| Command (Chinese) | Action |
|-------------------|--------|
| `模型` | List saved models |
| `新增模型` | Add a model |
| `切换模型` | Switch active model |
| `删除模型` | Remove from list |

During streaming, character count shows progress; when finished, real **token usage** from the API is displayed.

### Environment variables (optional; override config file)

| Variable | Description | Default |
|----------|-------------|---------|
| `DEEPSEEK_API_KEY` | API key | — |
| `DEEPSEEK_MODEL` | Model | `deepseek-v4-flash` |
| `DEEPSEEK_BASE_URL` | API URL | `https://api.deepseek.com` |
| `MARKPRESS_CONVERT_NO_AI_FIX` | `1` to skip AI fix on convert | — |
| `MARKPRESS_CONVERT_NO_WRITE_MD` | `1` to skip writing back to md | — |

### Knowledge base (auto-loaded by AI)

On startup, `mpr ai` reads all `.md` files under [`knowledge/`](knowledge/). Edit those files to update what the AI knows—no code changes required.

```bash
MARKPRESS_KNOWLEDGE_DIR=./my-knowledge mpr ai
```

### Chat workflow

1. Describe the style (e.g. dark blue header, white body text)
2. AI returns a design summary and full theme JSON
3. Refine in chat (e.g. “make the header darker”)
4. Type **「保存」** (save) to write a `.json` file in cwd
5. Type **「退出」** (quit) to exit

You can also say **「转换」** or type `@` to open the convert wizard.

### Try a generated theme

```bash
mpr convert --md agreement.md --theme ./my-theme.json --out output/agreement.html
```

---

## Examples

### Interactive mode

```bash
cd my-docs
mpr
```

Flow: pick theme → space to multi-select Markdown → confirm → batch convert.

### CLI mode

```bash
# Built-in theme
mpr convert --md agreement.md --theme 有底色 --out output/agreement.html

# Local theme JSON
mpr convert --md agreement.md --theme ./my-theme.json --out output/agreement.html

# All md files in cwd
mpr c --all -t 正式版
```

### Custom input/output dirs (interactive)

**Windows PowerShell:**

```powershell
$env:MARKPRESS_INPUT = "D:\docs"
$env:MARKPRESS_OUTPUT = "D:\docs\output"
mpr
```

**macOS / Linux:**

```bash
MARKPRESS_INPUT=./docs MARKPRESS_OUTPUT=./docs/output mpr
```

---

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MARKPRESS_INPUT` | Document scan root for interactive mode | cwd |
| `MARKPRESS_OUTPUT` | HTML output directory | `./output` |
| `MARKPRESS_EXAMPLES` | Alias for `MARKPRESS_INPUT` | — |
| `MARKPRESS_KNOWLEDGE_DIR` | Custom AI knowledge directory | `knowledge/` |
| `MARKPRESS_AI_VERBOSE` | `1` for full streaming output | — |

---

## Scan rules (interactive mode)

**Included as Markdown:**

- Business docs, e.g. `agreement.md`, `guide.md`

**Excluded automatically:**

- Project metadata: `README.md`, `Progress.md`, etc.
- Non-theme JSON: `package.json`, `tsconfig.json` (only JSON with `global` / `typography` / `table` is treated as a theme)

Run in a dedicated docs folder or set `MARKPRESS_INPUT` to avoid mixing with project config files.

---

## Local development

```bash
git clone https://github.com/magic-wrangler/markpress-cli.git
cd markpress-cli
pnpm install
```

### Dev mode (no build after each edit)

```bash
pnpm dev:cli
pnpm convert -- --md agreement.md --theme 有底色 --out test-output/agreement.html
pnpm ai
```

### Test built output (simulates npm install)

```bash
pnpm build
node dist/cli.mjs themes list
node dist/cli.mjs convert --md agreement.md --theme 有底色 --out test-output/agreement.html
```

### Global link (simulates `npm install -g`)

```bash
npm link
pnpm build   # after code changes
mpr
```

---

## Build & publish (maintainers)

```bash
pnpm build
npm pack --dry-run
npm publish --access public
```

---

## License

MIT
