import * as p from '@clack/prompts'
import {
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  DEEPSEEK_MODELS,
  getAiConfigPath,
  isDeprecatedModel,
  loadAiConfigFile,
  maskApiKey,
  saveAiConfigFile,
  type DeepSeekFileConfig,
} from './user-config.ts'

async function promptApiKey(existing?: string): Promise<string | symbol> {
  if (existing) {
    const reuse = await p.confirm({
      message: `沿用已保存的 API 密钥（${maskApiKey(existing)}）？`,
      initialValue: true,
    })
    if (p.isCancel(reuse)) return reuse
    if (reuse) return existing
  }

  p.log.info('在 https://platform.deepseek.com/api_keys 创建 API 密钥')

  return p.password({
    message: 'DeepSeek API 密钥',
    validate: (value) => {
      if (!value?.trim()) return '请输入 API 密钥'
      if (!value.trim().startsWith('sk-')) return '密钥通常以 sk- 开头，请确认是否正确'
    },
  })
}

async function promptModel(current?: string): Promise<string | symbol> {
  return p.select({
    message: '选择模型',
    initialValue: current || DEFAULT_MODEL,
    options: DEEPSEEK_MODELS.map((m) => ({
      value: m.value,
      label: m.label,
      hint: m.hint,
    })),
  })
}

async function promptBaseUrl(current?: string): Promise<string | symbol> {
  return p.text({
    message: 'API 地址（一般无需修改）',
    placeholder: DEFAULT_BASE_URL,
    defaultValue: current || DEFAULT_BASE_URL,
    validate: (value) => {
      const v = (value || DEFAULT_BASE_URL).trim()
      if (!v.startsWith('http')) return '请输入有效的 URL'
    },
  })
}

async function promptTemperature(current?: number): Promise<string | symbol> {
  return p.select({
    message: '创造性（temperature）',
    initialValue: String(current ?? DEFAULT_TEMPERATURE),
    options: [
      { value: '0.3', label: '0.3', hint: '更稳定，输出更一致' },
      { value: '0.7', label: '0.7', hint: '推荐，平衡创意与稳定' },
      { value: '1.0', label: '1.0', hint: '更有创意，结果更多样' },
    ],
  })
}

export async function runAiConfigWizard(force = false): Promise<DeepSeekFileConfig | null> {
  const existing = loadAiConfigFile()?.deepseek

  if (!force && existing?.apiKey) {
    return existing
  }

  p.intro(force ? 'Markpress · 修改 AI 配置' : 'Markpress · 首次配置 DeepSeek')

  const apiKey = await promptApiKey(existing?.apiKey)
  if (p.isCancel(apiKey)) {
    p.cancel('已取消配置')
    return null
  }

  const model = await promptModel(existing?.model)
  if (p.isCancel(model)) {
    p.cancel('已取消配置')
    return null
  }

  const baseUrl = await promptBaseUrl(existing?.baseUrl)
  if (p.isCancel(baseUrl)) {
    p.cancel('已取消配置')
    return null
  }

  const temperature = await promptTemperature(existing?.temperature)
  if (p.isCancel(temperature)) {
    p.cancel('已取消配置')
    return null
  }

  const config: DeepSeekFileConfig = {
    apiKey: (apiKey as string).trim(),
    model: model as string,
    baseUrl: ((baseUrl as string).trim() || DEFAULT_BASE_URL).replace(/\/$/, ''),
    temperature: parseFloat(temperature as string),
  }

  const save = await p.confirm({
    message: `保存到 ${getAiConfigPath()}？`,
    initialValue: true,
  })
  if (p.isCancel(save) || !save) {
    p.cancel('未保存配置')
    return null
  }

  if (isDeprecatedModel(config.model)) {
    p.log.warn(`${config.model} 将于 2026/07/24 弃用，建议改用 deepseek-v4-flash 或 deepseek-v4-pro`)
  }

  saveAiConfigFile(config)
  p.log.success(`配置已保存：${getAiConfigPath()}`)
  p.log.info(`模型：${config.model} · 密钥：${maskApiKey(config.apiKey)}`)
  p.outro('配置完成')

  return config
}

export function printCurrentAiConfig(): void {
  const file = loadAiConfigFile()
  const envKey = process.env.DEEPSEEK_API_KEY?.trim()

  if (envKey) {
    p.log.info(`API 密钥：环境变量（${maskApiKey(envKey)}）`)
    p.log.info(`模型：${process.env.DEEPSEEK_MODEL?.trim() || file?.deepseek.model || DEFAULT_MODEL}`)
    return
  }

  if (file) {
    p.log.info(`API 密钥：配置文件（${maskApiKey(file.deepseek.apiKey)}）`)
    p.log.info(`模型：${file.deepseek.model}`)
    if (isDeprecatedModel(file.deepseek.model)) {
      p.log.warn(`${file.deepseek.model} 将于 2026/07/24 弃用，可输入「配置」或运行 mpr ai config 升级模型`)
    }
    p.log.info(`配置路径：${getAiConfigPath()}`)
    return
  }
}
