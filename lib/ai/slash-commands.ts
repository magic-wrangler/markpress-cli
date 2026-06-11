import { MODEL_COMMANDS } from './model-manager.ts'

export interface SlashCommand {
  slash: string
  command: string
  desc: string
}

/** 菜单展示项（精简，无中英文重复） */
const SLASH_MENU: SlashCommand[] = [
  { slash: '/list', command: MODEL_COMMANDS.list.en, desc: '模型列表' },
  { slash: '/add', command: MODEL_COMMANDS.add.en, desc: '新增模型' },
  { slash: '/switch', command: MODEL_COMMANDS.switch.en, desc: '切换模型' },
  { slash: '/delete', command: MODEL_COMMANDS.delete.en, desc: '删除模型' },
  { slash: '/use1', command: `${MODEL_COMMANDS.use.zh}1`, desc: '按序号切换' },
  { slash: '/配置', command: '配置', desc: 'API 设置' },
  { slash: '/保存', command: '保存', desc: '保存主题' },
  { slash: '/内置主题', command: '内置主题', desc: '内置主题' },
  { slash: '/帮我转换', command: '帮我转换', desc: '转换向导' },
]

/** 含中文别名，供 Tab 补全与解析 */
export const SLASH_COMMANDS: SlashCommand[] = [
  ...SLASH_MENU,
  { slash: '/model', command: MODEL_COMMANDS.list.en, desc: '模型列表' },
  { slash: '/models', command: MODEL_COMMANDS.list.en, desc: '模型列表' },
  { slash: '/模型列表', command: MODEL_COMMANDS.list.zh, desc: '模型列表' },
  { slash: '/模型新增', command: MODEL_COMMANDS.add.zh, desc: '新增模型' },
  { slash: '/模型修改', command: MODEL_COMMANDS.switch.zh, desc: '切换模型' },
  { slash: '/模型删除', command: MODEL_COMMANDS.delete.zh, desc: '删除模型' },
  { slash: '/模型帮助', command: MODEL_COMMANDS.help.zh, desc: '命令帮助' },
  { slash: '/help', command: MODEL_COMMANDS.help.en, desc: '命令帮助' },
  { slash: '/如何转换', command: '如何转换', desc: '转换说明' },
]

const SLASH_MAP = new Map(SLASH_COMMANDS.map((c) => [c.slash.toLowerCase(), c.command]))

export function resolveSlashInput(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('/')) return trimmed
  if (trimmed === '/') return null

  const lower = trimmed.toLowerCase()

  const useMatch = /^\/use(\d+)$/i.exec(lower)
  if (useMatch) {
    return `${MODEL_COMMANDS.use.zh}${useMatch[1]}`
  }

  const mapped = SLASH_MAP.get(lower)
  if (mapped) return mapped

  return trimmed.slice(1).trim() || null
}
