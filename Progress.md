# 项目进度记录

> 最后更新：2026-06-11 20:00
> 维护者：Progress Recorder 子代理

## 约束决策

| ID | 日期 | 决策内容 | 来源 |
|----|------|----------|------|
| D001 | 2026-06-09 | 全局布局使用 `fontSize`（默认 12）+ `fontSizeUnit`（px/pt）作为全文统一字号基准；排版/表格字号以 `em` 相对 `DEFAULT_GLOBAL_FONT_SIZE(12)` 换算，改全局字号时全文同比缩放；基准字号设在 `.content-wrapper` | 用户要求全局字号 + 统一控制所有字号 |
| D002 | 2026-06-09 | npm 包名定为 `markpress-cli`，公开发布，支持 `npm install -g` 全局使用 | npm 全局 CLI 实施计划确认 |
| D003 | 2026-06-09 | CLI 内置主题：`有底色`、`无底色`；用户 md 自备；支持本地 json 覆盖 | npm 全局 CLI 实施计划确认 |
| D004 | 2026-06-09 | 双轨分发：npm 全局 CLI + zip 离线包并存，共用 tool/ 源码逻辑 | npm 全局 CLI 实施计划确认 |
| D005 | 2026-06-09 | npm CLI 使用独立公开仓库 `markpress-cli`，与含敏感信息的 `mark-press` 主仓分离；npm 发布仅含 `dist` + `themes` | 用户顾虑主仓敏感信息，修订仓库策略 |
| D006 | 2026-06-11 | Windows 全局命令使用 `mpr`（`mp` 与 PowerShell 别名冲突）；`markpress` 与 `mpr` 等价 | AI 集成对话：短命令选型 |
| D007 | 2026-06-11 | AI 集成 DeepSeek，Provider 层抽象预留扩展；配置存 `~/.markpress/ai-config.json`，默认模型 `deepseek-v4-flash` | AI 对话创建主题功能实施 |
| D008 | 2026-06-11 | 知识库改为 `knowledge/*.md` 启动时自动读取，可用 `MARKPRESS_KNOWLEDGE_DIR` 覆盖；删除硬编码知识文件 | 知识库可维护性重构 |
| D009 | 2026-06-11 | AI 生成主题以完整内置主题 JSON 为基准（默认「有底色」），用户可说「基于无底色」切换基准 | AI prompt 与生成质量要求 |
| D010 | 2026-06-11 | `mpr` 无参数启动时显示模式菜单：批量转换 / AI 创建主题；`mpr ai` 仍可直接进入 AI | 用户要求启动提示与快速切换 |
| D011 | 2026-06-11 | 新增内置主题「正式版」（白底标准标题），不修改原 RULE_蓝色底 / RULE_无底色 主题文件 | 用户要求语雀/飞书风格单独成主题 |
| D012 | 2026-06-11 | 内置主题 manifest 注册 `RULE_蓝色底`、`RULE_无底色`、`正式版`；`有底色`/`无底色` 作为 aliases 兼容旧命令 | 主题文件重命名后列表缺失修复 |
| D013 | 2026-06-11 | AI 生成主题默认基准改为「正式版」；用户可说「基于RULE_蓝色底」「基于无底色」等切换 | 用户要求改默认基准与提示文案 |
| D014 | 2026-06-11 | npm 包发布含 `templates/`；`mpr template` 将内置 `转换模板.md` 复制到用户当前目录 | 提升新用户体验 |
| D015 | 2026-06-11 | `@` 文件选择两条互斥路径：① Markdown 多选 → 选主题 ② 先选主题 JSON → Markdown 多选；不可混选 | 用户明确 @ 交互规则 |
| D016 | 2026-06-11 | 无用户 md 时 `@` 提供内置模板选项，选中后复制到 cwd 再进入转换流程；不直接引用 npm 包内 templates/ 路径 | 用户要求模板下载到本地再操作 |

## 待办事项

