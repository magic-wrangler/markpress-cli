import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, basename, extname, dirname } from 'node:path'
import { JSDOM } from 'jsdom'
import createDOMPurify from 'dompurify'
import type { StyleConfig } from './markdown-styles.ts'
import {
  injectScriptIntoHtml,
  renderMarkdownToStyledHtml,
} from './render-pipeline.ts'
import { resolveThemePath } from './theme-resolver.ts'
import { diffPreprocessMarkdown } from './markdown-preprocess.ts'
import { diffMarkdownLines, fixMarkdownContent } from './markdown-fix-pipeline.ts'
import { shouldAiFixOnConvert } from './convert-ai-fix.ts'
import { createFixStreamDisplay } from './convert-fix-ui.ts'
import { printMarkdownFixDiff } from './markdown-diff-display.ts'
import type { PreprocessChange } from './markdown-preprocess.ts'

export interface ConvertOptions {
  md: string
  theme: string
  out?: string
  customJs?: string
  cwd?: string
  aiFix?: boolean
  noAiFix?: boolean
  fixPreview?: boolean
  noPreprocess?: boolean
  /** 修复后展示 diff；默认 AI 修复或有 fixPreview 时为 true */
  showFixDiff?: boolean
  /** 不写回源 md（默认有修复时会写回） */
  noWriteMd?: boolean
  onStream?: (chunk: string, kind: 'reasoning' | 'content') => void
}

export interface ConvertResult {
  outPath: string
  fixChanges: PreprocessChange[]
  /** 是否已将修复后的内容写回源 .md */
  mdWrittenBack: boolean
}

let globalsReady = false

export function printPreprocessPreview(
  changes: PreprocessChange[],
  mdName = '文档'
): void {
  printMarkdownFixDiff(mdName, changes)
}

export function setupBrowserGlobals(): void {
  if (globalsReady) return
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  const { window } = dom
  globalThis.window = window as unknown as Window & typeof globalThis
  globalThis.document = window.document
  globalThis.DOMParser = window.DOMParser
  globalThis.Node = window.Node
  globalsReady = true
}

export function validateStyleConfigObject(parsed: unknown): parsed is StyleConfig {
  if (!parsed || typeof parsed !== 'object') return false
  const obj = parsed as Partial<StyleConfig>
  return !!(
    obj.global &&
    obj.typography &&
    obj.table &&
    obj.codeBlock &&
    obj.blockquote &&
    obj.link &&
    obj.list
  )
}

export function isValidThemeFile(themePath: string): boolean {
  try {
    const raw = readFileSync(themePath, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    return validateStyleConfigObject(parsed)
  } catch {
    return false
  }
}

export function loadThemeConfig(themePath: string): StyleConfig {
  const abs = resolve(themePath)
  const raw = readFileSync(abs, 'utf-8')
  const parsed = JSON.parse(raw) as StyleConfig
  if (!parsed.global || !parsed.typography || !parsed.table) {
    throw new Error(`主题 JSON 格式不完整，需包含 global / typography / table：${abs}`)
  }
  if (!parsed.codeBlock || !parsed.blockquote || !parsed.link || !parsed.list) {
    throw new Error(`主题 JSON 还需包含 codeBlock / blockquote / link / list：${abs}`)
  }
  return parsed
}

function shouldShowFixDiff(
  opts: ConvertOptions,
  useAiFix: boolean,
  fixChanges: PreprocessChange[]
): boolean {
  if (fixChanges.length === 0) return false
  if (opts.showFixDiff === false) return false
  if (opts.showFixDiff === true || opts.fixPreview) return true
  if (useAiFix) return true
  return process.env.MARKPRESS_CONVERT_SHOW_FIX_DIFF === '1'
}

function shouldWriteBackMd(opts: ConvertOptions, changed: boolean): boolean {
  if (!changed) return false
  if (opts.noWriteMd || process.env.MARKPRESS_CONVERT_NO_WRITE_MD === '1') return false
  return true
}

export async function runConvert(opts: ConvertOptions): Promise<ConvertResult> {
  const cwd = opts.cwd ?? process.cwd()
  setupBrowserGlobals()

  const mdPath = resolve(cwd, opts.md)
  const mdLabel = basename(mdPath)
  const themePath = resolveThemePath(opts.theme, cwd)
  const rawMarkdown = readFileSync(mdPath, 'utf-8')
  const useAiFix = shouldAiFixOnConvert(opts)

  if (opts.fixPreview && (opts.noPreprocess || process.env.MARKPRESS_MD_NO_PREPROCESS === '1')) {
    console.log('规则预处理：已跳过（--no-preprocess）\n')
  } else if (opts.fixPreview && !useAiFix) {
    printPreprocessPreview(diffPreprocessMarkdown(rawMarkdown).changes, mdLabel)
  }

  let display: ReturnType<typeof createFixStreamDisplay> | null = null
  let onStream = opts.onStream

  if (useAiFix && !onStream) {
    process.stdout.write('\n')
    display = createFixStreamDisplay('思考中…')
    onStream = display.onStream
  }

  let onUsage = opts.onUsage
  if (display && !onUsage) {
    onUsage = display.onUsage
  }

  let markdown: string
  let ruleChanges: PreprocessChange[] = []

  try {
    const result = await fixMarkdownContent(rawMarkdown, {
      aiFix: useAiFix,
      noPreprocess: opts.noPreprocess,
      onStream,
      onUsage,
    })
    markdown = result.text
    ruleChanges = result.ruleChanges
    display?.finish()
  } catch (err) {
    display?.fail()
    throw err
  }

  const fixChanges = diffMarkdownLines(rawMarkdown, markdown)

  if (shouldShowFixDiff(opts, useAiFix, fixChanges)) {
    printMarkdownFixDiff(mdLabel, fixChanges)
  } else if (opts.fixPreview && useAiFix) {
    if (ruleChanges.length > 0) {
      console.log(`规则预处理：${ruleChanges.length} 行\n`)
      printPreprocessPreview(ruleChanges, mdLabel)
    }
    if (fixChanges.length === 0) {
      console.log(`${mdLabel}：AI 修复后无需变更\n`)
    }
  }

  const mdChanged = markdown !== rawMarkdown
  let mdWrittenBack = false
  if (shouldWriteBackMd(opts, mdChanged)) {
    writeFileSync(mdPath, markdown, 'utf-8')
    mdWrittenBack = true
  }

  const styleConfig = loadThemeConfig(themePath)
  const dom = new JSDOM('')
  const purify = createDOMPurify(dom.window as unknown as Window)
  let html = await renderMarkdownToStyledHtml(markdown, styleConfig, purify)

  if (opts.customJs) {
    const script = readFileSync(resolve(cwd, opts.customJs), 'utf-8')
    html = injectScriptIntoHtml(html, script)
  }

  const outPath =
    opts.out
      ? resolve(cwd, opts.out)
      : resolve(mdPath, '..', `${basename(mdPath, extname(mdPath))}.html`)

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, html, 'utf-8')

  return { outPath, fixChanges, mdWrittenBack }
}
