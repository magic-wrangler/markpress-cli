import { parseConvertArgs, type ConvertArgs } from './parse-args.ts'

/** 解析引号内的参数 token */
function tokenizeArgv(input: string): string[] {
  const tokens: string[] = []
  let cur = ''
  let inQuote: '"' | "'" | null = null

  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (inQuote) {
      if (c === inQuote) {
        inQuote = null
        tokens.push(cur)
        cur = ''
      } else {
        cur += c
      }
    } else if (c === '"' || c === "'") {
      inQuote = c
    } else if (/\s/.test(c)) {
      if (cur) {
        tokens.push(cur)
        cur = ''
      }
    } else {
      cur += c
    }
  }

  if (cur) tokens.push(cur)
  return tokens
}

/**
 * 识别 AI 对话中的 convert 命令，支持：
 *   mpr convert --md a.md --theme t.json
 *   markpress convert ...
 *   convert --md a.md --theme t.json
 */
export function tryParseInlineConvert(input: string): ConvertArgs | null {
  const trimmed = input.trim()
  if (!/--md\b/.test(trimmed) || !/--theme\b/.test(trimmed)) return null

  const stripped = trimmed.replace(/^(?:(?:mpr|markpress)\s+)?/i, '')
  if (!/^convert\b/i.test(stripped)) return null

  const flagArgs = tokenizeArgv(stripped.replace(/^convert\s+/i, ''))
  const args = parseConvertArgs(flagArgs)

  if (!args.md || !args.theme) return null
  return args
}
