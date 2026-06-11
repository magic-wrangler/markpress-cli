import { loadAiConfigFile, DEFAULT_BASE_URL, DEFAULT_MODEL, DEFAULT_TEMPERATURE } from './user-config.ts'

export interface DeepSeekConfig {
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  source: 'env' | 'file'
}

export function resolveDeepSeekConfig(): DeepSeekConfig | null {
  const envKey = process.env.DEEPSEEK_API_KEY?.trim()
  const file = loadAiConfigFile()

  if (envKey) {
    return {
      apiKey: envKey,
      baseUrl: (process.env.DEEPSEEK_BASE_URL?.trim() || file?.deepseek.baseUrl || DEFAULT_BASE_URL).replace(
        /\/$/,
        ''
      ),
      model: process.env.DEEPSEEK_MODEL?.trim() || file?.deepseek.model || DEFAULT_MODEL,
      temperature: file?.deepseek.temperature ?? DEFAULT_TEMPERATURE,
      source: 'env',
    }
  }

  if (file?.deepseek.apiKey) {
    return {
      apiKey: file.deepseek.apiKey,
      baseUrl: file.deepseek.baseUrl,
      model: file.deepseek.model,
      temperature: file.deepseek.temperature,
      source: 'file',
    }
  }

  return null
}

/** @deprecated 使用 resolveDeepSeekConfig，保留供直接调用场景 */
export function loadDeepSeekConfig(): DeepSeekConfig {
  const config = resolveDeepSeekConfig()
  if (!config) {
    throw new Error('MISSING_AI_CONFIG')
  }
  return config
}
