/**
 * 复制内置模板时，将旧版主题表述更新为当前命名（幂等，可重复执行）
 */
export function normalizeTemplateMarkdown(content: string): string {
  let text = content

  // 附录示例命令：默认推荐正式版
  text = text.replace(
    /mpr convert --md 转换模板\.md --theme 有底色/g,
    'mpr convert --md 转换模板.md --theme 正式版'
  )

  // 旧版两行主题说明 → 当前三主题说明
  if (text.includes('**有底色**：表头深蓝') && !text.includes('**正式版**')) {
    text = text.replace(
      /## 2\.2 内置主题\r?\n\r?\n- \*\*有底色\*\*：表头深蓝，适合正式文档、规则协议\r?\n- \*\*无底色\*\*：简洁白底\r?\n\r?\n执行 `mpr themes list` 查看详情。/,
      `## 2.2 内置主题

- **正式版**（推荐）：白底深字，标题按语雀/飞书标准递减
- **RULE_蓝色底**（别名 \`有底色\`）：表头深蓝，适合正式文档、规则协议
- **RULE_无底色**（别名 \`无底色\`）：简洁白底

执行 \`mpr themes list\` 查看详情。`
    )
  }

  return text
}
