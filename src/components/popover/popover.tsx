import type { JSX } from '@solidjs/web'
import { createEffect } from 'solid-js'

import { mergeDefaults } from '../../shared/utils'
import { createHoverDelay } from '../shared/overlay/hover-delay'
import { createPopper } from '../shared/overlay/popper'

import { PopoverClose } from './popover-close'
import { PopoverContent } from './popover-content'
import type { usePopoverContext } from './popover-context'
import { PopoverProvider } from './popover-context'
import { PopoverTrigger } from './popover-trigger'
import type { PopoverProps } from './popover.types'
/**
 * Floating panel of interactive content anchored to a trigger. Use it for anchored content that
 * does not need a labeled modal surface; use `Tooltip` for a brief non-interactive hint,
 * `DropdownMenu` for a compact action list, and `Dialog` or `Sheet` when the task should take over
 * the page. It is headless (renders no element of its own) and opens on click by default, with
 * `openOnHover` as an alternative; open state is uncontrolled with `defaultOpen` or controlled
 * through `open` and `onOpenChange`.
 *
 * @example
 * ```tsx
 * import { Button, Popover } from 'moraine'
 *
 * <Popover>
 *   <Popover.Trigger as={Button}>Details</Popover.Trigger>
 *   <Popover.Content>More information</Popover.Content>
 * </Popover>
 * ```
 */
export function Popover(props: PopoverProps): JSX.Element {
  const merged = mergeDefaults(
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

  const hoverDelay = createHoverDelay({
    openDelay: () => merged.openDelay,
    closeDelay: () => merged.closeDelay,
    enabled: () => merged.openOnHover && !merged.disabled,
    setOpen: (open) => popper.setOpen(open),
  })

  createEffect(
    () => [(() => merged.openOnHover)(), (() => merged.disabled)()],
    () => {
      hoverDelay.invalidate()
    },
  )

  const behavior: ReturnType<typeof usePopoverContext> = {
    options: merged,
    popper,
    scheduleOpen: hoverDelay.scheduleOpen,
    scheduleClose: hoverDelay.scheduleClose,
    clearCloseTimer: hoverDelay.cancelClose,
    invalidateHoverTimers: hoverDelay.invalidate,
    get slotOverrides() {
      return { classes: merged.classes, styles: merged.styles }
    },
  }
  return <PopoverProvider value={behavior}>{merged.children}</PopoverProvider>
}

Popover.Trigger = PopoverTrigger
Popover.Content = PopoverContent
Popover.Close = PopoverClose
