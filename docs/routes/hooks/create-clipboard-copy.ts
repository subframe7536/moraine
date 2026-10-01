import { writeClipboard } from '@solid-primitives/clipboard'
import { createSignal, onCleanup } from 'solid-js'

export type ClipboardCopyState = 'idle' | 'copied' | 'failed'

/** Local feedback for a user-initiated copy; never reads or watches the clipboard. */
export function createClipboardCopy(options: { resetAfter?: number } = {}) {
  const [state, setState] = createSignal<ClipboardCopyState>('idle')
  let timer: ReturnType<typeof setTimeout> | undefined
  let attempt = 0
  let disposed = false

  onCleanup(() => {
    disposed = true
    clearTimeout(timer)
  })

  async function copy(source: string | (() => string | Promise<string>)): Promise<void> {
    if (disposed) {
      return
    }
    const currentAttempt = ++attempt
    clearTimeout(timer)
    setState('idle')
    let result: ClipboardCopyState
    try {
      const text = typeof source === 'function' ? await source() : source
      if (disposed || currentAttempt !== attempt) {
        return
      }
      await writeClipboard(text)
      result = 'copied'
    } catch {
      result = 'failed'
    }
    if (disposed || currentAttempt !== attempt) {
      return
    }
    setState(result)
    timer = setTimeout(() => setState('idle'), options.resetAfter ?? 2000)
  }

  return { state, copy }
}
