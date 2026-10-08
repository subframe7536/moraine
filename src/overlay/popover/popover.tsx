import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, mergeProps, on, onCleanup } from 'solid-js'

import { createPopper } from '../base/popper'

import { PopoverClose } from './popover-close'
import { PopoverContent } from './popover-content'
import type { usePopoverContext } from './popover-context'
import { PopoverProvider } from './popover-context'
import { PopoverTrigger } from './popover-trigger'
import type { PopoverProps } from './popover.types'

/** Click-triggered floating content panel anchored to a trigger element. */
export function Popover(props: PopoverProps): JSX.Element {
  const merged = mergeProps(
    {
      mode: 'click' as const,
      openDelay: 100,
      closeDelay: 100,
    },
    props,
  )

  const popper = createPopper(merged, 'popover')
  const [closeRegistrations, setCloseRegistrations] = createSignal<Set<number>>(new Set())
  const hasClose = createMemo(() => closeRegistrations().size > 0)

  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let hoverTimerVersion = 0
  let nextCloseRegistrationId = 0
  let ownerAlive = true

  function clearOpenTimer(): void {
    clearTimeout(openTimer)
    openTimer = undefined
  }

  function clearCloseTimer(): void {
    clearTimeout(closeTimer)
    closeTimer = undefined
  }

  function invalidateHoverTimers(): void {
    hoverTimerVersion += 1
    clearOpenTimer()
    clearCloseTimer()
  }

  function scheduleOpen(): void {
    if (merged.mode !== 'hover' || merged.disabled) {
      return
    }

    clearCloseTimer()
    clearOpenTimer()
    const version = ++hoverTimerVersion
    openTimer = setTimeout(() => {
      if (
        !ownerAlive ||
        version !== hoverTimerVersion ||
        merged.mode !== 'hover' ||
        merged.disabled
      ) {
        return
      }

      openTimer = undefined
      popper.setOpen(true)
    }, merged.openDelay)
  }

  function scheduleClose(): void {
    if (merged.mode !== 'hover' || merged.disabled) {
      return
    }

    clearOpenTimer()
    clearCloseTimer()
    const version = ++hoverTimerVersion
    closeTimer = setTimeout(() => {
      if (
        !ownerAlive ||
        version !== hoverTimerVersion ||
        merged.mode !== 'hover' ||
        merged.disabled
      ) {
        return
      }

      closeTimer = undefined
      popper.setOpen(false)
    }, merged.closeDelay)
  }

  function registerClose(): () => void {
    const registrationId = nextCloseRegistrationId++
    let active = true
    setCloseRegistrations((current) => {
      const next = new Set(current)
      next.add(registrationId)
      return next
    })

    return () => {
      if (!active) {
        return
      }

      active = false
      setCloseRegistrations((current) => {
        const next = new Set(current)
        next.delete(registrationId)
        return next
      })
    }
  }

  createEffect(
    on([() => merged.mode, () => merged.disabled], () => {
      invalidateHoverTimers()
    }),
  )

  onCleanup(() => {
    ownerAlive = false
    invalidateHoverTimers()
  })

  const behavior: ReturnType<typeof usePopoverContext> = {
    options: merged,
    popper,
    scheduleOpen,
    scheduleClose,
    clearCloseTimer,
    invalidateHoverTimers,
    hasClose,
    registerClose,
    get presentation() {
      return { classes: merged.classes, styles: merged.styles }
    },
  }
  return <PopoverProvider value={behavior}>{merged.children}</PopoverProvider>
}

Popover.Trigger = PopoverTrigger
Popover.Content = PopoverContent
Popover.Close = PopoverClose
