# StyleConfig 主题配置详细说明

> 维护说明：本文描述 Markpress CLI 主题 JSON（StyleConfig）的每个字段含义，与 Web 端 Markpress 编辑器导出格式兼容。`mpr ai` 启动时会自动读取 `knowledge/` 下全部 `.md`。
>
> 主题文件位置：`themes/<名称>.json`，或通过 `--theme ./我的主题.json` 指定本地路径。

---

## 1. 文件结构概览

主题 JSON 是一个对象，**顶层必填** 7 个区块：

| 顶层字段 | 类型 | 必填 | 作用 |
|----------|------|------|------|
| `global` | object | 是 | 页面布局、背景、全局字号基准 |
| `typography` | object | 是 | 标题、正文、自定义块文字样式 |
| `table` | object | 是 | 表格边框、表头/表体、单元格合并 |
| `codeBlock` | object | 是 | 代码块与行内代码 |
| `blockquote` | object | 是 | 引用块 |
| `link` | object | 是 | 超链接 |
| `list` | object | 是 | 有序/无序列表 |
| `customElements` | object | 否 | 将 `typography.custom1–5` 绑定到 HTML class |

校验规则（`validateStyleConfigObject`）：缺少上述任一必填区块则视为无效主题，无法用于转换或 AI 生成。

---

## 2. 字号换算机制（重要）

全局正文字号由 `global.fontSize` + `global.fontSizeUnit` 控制，**默认 12px**。

| 概念 | 说明 |
|------|------|
| 基准容器 | `.content-wrapper` 上的 `font-size` |
| 标题/表格字号 | JSON 中的 `fontSize` 数值按 **÷12 转为 em** 输出 |
| 示例 | `typography.h1.fontSize: 24` → CSS `font-size: 2em` → 实际 24px（基准 12 时） |
| 全局缩放 | 修改 `global.fontSize` 为 14 时，所有 em 换算后的元素同比放大 |

**约定**：JSON 里 `typography.*.fontSize`、`table.headerFontSize`、`table.bodyFontSize` 填写的是 **以 12 为基准的设计 px 值**，引擎统一换算，无需手写 em。

---

## 3. `global` — 页面与内容区

对应 HTML 结构：`body`（页面）→ `.content-wrapper`（内容区）。

| 字段 | 类型 | 必填 | 说明 | 示例 / 默认 |
|------|------|------|------|-------------|
| `pageBackground` | string | 是 | 整个页面（`body`）背景色，hex 或空字符串 | `#244770`；空则 `transparent` |
| `contentBackground` | string | 是 | 内容区（`.content-wrapper`）背景色 | `#ffffff` |
| `contentWidth` | number | 是 | 内容区最大宽度（px） | `790` |
| `contentPadding` | number | 是 | 内容区内边距默认值（px），四边未单独指定时使用 | `10` |
| `contentPaddingTop` | number | 否 | 内容区上内边距（px） | 默认 = `contentPadding` |
| `contentPaddingRight` | number | 否 | 内容区右内边距 | 同上 |
| `contentPaddingBottom` | number | 否 | 内容区下内边距 | 同上 |
| `contentPaddingLeft` | number | 否 | 内容区左内边距 | 同上 |
| `bodyPadding` | number | 否 | 页面（body）内边距默认值（px） | 默认 `20` |
| `bodyPaddingTop` | number | 否 | 页面上内边距 | 默认 = `bodyPadding` |
| `bodyPaddingRight` | number | 否 | 页面右内边距 | 同上 |
| `bodyPaddingBottom` | number | 否 | 页面下内边距 | 同上 |
| `bodyPaddingLeft` | number | 否 | 页面左内边距 | 同上 |
| `fontFamily` | string | 是 | 全局字体族，可含引号 | `"'Times New Roman', serif"` |
| `fontSize` | number | 否 | 全局基准字号 | 默认 `12` |
| `fontSizeUnit` | string | 否 | 基准字号单位 | `'px'` 或 `'pt'`，默认 `px` |
| `contentAlign` | string | 是 | 内容区在页面中的水平位置 | `'left'` \| `'center'` \| `'right'` |
| `borderRadius` | number | 否 | 内容区圆角（px） | 默认 `0` |
| `shadowEnabled` | boolean | 否 | 是否为内容区添加阴影 | `false` |
| `shadowX` | number | 否 | 阴影 X 偏移（px） | 默认 `0` |
| `shadowY` | number | 否 | 阴影 Y 偏移（px） | 默认 `2` |
| `shadowBlur` | number | 否 | 阴影模糊半径（px） | 默认 `10` |
| `shadowSpread` | number | 否 | 阴影扩展（px） | 默认 `0` |
| `shadowColor` | string | 否 | 阴影颜色 hex | 默认 `#000000` |
| `shadowOpacity` | number | 否 | 阴影透明度 0–1 | 默认 `0.1` |

