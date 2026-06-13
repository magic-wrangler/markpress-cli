import { resolveDeepSeekConfig } from './ai/config.ts'
import { loadAiConfigFile } from './ai/user-config.ts'

export interface ConvertAiFixResolveOptions {
  /** `--ai-fix` 显式开启（即使全局关闭也开启） */
  aiFix?: boolean
  /** `--no-ai-fix` 显式关闭 */
  noAiFix?: boolean
}

/**
 * 转换时是否调用 AI 修复 Markdown
 *
 * 默认：已配置 DeepSeek 时 **自动开启**；无 API 时仅规则预处理。
 * 关闭：`--no-ai-fix` 或 `MARKPRESS_CONVERT_NO_AI_FIX=1` 或 ai-config `convertAutoAiFix: false`
 */
export function shouldAiFixOnConvert(opts: ConvertAiFixResolveOptions = {}): boolean {
  if (opts.noAiFix || process.env.MARKPRESS_CONVERT_NO_AI_FIX === '1') {
    return false
  }
  if (!resolveDeepSeekConfig()) {
    return false
  }
  if (opts.aiFix === true || process.env.MARKPRESS_CONVERT_AI_FIX === '1') {
    return true
  }
  if (opts.aiFix === false) {
    return false
  }
  const file = loadAiConfigFile()
  if (file?.convertAutoAiFix === false) {
    return false
  }
  return true
}

export function describeConvertAiFixStatus(opts: ConvertAiFixResolveOptions = {}): string | null {
  if (!shouldAiFixOnConvert(opts)) {
    if (resolveDeepSeekConfig() && (opts.noAiFix || process.env.MARKPRESS_CONVERT_NO_AI_FIX === '1')) {
      return '转换时将跳过 AI 修复（仅规则预处理）'
    }
    return null
  }
  return '转换时将自动 AI 修复 Markdown（可用 --no-ai-fix 关闭）'
}
