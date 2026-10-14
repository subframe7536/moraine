import { createSignal } from 'solid-js'

import type { FeedbackPending } from './feedback.types'

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
}

export interface ActionRunner {
  pending: () => FeedbackPending | undefined
  run: (
    kind: FeedbackPending,
    event: MouseEvent | undefined,
    action: ((event?: MouseEvent) => void | Promise<unknown>) | undefined,
  ) => Promise<void>
}

/**
 * Runs an action or cancel handler. A returned promise shows `pending` until it
 * settles. A synchronous throw or rejection is reported and leaves the instance
 * open. `preventDefault()` also leaves it open. Otherwise the instance closes
 * with the action kind.
 */
export function createActionRunner(options: {
  closed: () => boolean
  onFinish: (kind: FeedbackPending) => void
}): ActionRunner {
  const [pending, setPending] = createSignal<FeedbackPending | undefined>()
  let current: Promise<void> | undefined

  const run: ActionRunner['run'] = (kind, event, action) => {
    if (options.closed() || pending()) {
      return Promise.resolve()
    }
    let outcome: unknown
    try {
      outcome = action?.(event)
    } catch (error) {
      console.error(error)
      return Promise.resolve()
    }
    if (event?.defaultPrevented) {
      return Promise.resolve()
    }
    if (!isPromiseLike(outcome)) {
      options.onFinish(kind)
      return Promise.resolve()
    }
    setPending(kind)
    const task = Promise.resolve(outcome).then(
      () => {
        if (!options.closed() && !event?.defaultPrevented) {
          options.onFinish(kind)
        }
      },
      (error: unknown) => {
        console.error(error)
        throw error
      },
    )
    const tracked = task.finally(() => {
      if (current === tracked) {
        current = undefined
        setPending(undefined)
      }
    })
    current = tracked
    return tracked
  }

  return { pending, run }
}
