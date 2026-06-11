export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export type ProviderId = 'deepseek'

export interface StreamCallbacks {
  onReasoningDelta?: (text: string) => void
  onContentDelta?: (text: string) => void
}

export interface LLMProvider {
  id: ProviderId
  chat(messages: ChatMessage[], signal?: AbortSignal): Promise<string>
  chatStream(messages: ChatMessage[], callbacks: StreamCallbacks, signal?: AbortSignal): Promise<string>
}
