/**
 * markpress-cli 唯一入口
 *
 *   mpr / markpress                交互模式
 *   mpr ai                         AI 对话创建主题
 *   mpr convert ...                非交互转换
 *   mpr themes list                列出内置主题
 */

import { listBuiltinThemes } from '../lib/theme-resolver.ts'
import { runConvertCli, printConvertHelp } from './convert.mts'
import { runInteractive } from './convert-interactive.mts'
import { runQuickConvert } from './quick-convert.mts'
import { runDefaultInteractive } from './startup-menu.mts'
import { runThemeAi } from './theme-ai.mts'
import { runTemplateCli } from './template.mts'
import { printVersion } from '../lib/version.ts'

function isVersionFlag(arg: string): boolean {
  return arg === '-v' || arg === '-V' || arg === '-version' || arg === '--version' || arg === 'version'
}

function isQuickConvertFlag(arg: string): boolean {
  return arg === '-c' || arg === '--convert'
}

function printHelp() {
  console.log(`markpress-cli — Markdown + 主题 JSON → 带样式 HTML

用法:
  mpr / markpress                    交互式批量转换（Windows 用 mpr，mp 与 PowerShell 冲突）
  mpr c / mpr -c                     快速转换（选 md → 主题）
  mpr ai                             AI 对话创建主题（DeepSeek）
  mpr ai -c / mpr ai --convert       快速转换（不进 AI 对话）
  mpr ai config                      配置 API 密钥、模型等
  mpr convert [选项]                 非交互转换（支持 --all -t 主题 批量）
  mpr template                       复制内置 Markdown 模板到当前目录
  mpr template list                  列出内置模板
  mpr themes list                    列出内置主题
  mpr --help                         显示帮助
  mpr -v / -version                  显示版本号

内置主题: RULE_蓝色底、RULE_无底色、正式版（别名：有底色、无底色）

示例:
  mpr c / mpr -c                     # 交互选文件 + 主题
  mpr -c --all -t 正式版             # 当前目录全部 md 一键转换
  mpr convert --md 协议.md --theme 有底色 --out output/协议.html
  mpr template                       # 复制 转换模板.md 到当前目录
  mpr ai

环境变量:
  MARKPRESS_INPUT / MARKPRESS_EXAMPLES  交互模式文档目录（默认当前目录）
  MARKPRESS_OUTPUT                      输出目录（默认 ./output）
  DEEPSEEK_API_KEY                      AI 密钥（也可用 mpr ai config 保存到 ~/.markpress/）
  DEEPSEEK_MODEL                        模型，默认 deepseek-v4-flash
  DEEPSEEK_BASE_URL                     API 地址，默认 https://api.deepseek.com
`)
}

function printThemesList() {
  const themes = listBuiltinThemes()
  if (themes.length === 0) {
    console.log('（无内置主题）')
    return
  }
  console.log('内置主题:\n')
  for (const t of themes) {
    console.log(`  ${t.id}`)
    console.log(`    ${t.label}`)
    console.log(`    ${t.description}`)
    console.log()
  }
}

async function main() {
  const argv = process.argv.slice(2)

  if (argv.length === 0) {
    await runDefaultInteractive()
    return
  }

  const cmd = argv[0]

  if (isVersionFlag(cmd)) {
    printVersion()
    return
  }

  if (cmd === '--help' || cmd === '-h' || cmd === 'help') {
    printHelp()
    return
  }

  if (isQuickConvertFlag(cmd)) {
    await runQuickConvert(argv.slice(1))
    return
  }

  if (cmd === 'convert') {
    await runConvertCli(argv.slice(1))
    return
  }

  if (cmd === 'c') {
    await runQuickConvert(argv.slice(1))
    return
  }

  if (cmd === 'interactive') {
    await runInteractive(argv.slice(1))
    return
  }

  if (cmd === 'ai') {
    await runThemeAi(argv.slice(1))
    return
  }

  if (cmd === 'themes' && argv[1] === 'list') {
    printThemesList()
    return
  }

  if (cmd === 'template') {
    await runTemplateCli(argv.slice(1))
    return
  }

  console.error(`未知命令: ${cmd}\n`)
  printHelp()
  process.exit(1)
}

main().catch((err) => {
  console.error('[markpress] 失败:', err instanceof Error ? err.message : err)
  process.exit(1)
})