| ID | 状态 | 内容 | 创建日期 |
|----|------|------|----------|
| T001 | archived | 全局布局新增可配置字号（默认 12px，单位 px/pt） · 已归档至 ARCH-20260611-1600 | 2026-06-09 |
| T002 | archived | 全局字号滑块统一缩放全文排版（标题/段落/表格/代码） · 已归档至 ARCH-20260611-1600 | 2026-06-09 |
| T003 | archived | 抽取 convert-core + theme-resolver 共享模块 · 已归档至 ARCH-20260611-1600 | 2026-06-09 |
| T004 | archived | 新增 cli.mts 子命令与 tsup 构建 · 已归档至 ARCH-20260611-1600 | 2026-06-09 |
| T005 | archived | 内置 themes/ 与交互/CLI 双模式主题选择 · 已归档至 ARCH-20260611-1600 | 2026-06-09 |
| T006 | archived | 同步 Skill 副本与使用说明 · 已归档至 ARCH-20260611-1600 | 2026-06-09 |
| T007 | completed | npm link 验证与 publish（需用户 npm 登录后执行） | 2026-06-09 |
| T008 | archived | DeepSeek AI 对话创建主题 JSON（`mpr ai` / `lib/ai/`） · 已归档至 ARCH-20260611-1600 | 2026-06-11 |
| T009 | archived | AI 交互 UI：紧凑 spinner、无 clack 框线占用 stdin、Ctrl+C + AbortSignal 可退出 · 已归档至 ARCH-20260611-1600 | 2026-06-11 |
| T010 | archived | AI 本地指令：内置主题 / 如何转换 / 帮我转换；`@` 文件选择；粘贴 convert 命令直接转换 · 已归档至 ARCH-20260611-1600 | 2026-06-11 |
| T011 | archived | 主题生成后展示配置摘要（`theme-preview.ts`）+ AI 文字说明 · 已归档至 ARCH-20260611-1600 | 2026-06-11 |
| T012 | archived | `mpr` 无参数启动菜单（`startup-menu.mts`）+ AI 可用提示 · 已归档至 ARCH-20260611-1600 | 2026-06-11 |
| T013 | archived | 新增内置主题「正式版」及 `themes/manifest.json` 注册 · 已归档至 ARCH-20260611-1900 | 2026-06-11 |
| T014 | archived | 知识库 `knowledge/style-config.md` 主题 JSON 字段详细说明 · 已归档至 ARCH-20260611-1900 | 2026-06-11 |
| T015 | archived | `mpr template` 命令 + npm `files` 含 `templates/` · 已归档至 ARCH-20260611-1900 | 2026-06-11 |
| T016 | archived | `@` / 交互扫描 `document-scan.ts`：不含 knowledge/ 与 npm templates/ · 已归档至 ARCH-20260611-1900 | 2026-06-11 |
| T017 | archived | 主题 manifest 支持 aliases；RULE_* 主题恢复列表 · 已归档至 ARCH-20260611-1900 | 2026-06-11 |
| T018 | archived | AI 默认基准主题改为「正式版」（`builtin-theme-context.ts`） · 已归档至 ARCH-20260611-1900 | 2026-06-11 |
| T019 | archived | `@` 互斥双路径 + md 多选批量转换（`convert-wizard.ts`） · 已归档至 ARCH-20260611-1900 | 2026-06-11 |
| T020 | archived | `/record`、`/archive` Cursor skills（`.cursor/skills/`） · 已归档至 ARCH-20260611-1900 | 2026-06-11 |

## 备注

| ID | 日期 | 内容 |
|----|------|------|
| N001 | 2026-06-09 | 主代理实现全局字号功能时未自动委派 progress-recorder，用户通过 `/record` 补录；子代理因额度限制不可用，由用户授权主代理直接写入 |
| N002 | 2026-06-09 | mark-press：Next.js 16 + React 19 + Supabase，Markdown → 带样式 HTML 可视化工具 |
| N003 | 2026-06-09 | npm CLI 实施开始；progress-recorder 额度不足，主代理按 N001 授权直接写入 Progress.md |
| N004 | 2026-06-09 | markpress-cli 独立仓已创建于 `e:\my_project\markpress-cli`，已 git init；构建与转换验证通过 |
| N005 | 2026-06-11 | npm 包 `files` 含 `dist`、`themes`、`knowledge`；开发脚本 `pnpm ai` / `pnpm dev:cli` |
| N006 | 2026-06-11 | 命令结构：`mpr` 交互转换 · `mpr ai` 创建主题 · `mpr convert` 非交互 · `mpr themes list` |
| N007 | 2026-06-11 | 用户询问大量改动是否应调用 progress-recorder；主代理按 N001 授权直接写入 Progress.md |
| N008 | 2026-06-11 | 用户生成的 HTML、主题 JSON、API 配置均在本地（cwd / ~/.markpress），不进 npm 包 |
| N009 | 2026-06-11 | D009 仍记载默认「有底色」；自 D013 起 AI 默认基准为「正式版」（旧决策行不修改） |
| N010 | 2026-06-11 | 用户 `/record` 补录本轮：正式版主题、template 命令、@ 互斥多选、RULE_* manifest |
