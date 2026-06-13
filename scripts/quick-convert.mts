/**
 * 快速转换：mpr c / mpr ai -c
 * 交互选文件 + 主题；或 --all -t 主题 一键批量
 */

import * as p from '@clack/prompts'
import { ChatPrompt } from '../lib/ai/chat-prompt.ts'
import { runConvertWizard } from '../lib/ai/convert-wizard.ts'
import { parseConvertArgs } from '../lib/parse-args.ts'
import { runConvertAllCli } from './convert.mts'

export function printQuickConvertHelp() {
  console.log(`markpress c（快速转换）

用法:
  mpr c / mpr ai -c                  交互：选 md（可全选）→ 选主题 → 转换
  mpr c --all -t <主题>              当前目录全部 md 直接转换（无交互）
  mpr -c                             同上（-c 为 c 的简写）
  mpr ai -c                          同上（不进 AI 对话）
  mpr ai --convert                   同上

选项（与 mpr convert 相同）:
  --all               转换当前目录全部 Markdown
  -t, --theme <主题>  主题名或 .json 路径（--all 时必需）
  --output-dir <dir>  HTML 输出目录（默认 ./output）
  --no-ai-fix         跳过 AI 修复
  --no-write-md       不写回源 md
  -h, --help          显示帮助

示例:
  mpr c
  mpr c --all -t 正式版
  mpr ai -c
`)
}

export async function runQuickConvert(argv: string[] = []): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printQuickConvertHelp()
    return
  }

  const args = parseConvertArgs(argv)
  if (args.all) {
    await runConvertAllCli(argv)
    return
  }

  p.intro('Markpress · 快速转换')
  const chat = new ChatPrompt()
  await runConvertWizard(chat, process.cwd())
}
