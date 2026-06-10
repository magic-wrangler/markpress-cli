/**
 * Markpress 独立样式引擎（与 Web 端 StyleConfig 格式兼容）
 * 仅含类型定义与 HTML/CSS 生成，无预设主题、无 UI 依赖。
 */

export interface StyleConfig {
  global: {
    pageBackground: string
    contentBackground: string
    contentWidth: number
    contentPadding: number
    contentPaddingTop?: number
    contentPaddingRight?: number
    contentPaddingBottom?: number
    contentPaddingLeft?: number
    bodyPadding?: number
    bodyPaddingTop?: number
    bodyPaddingRight?: number
    bodyPaddingBottom?: number
    bodyPaddingLeft?: number
    fontFamily: string
    fontSize?: number
    fontSizeUnit?: 'px' | 'pt'
    contentAlign: 'left' | 'center' | 'right'
    borderRadius?: number
    shadowEnabled?: boolean
    shadowX?: number
    shadowY?: number
    shadowBlur?: number
    shadowSpread?: number
    shadowColor?: string
    shadowOpacity?: number
  }
  typography: {
    h1: TypographyStyle
    h2: TypographyStyle
    h3: TypographyStyle
    h4: TypographyStyle
    h5: TypographyStyle
    h6: TypographyStyle
    p: TypographyStyle
    custom1: TypographyStyle
    custom2: TypographyStyle
    custom3: TypographyStyle
    custom4: TypographyStyle
    custom5: TypographyStyle
  }
  customElements?: {
    custom1: { enabled: boolean; name: string; selector: string }
    custom2: { enabled: boolean; name: string; selector: string }
    custom3: { enabled: boolean; name: string; selector: string }
    custom4: { enabled: boolean; name: string; selector: string }
    custom5: { enabled: boolean; name: string; selector: string }
  }
  table: {
    width: 'auto' | '100%'
    tableLayout: 'auto' | 'fixed'
    borderMode: 'none' | 'all' | 'horizontal' | 'outer'
    borderColor: string
    borderWidth: number
    cellPadding: number
    headerBackground: string
    headerColor: string
    headerFontWeight: string
    headerFontSize: number
    zebraStripe: boolean
    zebraOddColor: string
    zebraEvenColor: string
    bodyFontSize: number
    bodyColor: string
    bodyFontWeight: string
    enableRowMerge: boolean
    enableColMerge: boolean
  }
  codeBlock: {
    background: string
    color: string
    borderRadius: number
    fontFamily: string
  }
  blockquote: {
    background: string
    borderColor: string
    borderWidth: number
    color: string
  }
  link: {
    color: string
    hoverColor: string
    underline: 'none' | 'always' | 'hover'
  }
  list: {
    itemSpacing: number
  }
}

export interface TypographyStyle {
  fontSize: number
  fontWeight: string
  color: string
  textAlign: 'left' | 'center' | 'right' | 'justify'
  textDecoration: 'none' | 'underline' | 'line-through'
  textDecorationColor: string
  marginBottom: number
  lineHeight: number
  letterSpacing: number
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  backgroundColor: string
  padding: number
  borderRadius: number
  borderWidth: number
  borderColor: string
  borderStyle: 'none' | 'solid' | 'dashed' | 'dotted'
  customCSS: string
}

export const DEFAULT_GLOBAL_FONT_SIZE = 12
export const DEFAULT_GLOBAL_FONT_SIZE_UNIT: 'px' | 'pt' = 'px'

export function resolveGlobalFontSize(global: StyleConfig['global']): {
  size: number
  unit: 'px' | 'pt'
} {
  return {
    size: global.fontSize ?? DEFAULT_GLOBAL_FONT_SIZE,
    unit: global.fontSizeUnit ?? DEFAULT_GLOBAL_FONT_SIZE_UNIT,
  }
}

function toScaledFontSize(px: number): string {
  return `${px / DEFAULT_GLOBAL_FONT_SIZE}em`
}

