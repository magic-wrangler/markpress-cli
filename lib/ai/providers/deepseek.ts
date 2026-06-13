import { loadDeepSeekConfig } from '../config.ts'
import { normalizeTokenUsage } from '../token-usage.ts'
import type { ChatMessage, LLMProvider, StreamCallbacks } from '../types.ts'

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
  usage?: Record<string, unknown>
  error?: { message?: string }
}

interface StreamDelta {
  content?: string
  reasoning_content?: string
}

interface StreamChunk {
  choices?: Array<{ delta?: StreamDelta }>
  usage?: Record<string, unknown> | null
  error?: { message?: string }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error('The operation was aborted')
    err.name = 'AbortError'
    throw err
  }
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''
  let reasoning = ''

  const onAbort = () => {
    reader.cancel().catch(() => {})
  }
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    while (true) {
      throwIfAborted(signal)

      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue

        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') continue

        let chunk: StreamChunk
        try {
          chunk = JSON.parse(payload) as StreamChunk
        } catch {
          continue
        }

        if (chunk.error?.message) {
          throw new Error(chunk.error.message)
        }

        const usage = normalizeTokenUsage(chunk.usage)
        if (usage) {
          callbacks.onUsage?.(usage)
        }

        const delta = chunk.choices?.[0]?.delta
        if (!delta) continue

        if (delta.reasoning_content) {
          reasoning += delta.reasoning_content
          callbacks.onReasoningDelta?.(delta.reasoning_content)
        }
        if (delta.content) {
          content += delta.content
          callbacks.onContentDelta?.(delta.content)
        }
      }
    }

    return (content || reasoning).trim()
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }
}

async function requestChat(
  messages: ChatMessage[],
  stream: boolean,
  callbacks?: StreamCallbacks,
  signal?: AbortSignal
): Promise<string> {
  throwIfAborted(signal)
  const config = loadDeepSeekConfig()

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature,
      stream,
      ...(stream ? { stream_options: { include_usage: true } } : {}),
    }),
    signal,
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ChatCompletionResponse
    const msg = data.error?.message ?? `HTTP ${res.status}`
    throw new Error(`DeepSeek API 请求失败：${msg}`)
  }

  if (stream && res.body && callbacks) {
    const text = await readSseStream(res.body, callbacks, signal)
    if (!text) throw new Error('DeepSeek API 返回内容为空')
    return text
  }

  const data = (await res.json()) as ChatCompletionResponse
  const usage = normalizeTokenUsage(data.usage)
  if (usage) {
    callbacks?.onUsage?.(usage)
  }
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('DeepSeek API 返回内容为空')
  }
  return content
}

export function createDeepSeekProvider(): LLMProvider {
  return {
    id: 'deepseek',
    chat(messages, signal) {
      return requestChat(messages, false, undefined, signal)
    },
    chatStream(messages, callbacks, signal) {
      return requestChat(messages, true, callbacks, signal)
    },
  }
}