---

## 4. `typography` — 文字样式

包含键：`h1`、`h2`、`h3`、`h4`、`h5`、`h6`、`p`、`custom1`–`custom5`。  
每个键使用相同的 **TypographyStyle** 结构，对应 CSS 选择器 `h1`…`p`；`customN` 需配合 `customElements` 绑定到 class。

### 4.1 TypographyStyle 字段表

| 字段 | 类型 | 说明 | 常用值 |
|------|------|------|--------|
| `fontSize` | number | 字号设计值（px 基准，引擎转 em，见 §2） | 正文 `12`，h1 常见 `21–24` |
| `fontWeight` | string | 字重 | `'400'` 常规、`'500'` 中等、`'600'` 半粗、`'700'` 粗体 |
| `color` | string | 文字颜色 hex | `#262626`、`#ffffff` |
| `textAlign` | string | 水平对齐 | `'left'` \| `'center'` \| `'right'` \| `'justify'` |
| `textDecoration` | string | 文字装饰 | `'none'` \| `'underline'` \| `'line-through'` |
| `textDecorationColor` | string | 装饰线颜色 hex | 与 `color` 协调 |
| `marginBottom` | number | 段落下间距（px） | 标题 `10–30`，正文 `18` |
| `lineHeight` | number | 行高倍数（无单位） | 正文 `1.6`，标题 `1.3–1.5` |
| `letterSpacing` | number | 字间距（px） | 通常 `0` |
| `textTransform` | string | 大小写变换 | `'none'` \| `'uppercase'` \| `'lowercase'` \| `'capitalize'` |
| `backgroundColor` | string | 文字背景色 | `'transparent'` 或 hex；空字符串视为无背景 |
| `padding` | number | 内边距（px），0 时不输出 | 提示块可用 `10` |
| `borderRadius` | number | 圆角（px），0 时不输出 | 提示块可用 `4` |
| `borderWidth` | number | 边框宽度（px） | 配合 `borderStyle` 使用 |
| `borderColor` | string | 边框颜色 hex | — |
| `borderStyle` | string | 边框样式 | `'none'` \| `'solid'` \| `'dashed'` \| `'dotted'` |
| `customCSS` | string | 追加 raw CSS 片段 | 一般留空 `""` |

### 4.2 各键对应 Markdown / HTML

| 键 | 作用于 | 说明 |
|----|--------|------|
| `h1`–`h6` | `#` … `######` 标题 | 应严格递减字号，避免 h4 大于 h3 |
| `p` | 段落 `<p>` | 同时影响列表文字颜色（`ul/ol` 继承 `p.color`） |
| `custom1`–`custom5` | 见 `customElements` | 不直接对应 Markdown 语法，绑定 HTML class |

### 4.3 内置主题标题参考（正式版）

| 级别 | fontSize | fontWeight | 说明 |
|------|----------|------------|------|
| h1 | 22 | 600 | 一级章节 |
| h2 | 19 | 600 | 二级章节 |
| h3 | 16 | 600 | 三级小节 |
| h4 | 13 | 500 | 四级 |
| h5 | 12 | 600 | 与正文同大，加粗区分 |
| h6 | 11 | 500 | 略小于正文 |
| p | 12 | 400 | 正文基准 |

---

## 5. `customElements` — 自定义 HTML 块

可选。将 `typography.customN` 的样式应用到 Markdown 内嵌 HTML 的 class 选择器。

| 字段 | 类型 | 说明 |
|------|------|------|
| `enabled` | boolean | `true` 时才生成对应 CSS |
| `name` | string | 编辑器显示名称（如「标题」「副标题」） |
| `selector` | string | CSS 选择器，通常为 class，如 `.title` |

### 5.1 内置主题默认映射

