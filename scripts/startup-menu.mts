/**
 * 无参数启动时的模式选择
 */

import * as p from '@clack/prompts'
import { runInteractive } from './convert-interactive.mts'
import { runThemeAi } from './theme-ai.mts'

export type StartupMode = 'convert' | 'ai'

export async function promptStartupMode(): Promise<StartupMode | null> {
  const choice = await p.select({
    message: '选择模式',
    options: [
      {
        value: 'convert' as const,
        label: '批量转换',
        hint: '选主题 → 转 md → html',
      },
      {
        value: 'ai' as const,
        label: 'AI 创建主题',
        hint: '对话生成主题 JSON（mpr ai）',
      },
    ],
  })

  if (p.isCancel(choice)) return null
  return choice as StartupMode
}

export async function runDefaultInteractive(): Promise<void> {
  p.intro('Markpress · Markdown 主题转 HTML')
  p.log.info('提示：无 md 时可 mpr template 复制内置模板 · mpr ai 可对话创建主题')

  const mode = await promptStartupMode()
  if (!mode) {
    p.outro('已取消')
    return
  }

  if (mode === 'ai') {
    await runThemeAi()
    return
  }

  await runInteractive([], { skipIntro: true })
}
