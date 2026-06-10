export interface ConvertArgs {
  md: string
  theme: string
  out: string
  customJs: string
  inputDir: string
  outputDir: string
}

export function parseConvertArgs(argv: string[]): ConvertArgs {
  let md = ''
  let theme = ''
  let out = ''
  let customJs = ''
  let inputDir = ''
  let outputDir = ''

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const next = argv[i + 1]
    if (arg === '--md' && next) {
      md = next
      i++
    } else if (arg === '--theme' && next) {
      theme = next
      i++
    } else if (arg === '--out' && next) {
      out = next
      i++
    } else if (arg === '--custom-js' && next) {
      customJs = next
      i++
    } else if (arg === '--input-dir' && next) {
      inputDir = next
      i++
    } else if (arg === '--output-dir' && next) {
      outputDir = next
      i++
    }
  }

  return { md, theme, out, customJs, inputDir, outputDir }
}
