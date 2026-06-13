import { listBuiltinThemes } from '../theme-resolver.ts'
import { formatModelsListReply, formatModelCommandsHelp } from './model-manager.ts'

/** 识别「查看内置主题」类问题，本地回答，不走 AI */
export function isBuiltinThemesQuery(text: string): boolean {
  const t = normalizeQuery(text)
  if (!t) return false

  const patterns = [
    /^内置主题$/,
    /内置主题/,
    /有什么主题/,
    /有哪些主题/,
    /列出.*主题/,
    /主题列表/,
    /themes\s+list$/i,
    /^list\s+themes$/i,
  ]

  return patterns.some((p) => p.test(t))
}

/** 识别「如何转换 / 怎么用」类问题（疑问句 → 说明，不启动向导） */
export function isConvertHelpQuery(text: string): boolean {
  const t = normalizeQuery(text)
  if (!t) return false

  const patterns = [
    /如何转换/,
    /怎么转换/,
    /怎样转换/,
    /如何转成/,
    /怎么转成/,
    /怎么生成\s*html/i,
    /如何生成\s*html/i,
    /convert.*怎么用/i,
    /怎么用.*convert/i,
    /^怎么用$/,
    /^如何使用$/,
    /^怎么使用$/,
    /使用说明/,
    /^帮助$/,
    /^help$/i,
  ]

  return patterns.some((p) => p.test(t))
}

function normalizeQuery(text: string): string {
  return text
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[？?！!。.\s]+$/g, '')
}

export function formatBuiltinThemesReply(): string {
  const themes = listBuiltinThemes()
  if (themes.length === 0) {
    return '当前没有可用的内置主题。'
  }

  const lines = ['Markpress 内置主题：', '']
  for (const t of themes) {
    lines.push(`· ${t.id}`)
    lines.push(`  ${t.label}`)
    lines.push(`  ${t.description}`)
    lines.push(`  试用：convert --md 协议.md --theme ${t.id}`)
    lines.push('')
  }
  lines.push('描述风格可让 AI 以内置主题为基准生成自定义 JSON；输入「保存」写入文件。')
  return lines.join('\n')
}

export function formatConvertHelpReply(): string {
  const themes = listBuiltinThemes().map((t) => t.id).join('、') || '有底色、无底色'

  return [
    'Markpress 转换 Markdown → 带样式 HTML：',
    '',
    '1. 交互转换（推荐）',
    '   mpr',
    '   → 选择主题 → 多选 .md 文件 → 输出到 ./output/',
    '',
    '2. 命令行转换',
    '   mpr convert --md 协议.md --theme 有底色 --out output/协议.html',
    '',
    '3. 使用 AI 生成的主题',
    '   mpr convert --md 协议.md --theme ./我的主题.json',
    '',
    '4. 在本对话中直接说（不必固定「帮我转换」）',
    '   转换 · 转成 html · 生成 html · @ · 帮我转换',
    '   或粘贴：convert --md 协议.md --theme ./我的主题.json',
    '',
    `内置主题可直接使用：${themes}`,
    '输入「内置主题」查看详情；描述风格可 AI 生成新主题。',
  ].join('\n')
}

export type MarkdownFixMode = 'check' | 'fix'

/** 识别「检查 / 修复 Markdown」类请求 */
export function parseMarkdownFixQuery(text: string): MarkdownFixMode | null {
  const t = normalizeQuery(text)
  if (!t) return null

  const fixPatterns = [
    /^修复$/,
    /^fix$/i,
    /修复.*(?:md|markdown|文档|格式|语法)/i,
    /帮我修复/,
    /帮忙修复/,
    /请修复/,
    /fix\s+(?:md|markdown)/i,
  ]

  const checkPatterns = [
    /^检查$/,
    /^check$/i,
    /检查.*(?:md|markdown|文档|格式|语法)/i,
    /帮我检查/,
    /看看.*(?:md|markdown|文档)/,
    /check\s+(?:md|markdown)/i,
  ]

  if (fixPatterns.some((p) => p.test(t))) return 'fix'
  if (checkPatterns.some((p) => p.test(t))) return 'check'
  return null
}

