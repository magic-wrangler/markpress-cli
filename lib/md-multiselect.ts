import * as p from '@clack/prompts'

/** 列表预览默认最多展示行数，超出部分折叠 */
const DEFAULT_PREVIEW_LIMIT = 20

export interface PromptMarkdownMultiselectOptions {
  /** 手动多选时的提示语 */
  message?: string
  /** 无文件时的提示 */
  emptyMessage?: string
  /** 选择前预览列表最多展示几条（默认 20） */
  previewLimit?: number
}

/** 生成带序号的文件列表预览（可折叠） */
export function formatMarkdownFileListPreview(
  files: string[],
  limit = DEFAULT_PREVIEW_LIMIT
): { text: string; truncated: boolean; hiddenCount: number } {
  if (files.length === 0) {
    return { text: '（无）', truncated: false, hiddenCount: 0 }
  }

  const show = files.length <= limit ? files.length : Math.min(limit, files.length)
  const visible = files.slice(0, show)
  const lines = visible.map((name, i) => `${String(i + 1).padStart(2, ' ')}. ${name}`)
  const hiddenCount = files.length - visible.length

  if (hiddenCount > 0) {
    lines.push(`    … 还有 ${hiddenCount} 个（选「手动多选」可浏览并勾选全部）`)
  }

  return { text: lines.join('\n'), truncated: hiddenCount > 0, hiddenCount }
}

function printFullFileList(files: string[]): void {
  const body = files.map((name, i) => `${String(i + 1).padStart(2, ' ')}. ${name}`).join('\n')
  p.note(body, `全部 ${files.length} 个 Markdown`)
}

/**
 * 选择 Markdown 文件：多文件时先展示名单，再问「全选 / 手动多选」
 */
export async function promptMarkdownMultiselect(
  candidates: string[],
  opts: PromptMarkdownMultiselectOptions = {}
): Promise<string[] | null> {
  if (candidates.length === 0) {
    p.log.warn(opts.emptyMessage ?? '没有可选的 Markdown 文件')
    return null
  }

  if (candidates.length === 1) {
    p.log.info(`文档：${candidates[0]}`)
    return candidates
  }

  const limit = opts.previewLimit ?? DEFAULT_PREVIEW_LIMIT
  const preview = formatMarkdownFileListPreview(candidates, limit)
  p.note(preview.text, `共 ${candidates.length} 个 Markdown`)

  const selectOptions: Array<{ value: string; label: string; hint?: string }> = [
    {
      value: 'all',
      label: `全选（${candidates.length} 个）`,
      hint: preview.truncated
        ? `含 ${preview.hiddenCount} 个未在上方展开的文件`
        : '批量转换 / 修复',
    },
    {
      value: 'pick',
      label: '手动多选…',
      hint: '空格切换，Enter 确认',
    },
  ]

  if (preview.truncated) {
    selectOptions.push({
      value: 'list',
      label: '查看完整名单',
      hint: '展开全部文件名后再选择',
    })
  }

  while (true) {
    const mode = await p.select({
      message: '如何选择？',
      options: selectOptions,
    })
    if (p.isCancel(mode)) {
      p.cancel('已取消')
      return null
    }

    if (mode === 'list') {
      printFullFileList(candidates)
      continue
    }

    if (mode === 'all') {
      p.log.info(`已全选 ${candidates.length} 个：${summarizeNames(candidates)}`)
      return [...candidates]
    }

    const selected = await p.multiselect({
      message: opts.message ?? '选择 Markdown（空格多选，Enter 确认）',
      options: candidates.map((name) => ({ value: name, label: name })),
      required: true,
    })
    if (p.isCancel(selected)) {
      p.cancel('已取消')
      return null
    }

    return selected as string[]
  }
}

/** 日志摘要：前 3 个文件名 + 剩余数量 */
function summarizeNames(files: string[]): string {
  if (files.length <= 3) return files.join('、')
  return `${files.slice(0, 3).join('、')} 等 ${files.length} 个`
}
