# 项目进度记录

> 最后更新：2026-06-09
> 维护者：Progress Recorder 子代理

## 约束决策

| ID | 日期 | 决策内容 | 来源 |
|----|------|----------|------|
| D001 | 2026-06-09 | 全局布局使用 `fontSize`（默认 12）+ `fontSizeUnit`（px/pt）作为全文统一字号基准；排版/表格字号以 `em` 相对 `DEFAULT_GLOBAL_FONT_SIZE(12)` 换算，改全局字号时全文同比缩放；基准字号设在 `.content-wrapper` | 用户要求全局字号 + 统一控制所有字号 |
| D002 | 2026-06-09 | npm 包名定为 `markpress-cli`，公开发布，支持 `npm install -g` 全局使用 | npm 全局 CLI 实施计划确认 |
| D003 | 2026-06-09 | CLI 内置主题：`有底色`、`无底色`；用户 md 自备；支持本地 json 覆盖 | npm 全局 CLI 实施计划确认 |
| D004 | 2026-06-09 | 双轨分发：npm 全局 CLI + zip 离线包并存，共用 tool/ 源码逻辑 | npm 全局 CLI 实施计划确认 |
| D005 | 2026-06-09 | npm CLI 使用独立公开仓库 `markpress-cli`，与含敏感信息的 `mark-press` 主仓分离；npm 发布仅含 `dist` + `themes` | 用户顾虑主仓敏感信息，修订仓库策略 |

## 待办事项

| ID | 状态 | 内容 | 创建日期 |
|----|------|------|----------|
| T001 | completed | 全局布局新增可配置字号（默认 12px，单位 px/pt） | 2026-06-09 |
| T002 | completed | 全局字号滑块统一缩放全文排版（标题/段落/表格/代码） | 2026-06-09 |
| T003 | completed | 抽取 convert-core + theme-resolver 共享模块 | 2026-06-09 |
| T004 | completed | 新增 cli.mts 子命令与 tsup 构建 | 2026-06-09 |
| T005 | completed | 内置 themes/ 与交互/CLI 双模式主题选择 | 2026-06-09 |
| T006 | completed | 同步 Skill 副本与使用说明 | 2026-06-09 |
| T007 | pending | npm link 验证与 publish（需用户 npm 登录后执行） | 2026-06-09 |

## 备注

| ID | 日期 | 内容 |
|----|------|------|
| N001 | 2026-06-09 | 主代理实现全局字号功能时未自动委派 progress-recorder，用户通过 `/record` 补录；子代理因额度限制不可用，由用户授权主代理直接写入 |
| N002 | 2026-06-09 | mark-press：Next.js 16 + React 19 + Supabase，Markdown → 带样式 HTML 可视化工具 |
| N003 | 2026-06-09 | npm CLI 实施开始；progress-recorder 额度不足，主代理按 N001 授权直接写入 Progress.md |
| N004 | 2026-06-09 | markpress-cli 独立仓已创建于 `e:\my_project\markpress-cli`，已 git init；构建与转换验证通过 |
