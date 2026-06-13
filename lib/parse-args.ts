export interface ConvertArgs {
  md: string
  theme: string
  out: string
  customJs: string
  inputDir: string
  outputDir: string
  all: boolean
  aiFix: boolean
  fixPreview: boolean
  noPreprocess: boolean
  noAiFix: boolean
  noWriteMd: boolean
}

export function parseConvertArgs(argv: string[]): ConvertArgs {
  let md = ''
  let theme = ''
  let out = ''
  let customJs = ''
  let inputDir = ''
  let outputDir = ''
  let all = false
  let aiFix = false
  let fixPreview = false
  let noPreprocess = false
  let noAiFix = false
  let noWriteMd = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const next = argv[i + 1]
    if (arg === '--md' && next) {
      md = next
      i++
    } else if ((arg === '--theme' || arg === '-t') && next) {
      theme = next
      i++
    } else if (arg === '--all') {
      all = true
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
    } else if (arg === '--ai-fix') {
      aiFix = true
    } else if (arg === '--no-ai-fix') {
      noAiFix = true
    } else if (arg === '--fix-preview') {
      fixPreview = true
    } else if (arg === '--no-preprocess') {
      noPreprocess = true
    } else if (arg === '--no-write-md') {
      noWriteMd = true
    }
  }

  return {
    md,
    theme,
    out,
    customJs,
    inputDir,
    outputDir,
    all,
    aiFix,
    fixPreview,
    noPreprocess,
    noAiFix,
    noWriteMd,
  }
}
