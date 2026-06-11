import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, resolve, basename, dirname } from 'node:path'
import { getPackageRoot } from './theme-resolver.ts'

export interface BuiltinTemplate {
  id: string
  fileName: string
  label: string
  description: string
  filePath: string
}

export const DEFAULT_TEMPLATE_ID = '转换模板'

function getTemplatesDir(): string {
  return join(getPackageRoot(), 'templates')
}

export function listBuiltinTemplates(): BuiltinTemplate[] {
  const dir = getTemplatesDir()
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map((fileName) => {
      const id = basename(fileName, '.md')
      return {
        id,
        fileName,
        label: id === DEFAULT_TEMPLATE_ID ? '基础转换模板' : id,
        description:
          id === DEFAULT_TEMPLATE_ID
            ? '含标题层级、表格、代码块等示例，复制后按需修改'
            : '内置 Markdown 模板',
        filePath: join(dir, fileName),
      }
    })
}

export function findBuiltinTemplate(id: string): BuiltinTemplate | undefined {
  return listBuiltinTemplates().find((t) => t.id === id)
}

export function copyBuiltinTemplate(
  templateId: string,
  destPath: string
): { srcPath: string; destPath: string } {
  const tpl =
    findBuiltinTemplate(templateId) ?? findBuiltinTemplate(DEFAULT_TEMPLATE_ID)
  if (!tpl) {
    throw new Error('未找到内置转换模板（templates/ 目录缺失）')
  }

  const out = resolve(destPath)
  mkdirSync(dirname(out), { recursive: true })
  copyFileSync(tpl.filePath, out)
  return { srcPath: tpl.filePath, destPath: out }
}
