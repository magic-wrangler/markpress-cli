/**
 * 终端流式输出（配合 DeepSeek SSE）
 */

const DIM = '\x1b[90m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'

export class TerminalStreamWriter {
  private reasoningOpen = false
  private contentOpen = false

  beginReasoning(): void {
    if (this.reasoningOpen) return
    this.reasoningOpen = true
    process.stdout.write(`\n${DIM}┌ 思考过程${RESET}\n${DIM}│ ${RESET}`)
  }

  writeReasoning(chunk: string): void {
    if (!chunk) return
    if (!this.reasoningOpen) this.beginReasoning()
    process.stdout.write(chunk)
  }

  endReasoning(): void {
    if (!this.reasoningOpen) return
    process.stdout.write('\n')
    this.reasoningOpen = false
  }

  beginContent(): void {
    if (this.contentOpen) return
    this.contentOpen = true
    process.stdout.write(`\n${CYAN}┌ 回复${RESET}\n${CYAN}│ ${RESET}`)
  }

  writeContent(chunk: string): void {
    if (!chunk) return
    if (!this.contentOpen) this.beginContent()
    process.stdout.write(chunk)
  }

  endContent(): void {
    if (!this.contentOpen) return
    process.stdout.write('\n\n')
    this.contentOpen = false
  }

  finish(): void {
    this.endReasoning()
    this.endContent()
  }
}
