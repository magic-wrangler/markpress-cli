import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export interface DeepSeekFileConfig {
  apiKey: string
  model: string
  baseUrl: string
  temperature: number
}

export interface AiConfigFile {
  provider: 'deepseek'
  deepseek: DeepSeekFileConfig
}

const CONFIG_DIR = join(homedir(), '.markpress')
const CONFIG_PATH = join(CONFIG_DIR, 'ai-config.json')

export const DEFAULT_BASE_URL = 'https://api.deepseek.com'
export const DEFAULT_MODEL = 'deepseek-v4-flash'
export const DEFAULT_TEMPERATURE = 0.7

/** DeepSeek 官方模型列表；chat/reasoner 将于 2026-07-24 弃用 */
export const DEEPSEEK_MODELS = [
  { value: 'deepseek-v4-flash', label: 'deepseek-v4-flash', hint: '推荐，快速响应，适合主题生成' },
  { value: 'deepseek-v4-pro', label: 'deepseek-v4-pro', hint: '更强能力，适合复杂风格描述' },
  { value: 'deepseek-chat', label: 'deepseek-chat', hint: '将于 2026/07/24 弃用' },
  { value: 'deepseek-reasoner', label: 'deepseek-reasoner', hint: '将于 2026/07/24 弃用' },
] as const

const DEPRECATED_MODELS = new Set(['deepseek-chat', 'deepseek-reasoner'])

export function isDeprecatedModel(model: string): boolean {
  return DEPRECATED_MODELS.has(model)
}

export function getAiConfigPath(): string {
  return CONFIG_PATH
}

export function loadAiConfigFile(): AiConfigFile | null {
  if (!existsSync(CONFIG_PATH)) return null
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AiConfigFile>
    if (!parsed.deepseek?.apiKey?.trim()) return null
    return {
      provider: 'deepseek',
      deepseek: {
        apiKey: parsed.deepseek.apiKey.trim(),
        model: parsed.deepseek.model?.trim() || DEFAULT_MODEL,
        baseUrl: (parsed.deepseek.baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/$/, ''),
        temperature:
          typeof parsed.deepseek.temperature === 'number'
            ? parsed.deepseek.temperature
            : DEFAULT_TEMPERATURE,
      },
    }
  } catch {
    return null
  }
}

export function saveAiConfigFile(config: DeepSeekFileConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true })
  const data: AiConfigFile = { provider: 'deepseek', deepseek: config }
  writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8')
  try {
    chmodSync(CONFIG_PATH, 0o600)
  } catch {
    // Windows 等环境可能不支持 chmod
  }
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '***'
  return `${key.slice(0, 3)}...${key.slice(-4)}`
}

export function hasAiConfig(): boolean {
  if (process.env.DEEPSEEK_API_KEY?.trim()) return true
  return !!loadAiConfigFile()
}
