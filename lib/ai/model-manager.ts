import * as p from '@clack/prompts'
import {
  DEFAULT_MODEL,
  getAiConfigPath,
  isDeprecatedModel,
  loadAiConfigFile,
  normalizeSavedModels,
  saveAiConfigFile,
  type DeepSeekFileConfig,
} from './user-config.ts'
import { promptPickModel } from './model-prompts.ts'
import { runAiConfigWizard, printCurrentAiConfig } from './setup.ts'

export type ModelManageAction = 'list' | 'add' | 'switch' | 'delete' | 'menu' | 'help'

/** mpr ai 对话内模型管理指定命令（中英文均可） */
export const MODEL_COMMANDS = {
  list: { zh: '模型列表', en: 'model list' },
  add: { zh: '模型新增', en: 'model add' },
  switch: { zh: '模型修改', en: 'model switch' },
  delete: { zh: '模型删除', en: 'model delete' },
  use: { zh: '模型使用', en: 'model use' },
  help: { zh: '模型帮助', en: 'model help' },
} as const

export function formatModelCommandsHelp(): string {
  return [
    '模型列表 · 模型新增 · 模型修改 · 模型删除',
    '模型使用1 / 模型使用2 … 快速切换 · 配置：完整 API 设置',
  ].join('\n')
}

function requireFileConfig(): DeepSeekFileConfig | null {
  const file = loadAiConfigFile()
  if (!file?.deepseek.apiKey) {
    p.log.warn('尚未保存配置文件。请先输入「配置」→「完整设置」，或运行 mpr ai config。')
    return null
  }
  return file.deepseek
}

function envModelOverrideHint(): void {
  if (process.env.DEEPSEEK_MODEL?.trim()) {
    p.log.warn(
      '检测到环境变量 DEEPSEEK_MODEL，实际调用以环境变量为准；切换配置文件中的模型后请取消该变量或同步修改。'
    )
  }
}

function persistConfig(config: DeepSeekFileConfig): DeepSeekFileConfig {
  const savedModels = normalizeSavedModels(config.model, config.savedModels)
  const next = { ...config, savedModels }
  saveAiConfigFile(next)
  return next
}

function getConfigOrNull(): DeepSeekFileConfig | null {
  return loadAiConfigFile()?.deepseek ?? null
}

function getModelList(config: DeepSeekFileConfig): string[] {
  return normalizeSavedModels(config.model, config.savedModels)
}

export function formatModelQuickSwitchHint(): string | null {
  const config = getConfigOrNull()
  if (!config) return null
  const list = getModelList(config)
  if (list.length <= 1) return null
  const parts = list.map((name, i) => (name === config.model ? `${i + 1}:${name}*` : `${i + 1}:${name}`))
  return `快速切换：${parts.join(' · ')}（输入 ${MODEL_COMMANDS.use.zh}1 或 ${MODEL_COMMANDS.use.en} 1）`
}

export function formatModelsListReply(): string {
  const config = getConfigOrNull()
  if (!config?.apiKey) {
    return [
      '尚未保存模型列表。',
      '',
      '请先输入「配置」完成首次设置。',
      '',
      formatModelCommandsHelp(),
    ].join('\n')
  }

  const list = getModelList(config)
  const lines = ['── 模型列表 ──', '']

  list.forEach((name, i) => {
    const current = name === config.model ? '  ← 当前' : ''
    const tag = isDeprecatedModel(name) ? '（将弃用）' : ''
    lines.push(`  ${i + 1}. ${name}${tag}${current}`)
  })

  if (list.length > 1) {
    const uses = list.map((_, i) => `模型使用${i + 1}`).join(' · ')
    lines.push('')
    lines.push(`切换：${uses}`)
  }
  lines.push('管理：模型新增 · 模型修改 · 模型删除')

  if (process.env.DEEPSEEK_MODEL?.trim()) {
    lines.push(`（环境变量 DEEPSEEK_MODEL 会覆盖当前配置）`)
  }

  return lines.join('\n')
}

