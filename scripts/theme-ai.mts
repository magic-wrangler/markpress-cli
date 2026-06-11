/**
 * AI 对话创建主题
 */

import { writeFileSync, existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import * as p from '@clack/prompts'
import { resolveDeepSeekConfig } from '../lib/ai/config.ts'
import { formatThemePreview } from '../lib/ai/theme-preview.ts'
import {
  ChatPrompt,
  bindAbortOnSigint,
  isAbortError,
  isChatInterrupt,
  printAiReply,
  printLocalReply,
  printHint,
  printStatus,
  printThemePreview,
  withClackUi,
  withSpinner,
} from '../lib/ai/chat-prompt.ts'
import { runAiConfigWizard, printCurrentAiConfig } from '../lib/ai/setup.ts'
import {
  runConfigMenu,
  runAddModel,
  runSwitchModel,
  runDeleteModel,
  onModelConfigUpdated,
  formatModelsListReply,
  formatModelQuickSwitchHint,
  formatModelCommandsHelp,
  tryQuickModelSwitch,
  MODEL_COMMANDS,
} from '../lib/ai/model-manager.ts'
import { CompactAiDisplay, isVerboseAiDisplay } from '../lib/ai/compact-display.ts'
import { TerminalStreamWriter } from '../lib/ai/terminal-stream.ts'
import {
  createThemeChatSession,
  extractReplySummary,
  sendThemeMessage,
} from '../lib/ai/theme-generator.ts'
import { runConvert } from '../lib/convert-core.ts'
import { tryParseInlineConvert } from '../lib/inline-convert.ts'
import { formatBaseThemeSwitchHint } from '../lib/ai/builtin-theme-context.ts'
import { getKnowledgeSourceHint } from '../lib/ai/knowledge-loader.ts'
import {
  runAtFilePicker,
  runConvertWizard,
  isAtFilePickerInput,
  parseAtFilter,
} from '../lib/ai/convert-wizard.ts'
import { tryLocalInfoReply, isConvertRequestQuery, parseModelManageQuery } from '../lib/ai/local-commands.ts'
import { resolveSlashInput } from '../lib/ai/slash-commands.ts'

const EXIT_WORDS = new Set(['退出', 'quit', 'exit', 'q'])
const SAVE_WORDS = new Set(['保存', 'save'])

function normalizeFilename(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '我的主题.json'
  return extname(trimmed).toLowerCase() === '.json' ? trimmed : `${trimmed}.json`
}

async function ensureAiReady(): Promise<boolean> {
  if (resolveDeepSeekConfig()) return true

  p.log.warn('尚未配置 DeepSeek，接下来将引导你完成设置')
  const config = await runAiConfigWizard()
  return !!config
}

async function promptSaveTheme(
  cwd: string,
  session: ReturnType<typeof createThemeChatSession>,
  chat: ChatPrompt
): Promise<void> {
  if (!session.latestTheme) {
    printStatus('warn', '当前还没有有效的主题 JSON，请继续描述或要求 AI 重新生成')
    return
  }

  await withClackUi(chat, async () => {
    const filename = await p.text({
      message: '保存文件名',
      placeholder: '我的主题.json',
      defaultValue: '我的主题.json',
    })
    if (p.isCancel(filename)) {
      p.cancel('已取消保存')
      return
    }

    const outName = normalizeFilename(filename as string)
    const outPath = resolve(cwd, outName)

    if (existsSync(outPath)) {
      const overwrite = await p.confirm({ message: `${outName} 已存在，覆盖？` })
      if (p.isCancel(overwrite) || !overwrite) {
        p.cancel('已取消保存')
        return
      }
    }

    writeFileSync(outPath, JSON.stringify(session.latestTheme, null, 2), 'utf-8')
    printStatus('ok', `已保存 ${outPath}`)
    printStatus('info', `试用：convert --md 协议.md --theme ./${outName}`)
  })
}

export async function runAiConfig(): Promise<void> {
  await runAiConfigWizard(true)
}

export async function runThemeAi(argv: string[] = []): Promise<void> {
  if (argv[0] === 'config') {
    await runAiConfig()
    return
  }

  const cwd = process.cwd()

  console.log('\nMarkpress · AI 创建主题\n')

  const ready = await ensureAiReady()
  if (!ready) {
    process.exit(1)
  }

  printCurrentAiConfig()

  const hints = [
    formatBaseThemeSwitchHint(),
    '描述文档风格，如：表头再深一点、字号加大',
    '输入 @：选 Markdown（可多选）或先选主题 JSON · 「帮我转换」同上',
    '输入「内置主题」或「如何转换」查看说明',
    '模型列表 · 模型新增 · 模型修改 · 模型删除',
    '保存 · 配置 · 退出 · Ctrl+C 退出',
    '粘贴 convert 命令可直接转换',
  ]
  if (!isVerboseAiDisplay()) {
    hints.push('完整流式输出：MARKPRESS_AI_VERBOSE=1')
  }
  printHint('提示', hints)
  const modelQuickHint = formatModelQuickSwitchHint()
  if (modelQuickHint) printStatus('info', modelQuickHint)
  printStatus('info', `知识库：${getKnowledgeSourceHint()}`)

  let session: ReturnType<typeof createThemeChatSession>
  try {
    session = createThemeChatSession()
  } catch (err) {
    printStatus('warn', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }

  const chat = new ChatPrompt()

  try {
    while (true) {
      let text: string
      try {
        const raw = await chat.ask()
        const resolved = resolveSlashInput(raw)
        if (resolved === null) continue
        text = resolved.trim()
      } catch (err) {
        if (isChatInterrupt(err)) {
          console.log('\n再见！\n')
          break
        }
        continue
      }

      if (!text) continue

      if (EXIT_WORDS.has(text.toLowerCase())) {
        console.log('\n再见！\n')
        break
      }

      const modelAction = parseModelManageQuery(text)
      if (modelAction === 'list' || modelAction === 'help') {
        printAiReply(modelAction === 'help' ? formatModelCommandsHelp() : formatModelsListReply())
        continue
      }
      if (modelAction) {
        await withClackUi(chat, async () => {
          let updated = null
          switch (modelAction) {
            case 'menu':
              updated = await runConfigMenu()
              break
            case 'add':
              updated = await runAddModel()
              break
            case 'switch':
              updated = await runSwitchModel()
              break
            case 'delete':
              updated = await runDeleteModel()
              break
          }
          if (updated) {
            session = createThemeChatSession()
            onModelConfigUpdated()
          }
        })
        continue
      }

      const quickSwitch = tryQuickModelSwitch(text)
      if (quickSwitch) {
        printLocalReply(quickSwitch.message)
        if (quickSwitch.ok && !quickSwitch.message.includes('无需切换')) {
          session = createThemeChatSession()
          onModelConfigUpdated()
        }
        continue
      }

      if (SAVE_WORDS.has(text.toLowerCase())) {
        await promptSaveTheme(cwd, session, chat)
        continue
      }

      if (isAtFilePickerInput(text)) {
        await runAtFilePicker(chat, cwd, parseAtFilter(text))
        continue
      }

      if (isConvertRequestQuery(text)) {
        await runConvertWizard(chat, cwd)
        continue
      }

      const convertArgs = tryParseInlineConvert(text)
      if (convertArgs) {
        try {
          const { outPath } = await withSpinner(chat, `转换 ${convertArgs.md}`, () =>
            runConvert({
              md: convertArgs.md,
              theme: convertArgs.theme,
              out: convertArgs.out || undefined,
              customJs: convertArgs.customJs || undefined,
              cwd,
            })
          )
          printStatus('ok', `已生成 ${outPath}`)
        } catch (err) {
          printStatus('warn', err instanceof Error ? err.message : String(err))
        }
        continue
      }

      const localReply = tryLocalInfoReply(text)
      if (localReply) {
        printLocalReply(localReply)
        continue
      }

      const verbose = isVerboseAiDisplay()
      const compact = verbose ? null : new CompactAiDisplay()
      const writer = verbose ? new TerminalStreamWriter() : null
      if (compact) compact.start()

      const abort = new AbortController()
      const unbindSigint = bindAbortOnSigint(abort)

      try {
        const { reply, theme } = await sendThemeMessage(
          session,
          text,
          (chunk, kind) => {
            if (verbose && writer) {
              if (kind === 'reasoning') writer.writeReasoning(chunk)
              else writer.writeContent(chunk)
            } else if (compact) {
              if (kind === 'reasoning') compact.onReasoning(chunk)
              else compact.onContent(chunk)
            }
          },
          abort.signal
        )

        if (writer) writer.finish()
        if (compact) compact.finish(!!theme)

        const summary = extractReplySummary(reply)
        if (summary) printAiReply(summary)

        if (theme) {
          printThemePreview(formatThemePreview(theme))
          printStatus('ok', '完整 JSON 已就绪，输入「保存」写入文件')
        }
      } catch (err) {
        if (writer) writer.finish()
        if (compact) compact.fail()

        if (isAbortError(err)) {
          console.log('\n已取消\n')
          break
        }

        printStatus('warn', err instanceof Error ? err.message : String(err))
      } finally {
        unbindSigint()
      }
    }
  } finally {
    chat.close()
  }
}
