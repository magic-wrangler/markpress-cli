import { readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve, basename, extname } from 'node:path'
import * as p from '@clack/prompts'
import { runConvert, isValidThemeFile } from '../convert-core.ts'
import { listBuiltinThemes } from '../theme-resolver.ts'
import {
  scanMarkdownDocuments,
  formatDocumentSearchHint,
  hasUserMarkdown,
} from '../document-scan.ts'
import {
  copyBuiltinTemplate,
  DEFAULT_TEMPLATE_ID,
  findBuiltinTemplate,
} from '../builtin-templates.ts'
import { withClackUi, printStatus } from './chat-prompt.ts'
import type { ChatPrompt } from './chat-prompt.ts'

function listMdFiles(cwd: string): string[] {
  return scanMarkdownDocuments(cwd).map((f) => f.relativePath)
}

function listThemeJsonFiles(cwd: string): string[] {
  if (!existsSync(cwd)) return []
  return readdirSync(cwd)
    .filter((f) => f.toLowerCase().endsWith('.json') && isValidThemeFile(join(cwd, f)))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

function htmlNameForMd(mdName: string): string {
  return basename(mdName, extname(mdName)) + '.html'
}

function outputPathForMd(outputDir: string, mdName: string): string {
  return join(outputDir, htmlNameForMd(mdName))
}

function buildThemeOptions(cwd: string) {
  const builtinThemes = listBuiltinThemes()
  const localThemeNames = listThemeJsonFiles(cwd)

  return [
    ...builtinThemes.map((t) => ({
      value: `builtin:${t.id}`,
      label: `[内置] ${t.label}`,
      hint: t.description,
    })),
    ...localThemeNames.map((name) => ({
      value: `local:${name}`,
      label: `[本地] ${name}`,
      hint: undefined,
    })),
  ]
}

function resolveThemeSelection(selected: string, cwd: string): string {
  if (selected.startsWith('builtin:')) {
    return selected.slice('builtin:'.length)
  }
  if (selected.startsWith('local:')) {
    return join(cwd, selected.slice('local:'.length))
  }
  return selected
}

async function copyDefaultTemplateToCwd(cwd: string): Promise<string | null> {
  const tpl = findBuiltinTemplate(DEFAULT_TEMPLATE_ID)
  if (!tpl) {
    printStatus('warn', '未找到内置转换模板')
    return null
  }

  const destPath = resolve(cwd, tpl.fileName)

  if (existsSync(destPath)) {
    const overwrite = await p.confirm({
      message: `${tpl.fileName} 已存在，覆盖？`,
    })
    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel('已取消')
      return null
    }
  }

  copyBuiltinTemplate(DEFAULT_TEMPLATE_ID, destPath)
  printStatus('ok', `已复制到 ${destPath}`)
  return tpl.fileName
}

async function promptMdMultiselect(
  cwd: string,
  candidates: string[],
  message = '选择 Markdown（空格多选，回车确认）'
): Promise<string[] | null> {
  if (candidates.length === 0) {
    p.log.warn('没有可选的 Markdown 文件')
    p.log.info('可先执行 mpr template，或在 @ 中选择内置模板')
    return null
  }

  const selected = await p.multiselect({
    message,
    options: candidates.map((name) => ({ value: name, label: name })),
    required: true,
  })
  if (p.isCancel(selected)) {
    p.cancel('已取消')
    return null
  }
  return selected as string[]
}

