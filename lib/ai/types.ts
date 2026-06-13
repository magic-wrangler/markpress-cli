export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export type ProviderId = 'deepseek'

export interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  prompt_cache_hit_tokens?: number
  prompt_cache_miss_tokens?: number
}

export interface StreamCallbacks {
  onReasoningDelta?: (text: string) => void
  onContentDelta?: (text: string) => void
  /** 流式结束时 API 返回的真实 token 用量（需 stream_options.include_usage） */
  onUsage?: (usage: TokenUsage) => void
}

export interface LLMProvider {
  id: ProviderId
  chat(messages: ChatMessage[], signal?: AbortSignal): Promise<string>
  chatStream(messages: ChatMessage[], callbacks: StreamCallbacks, signal?: AbortSignal): Promise<string>
}
