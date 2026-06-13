import type { StyleConfig } from '../markdown-styles.ts'
import { validateStyleConfigObject } from '../convert-core.ts'
import { buildThemeSystemPrompt } from './prompts/theme.ts'
import { detectBaseThemeId, DEFAULT_BASE_THEME_ID } from './builtin-theme-context.ts'
import { getProvider } from './providers/index.ts'
import type { ChatMessage, LLMProvider, TokenUsage } from './types.ts'

const JSON_BLOCK_RE = /```(?:json)?\s*([\s\S]*?)```/gi

export interface ThemeChatSession {
  messages: ChatMessage[]
  latestTheme: StyleConfig | null
  provider: LLMProvider
  baseThemeId: string
}

export function createThemeChatSession(baseThemeId = DEFAULT_BASE_THEME_ID): ThemeChatSession {
  return {
    messages: [{ role: 'system', content: buildThemeSystemPrompt(baseThemeId) }],
    latestTheme: null,
    provider: getProvider('deepseek'),
    baseThemeId,
  }
}

/** 用户指定新基准主题时，重建 system prompt */
export function switchBaseTheme(session: ThemeChatSession, baseThemeId: string): void {
  session.baseThemeId = baseThemeId
  session.messages = [{ role: 'system', content: buildThemeSystemPrompt(baseThemeId) }]
  session.latestTheme = null
}

/** 去掉 JSON 代码块，保留 AI 的文字说明 */
export function extractReplySummary(text: string): string {
  return text
    .replace(/```json[\s\S]*?```/gi, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function extractThemeFromResponse(text: string): StyleConfig | null {
  const blocks: string[] = []
  let match: RegExpExecArray | null
  JSON_BLOCK_RE.lastIndex = 0
  while ((match = JSON_BLOCK_RE.exec(text)) !== null) {
    blocks.push(match[1].trim())
  }

  for (let i = blocks.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(blocks[i]) as unknown
      if (validateStyleConfigObject(parsed)) {
        return parsed as StyleConfig
      }
    } catch {
      // 尝试下一个块
    }
  }

  return null
}

export async function sendThemeMessage(
  session: ThemeChatSession,
  userInput: string,
  onStream?: (chunk: string, kind: 'reasoning' | 'content') => void,
  signal?: AbortSignal,
  onUsage?: (usage: TokenUsage) => void
): Promise<{ reply: string; theme: StyleConfig | null }> {
  const newBase = detectBaseThemeId(userInput)
  if (newBase && newBase !== session.baseThemeId) {
    switchBaseTheme(session, newBase)
  }

  session.messages.push({ role: 'user', content: userInput })

  const reply = onStream
    ? await session.provider.chatStream(
        session.messages,
        {
          onReasoningDelta: (text) => onStream(text, 'reasoning'),
          onContentDelta: (text) => onStream(text, 'content'),
          onUsage,
        },
        signal
      )
    : await session.provider.chat(session.messages, signal)

  session.messages.push({ role: 'assistant', content: reply })

  const theme = extractThemeFromResponse(reply)
  if (theme) {
    session.latestTheme = theme
  }

  return { reply, theme }
}
