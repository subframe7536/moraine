import type { Coords } from '@floating-ui/dom'
import type { JSX } from '@solidjs/web'
import { createEffect, createSignal, onCleanup } from 'solid-js'

import { createControllableValue } from '../../shared/controllable-value'
import { attachEventListener } from '../../shared/event-listener'
import { createId, mergeDefaults, settle } from '../../shared/utils'
import { createPopper } from '../shared/overlay/popper'

import { TooltipContent } from './tooltip-content'
import type { useTooltipContext } from './tooltip-context'
import { TooltipProvider } from './tooltip-context'
import { TooltipTrigger } from './tooltip-trigger'
import type { TooltipProps } from './tooltip.types'
interface TooltipTimers {
  close?: ReturnType<typeof setTimeout>
  open?: ReturnType<typeof setTimeout>
}

interface ActiveTooltip {
  close: () => boolean
  getPosition: () => Coords | undefined
  id: string
}

interface TooltipSkipDelay {
  id: string
  timer: number
}

interface TooltipScope {
  activeTooltip?: ActiveTooltip
  skipDelay?: TooltipSkipDelay
}

const tooltipScopes = new WeakMap<Document, TooltipScope>()

function getTooltipScope(ownerDocument: Document): TooltipScope {
  let scope = tooltipScopes.get(ownerDocument)
  if (!scope) {
    scope = {}
    tooltipScopes.set(ownerDocument, scope)
  }
  return scope
}

function clearSkipDelay(ownerDocument: Document, id?: string): void {
  const scope = getTooltipScope(ownerDocument)
  if (id && scope.skipDelay?.id !== id) {
    return
  }

  ownerDocument.defaultView?.clearTimeout(scope.skipDelay?.timer)
  scope.skipDelay = undefined
}

function startSkipDelay(ownerDocument: Document, id: string, duration: number): void {
  clearSkipDelay(ownerDocument)

  const ownerWindow = ownerDocument.defaultView
  if (duration <= 0 || !ownerWindow) {
    return
  }

  getTooltipScope(ownerDocument).skipDelay = {
    id,
    timer: ownerWindow.setTimeout(() => {
      clearSkipDelay(ownerDocument, id)
    }, duration),
  }
}

function setActiveTooltip(ownerDocument: Document, tooltip: ActiveTooltip): Coords | undefined {
  const scope = getTooltipScope(ownerDocument)
  let initialPosition: Coords | undefined
  if (scope.activeTooltip?.id !== tooltip.id) {
    const previous = scope.activeTooltip
    const position = previous?.getPosition()
    if (previous !== undefined) {
      previous.close()
      initialPosition = position
    }
  }

  scope.activeTooltip = tooltip
  clearSkipDelay(ownerDocument)
  return initialPosition
}

function clearActiveTooltip(ownerDocument: Document, id: string): void {
  const scope = getTooltipScope(ownerDocument)
  if (scope.activeTooltip?.id === id) {
    scope.activeTooltip = undefined
  }
}

function shouldOpenImmediately(ownerDocument: Document | undefined): boolean {
  const scope = ownerDocument && tooltipScopes.get(ownerDocument)
  return Boolean(scope?.activeTooltip || scope?.skipDelay)
}

/**
 * Hover- and focus-triggered informational overlay anchored to a trigger element. Compose
 * `Tooltip.Trigger` and `Tooltip.Content` inside it; the root renders no DOM element itself. Use
 * it for supplemental, non-interactive hints, `Popover` when the content is interactive, and
 * `Dialog` or `Sheet` for a task that should take over the page. Do not rely on tooltip text as
 * the only accessible name of a control. Uncontrolled by default; use `open`, `defaultOpen`, and
 * `onOpenChange` to control it.
 *
 * @example
 * ```tsx
 * import { Button, Tooltip } from 'moraine'
 *
 * <Tooltip placement="bottom">
 *   <Tooltip.Trigger as={Button} leading="i-lucide:save">
 *     Save
 *   </Tooltip.Trigger>
 *   <Tooltip.Content kbds={['command', 's']}>Save changes</Tooltip.Content>
 * </Tooltip>
 * ```
 */
