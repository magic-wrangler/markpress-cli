import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as p from '@clack/prompts'
import { scanMarkdownDocuments } from '../document-scan.ts'
import { diffMarkdownLines, fixMarkdownContent } from '../markdown-fix-pipeline.ts'
import { printMarkdownFixDiff } from '../markdown-diff-display.ts'
import { resolveDeepSeekConfig } from './config.ts'
import { createFixStreamDisplay } from '../convert-fix-ui.ts'
import { promptMarkdownMultiselect } from '../md-multiselect.ts'
import { withClackUi, printStatus } from './chat-prompt.ts'
import type { ChatPrompt } from './chat-prompt.ts'

export type MarkdownFixMode = 'check' | 'fix'

async function selectMarkdownFiles(cwd: string): Promise<string[] | null> {
  const mdFiles = scanMarkdownDocuments(cwd).map((f) => f.relativePath)
  if (mdFiles.length === 0) {
    printStatus('warn', `未找到 Markdown 文件（${cwd}）`)
    printStatus('info', '可先执行 mpr template 或输入 @ 复制转换模板')
    return null
  }

  if (mdFiles.length === 1) {
    p.log.info(`文档：${mdFiles[0]}`)
    return mdFiles
  }

  return promptMarkdownMultiselect(mdFiles, {
    message: '选择要处理的 Markdown（空格多选，Enter 确认）',
  })
}

async function runFixWithAiDisplay(
  chat: ChatPrompt,
  raw: string,
  useAi: boolean
): Promise<{ text: string; aiUsed: boolean }> {
  chat.release()

  if (!useAi) {
    const result = await fixMarkdownContent(raw, { aiFix: false })
    return { text: result.text, aiUsed: false }
  }

  const display = createFixStreamDisplay('思考中…')

  try {
    const result = await fixMarkdownContent(raw, {
      aiFix: true,
      onStream: display.onStream,
      onUsage: display.onUsage,
    })
    display.finish()
    return { text: result.text, aiUsed: true }
  } catch (err) {
    display.fail()
    throw err
  }
}

async function processOneFile(
  chat: ChatPrompt,
  cwd: string,
  mdName: string,
  mode: MarkdownFixMode
): Promise<void> {
  const absPath = resolve(cwd, mdName)
  const raw = readFileSync(absPath, 'utf-8')

  if (mode === 'check') {
    chat.release()
    const { text } = await fixMarkdownContent(raw, { aiFix: false })
    const changes = diffMarkdownLines(raw, text)
    printMarkdownFixDiff(mdName, changes)
    if (changes.length === 0) return

    await withClackUi(chat, async () => {
      const write = await p.confirm({ message: `写入修复到 ${mdName}？` })
      if (p.isCancel(write) || !write) {
        p.cancel('未写入')
        return
      }
      writeFileSync(absPath, text, 'utf-8')
      p.log.success(`已修复 ${mdName}`)
    })
    return
  }

  const useAi = !!resolveDeepSeekConfig()
  let fixed: string
  try {
    const result = await runFixWithAiDisplay(chat, raw, useAi)
    fixed = result.text
  } catch (err) {
    printStatus('warn', err instanceof Error ? err.message : String(err))
    return
  }

  const changes = diffMarkdownLines(raw, fixed)

  if (changes.length === 0) {
    printStatus('ok', `${mdName}：无需修复`)
    return
  }

  printMarkdownFixDiff(mdName, changes)

  await withClackUi(chat, async () => {
    const write = await p.confirm({ message: `写入 ${mdName}？` })
    if (p.isCancel(write) || !write) {
      p.cancel('未写入')
      return
    }
    writeFileSync(absPath, fixed, 'utf-8')
    p.log.success(`已修复 ${mdName}`)
  })
}

/** 「检查 / 修复」向导 */
export async function runMarkdownFixWizard(
  chat: ChatPrompt,
  cwd: string,
  mode: MarkdownFixMode
): Promise<void> {
  const mdList = await withClackUi(chat, () => selectMarkdownFiles(cwd))
  if (!mdList?.length) return

  if (mode === 'fix' && !resolveDeepSeekConfig()) {
    printStatus('info', '未配置 AI，将仅使用规则修复（#1212 → # 1212 等）')
  }

  for (const mdName of mdList) {
    await processOneFile(chat, cwd, mdName, mode)
  }
}