export type QuickSwitchResult =
  | { ok: true; config: DeepSeekFileConfig; message: string }
  | { ok: false; message: string }

const MODEL_SUBCOMMAND_WORDS = new Set(['list', 'add', 'switch', 'delete', 'help', 'use'])

/** 解析快速切换：模型使用1、model use 1、切换 deepseek-v4-pro（不含 model list 等管理子命令） */
export function tryQuickModelSwitch(text: string): QuickSwitchResult | null {
  const raw = text.trim().replace(/[\u200B-\u200D\uFEFF]/g, '')
  let modelName: string | undefined

  // model list / model add 等管理子命令，不可当作切换目标
  const modelSub = /^model\s+(\w+)$/i.exec(raw)
  if (modelSub && MODEL_SUBCOMMAND_WORDS.has(modelSub[1].toLowerCase())) return null

  const byIndex = /^(?:模型使用|model\s+use|模型)\s*(\d+)$/i.exec(raw)
  if (byIndex) {
    const config = getConfigOrNull()
    if (!config?.apiKey) {
      return { ok: false, message: '尚未配置，请先输入「配置」完成设置。' }
    }
    const list = getModelList(config)
    const idx = parseInt(byIndex[1], 10)
    if (idx < 1 || idx > list.length) {
      return {
        ok: false,
        message: `无效序号，当前共 ${list.length} 个模型，请输入 ${MODEL_COMMANDS.use.zh}1–${MODEL_COMMANDS.use.zh}${list.length}。`,
      }
    }
    modelName = list[idx - 1]
  }

  const byName = /^(?:切换|use)\s+([\w.-]+)$/i.exec(raw)
  if (!modelName && byName) {
    const config = getConfigOrNull()
    if (!config?.apiKey) {
      return { ok: false, message: '尚未配置，请先输入「配置」完成设置。' }
    }
    const list = getModelList(config)
    const target = byName[1]
    if (MODEL_SUBCOMMAND_WORDS.has(target.toLowerCase())) return null
    if (list.includes(target)) {
      modelName = target
    } else {
      const fuzzy = list.find((m) => m.includes(target) || target.includes(m))
      if (!fuzzy) {
        return {
          ok: false,
          message: `「${target}」不在已保存列表中。输入「模型」查看，或「新增模型」添加。`,
        }
      }
      modelName = fuzzy
    }
  }

  if (!modelName) return null

  const config = getConfigOrNull()
  if (!config?.apiKey) {
    return { ok: false, message: '尚未配置，请先输入「配置」完成设置。' }
  }

  if (modelName === config.model) {
    return { ok: true, config, message: `当前已是「${modelName}」，无需切换。` }
  }

  const next = persistConfig({ ...config, model: modelName })
  if (isDeprecatedModel(modelName)) {
    return {
      ok: true,
      config: next,
      message: `已切换为「${modelName}」（该模型将于 2026/07/24 弃用）`,
    }
  }
  return { ok: true, config: next, message: `已切换为「${modelName}」` }
}

export async function runAddModel(): Promise<DeepSeekFileConfig | null> {
  const config = requireFileConfig()
  if (!config) return null

  p.intro('Markpress · 新增模型')

  const saved = new Set(normalizeSavedModels(config.model, config.savedModels))
  const picked = await promptPickModel('选择要新增的模型', config.model, saved)
  if (p.isCancel(picked)) {
    p.cancel('已取消')
    return null
  }

  const modelName = (picked as string).trim()
  if (saved.has(modelName)) {
    p.log.warn(`「${modelName}」已在列表中`)
    p.outro('')
    return config
  }

  const setActive = await p.confirm({
    message: `将「${modelName}」设为当前使用的模型？`,
    initialValue: false,
  })
  if (p.isCancel(setActive)) {
    p.cancel('已取消')
    return null
  }

  const savedModels = [...saved, modelName]
  const next = persistConfig({
    ...config,
    model: setActive ? modelName : config.model,
    savedModels,
  })

  if (isDeprecatedModel(modelName)) {
    p.log.warn(`${modelName} 将于 2026/07/24 弃用，建议改用 deepseek-v4-flash 或 deepseek-v4-pro`)
  }

  envModelOverrideHint()
  p.log.success(`已新增「${modelName}」（列表共 ${savedModels.length} 个）`)
  if (setActive) p.log.info(`当前模型：${modelName}`)
  p.outro('完成')
  return next
}

