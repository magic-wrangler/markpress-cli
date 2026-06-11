import type { StyleConfig } from '../markdown-styles.ts'

function line(label: string, value: string): string {
  return `  ${label.padEnd(10)} ${value}`
}

/** 将主题 JSON 转为终端可读的配置摘要 */
export function formatThemePreview(theme: StyleConfig): string {
  const g = theme.global
  const t = theme.table
  const p = theme.typography.p
  const h1 = theme.typography.h1
  const link = theme.link
  const code = theme.codeBlock

  const rows = [
    '主题配置摘要',
    '',
    line('页面背景', g.pageBackground || '（无）'),
    line('内容区', g.contentBackground || '（无）'),
    line('字体', g.fontFamily),
    line('内容宽度', `${g.contentWidth}px`),
    line('正文', `${p.fontSize}px · ${p.color} · ${p.fontWeight}`),
    line('标题 h1', `${h1.fontSize}px · ${h1.fontWeight} · ${h1.color}`),
    line('表头', `${t.headerBackground || '（无底色）'} / 字 ${t.headerColor}`),
    line('表格边框', `${t.borderMode} · ${t.borderColor}`),
    line('链接', `${link.color}（悬停 ${link.hoverColor}）`),
    line('代码块', `底 ${code.background} · 字 ${code.color}`),
  ]

  if (t.zebraStripe) {
    rows.push(line('斑马纹', `${t.zebraOddColor} / ${t.zebraEvenColor}`))
  }

  return rows.join('\n')
}
