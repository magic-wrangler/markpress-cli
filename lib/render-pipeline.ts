import { marked } from 'marked'
import { generateFullHTML, type StyleConfig } from './markdown-styles.ts'
import { processTableMerge } from './table-merge.ts'

export const MARKDOWN_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote', 'pre', 'code',
    'a', 'strong', 'em', 'del', 'img',
    'div', 'span',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'rowspan', 'colspan',
  ],
} as const

export interface HtmlSanitizer {
  sanitize: (
    html: string,
    config: {
      ALLOWED_TAGS: readonly string[]
      ALLOWED_ATTR: readonly string[]
    }
  ) => string
}

export async function markdownToCleanHtml(
  markdown: string,
  purify: HtmlSanitizer,
  styleConfig: StyleConfig
): Promise<string> {
  const rawHtml = await marked(markdown)
  let cleanHtml = purify.sanitize(rawHtml, MARKDOWN_SANITIZE_CONFIG)
  cleanHtml = processTableMerge(cleanHtml, {
    enableRowMerge: styleConfig.table.enableRowMerge,
    enableColMerge: styleConfig.table.enableColMerge,
  })
  return cleanHtml
}

export async function renderMarkdownToStyledHtml(
  markdown: string,
  styleConfig: StyleConfig,
  purify: HtmlSanitizer
): Promise<string> {
  const cleanHtml = await markdownToCleanHtml(markdown, purify, styleConfig)
  return generateFullHTML(cleanHtml, styleConfig)
}

export function injectScriptIntoHtml(html: string, script: string): string {
  const code = script.trim()
  if (!code) return html
  const safe = code.replace(/<\/script>/gi, '<\\/script>')
  const tag = `<script>\n${safe}\n</script>\n`
  const idx = html.lastIndexOf('</body>')
  if (idx === -1) return html + '\n' + tag
  return html.slice(0, idx) + tag + html.slice(idx)
}
