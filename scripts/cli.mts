/**
 * markpress-cli 唯一入口
 *
 *   markpress                    交互模式
 *   markpress convert ...        非交互转换
 *   markpress themes list        列出内置主题
 */

import { listBuiltinThemes } from '../lib/theme-resolver.ts'
import { runConvertCli, printConvertHelp } from './convert.mts'
import { runInteractive } from './convert-interactive.mts'

function printHelp() {
  console.log(`markpress-cli — Markdown + 主题 JSON → 带样式 HTML

用法:
  markpress                          交互式批量转换
  markpress convert [选项]           非交互转换
  markpress themes list              列出内置主题
  markpress --help                   显示帮助

内置主题: 有底色、无底色

示例:
  markpress convert --md 协议.md --theme 有底色 --out output/协议.html

环境变量:
  MARKPRESS_INPUT / MARKPRESS_EXAMPLES  交互模式文档目录（默认当前目录）
  MARKPRESS_OUTPUT                      输出目录（默认 ./output）
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
    await runInteractive()
    return
  }

  const cmd = argv[0]

  if (cmd === '--help' || cmd === '-h' || cmd === 'help') {
    printHelp()
    return
  }

  if (cmd === 'convert') {
    await runConvertCli(argv.slice(1))
    return
  }

  if (cmd === 'interactive') {
    await runInteractive(argv.slice(1))
    return
  }

  if (cmd === 'themes' && argv[1] === 'list') {
    printThemesList()
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
