/**
 * 非交互转换
 */

import { readFileSync, mkdirSync } from 'node:fs'
import { resolve, join, basename, extname } from 'node:path'
import { runConvert, printPreprocessPreview } from '../lib/convert-core.ts'
import { shouldAiFixOnConvert, describeConvertAiFixStatus } from '../lib/convert-ai-fix.ts'
import { diffPreprocessMarkdown } from '../lib/markdown-preprocess.ts'
import { scanMarkdownDocuments } from '../lib/document-scan.ts'
import { parseConvertArgs } from '../lib/parse-args.ts'

function htmlNameForMd(mdName: string): string {
  return basename(mdName, extname(mdName)) + '.html'
}

function outputPathForMd(outputDir: string, mdName: string): string {
  return join(outputDir, htmlNameForMd(mdName))
}

export function printConvertHelp() {
  console.log(`markpress convert

必需:
  --md <path>         Markdown 文件路径
  --theme <name|path> 内置主题名（有底色 / 无底色）或 .json 路径
                      （仅 --fix-preview 时可省略）

可选:
  --all               转换当前目录全部 Markdown（需 --theme，输出到 --output-dir 或 ./output）
  -t, --theme <name>  内置主题名或 .json 路径
  --out <path>        单文件输出 HTML 路径（与 --all 互斥）
  --output-dir <dir>  批量输出目录（--all 时默认 ./output）
  --custom-js <path>  注入到 </body> 前的 JS 文件
  --ai-fix            显式开启 AI 修复（已配置 API 时默认已自动开启）
  --no-ai-fix         本次转换跳过 AI 修复（仍做规则预处理）
  --no-write-md       修复后不写回源 Markdown（默认会写回）
  --fix-preview       打印规则预处理修复 diff（可与 --ai-fix 联用）
  --no-preprocess     跳过规则预处理（仍可使用 --ai-fix）
  -h, --help          显示帮助

示例:
  markpress convert --md 协议.md --theme 有底色 --out output/协议.html
  markpress convert --md 协议.md --theme ./自定义.json
  markpress convert --md 协议.md --fix-preview
  markpress convert --md 协议.md --theme 有底色 --ai-fix --fix-preview
  markpress convert --all -t 正式版
  mpr c --all -t 正式版
`)
}

/** --all 批量非交互转换（供 mpr convert / mpr c 共用） */
export async function runConvertAllCli(argv: string[]): Promise<void> {
  const {
    theme,
    customJs,
    inputDir,
    outputDir,
    aiFix,
    fixPreview,
    noPreprocess,
    noAiFix,
    noWriteMd,
  } = parseConvertArgs(argv)

  if (!theme) {
    console.error('错误：--all 必须配合 --theme / -t\n')
    printConvertHelp()
    process.exit(1)
  }

  const cwd = resolve(inputDir || process.cwd())
  const mdFiles = scanMarkdownDocuments(cwd).map((f) => f.relativePath)

  if (mdFiles.length === 0) {
    console.error(`未找到 Markdown 文件（${cwd}）`)
    process.exit(1)
  }

  const outBase = resolve(outputDir || process.env.MARKPRESS_OUTPUT || join(cwd, 'output'))
  mkdirSync(outBase, { recursive: true })

  console.log(`主题：${theme}`)
  console.log(`将转换 ${mdFiles.length} 个文件 → ${outBase}`)
  const aiFixHint = describeConvertAiFixStatus()
  if (aiFixHint) console.log(aiFixHint)

  if (mdFiles.length <= 20) {
    for (const name of mdFiles) console.log(`  · ${name}`)
  } else {
    for (const name of mdFiles.slice(0, 15)) console.log(`  · ${name}`)
    console.log(`  … 共 ${mdFiles.length} 个（省略 ${mdFiles.length - 15} 个）`)
  }

  const useAi = shouldAiFixOnConvert({ aiFix, noAiFix })
  let ok = 0
  let fail = 0

  for (const mdName of mdFiles) {
    const outPath = outputPathForMd(outBase, mdName)
    try {
      if (useAi) {
        console.log(`\n· ${mdName}`)
        const result = await runConvert({
          md: mdName,
          theme,
          out: outPath,
          customJs: customJs || undefined,
          cwd,
          aiFix: aiFix || undefined,
          fixPreview,
          noPreprocess,
          noAiFix,
          noWriteMd,
          showFixDiff: true,
        })
        if (result.mdWrittenBack) console.log(`  已写回 ${mdName}`)
        console.log(`✓ ${htmlNameForMd(mdName)}`)
      } else {
        const result = await runConvert({
          md: mdName,
          theme,
          out: outPath,
          customJs: customJs || undefined,
          cwd,
          aiFix: aiFix || undefined,
          fixPreview,
          noPreprocess,
          noAiFix,
          noWriteMd,
          showFixDiff: false,
        })
        const suffix = result.mdWrittenBack ? '（已写回 md）' : ''
        console.log(`✓ ${htmlNameForMd(mdName)}${suffix}`)
      }
      ok++
    } catch (err) {
      console.error(`✗ ${mdName}:`, err instanceof Error ? err.message : err)
      fail++
    }
  }

  if (fail === 0) {
    console.log(`\n全部成功（${ok} 个）→ ${outBase}`)
  } else {
    console.log(`\n完成：成功 ${ok}，失败 ${fail}`)
    process.exit(1)
  }
}

export async function runConvertCli(argv: string[]): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printConvertHelp()
    return
  }

  if (argv.includes('--all')) {
    await runConvertAllCli(argv)
    return
  }

  const { md, theme, out, customJs, aiFix, fixPreview, noPreprocess, noAiFix, noWriteMd } = parseConvertArgs(argv)

  if (!md) {
    console.error('错误：必须提供 --md\n')
    printConvertHelp()
    process.exit(1)
  }

  if (fixPreview && !theme) {
    const mdPath = resolve(process.cwd(), md)
    const raw = readFileSync(mdPath, 'utf-8')
    if (noPreprocess) {
      console.log('规则预处理：已跳过（--no-preprocess）')
    } else {
      const { changes } = diffPreprocessMarkdown(raw)
      printPreprocessPreview(changes, basename(mdPath))
    }
    return
  }

  if (!theme) {
    console.error('错误：必须提供 --theme（若仅预览修复，可加 --fix-preview）\n')
    printConvertHelp()
    process.exit(1)
  }

  const result = await runConvert({
    md,
    theme,
    out: out || undefined,
    customJs: customJs || undefined,
    aiFix: aiFix || undefined,
    fixPreview,
    noPreprocess,
    noAiFix,
    noWriteMd,
  })
  if (result.mdWrittenBack) {
    console.log(`已写回: ${md}`)
  }
  console.log(`已生成: ${result.outPath}`)
}
