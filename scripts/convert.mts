/**
 * 非交互转换
 */

import { runConvert } from '../lib/convert-core.ts'
import { parseConvertArgs } from '../lib/parse-args.ts'

export function printConvertHelp() {
  console.log(`markpress convert

必需:
  --md <path>         Markdown 文件路径
  --theme <name|path> 内置主题名（有底色 / 无底色）或 .json 路径

可选:
  --out <path>        输出 HTML 路径（默认与 md 同目录同名 .html）
  --custom-js <path>  注入到 </body> 前的 JS 文件
  -h, --help          显示帮助

示例:
  markpress convert --md 协议.md --theme 有底色 --out output/协议.html
  markpress convert --md 协议.md --theme ./自定义.json
`)
}

export async function runConvertCli(argv: string[]): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printConvertHelp()
    return
  }

  const { md, theme, out, customJs } = parseConvertArgs(argv)

  if (!md || !theme) {
    console.error('错误：必须提供 --md 和 --theme\n')
    printConvertHelp()
    process.exit(1)
  }

  const { outPath } = await runConvert({ md, theme, out: out || undefined, customJs: customJs || undefined })
  console.log(`已生成: ${outPath}`)
}

