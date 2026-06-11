import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { getPackageRoot } from '../theme-resolver.ts'

/** 知识库目录：优先 MARKPRESS_KNOWLEDGE_DIR，否则包内 knowledge/ */
export function getKnowledgeDir(): string {
  const envDir = process.env.MARKPRESS_KNOWLEDGE_DIR?.trim()
  if (envDir && existsSync(envDir)) {
    return resolve(envDir)
  }
  return join(getPackageRoot(), 'knowledge')
}

/**
 * 读取 knowledge/*.md，按文件名排序拼接
 * 每次调用重新读取，编辑 MD 后新开对话即可生效
 */
export function loadKnowledgeMarkdown(): string {
  const dir = getKnowledgeDir()
  if (!existsSync(dir)) {
    return ''
  }

  const files = readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))

  const sections: string[] = []

  for (const name of files) {
    const filePath = join(dir, name)
    if (!statSync(filePath).isFile()) continue

    const content = readFileSync(filePath, 'utf-8').trim()
    if (content) {
      sections.push(content)
    }
  }

  return sections.join('\n\n---\n\n')
}

export function getKnowledgeSourceHint(): string {
  const dir = getKnowledgeDir()
  const count = existsSync(dir)
    ? readdirSync(dir).filter((n) => n.toLowerCase().endsWith('.md')).length
    : 0
  return count > 0 ? `${dir}（${count} 个文件）` : '（未找到知识库）'
}
