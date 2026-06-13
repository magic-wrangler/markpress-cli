import { diffPreprocessMarkdown } from './markdown-preprocess.ts'
import { aiFixMarkdown } from './ai/markdown-fixer.ts'
import { resolveDeepSeekConfig } from './ai/config.ts'
import type { PreprocessChange } from './markdown-preprocess.ts'

export interface FixMarkdownOptions {
  aiFix?: boolean
  noPreprocess?: boolean
  onStream?: (chunk: string, kind: 'reasoning' | 'content') => void
  signal?: AbortSignal
}

export interface FixMarkdownResult {
  text: string
  ruleChanges: PreprocessChange[]
  aiUsed: boolean
}

/** 对比全文行级 diff（用于展示） */
export function diffMarkdownLines(before: string, after: string): PreprocessChange[] {
  const bLines = before.split(/\r?\n/)
  const aLines = after.split(/\r?\n/)
  const max = Math.max(bLines.length, aLines.length)
  const changes: PreprocessChange[] = []

  for (let i = 0; i < max; i++) {
    const b = bLines[i] ?? ''
    const a = aLines[i] ?? ''
    if (b !== a) {
      changes.push({ line: i + 1, before: b, after: a })
    }
  }
  return changes
}

export async function fixMarkdownContent(
  raw: string,
  opts: FixMarkdownOptions = {}
): Promise<FixMarkdownResult> {
  const skipPreprocess =
    opts.noPreprocess || process.env.MARKPRESS_MD_NO_PREPROCESS === '1'

  let text = raw
  let ruleChanges: PreprocessChange[] = []
  let aiUsed = false

  if (!skipPreprocess) {
    const pre = diffPreprocessMarkdown(raw)
    text = pre.text
    ruleChanges = pre.changes
  }

  if (opts.aiFix && resolveDeepSeekConfig()) {
    const callbacks = opts.onStream
      ? {
          onReasoningDelta: (chunk: string) => opts.onStream!(chunk, 'reasoning'),
          onContentDelta: (chunk: string) => opts.onStream!(chunk, 'content'),
        }
      : undefined
    text = await aiFixMarkdown(text, callbacks, opts.signal)
    aiUsed = true
    if (!skipPreprocess) {
      text = diffPreprocessMarkdown(text).text
    }
  }

  return { text, ruleChanges, aiUsed }
}