| 键 | name | selector | Markdown 用法 |
|----|------|----------|---------------|
| custom1 | 标题 | `.title` | `<div class="title">文档主标题</div>` |
| custom2 | 副标题 | `.note` | `<div class="note">副标题</div>` |
| custom3 | 介绍 | `.introduction` | `<div class="introduction">引言</div>` |
| custom4 | 成功提示 | `.success` | 默认 `enabled: false` |
| custom5 | 自定义样式 | `.custom` | 默认 `enabled: false` |

> 注意：选择器不要带多余空格（如 `.introduction ` 会导致匹配失败）。

---

## 6. `table` — 表格

| 字段 | 类型 | 说明 | 可选值 / 示例 |
|------|------|------|---------------|
| `width` | string | 表格宽度 | `'100%'` \| `'auto'` |
| `tableLayout` | string | 列宽算法 | `'fixed'` 均分 \| `'auto'` 按内容 |
| `borderMode` | string | 边框模式 | 见下表 |
| `borderColor` | string | 边框颜色 hex | `#dee0e3`、`#ffffff` |
| `borderWidth` | number | 边框宽度（px） | `1` |
| `cellPadding` | number | 单元格内边距（px） | `8` |
| `headerBackground` | string | 表头背景色 | `#244770` 或 `#f5f6f7` |
| `headerColor` | string | 表头文字色 | `#ffffff` 或 `#1f2329` |
| `headerFontWeight` | string | 表头字重 | `'400'`–`'700'` |
| `headerFontSize` | number | 表头字号（px 基准） | 通常 `12` |
| `bodyColor` | string | 表体文字色 | `#262626` |
| `bodyFontWeight` | string | 表体字重 | `'400'` |
| `bodyFontSize` | number | 表体字号（px 基准） | 通常 `12` |
| `zebraStripe` | boolean | 是否斑马纹（仅 tbody 奇偶行） | `true` \| `false` |
| `zebraOddColor` | string | 奇数行背景 | `#ffffff` |
| `zebraEvenColor` | string | 偶数行背景 | `#fafafa` |
| `enableRowMerge` | boolean | 是否启用纵向合并 | 见 §6.2 |
| `enableColMerge` | boolean | 是否启用横向合并 | 见 §6.2 |

### 6.1 `borderMode` 效果

| 值 | 表格外框 | 单元格边框 |
|----|----------|------------|
| `none` | 无 | 无 |
| `all` | 有 | 四边均有 |
| `horizontal` | 上下 | 仅底边 |
| `outer` | 有 | 无（仅外框） |

### 6.2 单元格合并（Markdown 表格）

需 `enableRowMerge` / `enableColMerge` 为 `true`（内置主题默认开启）。

| 标记 / 写法 | 方向 | 规则 |
|-------------|------|------|
| 空单元格 | 纵向 rowspan | 向上合并到最近有内容的单元格 |
| `^^` | 纵向 | 强制向上合并 |
| 空单元格（表头 `th`） | 横向 colspan | 向左合并 |
| `<<` | 横向 | 强制向左合并 |

---

## 7. `codeBlock` — 代码

| 字段 | 类型 | 说明 |
|------|------|------|
| `background` | string | 代码背景色（`<pre>` 与行内 `<code>` 默认背景） |
| `color` | string | 代码文字色 |
| `fontFamily` | string | 等宽字体 | 
| `borderRadius` | number | `<pre>` 圆角（px）；行内 code 固定 4px |

`<pre><code>` 内层 code 无背景，避免双重底色。

---

## 8. `blockquote` — 引用

| 字段 | 类型 | 说明 |
|------|------|------|
| `background` | string | 引用块背景色 |
| `borderColor` | string | 左侧竖条颜色 |
| `borderWidth` | number | 左侧竖条宽度（px） |
| `color` | string | 引用文字颜色 |

固定样式：左竖条 + 内边距 `12px 20px`，下边距 `16px`。

---

## 9. `link` — 超链接

| 字段 | 类型 | 说明 | 可选值 |
|------|------|------|--------|
| `color` | string | 默认链接色 | `#0066cc` |
| `hoverColor` | string | 鼠标悬停颜色 | `#004499` |
| `underline` | string | 下划线策略 | `'none'` \| `'always'` \| `'hover'` |

- `hover`：默认无下划线，悬停时显示下划线（常用）
- `always`：始终下划线
- `none`：始终无下划线

---

## 10. `list` — 列表