export async function runSwitchModel(): Promise<DeepSeekFileConfig | null> {
  const config = requireFileConfig()
  if (!config) return null

  p.intro('Markpress · 切换模型')

  const list = getModelList(config)
  const picked = await p.select({
    message: '选择要使用的模型',
    initialValue: config.model,
    options: list.map((name, i) => ({
      value: name,
      label: `${i + 1}. ${name === config.model ? `${name}（当前）` : name}`,
      hint: isDeprecatedModel(name) ? '将于 2026/07/24 弃用' : undefined,
    })),
  })
  if (p.isCancel(picked)) {
    p.cancel('已取消')
    return null
  }

  const modelName = picked as string
  if (modelName === config.model) {
    p.log.info(`当前已是「${modelName}」`)
    p.outro('')
    return config
  }

  const next = persistConfig({ ...config, model: modelName })

  if (isDeprecatedModel(modelName)) {
    p.log.warn(`${modelName} 将于 2026/07/24 弃用，建议改用 deepseek-v4-flash 或 deepseek-v4-pro`)
  }

  envModelOverrideHint()
  p.log.success(`已切换为「${modelName}」`)
  p.outro('完成')
  return next
}

export async function runDeleteModel(): Promise<DeepSeekFileConfig | null> {
  const config = requireFileConfig()
  if (!config) return null

  p.intro('Markpress · 删除模型')

  const list = normalizeSavedModels(config.model, config.savedModels)
  if (list.length <= 1) {
    p.log.warn('至少需保留 1 个模型，无法删除')
    p.outro('')
    return config
  }

  const removable = list.filter((name) => name !== config.model)
  if (removable.length === 0) {
    p.log.warn(`「${config.model}」为当前模型，请先「切换模型」后再删除`)
    p.outro('')
    return config
  }

  const picked = await p.select({
    message: '选择要删除的模型（不含当前使用的）',
    options: removable.map((name) => ({ value: name, label: name })),
  })
  if (p.isCancel(picked)) {
    p.cancel('已取消')
    return null
  }

  const modelName = picked as string
  const confirm = await p.confirm({ message: `确定删除「${modelName}」？`, initialValue: false })
  if (p.isCancel(confirm) || !confirm) {
    p.cancel('已取消删除')
    return null
  }

  const savedModels = list.filter((name) => name !== modelName)
  const next = persistConfig({ ...config, savedModels })

  p.log.success(`已删除「${modelName}」`)
  p.outro('完成')
  return next
}

export async function runConfigMenu(): Promise<DeepSeekFileConfig | null> {
  const action = await p.select({
    message: '配置',
    options: [
      { value: 'full', label: '完整设置', hint: 'API 密钥、地址、temperature' },
      { value: 'list', label: '查看模型列表' },
      { value: 'add', label: '新增模型' },
      { value: 'switch', label: '切换模型', hint: '修改当前使用的模型' },
      { value: 'delete', label: '删除模型' },
    ],
  })
  if (p.isCancel(action)) {
    p.cancel('已取消')
    return null
  }

  switch (action) {
    case 'full':
      return runAiConfigWizard(true)
    case 'list':
      p.log.info(formatModelsListReply())
      return loadAiConfigFile()?.deepseek ?? null
    case 'add':
      return runAddModel()
    case 'switch':
      return runSwitchModel()
    case 'delete':
      return runDeleteModel()
    default:
      return null
  }
}

/** 配置变更后刷新会话时调用 */
export function onModelConfigUpdated(): void {
  printCurrentAiConfig()
}