export function Tooltip(props: TooltipProps): JSX.Element {
  const merged = mergeDefaults(
    {
      openDelay: 600,
      closeDelay: 200,
      skipDelay: 300,
      gutter: 4,
      overflowPadding: 4,
    },
    props,
  )

  const tooltipId = createId(() => merged.id, 'tooltip')
  const [open, setOpen] = createControllableValue<boolean>({
    value: () => merged.open,
    defaultValue: () => merged.defaultOpen ?? false,
  })
  const popper = createPopper(
    {
      get id() {
        return tooltipId()
      },
      get open() {
        return open()
      },
      onOpenChange: requestOpen,
      get disabled() {
        return merged.disabled
      },
    },
    'tooltip',
  )
  const ownerDocument = () => popper.triggerElement()?.ownerDocument
  const timers: TooltipTimers = {}
  const [shouldUseInstantMotion, setShouldUseInstantMotion] = createSignal(false)
  const [initialPosition, setInitialPosition] = createSignal<Coords>()
  let ownerAlive = true
  let timerVersion = 0
  let activeDocument: Document | undefined
  const skipDelayDocuments = new Set<Document>()
  let dismissedByPress = false
  let disabledInitialized = false
  let wasDisabled = false
  let ignoreNextFocusAfterWindowBlur = false

  onCleanup(() => {
    ownerAlive = false
    invalidateTimers()
    if (activeDocument) {
      clearActiveTooltip(activeDocument, tooltipId())
    }
    for (const ownerDocument of skipDelayDocuments) {
      clearSkipDelay(ownerDocument, tooltipId())
    }
  })

  function clearOpenTimer(): void {
    clearTimeout(timers.open)
    timers.open = undefined
  }

  function clearCloseTimer(): void {
    clearTimeout(timers.close)
    timers.close = undefined
  }

  function invalidateTimers(): void {
    timerVersion += 1
    clearOpenTimer()
    clearCloseTimer()
  }

  function requestOpen(nextOpen: boolean): void {
    setOpen(nextOpen)
    merged.onOpenChange?.(nextOpen)
  }

  function closeImmediately(): boolean {
    return settle(() => closeImmediatelyInner())
  }

  function closeImmediatelyInner(): boolean {
    invalidateTimers()
    setShouldUseInstantMotion(true)
    if (open()) {
      requestOpen(false)
    }

    // Staged writes are invisible to `open()`: an uncontrolled close always
    // takes effect at the next settle; a controlled one only if the parent
    // accepts it, so fall back to the committed read.
    const closed = merged.open === undefined || !open()
    if (!closed) {
      setShouldUseInstantMotion(false)
    }
    return closed
  }

  function requestTooltipOpen(instantMotion: boolean): void {
    clearOpenTimer()
    setShouldUseInstantMotion(instantMotion)
    popper.setOpen(true)
  }

  function scheduleOpen(fromFocus = false): void {
    settle(() => scheduleOpenInner(fromFocus))
  }

  function scheduleOpenInner(fromFocus = false): void {
    if (fromFocus && ignoreNextFocusAfterWindowBlur) {
      ignoreNextFocusAfterWindowBlur = false
      return
    }

    if (!fromFocus) {
      ignoreNextFocusAfterWindowBlur = false
    }

    if (merged.disabled || dismissedByPress) {
      return
    }

    clearCloseTimer()
    clearOpenTimer()

    if (popper.isOpen()) {
      return
    }

    if (shouldOpenImmediately(ownerDocument())) {
      requestTooltipOpen(true)
      return
    }

    if (merged.openDelay <= 0) {
      requestTooltipOpen(false)
      return
    }

    setShouldUseInstantMotion(false)
    const version = ++timerVersion
    timers.open = setTimeout(
      () =>
        settle(() => {
          if (!ownerAlive || version !== timerVersion || merged.disabled) {
            return
          }

          requestTooltipOpen(false)
        }),
      merged.openDelay,
    )
  }

  function scheduleClose(): void {
    settle(() => scheduleCloseInner())
  }

  function scheduleCloseInner(): void {
    clearOpenTimer()

    if (!popper.isOpen()) {
      setShouldUseInstantMotion(false)
      return
    }

    clearCloseTimer()

    if (merged.closeDelay <= 0) {
      setShouldUseInstantMotion(false)
      popper.setOpen(false)
      return
    }

    const version = ++timerVersion
    timers.close = setTimeout(
      () =>
        settle(() => {
          if (!ownerAlive || version !== timerVersion || merged.disabled) {
            return
          }

          setShouldUseInstantMotion(false)
          popper.setOpen(false)
          clearCloseTimer()
        }),
      merged.closeDelay,
    )
  }

  createEffect(
    () => Boolean(merged.disabled),
    (disabled) => {
      if (disabledInitialized && disabled && !wasDisabled) {
        invalidateTimers()
        setShouldUseInstantMotion(false)

        if (open()) {
          requestOpen(false)
        }
      }

      wasDisabled = disabled
      disabledInitialized = true
    },
  )

  createEffect(ownerDocument, (currentDocument) => {
    const ownerWindow = currentDocument?.defaultView
    if (!ownerWindow) {
      return
    }
    return attachEventListener(ownerWindow, 'blur', () => {
      ignoreNextFocusAfterWindowBlur = true
      clearOpenTimer()
    })
  })

  createEffect(
    () => [(() => open() && !merged.disabled)(), ownerDocument()],
    ([isResolvedOpen, currentDocument]) => {
      const id = tooltipId()
      if (activeDocument && (activeDocument !== currentDocument || !isResolvedOpen)) {
        clearActiveTooltip(activeDocument, id)
        startSkipDelay(activeDocument, id, merged.skipDelay)
        skipDelayDocuments.add(activeDocument)
        activeDocument = undefined
      }

      if (isResolvedOpen && currentDocument) {
        if (!activeDocument) {
          const position = setActiveTooltip(currentDocument, {
            id,
            close: closeImmediately,
            getPosition: () => {
              const positioner = popper.contentElement()?.parentElement
              if (!positioner?.isConnected) {
                return undefined
              }
              const style = currentDocument.defaultView?.getComputedStyle(positioner)
              if (style?.visibility !== 'visible' || style.display === 'none') {
                return undefined
              }
              const rect = positioner.getBoundingClientRect()
              return { x: rect.left, y: rect.top }
            },
          })
          setInitialPosition(position)
          if (position) {
            setShouldUseInstantMotion(true)
          }
          activeDocument = currentDocument
        }
      }
    },
  )

  const behavior: ReturnType<typeof useTooltipContext> = {
    options: merged,
    popper,
    instantMotion: shouldUseInstantMotion,
    initialPosition,
    scheduleOpen,
    scheduleClose,
    dismiss: () => {
      dismissedByPress = true
      closeImmediately()
    },
    resetPress: () => {
      dismissedByPress = false
    },
    keepOpen: () => {
      clearCloseTimer()
      const currentDocument = ownerDocument()
      if (currentDocument) {
        clearSkipDelay(currentDocument, tooltipId())
      }
    },
    get slotOverrides() {
      return { classes: merged.classes, styles: merged.styles }
    },
  }
  return <TooltipProvider value={behavior}>{merged.children}</TooltipProvider>
}

Tooltip.Trigger = TooltipTrigger
Tooltip.Content = TooltipContent
