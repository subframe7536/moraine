import type { Accessor } from 'solid-js'
import { onCleanup } from 'solid-js'
export interface HoverDelayOptions {
  openDelay: Accessor<number>
  closeDelay: Accessor<number>
  enabled: Accessor<boolean>
  setOpen: (open: boolean) => void
}

export interface HoverDelay {
  scheduleOpen: () => void
  scheduleClose: () => void
  cancelClose: () => void
  invalidate: () => void
}

/** Runs delayed hover open and close requests that survive only while the owner lives. */
export function createHoverDelay(options: HoverDelayOptions): HoverDelay {
  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let timerVersion = 0
  let ownerAlive = true

  function clearOpenTimer(): void {
    clearTimeout(openTimer)
    openTimer = undefined
  }

  function clearCloseTimer(): void {
    clearTimeout(closeTimer)
    closeTimer = undefined
  }

  function invalidate(): void {
    timerVersion += 1
    clearOpenTimer()
    clearCloseTimer()
  }

  function scheduleOpen(): void {
    if (!options.enabled()) {
      return
    }

    clearCloseTimer()
    clearOpenTimer()
    const version = ++timerVersion
    openTimer = setTimeout(() => {
      if (!ownerAlive || version !== timerVersion || !options.enabled()) {
        return
      }

      openTimer = undefined
      options.setOpen(true)
    }, options.openDelay())
  }

  function scheduleClose(): void {
    if (!options.enabled()) {
      return
    }

    clearOpenTimer()
    clearCloseTimer()
    const version = ++timerVersion
    closeTimer = setTimeout(() => {
      if (!ownerAlive || version !== timerVersion || !options.enabled()) {
        return
      }

      closeTimer = undefined
      options.setOpen(false)
    }, options.closeDelay())
  }

  function cancelClose(): void {
    clearCloseTimer()
  }

  onCleanup(() => {
    ownerAlive = false
    invalidate()
  })

  return {
    scheduleOpen,
    scheduleClose,
    cancelClose,
    invalidate,
  }
}
