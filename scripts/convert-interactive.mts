/**
 * 交互式批量转换
 */

import { readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve, basename, extname } from 'node:path'
import * as p from '@clack/prompts'
import { runConvert, isValidThemeFile } from '../lib/convert-core.ts'
import { listBuiltinThemes } from '../lib/theme-resolver.ts'
import { parseConvertArgs } from '../lib/parse-args.ts'
import { isContentMarkdown } from '../lib/scan-filters.ts'

export interface InteractiveOptions {
  inputDir?: string
  outputDir?: string
}

function getDirs(opts: InteractiveOptions) {
  const inputDir = resolve(
    opts.inputDir ?? process.env.MARKPRESS_INPUT ?? process.env.MARKPRESS_EXAMPLES ?? process.cwd()
  )
  const outputDir = resolve(
    opts.outputDir ?? process.env.MARKPRESS_OUTPUT ?? join(process.cwd(), 'output')
  )
  return { inputDir, outputDir }
}

function listFiles(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(ext))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

function htmlNameForMd(mdName: string): string {
  return basename(mdName, extname(mdName)) + '.html'
}

function outputPathForMd(outputDir: string, mdName: string): string {
  return join(outputDir, htmlNameForMd(mdName))
}

function resolveThemeSelection(selected: string, inputDir: string): string {
  if (selected.startsWith('builtin:')) {
    return selected.slice('builtin:'.length)
  }
  if (selected.startsWith('local:')) {
    return join(inputDir, selected.slice('local:'.length))
  }
  return selected
}

async function runSession(inputDir: string, outputDir: string): Promise<boolean> {
  mkdirSync(outputDir, { recursive: true })

  const mdNames = listFiles(inputDir, '.md').filter(isContentMarkdown)
  const localThemeNames = listFiles(inputDir, '.json').filter((name) =>
    isValidThemeFile(join(inputDir, name))
  )
  const builtinThemes = listBuiltinThemes()

  if (mdNames.length === 0) {
    p.log.error(`未找到 Markdown，请将 .md 放入：${inputDir}`)
    return false
  }

  const themeOptions = [
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

  if (themeOptions.length === 0) {
    p.log.error('未找到可用主题（内置主题文件缺失）')
    return false
  }

  const themeSelected = await p.select({
    message: '选择主题（本批次共用）',
    options: themeOptions,
  })
  if (p.isCancel(themeSelected)) {
    p.cancel('已取消')
    return false
  }

  const mdSelected = await p.multiselect({
    message: '选择 Markdown 文件（空格切换，Enter 确认）',
    options: mdNames.map((name) => {
      const outName = htmlNameForMd(name)
      const willOverwrite = existsSync(outputPathForMd(outputDir, name))
      return {
        value: name,
        label: name,
        hint: willOverwrite ? `将覆盖 output/${outName}` : undefined,
      }
    }),
    required: true,
  })
  if (p.isCancel(mdSelected)) {
    p.cancel('已取消')
    return false
  }

  const mdList = mdSelected as string[]
  const themeArg = resolveThemeSelection(themeSelected as string, inputDir)

  p.log.info(`主题：${themeArg}`)
  p.log.info(`将转换 ${mdList.length} 个文件 → ${outputDir}`)

  const toOverwrite = mdList.filter((name) => existsSync(outputPathForMd(outputDir, name)))
  if (toOverwrite.length > 0) {
    p.log.warn('再次选择相同 Markdown 将直接覆盖已有 HTML。')
    p.note(
      toOverwrite.map((name) => `  output/${htmlNameForMd(name)}`).join('\n'),
      `将覆盖 ${toOverwrite.length} 个文件`
    )
  }

  const confirmMessage = toOverwrite.length > 0 ? '确认覆盖并转换？' : '开始转换？'
  const confirm = await p.confirm({ message: confirmMessage })
  if (p.isCancel(confirm) || !confirm) {
    p.cancel('已取消')
    return false
  }

  let ok = 0
  let fail = 0

  for (const mdName of mdList) {
    const mdPath = join(inputDir, mdName)
    const outName = htmlNameForMd(mdName)
    const outPath = outputPathForMd(outputDir, mdName)
    const spin = p.spinner()

    spin.start(`转换 ${mdName} → ${outName}`)
    try {
      await runConvert({
        md: mdPath,
        theme: themeArg,
        out: outPath,
        cwd: inputDir,
      })
      spin.stop(`完成 ${outName}`)
      ok++
    } catch (err) {
      spin.stop(`失败 ${outName}`)
      p.log.error(err instanceof Error ? err.message : String(err))
      fail++
    }
  }

  p.note(
    mdList.map((name) => `  ${name} → output/${htmlNameForMd(name)}`).join('\n'),
    '输出文件'
  )

  if (fail === 0) {
    p.outro(`全部成功（${ok} 个）`)
  } else {
    p.outro(`完成：成功 ${ok}，失败 ${fail}`)
  }

  return fail === 0
}

export async function runInteractive(argv: string[] = []): Promise<void> {
  const { inputDir: argInput, outputDir: argOutput } = parseConvertArgs(argv)
  const { inputDir, outputDir } = getDirs({
    inputDir: argInput || undefined,
    outputDir: argOutput || undefined,
  })

  p.intro('Markpress · Markdown 主题转 HTML')
  p.log.info(`文档目录：${inputDir}`)
  p.log.info(`输出目录：${outputDir}`)

  while (true) {
    await runSession(inputDir, outputDir)

    const again = await p.confirm({ message: '继续转换更多文件？' })
    if (p.isCancel(again) || !again) {
      p.outro('再见！')
      break
    }
  }
}
