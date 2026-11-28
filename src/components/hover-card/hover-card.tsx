import type { Coords } from '@floating-ui/dom'
import type { JSX } from '@solidjs/web'
import { createEffect, createSignal } from 'solid-js'

import { attachEventListener } from '../../shared/event-listener'
import { createId } from '../../shared/utils'
import { createHoverDelay } from '../shared/overlay/hover-delay'
import { createPopper } from '../shared/overlay/popper'

import { HoverCardContent } from './hover-card-content'
import type { HoverCardContextValue } from './hover-card-context'
import { HoverCardProvider, useHoverCardContext } from './hover-card-context'
import { HoverCardTrigger } from './hover-card-trigger'
import type { HoverCardProps } from './hover-card.types'
/**
 * Headless root for a preview card that opens on hover or keyboard focus of a link trigger. Use it
 * to preview the destination of a link, `Tooltip` for a brief non-interactive hint, and `Popover`
 * for content the user must reach and operate. The content is supplementary: it is not reachable
 * by keyboard or announced to screen readers, so the same information must exist at the link
 * destination. Open state can be controlled with `open` / `onOpenChange`, or left uncontrolled
 * with `defaultOpen`.
 *
 * @example
 * ```tsx
 * import { HoverCard } from 'moraine'
 *
 * <HoverCard placement="top" openDelay={300}>
 *   <HoverCard.Trigger href="/u/alex.morgan">@alex.morgan</HoverCard.Trigger>
 *   <HoverCard.Content>Author profile preview</HoverCard.Content>
 * </HoverCard>
 * ```
 */
export function HoverCard(props: HoverCardProps): JSX.Element {
  const parent = useHoverCardContext()
  const hoverCardId = createId(() => props.id, 'hover-card')
  const popper = createPopper(
    {
      get id() {
        return hoverCardId()
      },
      get open() {
        return props.open
      },
      get defaultOpen() {
        return props.defaultOpen
      },
      onOpenChange: (nextOpen) => props.onOpenChange?.(nextOpen),
      get disabled() {
        return props.disabled
      },
    },
    'hover-card',
  )
  const ownerDocument = () => popper.triggerElement()?.ownerDocument
  const hoverDelay = createHoverDelay({
    openDelay: () => props.openDelay ?? 600,
    closeDelay: () => props.closeDelay ?? 300,
    enabled: () => !props.disabled,
    setOpen: (open) => popper.setOpen(open),
  })
  const [instantMotion, setInstantMotion] = createSignal(false)
  const [openedByTrigger, setOpenedByTrigger] = createSignal(false)
  const [inlinePoint, setInlinePoint] = createSignal<Coords>()
  const [activeValue, setActiveValue] = createSignal<string>()
  let ignoreNextFocusAfterWindowBlur = false
  let triggerOpenPending = false

  function scheduleOpen(fromFocus = false): void {
    if (fromFocus && ignoreNextFocusAfterWindowBlur) {
      ignoreNextFocusAfterWindowBlur = false
      return
    }

    if (!fromFocus) {
      ignoreNextFocusAfterWindowBlur = false
    }

    if (props.disabled) {
      return
    }

    parent?.cancelClose()
    hoverDelay.cancelClose()
    if (popper.isOpen()) {
      return
    }

    triggerOpenPending = true
    setInstantMotion(fromFocus)
    hoverDelay.scheduleOpen()
  }

  function scheduleClose(): void {
    triggerOpenPending = false
    setInstantMotion(false)
    parent?.scheduleClose()
    hoverDelay.scheduleClose()
  }

  function cancelClose(): void {
    parent?.cancelClose()
    hoverDelay.cancelClose()
  }

  createEffect(popper.isOpen, (open) => {
    if (open) {
      if (triggerOpenPending) {
        setOpenedByTrigger(true)
      }
      triggerOpenPending = false
      return
    }

    triggerOpenPending = false
    setOpenedByTrigger(false)
    setInlinePoint(undefined)
  })

  createEffect(
    () => Boolean(props.disabled),
    () => {
      hoverDelay.invalidate()
    },
  )

  createEffect(ownerDocument, (currentDocument) => {
    const ownerWindow = currentDocument?.defaultView
    if (!ownerWindow) {
      return
    }
    return attachEventListener(ownerWindow, 'blur', () => {
      ignoreNextFocusAfterWindowBlur = true
      hoverDelay.invalidate()
    })
  })

  const behavior: HoverCardContextValue = {
    options: props,
    popper,
    instantMotion,
    openedByTrigger,
    inlinePoint,
    activeValue,
    activateTrigger: (value, element) => {
      popper.setTriggerElement(element)
      setActiveValue(value)
    },
    scheduleOpen,
    scheduleClose,
    cancelClose,
    recordPoint: (x, y) => setInlinePoint({ x, y }),
    markInstantClose: () => setInstantMotion(true),
    get slotOverrides() {
      return { classes: props.classes, styles: props.styles }
    },
  }
  return <HoverCardProvider value={behavior}>{props.children}</HoverCardProvider>
}

HoverCard.Trigger = HoverCardTrigger
HoverCard.Content = HoverCardContent
