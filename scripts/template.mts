/**
 * 内置 Markdown 转换模板
 *
 *   mpr template              复制默认模板到当前目录
 *   mpr template list         列出内置模板
 *   mpr template copy [--out] 复制指定模板
 */

import { existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import * as p from '@clack/prompts'
import {
  copyBuiltinTemplate,
  DEFAULT_TEMPLATE_ID,
  findBuiltinTemplate,
  listBuiltinTemplates,
} from '../lib/builtin-templates.ts'

function parseTemplateArgs(argv: string[]): { id: string; out?: string } {
  let id = DEFAULT_TEMPLATE_ID
  let out: string | undefined

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--out' || arg === '-o') {
      out = argv[++i]
      continue
    }
    if (!arg.startsWith('-')) {
      id = arg.replace(/\.md$/i, '')
    }
  }

  return { id, out }
}

export function printTemplateHelp() {
  console.log(`用法:
  mpr template                    复制「转换模板.md」到当前目录
  mpr template list               列出内置模板
  mpr template copy [名称]        复制模板（默认：转换模板）
  mpr template copy --out 文档.md 指定输出文件名

示例:
  cd my-docs && mpr template
  mpr template copy --out 我的协议.md
`)
}

export function printTemplateList() {
  const templates = listBuiltinTemplates()
  if (templates.length === 0) {
    console.log('（无内置模板）')
    return
  }
  console.log('内置 Markdown 模板:\n')
  for (const t of templates) {
    console.log(`  ${t.id}`)
    console.log(`    ${t.label}`)
    console.log(`    ${t.description}`)
    console.log()
  }
  console.log('复制到当前目录: mpr template')
}

export async function runTemplateCopy(
  cwd: string,
  templateId: string,
  outFile?: string,
  interactive = true
): Promise<string | null> {
  const tpl = findBuiltinTemplate(templateId)
  if (!tpl) {
    const msg = `未找到模板「${templateId}」，可用 mpr template list 查看`
    if (interactive) p.log.error(msg)
    else console.error(msg)
    return null
  }

  const destName = outFile ?? tpl.fileName
  const destPath = resolve(cwd, destName)

  if (existsSync(destPath) && interactive) {
    const overwrite = await p.confirm({
      message: `${destName} 已存在，覆盖？`,
    })
    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel('已取消复制')
      return null
    }
  }

  copyBuiltinTemplate(templateId, destPath)
  return destPath
}

export async function runTemplateCli(argv: string[] = []): Promise<void> {
  const sub = argv[0]

  if (sub === '--help' || sub === '-h' || sub === 'help') {
    printTemplateHelp()
    return
  }

  if (sub === 'list') {
    printTemplateList()
    return
  }

  const cwd = process.cwd()
  const rest = sub === 'copy' ? argv.slice(1) : argv
  const { id, out } = parseTemplateArgs(rest)

  const destPath = await runTemplateCopy(cwd, id, out, true)
  if (!destPath) return

  p.log.success(`已复制 ${basename(destPath)}`)
  p.log.info(`路径：${destPath}`)
  p.log.info(`下一步：编辑后执行 mpr convert --md ${basename(destPath)} --theme 正式版`)
}
