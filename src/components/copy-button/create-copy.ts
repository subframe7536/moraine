import type { Accessor } from 'solid-js'
import { createMemo, createSignal, onCleanup } from 'solid-js'
import { isServer } from 'solid-js/web'

export type CopyData = string | ClipboardItem | ClipboardItem[]

export type CopySource = CopyData | (() => CopyData)

export type CopyState = 'idle' | 'copied' | 'failed'

export interface CreateCopyOptions {
  /**
   * Default source value to copy if none is provided to `copy()`.
   */
  value?: CopySource

  /**
   * Duration in milliseconds to hold the 'copied' state before returning to 'idle'.
   * @default 2000
   */
  copiedDuration?: number | (() => number | undefined)

  /**
   * Callback invoked when a copy succeeds.
   */
  onCopy?: (data: CopyData) => void

  /**
   * Callback invoked when a copy fails.
   */
  onError?: (error: unknown) => void

  /**
   * Callback invoked when the copy status changes.
   */
  onStatusChange?: (details: { copied: boolean; state: CopyState; data?: CopyData }) => void
}

export interface CreateCopyReturn {
  /**
   * Whether the last copy was successful and the duration is still active.
   */
  copied: Accessor<boolean>

  /**
   * Current copy state: 'idle' | 'copied' | 'failed'.
   */
  state: Accessor<CopyState>

  /**
   * Triggers copy operation with automatic fallback to command.
   */
  copy: (data?: CopySource) => Promise<boolean>

  /**
   * Resets the state back to 'idle' and clears active timers.
   */
  reset: () => void

  /**
   * The last error if copy failed.
   */
  error: Accessor<unknown>

  /**
   * Whether clipboard operations are supported in the current environment.
   */
  isSupported: Accessor<boolean>

  /**
   * The last copied data.
   */
  data: Accessor<CopyData | undefined>
}

export function isClipboardItem(item: unknown): item is ClipboardItem {
  return !isServer && typeof ClipboardItem !== 'undefined' && item instanceof ClipboardItem
}

export function copyWithCommand(text: string): boolean {
  if (isServer || typeof document === 'undefined') {
    return false
  }

  const element = document.createElement('textarea')
  element.value = text
  element.setAttribute('readonly', '')
  element.style.contain = 'strict'
  element.style.position = 'fixed'
  element.style.left = '-9999px'
  element.style.top = '-9999px'
  element.style.opacity = '0'
  element.style.fontSize = '16px'

  const selection = document.getSelection()
  const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
  const container = document.body ?? document.documentElement
  container.appendChild(element)
  element.select()
  element.setSelectionRange(0, text.length)

  let successful = false
  try {
    successful = document.execCommand('copy')
  } catch {
    successful = false
  } finally {
    container.removeChild(element)
    if (originalRange && selection) {
      selection.removeAllRanges()
      selection.addRange(originalRange)
    }
  }

  return successful
}

export async function fallbackToCommand(data: CopyData): Promise<boolean> {
  if (isServer || typeof window === 'undefined') {
    return false
  }

  if (typeof data === 'string') {
    return copyWithCommand(data)
  }

  const items = Array.isArray(data) ? data : [data]
  for (const item of items) {
    const types = isClipboardItem(item)
      ? item.types
      : item &&
          typeof item === 'object' &&
          'types' in item &&
          Array.isArray((item as Record<string, unknown>).types)
        ? (item as { types: readonly string[] }).types
        : undefined

    if (types) {
      const textType = types.find((t: string) => t === 'text/plain' || t.startsWith('text/'))
      if (textType && typeof item.getType === 'function') {
        try {
          const blob = await item.getType(textType)
          const text = await blob.text()
          if (typeof text === 'string') {
            return copyWithCommand(text)
          }
        } catch {
          // Fall through to next item or JSON fallback
        }
      }
    }
  }

  try {
    const jsonText = JSON.stringify(data)
    return copyWithCommand(jsonText)
  } catch {
    return false
  }
}

export async function writeClipboardWithFallback(data: CopyData): Promise<boolean> {
  if (isServer || typeof window === 'undefined') {
    return false
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      if (typeof data === 'string') {
        if (typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(data)
          return true
        }
      } else if (typeof navigator.clipboard.write === 'function') {
        const items = Array.isArray(data) ? data : [data]
        await navigator.clipboard.write(items)
        return true
      }
    } catch {
      // Modern clipboard call failed, proceed to legacy command fallback
    }
  }

  return fallbackToCommand(data)
}

export function createCopy(options: CreateCopyOptions = {}): CreateCopyReturn {
  const [state, setState] = createSignal<CopyState>('idle')
  const [error, setError] = createSignal<unknown>(undefined)
  const [data, setData] = createSignal<CopyData | undefined>(undefined)

  let timer: ReturnType<typeof setTimeout> | undefined
  let attempt = 0
  let disposed = false

  onCleanup(() => {
    disposed = true
    clearTimeout(timer)
  })

  function notifyStatus(nextState: CopyState, currentData?: CopyData) {
    setState(nextState)
    options.onStatusChange?.({
      copied: nextState === 'copied',
      state: nextState,
      data: currentData,
    })
  }

  function reset() {
    clearTimeout(timer)
    notifyStatus('idle', data())
    setError(undefined)
  }

  const copied = createMemo(() => state() === 'copied')

  function resolveDuration(): number {
    const val =
      typeof options.copiedDuration === 'function'
        ? options.copiedDuration()
        : options.copiedDuration
    return val ?? 2000
  }

  const isSupported = () => {
    if (isServer || typeof window === 'undefined') {
      return false
    }
    return (
      (typeof navigator !== 'undefined' &&
        Boolean(navigator.clipboard) &&
        (typeof navigator.clipboard.writeText === 'function' ||
          typeof navigator.clipboard.write === 'function')) ||
      (typeof document !== 'undefined' && typeof document.execCommand === 'function')
    )
  }

  async function copy(source?: CopySource): Promise<boolean> {
    if (disposed || isServer) {
      return false
    }

    const targetSource = source ?? options.value
    if (targetSource === undefined) {
      return false
    }

    const currentAttempt = ++attempt
    clearTimeout(timer)
    setError(undefined)
    notifyStatus('idle', undefined)

    let resolvedData: CopyData
    try {
      resolvedData = typeof targetSource === 'function' ? targetSource() : targetSource
      if (disposed || currentAttempt !== attempt) {
        return false
      }

      const success = await writeClipboardWithFallback(resolvedData)
      if (disposed || currentAttempt !== attempt) {
        return false
      }

      if (!success) {
        throw new Error('Copy operation failed')
      }

      setData(resolvedData)
      notifyStatus('copied', resolvedData)
      options.onCopy?.(resolvedData)

      const duration = resolveDuration()
      timer = setTimeout(() => {
        if (!disposed && currentAttempt === attempt) {
          notifyStatus('idle', resolvedData)
        }
      }, duration)

      return true
    } catch (err) {
      if (disposed || currentAttempt !== attempt) {
        return false
      }

      setError(err)
      notifyStatus('failed', undefined)
      options.onError?.(err)

      const duration = resolveDuration()
      timer = setTimeout(() => {
        if (!disposed && currentAttempt === attempt) {
          notifyStatus('idle', undefined)
        }
      }, duration)

      return false
    }
  }

  return {
    copied,
    state,
    copy,
    reset,
    error,
    isSupported,
    data,
  }
}