export function isMarkdownFixQuery(text: string): boolean {
  return parseMarkdownFixQuery(text) !== null
}

/** 识别「开始转换」类请求，走本地向导（说法灵活，不必固定「帮我转换」） */
export function isConvertRequestQuery(text: string): boolean {
  const t = normalizeQuery(text)
  if (!t) return false

  // 疑问句留给「如何转换」说明
  if (/^(如何|怎么|怎样|为何|为什么)/.test(t)) return false

  const patterns = [
    /^convert$/i,
    /^转换$/,
    /^转$/,
    /帮我转换/,
    /帮忙转换/,
    /帮我转/,
    /帮忙转/,
    /我要转换/,
    /我要转/,
    /我想转换/,
    /我想转/,
    /请转换/,
    /请转/,
    /转换一下/,
    /转一下/,
    /能帮我转/,
    /可以帮我转/,
    /请帮我转/,
    /^转换吧$/,
    /^开始转换/,
    /^去转换/,
    /^现在转换/,
    /转成\s*html/i,
    /转换\s*成\s*html/i,
    /生成\s*html/i,
    /导出\s*html/i,
    /出\s*html/i,
    /转\s*html/i,
    /转换\s*(?:md|markdown|文档|文件)/i,
    /(?:md|markdown|文档|文件)\s*转(?:换|成|为)?/i,
    /批量转换/,
    /全部转换/,
  ]

  return patterns.some((p) => p.test(t))
}

/** 是否为纯信息/操作查询（不走 AI 或不应要求 JSON） */
export function isInfoQuery(text: string): boolean {
  return (
    isBuiltinThemesQuery(text) ||
    isConvertHelpQuery(text) ||
    isConvertRequestQuery(text) ||
    isMarkdownFixQuery(text) ||
    parseModelManageQuery(text) !== null
  )
}

/** 识别模型管理指令（指定命令见 MODEL_COMMANDS） */
export function parseModelManageQuery(
  text: string
): 'list' | 'add' | 'switch' | 'delete' | 'menu' | 'help' | null {
  const t = normalizeQuery(text).toLowerCase()

  if (/^(配置|config|设置)$/.test(t)) return 'menu'

  const patterns: Array<{ re: RegExp; action: 'list' | 'add' | 'switch' | 'delete' | 'help' }> = [
    // 指定命令（推荐）
    { re: /^模型列表$/, action: 'list' },
    { re: /^模型新增$/, action: 'add' },
    { re: /^模型修改$/, action: 'switch' },
    { re: /^模型删除$/, action: 'delete' },
    { re: /^模型帮助$/, action: 'help' },
    { re: /^model\s+list$/i, action: 'list' },
    { re: /^model\s+add$/i, action: 'add' },
    { re: /^model\s+switch$/i, action: 'switch' },
    { re: /^model\s+delete$/i, action: 'delete' },
    { re: /^model\s+help$/i, action: 'help' },
    // 兼容别名
    { re: /^(查看模型|当前模型|models?)$/, action: 'list' },
    { re: /^模型$/, action: 'list' },
    { re: /^(新增|添加)\s*模型$/, action: 'add' },
    { re: /^(修改|切换|更换)\s*模型$/, action: 'switch' },
    { re: /^(删除|移除)\s*模型$/, action: 'delete' },
  ]

  for (const { re, action } of patterns) {
    if (re.test(t)) return action
  }

  return null
}

/** 本地可回答的信息类问题 */
export function tryLocalInfoReply(text: string): string | null {
  if (isBuiltinThemesQuery(text)) return formatBuiltinThemesReply()
  if (isConvertHelpQuery(text)) return formatConvertHelpReply()
  const modelAction = parseModelManageQuery(text)
  if (modelAction === 'list') return formatModelsListReply()
  if (modelAction === 'help') return formatModelCommandsHelp()
  return null
}
