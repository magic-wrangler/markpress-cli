import { createDeepSeekProvider } from './deepseek.ts'
import type { LLMProvider, ProviderId } from '../types.ts'

export function getProvider(id: ProviderId = 'deepseek'): LLMProvider {
  if (id === 'deepseek') {
    return createDeepSeekProvider()
  }
  throw new Error(`不支持的模型提供商：${id}`)
}
