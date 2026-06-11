import * as readline from 'node:readline'
import { stdin as input, stdout as output } from 'node:process'
import * as p from '@clack/prompts'

const DIM = '\x1b[2m'
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const RESET = '\x1b[0m'

export class ChatInterruptError extends Error {
  constructor() {
    super('interrupted')
    this.name = 'ChatInterruptError'
  }
}

export function isChatInterrupt(err: unknown): err is ChatInterruptError {
  return err instanceof ChatInterruptError
}

export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { name?: string; code?: string }
  return e.name === 'AbortError' || e.code === 'ABORT_ERR'
}

/** 单行聊天输入，避免 clack text 的多层框线 */
export class ChatPrompt {
  private rl: readline.Interface | null = null
  private pendingReject: ((err: ChatInterruptError) => void) | null = null

  private open(): readline.Interface {
    if (this.rl && !this.rl.closed) return this.rl

    this.rl = readline.createInterface({ input, output, terminal: true })

    this.rl.on('SIGINT', () => {
      this.pendingReject?.(new ChatInterruptError())
      this.pendingReject = null
      this.release()
    })

    return this.rl
  }

  /** 释放 readline，供 clack 向导/表单接管终端 */
  release(): void {
    if (this.rl && !this.rl.closed) {
      this.rl.close()
    }
    this.rl = null
    this.pendingReject = null
  }

  ask(): Promise<string> {
    const rl = this.open()
    return new Promise((resolve, reject) => {
      this.pendingReject = reject
      rl.question(`${CYAN}>${RESET} `, (answer) => {
        this.pendingReject = null
        resolve(answer)
      })
    })
  }

  close(): void {
    this.release()
  }
}

export function printAiReply(text: string): void {
  const trimmed = text.trim()
  if (!trimmed) return
  console.log(`${DIM}AI${RESET}`)
  for (const line of trimmed.split('\n')) {
    console.log(`  ${line}`)
  }
  console.log()
}

/** 本地指令结果，不用 AI 标签 */
export function printLocalReply(text: string): void {
  const trimmed = text.trim()
  if (!trimmed) return
  for (const line of trimmed.split('\n')) {
    console.log(`  ${line}`)
  }
  console.log()
}

export function printHint(title: string, lines: string[]): void {
  console.log(`${DIM}${title}${RESET}`)
  for (const line of lines) {
    console.log(`${DIM}  ${line}${RESET}`)
  }
  console.log()
}

export function printThemePreview(text: string): void {
  const trimmed = text.trim()
  if (!trimmed) return
  console.log(`${DIM}${trimmed.split('\n')[0]}${RESET}`)
  for (const line of trimmed.split('\n').slice(1)) {
    if (line.trim()) console.log(`${DIM}${line}${RESET}`)
  }
  console.log()
}

export function printStatus(kind: 'ok' | 'warn' | 'info', message: string): void {
  const prefix =
    kind === 'ok' ? `${GREEN}✓${RESET}` : kind === 'warn' ? `${DIM}!${RESET}` : `${DIM}·${RESET}`
  console.log(`${prefix} ${message}`)
}

/** clack 交互前释放 readline，结束后由下次 ask() 自动重建 */
export async function withClackUi<T>(chat: ChatPrompt, run: () => Promise<T>): Promise<T> {
  chat.release()
  return run()
}

/** 在对话中短暂使用 clack spinner（转换等） */
export async function withSpinner<T>(
  chat: ChatPrompt,
  label: string,
  run: () => Promise<T>
): Promise<T> {
  chat.release()
  const spin = p.spinner()
  spin.start(label)
  try {
    const result = await run()
    spin.stop()
    return result
  } catch (err) {
    spin.stop('失败')
    throw err
  }
}

/** 等待异步操作期间监听 Ctrl+C */
export function bindAbortOnSigint(abort: AbortController): () => void {
  const onSigint = () => abort.abort()
  process.once('SIGINT', onSigint)
  return () => process.off('SIGINT', onSigint)
}
