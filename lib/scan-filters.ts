/** 交互扫描时排除的项目/工具元数据 Markdown（非待转换文档） */
const EXCLUDED_MARKDOWN_NAMES = new Set([
  'readme.md',
  'changelog.md',
  'contributing.md',
  'license.md',
  'progress.md',
  'progress.archive.md',
  'claude.md',
  'skill.md',
])

/** 是否为用户待转换的 Markdown 文档 */
export function isContentMarkdown(filename: string): boolean {
  if (!filename.toLowerCase().endsWith('.md')) return false
  if (filename.startsWith('.')) return false
  return !EXCLUDED_MARKDOWN_NAMES.has(filename.toLowerCase())
}
