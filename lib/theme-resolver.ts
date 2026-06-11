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
  aliases?: string[]
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

function manifestEntryMatchesId(entry: ThemeManifestEntry, themeId: string): boolean {
  if (entry.id === themeId) return true
  return entry.aliases?.includes(themeId) ?? false
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

function findManifestEntry(themeId: string): ThemeManifestEntry | undefined {
  return loadManifest().find((entry) => manifestEntryMatchesId(entry, themeId))
}

/** 将主题 id 或别名解析为 manifest 中的 canonical id */
export function resolveBuiltinThemeId(name: string): string | null {
  return findManifestEntry(name)?.id ?? null
}

export function listManifestThemeLookup(): { id: string; names: string[] }[] {
  const themesDir = join(getPackageRoot(), 'themes')
  return loadManifest()
    .filter((entry) => existsSync(join(themesDir, `${entry.id}.json`)))
    .map((entry) => ({
      id: entry.id,
      names: [entry.id, ...(entry.aliases ?? [])],
    }))
}

function findBuiltinById(id: string): BuiltinTheme | undefined {
  const entry = findManifestEntry(id)
  if (!entry) return undefined
  const filePath = join(getPackageRoot(), 'themes', `${entry.id}.json`)
  if (!existsSync(filePath)) return undefined
  return {
    id: entry.id,
    label: entry.label,
    description: entry.description,
    filePath,
  }
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
  if (
    builtin &&
    (trimmed === id ||
      trimmed === `builtin:${id}` ||
      trimmed === builtin.id ||
      trimmed === `builtin:${builtin.id}`)
  ) {
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