function generateTypographyCSS(element: string, style: TypographyStyle): string {
  const baseCSS = `
    font-size: ${toScaledFontSize(style.fontSize)};
    font-weight: ${style.fontWeight};
    color: ${style.color};
    text-align: ${style.textAlign};
    text-decoration: ${style.textDecoration};
    text-decoration-color: ${style.textDecorationColor};
    margin-bottom: ${style.marginBottom}px;
    line-height: ${style.lineHeight};
    letter-spacing: ${style.letterSpacing}px;
    text-transform: ${style.textTransform};
    ${style.backgroundColor !== 'transparent' ? `background-color: ${style.backgroundColor};` : ''}
    ${style.padding > 0 ? `padding: ${style.padding}px;` : ''}
    ${style.borderRadius > 0 ? `border-radius: ${style.borderRadius}px;` : ''}
    ${style.borderStyle !== 'none' ? `border: ${style.borderWidth}px ${style.borderStyle} ${style.borderColor};` : ''}
    ${style.customCSS}
  `
  return `${element} { ${baseCSS} }`
}

function generateCustomElementsCSS(config: StyleConfig): string {
  if (!config.customElements) return ''

  const customCSS: string[] = []
  const customKeys = ['custom1', 'custom2', 'custom3', 'custom4', 'custom5'] as const

  for (const key of customKeys) {
    const elementConfig = config.customElements[key]
    if (elementConfig?.enabled) {
      const style = config.typography[key]
      if (style) {
        customCSS.push(generateTypographyCSS(elementConfig.selector, style))
      }
    }
  }

  return customCSS.join('\n')
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
  }
  return '0, 0, 0'
}

function generateTableStyles(table: StyleConfig['table']): string {
  let borderStyle = ''
  switch (table.borderMode) {
    case 'none':
      borderStyle = 'border: none;'
      break
    case 'all':
      borderStyle = `border: ${table.borderWidth}px solid ${table.borderColor};`
      break
    case 'horizontal':
      borderStyle = `border-top: ${table.borderWidth}px solid ${table.borderColor}; border-bottom: ${table.borderWidth}px solid ${table.borderColor};`
      break
    case 'outer':
      borderStyle = `border: ${table.borderWidth}px solid ${table.borderColor};`
      break
  }

  let cellBorderStyle = ''
  switch (table.borderMode) {
    case 'none':
      cellBorderStyle = 'border: none;'
      break
    case 'all':
      cellBorderStyle = `border: ${table.borderWidth}px solid ${table.borderColor};`
      break
    case 'horizontal':
      cellBorderStyle = `border-bottom: ${table.borderWidth}px solid ${table.borderColor};`
      break
    case 'outer':
      cellBorderStyle = 'border: none;'
      break
  }

  let zebraStyles = ''
  if (table.zebraStripe) {
    zebraStyles = `
      tbody tr:nth-child(odd) { background-color: ${table.zebraOddColor}; }
      tbody tr:nth-child(even) { background-color: ${table.zebraEvenColor}; }
    `
  }

  return `
  table {
    width: ${table.width};
    table-layout: ${table.tableLayout};
    border-collapse: collapse;
    margin-bottom: 16px;
    ${borderStyle}
  }
  th, td {
    padding: ${table.cellPadding}px;
    text-align: left;
    ${cellBorderStyle}
  }
  th {
    background-color: ${table.headerBackground};
    color: ${table.headerColor};
    font-weight: ${table.headerFontWeight};
    font-size: ${toScaledFontSize(table.headerFontSize)};
  }
  td {
    color: ${table.bodyColor};
    font-weight: ${table.bodyFontWeight};
    font-size: ${toScaledFontSize(table.bodyFontSize)};
  }
  ${zebraStyles}
  `
}

