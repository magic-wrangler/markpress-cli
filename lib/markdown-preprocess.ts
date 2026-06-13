/**
 * 转换前 Markdown 规范化（规则引擎，不调用 AI）
 *
 * 修复 marked 无法正确解析的常见写法，尤其是：
 * - ATX 标题 # 后缺少空格：`#1212` → `# 1212`、`\##标题` → `## 标题`
 * - 行首被错误转义：`\# 标题` → `# 标题`
 * - 行内 AI 误转义：`\*\*bold\*\*`、`{win\_score}` 等
 * - 多余空行（列表项之间、连续 3+ 空行）与缺失空行（标题/段落与列表之间）
 */

function fixInlineEscapes(line: string): string {
  let fixed = line
  let prev = ''

  while (prev !== fixed) {
    prev = fixed
    fixed = fixed.replace(/\\\*\\\*/g, '**')
    fixed = fixed.replace(/\\([{}])/g, '$1')
    fixed = fixed.replace(/\\_/g, '_')
    fixed = fixed.replace(/\\([*`|[\]()#+.!-])/g, '$1')
    fixed = fixed.replace(/\\+(?=[*_`{|}[\]()#+.!-])/g, '')
  }

  return fixed
}

function fixMarkdownLine(line: string): string {
  let fixed = line

  // 行首：\##标题 → ## 标题
  fixed = fixed.replace(/^(\s*)\\(#{1,6})([^\s#\n].*)$/, '$1$2 $3')

  // 行首：\# / ##（后接空白或行尾）
  fixed = fixed.replace(/^(\s*)\\(#{1,6})(\s|$)/, '$1$2$3')

  // 行首：# 后紧跟非空白
  fixed = fixed.replace(/^(\s*)(#{1,6})([^\s#\n].*)$/, '$1$2 $3')

  fixed = fixed.replace(/^(\s*)\\([-*+])(\s)/, '$1$2$3')
  fixed = fixed.replace(/^(\s*)(\d+)\\\.(\s)/, '$1$2.$3')
  fixed = fixed.replace(/^(\s*)\\>(\s?)/, '$1>$2')

  fixed = fixInlineEscapes(fixed)

  return fixed
}

function isBlank(line: string): boolean {
  return line.trim() === ''
}

function isFenceDelimiter(line: string): boolean {
  return line.trimStart().startsWith('```')
}

function isListLine(line: string): boolean {
  return /^\s*(?:\d+\.|\*|\-|\+)\s/.test(line)
}

function isHeadingLine(line: string): boolean {
  return /^\s*#{1,6}\s/.test(line)
}

/** 两段内容之间是否应保留/插入一个空行 */
function needsBlankBetween(prev: string, next: string): boolean {
  if (isBlank(prev) || isBlank(next)) return false
  if (isListLine(prev) && isListLine(next)) return false
  if (isHeadingLine(prev)) return true
  if (isListLine(next) && !isListLine(prev)) return true
  if (isListLine(prev) && !isListLine(next)) return true
  if (isHeadingLine(next)) return true
  if (!isListLine(prev) && !isHeadingLine(prev) && !isListLine(next) && !isHeadingLine(next)) {
    return true
  }
  return false
}

/** 折叠多余空行，补齐块级结构之间缺失的空行 */
export function normalizeBlankLines(lines: string[]): string[] {
  const fixed: string[] = []
  let inFence = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (isFenceDelimiter(line)) {
      inFence = !inFence
      fixed.push(line)
      continue
    }

    if (inFence) {
      fixed.push(line)
      continue
    }

    if (isBlank(line)) {
      let j = i + 1
      while (j < lines.length && isBlank(lines[j]) && !isFenceDelimiter(lines[j])) j++

      const prev = fixed.length > 0 ? fixed[fixed.length - 1]! : ''
      const next = j < lines.length ? lines[j]! : ''

      // 列表项之间不要空行
      if (isListLine(prev) && isListLine(next)) {
        i = j - 1
        continue
      }

      // 已有空行则不再追加（合并连续空行）
      if (fixed.length > 0 && isBlank(fixed[fixed.length - 1]!)) {
        i = j - 1
        continue
      }

      if (prev && next && needsBlankBetween(prev, next)) {
        fixed.push('')
      }

      i = j - 1
      continue
    }

    const prev = fixed.length > 0 ? fixed[fixed.length - 1]! : ''
    if (prev && !isBlank(prev) && needsBlankBetween(prev, line)) {
      fixed.push('')
    }

    fixed.push(line)
  }

  while (fixed.length > 0 && isBlank(fixed[fixed.length - 1]!)) {
    fixed.pop()
  }

  return fixed
}

function processLines(lines: string[]): string[] {
  const out: string[] = []
  let inFence = false

  for (const line of lines) {
    if (isFenceDelimiter(line)) {
      inFence = !inFence
      out.push(line)
      continue
    }
    out.push(inFence ? line : fixMarkdownLine(line))
  }

  return normalizeBlankLines(out)
}

export function preprocessMarkdown(source: string): string {
  return processLines(source.split(/\r?\n/)).join('\n')
}

export interface PreprocessChange {
  line: number
  before: string
  after: string
}

export function diffPreprocessMarkdown(source: string): {
  text: string
  changes: PreprocessChange[]
} {
  const beforeLines = source.split(/\r?\n/)
  const afterLines = processLines(beforeLines)
  const changes: PreprocessChange[] = []
  const max = Math.max(beforeLines.length, afterLines.length)

  for (let i = 0; i < max; i++) {
    const before = beforeLines[i] ?? ''
    const after = afterLines[i] ?? ''
    if (before !== after) {
      changes.push({ line: i + 1, before, after })
    }
  }

  return { text: afterLines.join('\n'), changes }
}
