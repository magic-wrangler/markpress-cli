import { readFileSync } from 'node:fs'
import { listBuiltinThemes, resolveBuiltinThemeId, listManifestThemeLookup } from '../theme-resolver.ts'
import type { StyleConfig } from '../markdown-styles.ts'
import { validateStyleConfigObject } from '../convert-core.ts'

export const DEFAULT_BASE_THEME_ID = '正式版'

/** 除默认外可切换的内置主题 id 列表 */
export function getAlternateBaseThemeIds(): string[] {
  return listBuiltinThemes()
    .map((t) => t.id)
    .filter((id) => id !== DEFAULT_BASE_THEME_ID)
}

/** CLI / AI 提示：默认基准与切换说法 */
export function formatBaseThemeSwitchHint(): string {
  const alts = getAlternateBaseThemeIds()
  if (alts.length === 0) {
    return `默认以内置主题「${DEFAULT_BASE_THEME_ID}」为基准生成`
  }
  const examples = alts.map((id) => `「基于${id}」`).join('、')
  return `默认以内置主题「${DEFAULT_BASE_THEME_ID}」为基准生成，可说 ${examples} 换基准`
}

/** 读取内置主题完整 JSON */
export function loadBuiltinThemeConfig(id: string): StyleConfig | null {
  const canonicalId = resolveBuiltinThemeId(id) ?? id
  const theme = listBuiltinThemes().find((t) => t.id === canonicalId)
  if (!theme) return null
  try {
    const parsed = JSON.parse(readFileSync(theme.filePath, 'utf-8')) as unknown
    return validateStyleConfigObject(parsed) ? (parsed as StyleConfig) : null
  } catch {
    return null
  }
}

/** 从用户输入识别基准主题，如「基于无底色」「基于RULE_蓝色底」 */
export function detectBaseThemeId(text: string): string | null {
  for (const { id, names } of listManifestThemeLookup()) {
    for (const name of names) {
      const patterns = [
        new RegExp(`基于${name}`),
        new RegExp(`参考${name}`),
        new RegExp(`以${name}为基准`),
        new RegExp(`用${name}`),
      ]
      if (patterns.some((p) => p.test(text))) return id
    }
  }
  return null
}

function formatThemeBlock(theme: BuiltinTheme): string {
  const raw = readFileSync(theme.filePath, 'utf-8').trim()
  return `### 「${theme.id}」— ${theme.label}\n${theme.description}\n\n\`\`\`json\n${raw}\n\`\`\``
}

/** 将全部内置主题完整 JSON 嵌入 prompt */
export function buildBuiltinThemesContext(): string {
  const themes = listBuiltinThemes()
  if (themes.length === 0) return '（当前无内置主题文件）'
  return themes.map(formatThemeBlock).join('\n\n')
}

export function getBaseThemeIdForSession(explicit?: string): string {
  if (explicit && loadBuiltinThemeConfig(explicit)) return explicit
  if (loadBuiltinThemeConfig(DEFAULT_BASE_THEME_ID)) return DEFAULT_BASE_THEME_ID
  return listBuiltinThemes()[0]?.id ?? DEFAULT_BASE_THEME_ID
}
