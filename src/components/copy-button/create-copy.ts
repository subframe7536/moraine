import { isServer } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { createMemo, createSignal, onCleanup, untrack } from 'solid-js'

export type CopyData = string | ClipboardItem | Array<ClipboardItem>

export type CopySource = CopyData | Promise<CopyData> | (() => CopyData | Promise<CopyData>)

export type CopyStatus = 'idle' | 'copied' | 'error'

export interface CreateCopyOptions {
  /**
   * Document owning the element that triggers the copy. Used for the execCommand
   * fallback so it targets the same document as the invoking element.
   */
  ownerDocument?: Accessor<Document | undefined>

  /**
   * Default source value to copy if none is provided to `copy()`.
   */
  value?: CopySource

  /**
   * Delay in milliseconds before the 'copied' or 'error' status returns to 'idle'.
   * @default 2000
   */
  resetDelay?: number | (() => number | undefined)

  /**
   * Callback invoked when a copy succeeds.
   */
  onCopySuccess?: (data: CopyData) => void

  /**
   * Callback invoked when a copy fails.
   */
  onCopyError?: (error: unknown) => void

  /**
   * Callback invoked with the new status whenever the copy status changes. It is not called when
   * the status stays the same, such as a copy starting while the status is already `'idle'`.
   */
  onStatusChange?: (status: CopyStatus) => void
}

export interface CreateCopyReturn {
  /**
   * Whether the last copy was successful and the duration is still active.
   */
  isCopied: Accessor<boolean>

  /**
   * Whether the last copy failed and the duration is still active.
   */
  isError: Accessor<boolean>

  /**
   * Current copy status: 'idle' | 'copied' | 'error'.
   */
  status: Accessor<CopyStatus>

  /**
   * Triggers copy operation with automatic fallback to command.
   */
  copy: (data?: CopySource) => Promise<boolean>

  /**
   * Resets the status back to 'idle' and clears active timers.
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
}

export function isClipboardItem(item: unknown): item is ClipboardItem {
  return !isServer && typeof ClipboardItem !== 'undefined' && item instanceof ClipboardItem
}

export function copyWithCommand(text: string, ownerDocument?: Document): boolean {
  if (isServer || (ownerDocument === undefined && typeof document === 'undefined')) {
    return false
  }

  const doc = ownerDocument ?? document
  const element = doc.createElement('textarea')
  element.value = text
  element.setAttribute('readonly', '')
  element.style.contain = 'strict'
  element.style.position = 'fixed'
  element.style.left = '-9999px'
  element.style.top = '-9999px'
  element.style.opacity = '0'
  element.style.fontSize = '16px'

  const selection = doc.getSelection()
  const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
  const container = doc.body ?? doc.documentElement
  container.append(element)
  element.select()
  element.setSelectionRange(0, text.length)

  let successful = false
  try {
    successful = doc.execCommand('copy')
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

export async function fallbackToCommand(
  data: CopyData,
  ownerDocument?: Document,
): Promise<boolean> {
  if (isServer || (ownerDocument === undefined && typeof window === 'undefined')) {
    return false
  }

  if (typeof data === 'string') {
    return copyWithCommand(data, ownerDocument)
  }

  const items = Array.isArray(data) ? data : [data]
  for (const item of items) {
    const types = isClipboardItem(item)
      ? item.types
      : item &&
          typeof item === 'object' &&
          'types' in item &&
          Array.isArray((item as Record<string, unknown>).types)
        ? (item as { types: ReadonlyArray<string> }).types
        : undefined

    if (types) {
      const textType = types.find((t: string) => t === 'text/plain' || t.startsWith('text/'))
      if (textType && typeof item.getType === 'function') {
        try {
          // oxlint-disable-next-line eslint/no-await-in-loop -- Clipboard items are fallback candidates and must be tried in order.
          const blob = await item.getType(textType)
          // oxlint-disable-next-line eslint/no-await-in-loop -- The selected blob must finish before deciding whether to try the next item.
          const text = await blob.text()
          if (typeof text === 'string') {
            return copyWithCommand(text, ownerDocument)
          }
        } catch {
          // Fall through to next item or JSON fallback
        }
      }
    }
  }

  try {
    const jsonText = JSON.stringify(data)
    return copyWithCommand(jsonText, ownerDocument)
  } catch {
    return false
  }
}

export async function writeClipboardWithFallback(
  data: CopyData,
  ownerDocument?: Document,
): Promise<boolean> {
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

  return fallbackToCommand(data, ownerDocument)
}

function isCopySupported(): boolean {
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

export function createCopy(options: CreateCopyOptions = {}): CreateCopyReturn {
  const [status, setStatus] = createSignal<CopyStatus>('idle')
  const [error, setError] = createSignal<unknown>(undefined)

  let timer: ReturnType<typeof setTimeout> | undefined
  let attempt = 0
  let disposed = false

  onCleanup(() => {
    disposed = true
    clearTimeout(timer)
  })

  function notifyStatus(nextStatus: CopyStatus) {
    if (untrack(status) === nextStatus) {
      return
    }
    setStatus(nextStatus)
    options.onStatusChange?.(nextStatus)
  }

  function reset() {
    clearTimeout(timer)
    notifyStatus('idle')
    setError(undefined)
  }

  const isCopied = createMemo(() => status() === 'copied')
  const isError = createMemo(() => status() === 'error')

  function resolveDuration(): number {
    const val = typeof options.resetDelay === 'function' ? options.resetDelay() : options.resetDelay
    return val ?? 2000
  }

  const isSupported = isCopySupported

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
    notifyStatus('idle')

    let resolvedData: CopyData
    try {
      const maybePromise = typeof targetSource === 'function' ? targetSource() : targetSource
      resolvedData =
        maybePromise instanceof Promise ||
        (Boolean(maybePromise) &&
          typeof (maybePromise as unknown as { then?: unknown }).then === 'function')
          ? await maybePromise
          : maybePromise
      if (disposed || currentAttempt !== attempt) {
        return false
      }

      const success = await writeClipboardWithFallback(resolvedData, options.ownerDocument?.())
      if (disposed || currentAttempt !== attempt) {
        return false
      }

      if (!success) {
        throw new Error('Copy operation failed')
      }

      notifyStatus('copied')
      options.onCopySuccess?.(resolvedData)

      const duration = resolveDuration()
      timer = setTimeout(() => {
        if (!disposed && currentAttempt === attempt) {
          notifyStatus('idle')
        }
      }, duration)

      return true
    } catch (error_) {
      if (disposed || currentAttempt !== attempt) {
        return false
      }

      setError(error_)
      notifyStatus('error')
      options.onCopyError?.(error_)

      const duration = resolveDuration()
      timer = setTimeout(() => {
        if (!disposed && currentAttempt === attempt) {
          notifyStatus('idle')
        }
      }, duration)

      return false
    }
  }

  return {
    isCopied,
    isError,
    status,
    copy,
    reset,
    error,
    isSupported,
  }
}