| 字段 | 类型 | 说明 |
|------|------|------|
| `itemSpacing` | number | 每个 `<li>` 的下间距（px） |

列表文字颜色取自 `typography.p.color`；左缩进固定 `24px`。

---

## 11. 内置主题对照

通过 `mpr themes list` 查看；文件位于 `themes/manifest.json` 注册。

| ID | 适用场景 | 页面/内容背景 | 正文色 | 表头 | 标题特点 |
|----|----------|---------------|--------|------|----------|
| `有底色` | 赛事规则、正式协议 | 深蓝 `#244770` | 白色 | 深蓝底白字 | 原 Web 导出层级 |
| `无底色` | 简洁排版 | 透明/白 | 白色* | 无表头底色 | 原 Web 导出层级 |
| `正式版` | 在线文档风格 | 白 `#ffffff` | `#262626` | 浅灰 `#f5f6f7` | 语雀/飞书比例 h1–h6 |

\* `无底色` 主题为历史 Web 导出配置，白字配透明底在浏览器中可能不易阅读；正式文档建议优先用 **`正式版`** 或自行指定本地 JSON。

`themes/` 下另有 `RULE_蓝色底.json`、`RULE_无底色.json` 等副本，用法与内置相同：`--theme ./themes/RULE_蓝色底.json`。

---

## 12. 使用方式

```bash
# 内置主题名
mpr convert --md 协议.md --theme 正式版 --out output/协议.html

# 本地 JSON 路径
mpr convert --md 协议.md --theme ./我的主题.json

# AI 生成后保存，再转换
mpr ai    # 对话中输入「保存」
```

AI 生成主题时须输出 **完整 JSON**（含全部必填顶层字段），基于某一内置主题修改，不得只输出片段。

---

## 13. 完整 JSON 骨架示例

```json
{
  "global": { "pageBackground": "#ffffff", "contentBackground": "#ffffff", "contentWidth": 790, "contentPadding": 10, "fontFamily": "'Times New Roman', serif", "fontSizeUnit": "px", "contentAlign": "left" },
  "typography": {
    "p": { "fontSize": 12, "fontWeight": "400", "color": "#262626", "textAlign": "left", "textDecoration": "none", "textDecorationColor": "#333", "marginBottom": 18, "lineHeight": 1.6, "letterSpacing": 0, "textTransform": "none", "backgroundColor": "transparent", "padding": 0, "borderRadius": 0, "borderWidth": 0, "borderColor": "transparent", "borderStyle": "none", "customCSS": "" },
    "h1": { "...": "同 TypographyStyle 结构" },
    "h2": { "...": "" },
    "h3": { "...": "" },
    "h4": { "...": "" },
    "h5": { "...": "" },
    "h6": { "...": "" },
    "custom1": { "...": "" },
    "custom2": { "...": "" },
    "custom3": { "...": "" },
    "custom4": { "...": "" },
    "custom5": { "...": "" }
  },
  "customElements": {
    "custom1": { "enabled": true, "name": "标题", "selector": ".title" },
    "custom2": { "enabled": true, "name": "副标题", "selector": ".note" },
    "custom3": { "enabled": true, "name": "介绍", "selector": ".introduction" },
    "custom4": { "enabled": false, "name": "成功提示", "selector": ".success" },
    "custom5": { "enabled": false, "name": "自定义样式", "selector": ".custom" }
  },
  "table": { "width": "100%", "tableLayout": "fixed", "borderMode": "all", "borderColor": "#dee0e3", "borderWidth": 1, "cellPadding": 8, "headerBackground": "#f5f6f7", "headerColor": "#1f2329", "headerFontWeight": "600", "headerFontSize": 12, "bodyColor": "#262626", "bodyFontWeight": "400", "bodyFontSize": 12, "zebraStripe": false, "zebraOddColor": "#ffffff", "zebraEvenColor": "#fafafa", "enableRowMerge": true, "enableColMerge": true },
  "codeBlock": { "background": "#f6f8fa", "color": "#24292e", "fontFamily": "monospace", "borderRadius": 6 },
  "blockquote": { "background": "#f9f9f9", "borderColor": "#ddd", "borderWidth": 4, "color": "#666" },
  "link": { "color": "#0066cc", "hoverColor": "#004499", "underline": "hover" },
  "list": { "itemSpacing": 8 }
}
```

完整可参考：`themes/正式版.json`。
