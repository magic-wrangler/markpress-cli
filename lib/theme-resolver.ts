import { readFileSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface BuiltinTheme {
  id: string
  label: string
  description: string
  filePath: string
}

interface ThemeManifestEntry {
  id: string
  label: string
  description: string
}

let cachedPackageRoot: string | null = null

/** npm 包根目录（含 themes/）；开发时 tsx 与发布后 dist/cli.mjs 均适用 */
export function getPackageRoot(): string {
  if (cachedPackageRoot) return cachedPackageRoot
  const selfDir = dirname(fileURLToPath(import.meta.url))
  // lib/ 或 dist/ 的上一级即为包根
  cachedPackageRoot = join(selfDir, '..')
  return cachedPackageRoot
}

function loadManifest(): ThemeManifestEntry[] {
  const manifestPath = join(getPackageRoot(), 'themes', 'manifest.json')
  if (!existsSync(manifestPath)) return []
  return JSON.parse(readFileSync(manifestPath, 'utf-8')) as ThemeManifestEntry[]
}

export function listBuiltinThemes(): BuiltinTheme[] {
  const themesDir = join(getPackageRoot(), 'themes')
  return loadManifest()
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      description: entry.description,
      filePath: join(themesDir, `${entry.id}.json`),
    }))
    .filter((t) => existsSync(t.filePath))
}

function findBuiltinById(id: string): BuiltinTheme | undefined {
  return listBuiltinThemes().find((t) => t.id === id)
}

/**
 * 解析主题参数：
 * - `有底色` / `builtin:有底色` → 内置主题
 * - `./x.json` / 绝对路径 → 本地文件
 * - 否则尝试 cwd 下 `themeArg.json`，再尝试内置 id
 */
export function resolveThemePath(themeArg: string, cwd = process.cwd()): string {
  const trimmed = themeArg.trim()
  if (!trimmed) {
    throw new Error('主题参数不能为空')
  }

  let id = trimmed
  if (trimmed.startsWith('builtin:')) {
    id = trimmed.slice('builtin:'.length)
  }

  const builtin = findBuiltinById(id)
  if (builtin && (trimmed === id || trimmed === `builtin:${id}`)) {
    return builtin.filePath
  }

  if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.endsWith('.json')) {
    const abs = resolve(cwd, trimmed)
    if (!existsSync(abs)) {
      throw new Error(`主题文件不存在：${abs}`)
    }
    return abs
  }

  const localJson = resolve(cwd, `${trimmed}.json`)
  if (existsSync(localJson)) {
    return localJson
  }

  const fallbackBuiltin = findBuiltinById(trimmed)
  if (fallbackBuiltin) {
    return fallbackBuiltin.filePath
  }

  throw new Error(
    `无法解析主题「${themeArg}」。可用内置：${listBuiltinThemes().map((t) => t.id).join('、') || '无'}；或提供 .json 路径`
  )
}
