import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, mergeProps, on } from 'solid-js'

import { createHoverDelay } from '../shared/overlay/hover-delay'
import { createPopper } from '../shared/overlay/popper'

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
      openOnHover: false,
      openDelay: 100,
      closeDelay: 100,
      gutter: 4,
      overflowPadding: 4,
    },
    props,
  )

  const popper = createPopper(merged, 'popover')
  const [closeRegistrations, setCloseRegistrations] = createSignal<Set<number>>(new Set())
  const hasClose = createMemo(() => closeRegistrations().size > 0)

  const hoverDelay = createHoverDelay({
    openDelay: () => merged.openDelay,
    closeDelay: () => merged.closeDelay,
    enabled: () => merged.openOnHover && !merged.disabled,
    setOpen: (open) => popper.setOpen(open),
  })

  let nextCloseRegistrationId = 0

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
    on([() => merged.openOnHover, () => merged.disabled], () => {
      hoverDelay.invalidate()
    }),
  )

  const behavior: ReturnType<typeof usePopoverContext> = {
    options: merged,
    popper,
    scheduleOpen: hoverDelay.scheduleOpen,
    scheduleClose: hoverDelay.scheduleClose,
    clearCloseTimer: hoverDelay.cancelClose,
    invalidateHoverTimers: hoverDelay.invalidate,
    hasClose,
    registerClose,
    get slotOverrides() {
      return { classes: merged.classes, styles: merged.styles }
    },
  }
  return <PopoverProvider value={behavior}>{merged.children}</PopoverProvider>
}

Popover.Trigger = PopoverTrigger
Popover.Content = PopoverContent
Popover.Close = PopoverClose
