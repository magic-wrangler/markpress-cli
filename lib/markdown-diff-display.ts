import type { PreprocessChange } from '../markdown-preprocess.ts'

const DIM = '\x1b[2m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

function truncate(text: string, max = 100): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

/** 高亮显示被移除的反斜杠 */
function highlightBackslashes(text: string, color: string): string {
  return text.replace(/\\./g, (m) => `${color}${m}${RESET}`)
}

function countBackslashes(text: string): number {
  return (text.match(/\\/g) || []).length
}

/** 提取变更片段（省略相同的前后文，便于阅读长行 / RTL 文本） */
export function formatChangeSnippet(before: string, after: string, context = 24): string {
  let start = 0
  const minLen = Math.min(before.length, after.length)
  while (start < minLen && before[start] === after[start]) start++

  let endB = before.length
  let endA = after.length
  while (endB > start && endA > start && before[endB - 1] === after[endA - 1]) {
    endB--
    endA--
  }

  const prefix =
    start > context ? `…${before.slice(start - context, start)}` : before.slice(0, start)
  const suffixB = endB < before.length - context ? `${before.slice(endB, endB + context)}…` : before.slice(endB)
  const suffixA = endA < after.length - context ? `${after.slice(endA, endA + context)}…` : after.slice(endA)

  const removed = before.slice(start, endB)
  const added = after.slice(start, endA)

  // 小改动（如补空格、去 \）整行红绿，更易辨认
  const smallChange =
    removed.length + added.length <= 30 &&
    Math.max(before.length, after.length) <= 200

  if (smallChange) {
    return [
      `${DIM}-${RESET} ${RED}${before}${RESET}`,
      `${DIM}+${RESET} ${GREEN}${after}${RESET}`,
    ].join('\n')
  }

  return [
    `${DIM}-${RESET} ${prefix}${RED}${removed}${RESET}${suffixB}`,
    `${DIM}+${RESET} ${prefix}${GREEN}${added}${RESET}${suffixA}`,
  ].join('\n')
}

export function printMarkdownFixDiff(mdName: string, changes: PreprocessChange[]): void {
  if (changes.length === 0) {
    console.log(`${GREEN}✓${RESET} ${mdName}：格式正常，无需修复\n`)
    return
  }

  const backslashRemoved = changes.reduce(
    (sum, c) => sum + Math.max(0, countBackslashes(c.before) - countBackslashes(c.after)),
    0
  )

  console.log(`${YELLOW}·${RESET} ${mdName}：${changes.length} 行有变更` +
    (backslashRemoved > 0 ? `，移除 ${backslashRemoved} 处 \\ 转义` : '') +
    '\n')

  for (const c of changes.slice(0, 30)) {
    const bsDelta = countBackslashes(c.before) - countBackslashes(c.after)
    const tag = bsDelta > 0 ? `${DIM}（-${bsDelta}\\）${RESET} ` : ''
    console.log(`  ${DIM}第 ${c.line} 行${RESET} ${tag}`)
    console.log(`  ${formatChangeSnippet(c.before, c.after)}`)
  }

  if (changes.length > 30) {
    console.log(`${DIM}  … 还有 ${changes.length - 30} 行未展示${RESET}`)
  }
  console.log()
}

/** clack 环境下用纯文本 diff（无 ANSI 时仍可读） */
export function formatPlainChangeSummary(c: PreprocessChange): string[] {
  const bsDelta = countBackslashes(c.before) - countBackslashes(c.after)
  const tag = bsDelta > 0 ? ` (-${bsDelta}\\)` : ''
  return [
    `  第 ${c.line} 行${tag}`,
    `    - ${truncate(highlightBackslashes(c.before, ''))}`,
    `    + ${truncate(c.after)}`,
  ]
}
