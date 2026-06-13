/**
 * 无参数启动时的交互转换（不走 AI）
 */

import * as p from '@clack/prompts'
import { runInteractive } from './convert-interactive.mts'

export async function runDefaultInteractive(): Promise<void> {
  p.intro('Markpress · Markdown 主题转 HTML')
  p.log.info('提示：无 md 时可 mpr template · AI 主题/修复请用 mpr ai')

  await runInteractive([], { skipIntro: true, noAiFix: true })
}