async function runBatchConvert(
  cwd: string,
  mdList: string[],
  themeArg: string
): Promise<void> {
  const outputDir = resolve(process.env.MARKPRESS_OUTPUT ?? join(cwd, 'output'))
  mkdirSync(outputDir, { recursive: true })

  p.log.info(`主题：${themeArg}`)
  p.log.info(`将转换 ${mdList.length} 个文件 → ${outputDir}`)

  const toOverwrite = mdList.filter((name) => existsSync(outputPathForMd(outputDir, name)))
  if (toOverwrite.length > 0) {
    p.log.warn('部分 HTML 已存在，将直接覆盖。')
  }

  const confirm = await p.confirm({
    message: toOverwrite.length > 0 ? '确认覆盖并转换？' : '开始转换？',
  })
  if (p.isCancel(confirm) || !confirm) {
    p.cancel('已取消')
    return
  }

  let ok = 0
  let fail = 0

  for (const mdName of mdList) {
    const outName = htmlNameForMd(mdName)
    const outPath = outputPathForMd(outputDir, mdName)
    const spin = p.spinner()
    spin.start(`转换 ${mdName} → ${outName}`)
    try {
      await runConvert({
        md: mdName,
        theme: themeArg,
        out: outPath,
        cwd,
      })
      spin.stop(`完成 ${outName}`)
      ok++
    } catch (err) {
      spin.stop(`失败 ${outName}`)
      p.log.error(err instanceof Error ? err.message : String(err))
      fail++
    }
  }

  if (fail === 0) {
    p.log.success(`全部成功（${ok} 个）→ ${outputDir}`)
  } else {
    p.log.warn(`完成：成功 ${ok}，失败 ${fail}`)
  }
}

/** 路径 A：先选 md（多选）→ 再选主题（含内置） */
async function mdFirstFlow(cwd: string, mdCandidates: string[]): Promise<void> {
  const mdList = await promptMdMultiselect(cwd, mdCandidates)
  if (!mdList?.length) return

  const themeOptions = buildThemeOptions(cwd)
  if (themeOptions.length === 0) {
    p.log.error('未找到可用主题')
    return
  }

  const themeSelected = await p.select({
    message: '选择主题',
    options: themeOptions,
  })
  if (p.isCancel(themeSelected)) {
    p.cancel('已取消')
    return
  }

  await runBatchConvert(cwd, mdList, resolveThemeSelection(themeSelected as string, cwd))
}

async function runMdFirstPath(
  chat: ChatPrompt,
  cwd: string,
  mdCandidates: string[]
): Promise<void> {
  await withClackUi(chat, async () => mdFirstFlow(cwd, mdCandidates))
}

/** 路径 B：先选主题（内置 + 本地 JSON）→ 再选 md（多选） */
async function themeFirstFlow(
  cwd: string,
  preselectedTheme?: string
): Promise<void> {
  const themeOptions = buildThemeOptions(cwd)
  if (themeOptions.length === 0) {
    p.log.error('未找到可用主题')
    return
  }

  let themeSelected = preselectedTheme
  if (!themeSelected) {
    const sel = await p.select({
      message: '选择主题（含内置与本地 JSON）',
      options: themeOptions,
    })
    if (p.isCancel(sel)) {
      p.cancel('已取消')
      return
    }
    themeSelected = sel as string
  } else if (!themeSelected.startsWith('builtin:') && !themeSelected.startsWith('local:')) {
    themeSelected = `local:${preselectedTheme}`
  }

  const themeArg = resolveThemeSelection(themeSelected, cwd)
  const mdList = await promptMdMultiselect(
    cwd,
    listMdFiles(cwd),
    '选择要转换的 Markdown（空格多选）'
  )
  if (!mdList?.length) return

  await runBatchConvert(cwd, mdList, themeArg)
}

async function runThemeFirstPath(
  chat: ChatPrompt,
  cwd: string,
  preselectedJson?: string
): Promise<void> {
  await withClackUi(chat, async () =>
    themeFirstFlow(cwd, preselectedJson ? `local:${preselectedJson}` : undefined)
  )
}

export interface ConvertWizardOptions {
  preselectedMd?: string
}

/** 「帮我转换」向导：md 多选 → 主题 */
export async function runConvertWizard(
  chat: ChatPrompt,
  cwd: string,
  opts: ConvertWizardOptions = {}
): Promise<void> {
  const mdCandidates = listMdFiles(cwd)
  if (mdCandidates.length === 0) {
    printStatus('warn', `当前目录未找到 Markdown：${cwd}`)
    printStatus('info', '输入 @ 可选择内置模板并复制到当前目录')
    return
  }

  const initial =
    opts.preselectedMd && mdCandidates.includes(opts.preselectedMd)
      ? [opts.preselectedMd]
      : mdCandidates

  if (opts.preselectedMd && initial.length === 1) {
    await runMdFirstPath(chat, cwd, initial)
    return
  }

  await runMdFirstPath(chat, cwd, mdCandidates)
}

