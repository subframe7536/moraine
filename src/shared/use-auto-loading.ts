import type { JSX } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { createMemo, createSignal, flush } from 'solid-js'

import { callHandler } from './utils'
function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
}

interface UseAutoLoadingClickOptions<T, E extends Event> {
  loading?: Accessor<boolean | undefined>
  autoLoading?: Accessor<boolean | undefined>
  onClick?: JSX.EventHandlerUnion<T, E>
}

export function useAutoLoadingClick<T, E extends Event = MouseEvent>(
  options: UseAutoLoadingClickOptions<T, E>,
): {
  isLoading: Accessor<boolean>
  onClick: JSX.EventHandler<T, E>
} {
  const [pendingActionCount, setPendingActionCount] = createSignal(0)

  const isLoading = createMemo(() =>
    Boolean(options.loading?.() || (options.autoLoading?.() && pendingActionCount() > 0)),
  )

  const decrement = (): void => {
    setPendingActionCount((count) => Math.max(0, count - 1))
  }

  const onClick: JSX.EventHandler<T, E> = (event) => {
    const { defaultPrevented, result: handlerResult } = callHandler<E>(event, options.onClick)

    if (!options.autoLoading?.() || defaultPrevented || !isPromiseLike(handlerResult)) {
      return
    }

    flush(() => setPendingActionCount((count) => count + 1))
    void Promise.resolve(handlerResult).then(decrement, decrement)
  }

  return {
    isLoading,
    onClick,
  }
}