export function generateInlineStyles(config: StyleConfig): string {
  const { global, typography, table, codeBlock, blockquote, link, list } = config

  const tableStyles = generateTableStyles(table)
  const customStyles = generateCustomElementsCSS(config)
  const linkHoverStyle =
    link.underline === 'hover'
      ? 'text-decoration: none;'
      : link.underline === 'always'
        ? 'text-decoration: underline;'
        : 'text-decoration: none;'

  const shadowStyle = global.shadowEnabled
    ? `box-shadow: ${global.shadowX ?? 0}px ${global.shadowY ?? 2}px ${global.shadowBlur ?? 10}px ${global.shadowSpread ?? 0}px rgba(${hexToRgb(global.shadowColor ?? '#000000')}, ${global.shadowOpacity ?? 0.1});`
    : ''

  const alignStyle =
    global.contentAlign === 'left'
      ? 'margin: 0;'
      : global.contentAlign === 'right'
        ? 'margin: 0 0 0 auto;'
        : 'margin: 0 auto;'

  const bp = global.bodyPadding ?? 20
  const bpTop = global.bodyPaddingTop ?? bp
  const bpRight = global.bodyPaddingRight ?? bp
  const bpBottom = global.bodyPaddingBottom ?? bp
  const bpLeft = global.bodyPaddingLeft ?? bp

  const cp = global.contentPadding
  const cpTop = global.contentPaddingTop ?? cp
  const cpRight = global.contentPaddingRight ?? cp
  const cpBottom = global.contentPaddingBottom ?? cp
  const cpLeft = global.contentPaddingLeft ?? cp
  const { size: globalFontSize, unit: globalFontSizeUnit } = resolveGlobalFontSize(global)

  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        background-color: var(--page-bg, ${global.pageBackground || 'transparent'}); 
        margin: 0; 
        padding: ${bpTop}px ${bpRight}px ${bpBottom}px ${bpLeft}px;
        font-family: ${global.fontFamily};
      }
      .content-wrapper {
        background-color: var(--content-bg, ${global.contentBackground || 'transparent'});
        max-width: ${global.contentWidth}px;
        ${alignStyle}
        padding: ${cpTop}px ${cpRight}px ${cpBottom}px ${cpLeft}px;
        border-radius: ${global.borderRadius ?? 0}px;
        font-size: ${globalFontSize}${globalFontSizeUnit};
        ${shadowStyle}
      }
      ${generateTypographyCSS('h1', typography.h1)}
      ${generateTypographyCSS('h2', typography.h2)}
      ${generateTypographyCSS('h3', typography.h3)}
      ${generateTypographyCSS('h4', typography.h4)}
      ${generateTypographyCSS('h5', typography.h5)}
      ${generateTypographyCSS('h6', typography.h6)}
      ${generateTypographyCSS('p', typography.p)}
      ${customStyles}
      ${tableStyles}
      pre { background-color: ${codeBlock.background}; color: ${codeBlock.color}; border-radius: ${codeBlock.borderRadius}px; font-family: ${codeBlock.fontFamily}; padding: 16px; overflow-x: auto; margin-bottom: 16px; }
      code { background-color: ${codeBlock.background}; color: ${codeBlock.color}; font-family: ${codeBlock.fontFamily}; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
      pre code { background: none; padding: 0; }
      blockquote { background-color: ${blockquote.background}; border-left: ${blockquote.borderWidth}px solid ${blockquote.borderColor}; color: ${blockquote.color}; padding: 12px 20px; margin: 0 0 16px 0; }
      a { color: ${link.color}; ${linkHoverStyle} }
      a:hover { color: ${link.hoverColor}; ${link.underline === 'hover' ? 'text-decoration: underline;' : ''} }
      ul, ol { margin-bottom: 16px; padding-left: 24px; color: ${typography.p.color}; }
      li { margin-bottom: ${list.itemSpacing}px; line-height: 1.6; }
      hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
      img { max-width: 100%; height: auto; }
      strong { font-weight: 700; }
      em { font-style: italic; }
    </style>
  `
}

export function generateFullHTML(content: string, config: StyleConfig): string {
  const styles = generateInlineStyles(config)
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Document</title>
  ${styles}
</head>
<body>
  <div class="content-wrapper">
    ${content}
  </div>
</body>
</html>`
}
