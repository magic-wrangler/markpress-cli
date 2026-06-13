import { CompactAiDisplay, isVerboseAiDisplay } from './ai/compact-display.ts'
import { TerminalStreamWriter } from './ai/terminal-stream.ts'

export interface FixStreamDisplay {
  onStream: (chunk: string, kind: 'reasoning' | 'content') => void
  finish: () => void
  fail: () => void
}

/** 与 mpr ai 对话一致的「思考中…」loading */
export function createFixStreamDisplay(initialMessage = '思考中…'): FixStreamDisplay {
  const verbose = isVerboseAiDisplay()

  if (verbose) {
    const writer = new TerminalStreamWriter()
    return {
      onStream: (chunk, kind) => {
        if (kind === 'reasoning') writer.writeReasoning(chunk)
        else writer.writeContent(chunk)
      },
      finish: () => writer.finish(),
      fail: () => writer.finish(),
    }
  }

  const compact = new CompactAiDisplay()
  compact.start(initialMessage)
  return {
    onStream: (chunk, kind) => {
      if (kind === 'reasoning') compact.onReasoning(chunk)
      else compact.onContent(chunk)
    },
    finish: () => compact.finish(),
    fail: () => compact.fail(),
  }
}
