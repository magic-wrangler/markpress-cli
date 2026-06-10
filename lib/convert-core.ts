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

export interface ConvertOptions {
  md: string
  theme: string
  out?: string
  customJs?: string
  cwd?: string
}

export interface ConvertResult {
  outPath: string
}

let globalsReady = false

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

/** 判断 JSON 文件是否为 StyleConfig 主题（用于交互列表过滤） */
export function isValidThemeFile(themePath: string): boolean {
  try {
    const raw = readFileSync(themePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<StyleConfig>
    return !!(
      parsed.global &&
      parsed.typography &&
      parsed.table &&
      parsed.codeBlock &&
      parsed.blockquote &&
      parsed.link &&
      parsed.list
    )
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

export async function runConvert(opts: ConvertOptions): Promise<ConvertResult> {
  const cwd = opts.cwd ?? process.cwd()
  setupBrowserGlobals()

  const mdPath = resolve(cwd, opts.md)
  const themePath = resolveThemePath(opts.theme, cwd)
  const markdown = readFileSync(mdPath, 'utf-8')
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

  return { outPath }
}
