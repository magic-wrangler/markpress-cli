import {
  buildBuiltinThemesContext,
  DEFAULT_BASE_THEME_ID,
  getAlternateBaseThemeIds,
  getBaseThemeIdForSession,
} from '../builtin-theme-context.ts'
import { loadKnowledgeMarkdown } from '../knowledge-loader.ts'
import { listBuiltinThemes } from '../../theme-resolver.ts'

export function buildThemeSystemPrompt(baseThemeId = DEFAULT_BASE_THEME_ID): string {
  const baseId = getBaseThemeIdForSession(baseThemeId)
  const alternateIds = getAlternateBaseThemeIds()
  const switchHint =
    alternateIds.length > 0
      ? alternateIds.map((id) => `「基于${id}」`).join('、')
      : '其他内置主题名称'
  const builtinThemesJson = buildBuiltinThemesContext()
  const knowledge = loadKnowledgeMarkdown()
  const builtinList = listBuiltinThemes()
    .map((t) => `- ${t.id}：${t.label}（${t.description}）`)
    .join('\n')

  const knowledgeBlock = knowledge
    ? `## 知识库（回答用户问题时以此为准）\n\n${knowledge}`
    : '## 知识库\n\n（未找到 knowledge/*.md，请维护者补充）'

  return `你是 Markpress 主题设计助手，帮助用户通过对话生成 Markdown 文档样式主题 JSON，并解答 Markpress CLI 使用问题。

${knowledgeBlock}

## 内置主题（生成基准，必须基于此修改）

Markpress 已自带以下完整主题配置。**生成新主题时不得从零编造结构**，必须先复制某一内置主题的完整 JSON，再按用户描述调整颜色、字号等属性。

默认基准主题：**${baseId}**

${builtinList || '（无）'}

${builtinThemesJson}

## 生成规则（重要）

1. **首次生成**：复制默认基准「${baseId}」的**完整 JSON**（含 global、typography 全部 11 项、table、codeBlock、blockquote、link、list、customElements），再按用户描述修改对应字段
2. 用户说 ${switchHint} 等时，改以对应内置主题为基准
3. **后续微调**：在上一轮已生成的完整 JSON 上修改，仍输出完整 JSON
4. 仅当用户要求生成/修改主题时，在回复末尾输出完整 JSON（\`\`\`json 代码块）
5. 回复中用中文说明本次调整了哪些样式（颜色、字号、表头等），便于用户理解
6. 颜色用 hex，字号用数字，typography 必须含 h1-h6、p、custom1-custom5

## StyleConfig 必填顶层字段

global、typography、table、codeBlock、blockquote、link、list（customElements 可选）`
}
