import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, on, onCleanup, untrack } from 'solid-js'

import type { ToastRecord } from './toast-store'
import type { ToastT } from './toast.types'
import { DEFAULT_TOAST_DURATION } from './toast.types'

export interface CreateToastTimerOptions {
  toast: () => ToastRecord
  options: Accessor<ToastT.Options>
  paused: Accessor<boolean>
  swiping: Accessor<boolean>
  running: Accessor<boolean>
  isLoading: Accessor<boolean>
  onTimeout: () => void
}

export function createToastTimer(options: CreateToastTimerOptions) {
  const [isBumping, setIsBumping] = createSignal(false)
  const [progressEpoch, setProgressEpoch] = createSignal(1)

  const initialDuration = createMemo(() => {
    const dur = options.options().duration
    if (dur !== undefined) {
      return dur
    }
    return options.options().type === 'loading' ? Number.POSITIVE_INFINITY : DEFAULT_TOAST_DURATION
  })

  let remainingTime = untrack(initialDuration)
  let timerId: ReturnType<typeof setTimeout> | undefined
  let bumpTimerId: ReturnType<typeof setTimeout> | undefined
  let closeTimerStartTime = 0

  const stopTimer = () => {
    if (timerId) {
      clearTimeout(timerId)
      timerId = undefined
    }
  }

  const isPaused = () =>
    options.isLoading() ||
    initialDuration() === Number.POSITIVE_INFINITY ||
    options.paused() ||
    options.swiping() ||
    options.running()

  const startTimer = () => {
    stopTimer()
    if (isPaused()) {
      return
    }
    closeTimerStartTime = Date.now()
    if (remainingTime <= 0) {
      options.onTimeout()
      return
    }
    timerId = setTimeout(() => {
      stopTimer()
      options.onTimeout()
    }, remainingTime)
  }

  const resetCloseTimer = () => {
    remainingTime = untrack(initialDuration)
    closeTimerStartTime = 0
    setProgressEpoch((prev) => prev + 1)
  }

  let disposed = false

  const handleBump = () => {
    if (bumpTimerId) {
      clearTimeout(bumpTimerId)
    }
    setIsBumping(false)
    // oxlint-disable-next-line subf/solid-reactivity -- Bump animation reads the latest duration after this paint.
    queueMicrotask(() => {
      if (disposed) {
        return
      }
      setIsBumping(true)
      resetCloseTimer()
      startTimer()
      bumpTimerId = setTimeout(() => {
        setIsBumping(false)
        bumpTimerId = undefined
      }, 240)
    })
  }

  createEffect(
    on(
      () => options.toast().bump,
      (bump) => {
        if (bump !== undefined && bump > 0) {
          handleBump()
        }
      },
      { defer: true },
    ),
  )

  createEffect(
    on(
      initialDuration,
      () => {
        resetCloseTimer()
        startTimer()
      },
      { defer: true },
    ),
  )

  createEffect(
    on(isPaused, (paused) => {
      if (paused) {
        if (closeTimerStartTime > 0) {
          const elapsed = Date.now() - closeTimerStartTime
          remainingTime = Math.max(0, remainingTime - elapsed)
          closeTimerStartTime = 0
        }
        stopTimer()
      } else {
        startTimer()
      }
    }),
  )

  onCleanup(() => {
    disposed = true
    clearTimeout(timerId)
    if (bumpTimerId) {
      clearTimeout(bumpTimerId)
    }
  })

  return {
    isBumping,
    progressEpoch,
    initialDuration,
    isPaused,
  }
}
