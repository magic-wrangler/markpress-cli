import type { TokenUsage } from './types.ts'

export function normalizeTokenUsage(raw: Record<string, unknown> | null | undefined): TokenUsage | null {
  if (!raw || typeof raw !== 'object') return null
  const total = raw.total_tokens
  const prompt = raw.prompt_tokens
  const completion = raw.completion_tokens
  if (total == null && prompt == null && completion == null) return null

  const promptTokens = typeof prompt === 'number' ? prompt : 0
  const completionTokens = typeof completion === 'number' ? completion : 0
  const totalTokens =
    typeof total === 'number' ? total : promptTokens + completionTokens

  const usage: TokenUsage = {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
  }

  if (typeof raw.prompt_cache_hit_tokens === 'number') {
    usage.prompt_cache_hit_tokens = raw.prompt_cache_hit_tokens
  }
  if (typeof raw.prompt_cache_miss_tokens === 'number') {
    usage.prompt_cache_miss_tokens = raw.prompt_cache_miss_tokens
  }

  return usage
}

export function formatTokenUsageLine(usage: TokenUsage): string {
  let line = `tokens：输入 ${usage.prompt_tokens} · 输出 ${usage.completion_tokens} · 合计 ${usage.total_tokens}`
  if (usage.prompt_cache_hit_tokens != null && usage.prompt_cache_hit_tokens > 0) {
    line += ` · 缓存命中 ${usage.prompt_cache_hit_tokens}`
  }
  return line
}