/** 输入 @ 触发：md 与 json 两条互斥路径 */
export async function runAtFilePicker(
  chat: ChatPrompt,
  cwd: string,
  filter = ''
): Promise<void> {
  const needle = filter.toLowerCase()
  const mdFiles = listMdFiles(cwd).filter((n) => !needle || n.toLowerCase().includes(needle))
  const jsonFiles = listThemeJsonFiles(cwd).filter(
    (n) => !needle || n.toLowerCase().includes(needle)
  )

  const showTemplate =
    !hasUserMarkdown(cwd) &&
    (!needle ||
      '转换模板'.includes(needle) ||
      '模板'.includes(needle) ||
      DEFAULT_TEMPLATE_ID.toLowerCase().includes(needle))

  if (mdFiles.length === 0 && jsonFiles.length === 0 && !showTemplate) {
    if (needle) {
      printStatus('warn', `未找到匹配「${filter}」的文件`)
    } else {
      printStatus('warn', `未找到可转换文件（工作目录：${cwd}）`)
      printStatus('info', formatDocumentSearchHint(cwd))
      printStatus('info', '无 md 时 @ 可选内置模板，或执行 mpr template')
    }
    return
  }

  // 筛选结果唯一：直接进入对应路径
  if (needle && jsonFiles.length === 1 && mdFiles.length === 0) {
    await runThemeFirstPath(chat, cwd, jsonFiles[0])
    return
  }
  if (needle && mdFiles.length > 0 && jsonFiles.length === 0) {
    await runMdFirstPath(chat, cwd, mdFiles)
    return
  }

  await withClackUi(chat, async () => {
    const modeOptions: { value: string; label: string; hint?: string }[] = []

    if (showTemplate) {
      modeOptions.push({
        value: 'template',
        label: '[模板] 复制转换模板.md',
        hint: '复制到当前目录，再选 Markdown',
      })
    }
    if (mdFiles.length > 0 || hasUserMarkdown(cwd)) {
      modeOptions.push({
        value: 'md',
        label: '选择 Markdown',
        hint: '可多选，再选主题（含内置与本地 JSON）',
      })
    }
    if (jsonFiles.length > 0) {
      modeOptions.push({
        value: 'theme',
        label: '先选主题',
        hint: '内置或本地 JSON，再选 Markdown',
      })
    }

    if (modeOptions.length === 1) {
      const only = modeOptions[0].value
      if (only === 'template') {
        const copied = await copyDefaultTemplateToCwd(cwd)
        if (copied) await mdFirstFlow(cwd, [copied])
      } else if (only === 'md') {
        await mdFirstFlow(cwd, listMdFiles(cwd))
      } else if (only === 'theme') {
        await themeFirstFlow(cwd)
      }
      return
    }

    const mode = await p.select({
      message: needle ? `选择方式（筛选：${filter}）` : '选择方式',
      options: modeOptions,
    })
    if (p.isCancel(mode)) {
      p.cancel('已取消')
      return
    }

    if (mode === 'template') {
      const copied = await copyDefaultTemplateToCwd(cwd)
      if (copied) await mdFirstFlow(cwd, [copied])
    } else if (mode === 'md') {
      await mdFirstFlow(cwd, mdFiles.length > 0 ? mdFiles : listMdFiles(cwd))
    } else if (mode === 'theme') {
      await themeFirstFlow(cwd)
    }
  })
}

export function isAtFilePickerInput(text: string): boolean {
  return text === '@' || text.startsWith('@')
}

export function parseAtFilter(text: string): string {
  return text.startsWith('@') ? text.slice(1).trim() : ''
}
