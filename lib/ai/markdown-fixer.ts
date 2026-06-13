import { MARKDOWN_FIX_SYSTEM_PROMPT } from './prompts/markdown-fix.ts'
import { resolveDeepSeekConfig } from './config.ts'
import { getProvider } from './providers/index.ts'
import { loadKnowledgeFile } from './knowledge-loader.ts'
import type { ChatMessage, StreamCallbacks } from './types.ts'

function buildMarkdownFixSystemPrompt(): string {
  const knowledge = loadKnowledgeFile('markdown-fix.md')
  if (!knowledge) return MARKDOWN_FIX_SYSTEM_PROMPT
  return `${MARKDOWN_FIX_SYSTEM_PROMPT}\n\n---\n\n## 知识库（修复准则，以此为准）\n\n${knowledge}`
}

/** 去掉模型可能包裹的 markdown 围栏 */
export function extractMarkdownFromAiResponse(text: string): string {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/^```(?:markdown|md)?\r?\n([\s\S]*?)\r?\n```$/i)
  if (fenceMatch) return fenceMatch[1].replace(/\r?\n$/, '')
  return trimmed
}

export async function aiFixMarkdown(
  source: string,
  callbacks?: StreamCallbacks,
  signal?: AbortSignal
): Promise<string> {
  if (!resolveDeepSeekConfig()) {
    throw new Error(
      '未配置 AI：请设置环境变量 DEEPSEEK_API_KEY，或在 mpr ai 中完成模型配置（~/.markpress/ai-config.json）'
    )
  }

  const provider = getProvider('deepseek')
  const messages: ChatMessage[] = [
    { role: 'system', content: buildMarkdownFixSystemPrompt() },
    {
      role: 'user',
      content: `请修复以下 Markdown（只输出修复后的全文）：\n\n${source}`,
    },
  ]

  const raw = callbacks
    ? await provider.chatStream(messages, callbacks, signal)
    : await provider.chat(messages, signal)
  const fixed = extractMarkdownFromAiResponse(raw)
  if (!fixed) {
    throw new Error('AI 修复返回内容为空')
  }
  return fixed
}
