/** 是否显示完整流式思考/回复（默认折叠，避免刷屏） */
export function isVerboseAiDisplay(): boolean {
  return (
    process.env.MARKPRESS_AI_VERBOSE === '1' ||
    process.env.DEEPSEEK_SHOW_THINKING === '1'
  )
}

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

/**
 * 紧凑模式：仅写 stdout，不占用 stdin（避免与 readline 冲突）
 */
export class CompactAiDisplay {
  private timer: ReturnType<typeof setInterval> | null = null
  private frame = 0
  private message = '等待回复…'
  private reasoningChars = 0
  private contentChars = 0
  private started = false

  start(): void {
    if (this.started) return
    this.started = true
    this.timer = setInterval(() => {
      const icon = FRAMES[this.frame++ % FRAMES.length]
      process.stdout.write(`\r\x1b[2K${icon} ${this.message}`)
    }, 80)
  }

  private setMessage(msg: string): void {
    this.message = msg
    if (!this.started) this.start()
  }

  onReasoning(chunk: string): void {
    this.reasoningChars += chunk.length
    this.setMessage(`思考中… (${this.reasoningChars} 字)`)
  }

  onContent(chunk: string): void {
    this.contentChars += chunk.length
    if (this.reasoningChars > 0) {
      this.setMessage(`生成回复… (${this.contentChars} 字)`)
    } else {
      this.setMessage(`生成中… (${this.contentChars} 字)`)
    }
  }

  finish(_hasTheme?: boolean): void {
    if (!this.started) return
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    process.stdout.write('\r\x1b[2K')
    this.started = false
  }

  fail(): void {
    if (!this.started) return
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    process.stdout.write('\r\x1b[2K')
    console.log('✗ 请求失败')
    this.started = false
  }
}
