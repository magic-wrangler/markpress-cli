import { existsSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { isContentMarkdown } from './scan-filters.ts'

/** 相对 cwd 额外扫描的用户文档子目录（不含 npm 包内 templates/） */
const MD_USER_SUBDIRS = ['docs', 'examples'] as const

export interface ScannedMdFile {
  /** 相对 cwd 的路径，供 convert --md 使用 */
  relativePath: string
  absPath: string
}

function normalizeRelPath(cwd: string, absPath: string): string {
  return relative(cwd, absPath).replace(/\\/g, '/')
}

/** 非用户文档目录，@ 与交互转换均跳过 */
export function shouldExcludeMdPath(relativePath: string): boolean {
  const n = relativePath.replace(/\\/g, '/').toLowerCase()
  if (n === 'knowledge' || n.startsWith('knowledge/')) return true
  if (n.includes('/knowledge/')) return true
  if (n.startsWith('.cursor/') || n.includes('/.cursor/')) return true
  if (n.startsWith('.claude/') || n.includes('/.claude/')) return true
  return false
}

export function getDocumentSearchRoots(cwd: string): string[] {
  const roots: string[] = [resolve(cwd)]
  const envInput = process.env.MARKPRESS_INPUT ?? process.env.MARKPRESS_EXAMPLES
  if (envInput) {
    roots.push(resolve(envInput))
  }
  for (const sub of MD_USER_SUBDIRS) {
    roots.push(resolve(cwd, sub))
  }
  return [...new Set(roots)].filter((d) => existsSync(d))
}

/** 当前工作区是否已有用户 Markdown（不含内置 templates/） */
export function hasUserMarkdown(cwd: string): boolean {
  return scanMarkdownDocuments(cwd).length > 0
}

/** 扫描用户可转换 Markdown：当前目录 + MARKPRESS_INPUT + docs/ 等（不含内置 templates/） */
export function scanMarkdownDocuments(cwd: string): ScannedMdFile[] {
  const base = resolve(cwd)
  const seen = new Set<string>()
  const results: ScannedMdFile[] = []

  for (const root of getDocumentSearchRoots(base)) {
    let entries: string[]
    try {
      entries = readdirSync(root)
    } catch {
      continue
    }

    for (const name of entries) {
      if (!isContentMarkdown(name)) continue
      const absPath = join(root, name)
      const rel = normalizeRelPath(base, absPath)
      if (shouldExcludeMdPath(rel)) continue
      if (seen.has(rel)) continue
      seen.add(rel)
      results.push({ relativePath: rel, absPath })
    }
  }

  return results.sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath, 'zh-CN')
  )
}

export function formatDocumentSearchHint(cwd: string): string {
  const roots = getDocumentSearchRoots(cwd)
  const dirs = roots.map((d) => relative(cwd, d) || '.').join('、')
  return `已扫描：${dirs}（用户文档；内置模板需通过 @ 或 mpr template 复制）`
}
