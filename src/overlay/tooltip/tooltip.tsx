import type { Accessor, JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createComponent,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'

import { KbdGroup } from '../../element/kbd'
import { createStyles } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { createContextProvider } from '../../shared/create-context-provider'
import type { ValidComponent } from '../../shared/types'
import { createId } from '../../shared/utils'
import { parseFloatingPlacement } from '../base/placement'
import { createPopper, PopperTrigger, PopperContent, mergePopperElementProps } from '../base/popper'
import type { PopperTriggerProps } from '../base/popper.types'

import { tooltipContentDataAttributes, tooltipRecipe } from './tooltip.recipe'
import type { TooltipProps, TooltipT } from './tooltip.types'

// This wrapper needs library transition styling, but has no stable user/Theme override value.
// Internal visual elements do not become family slots solely because they render DOM.
const TOOLTIP_POSITIONER_CLASS = 'has-[[data-instant-motion]]:data-positioned:transition-transform'

interface TooltipTimers {
  close?: ReturnType<typeof setTimeout>
  open?: ReturnType<typeof setTimeout>
}

interface ActiveTooltip {
  close: () => void
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

function setActiveTooltip(ownerDocument: Document, tooltip: ActiveTooltip): void {
  const scope = getTooltipScope(ownerDocument)
  if (scope.activeTooltip?.id !== tooltip.id) {
    scope.activeTooltip?.close()
  }

  scope.activeTooltip = tooltip
  clearSkipDelay(ownerDocument)
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

const [TooltipProvider, useTooltipContext] = createContextProvider<{
  options: TooltipProps
  popper: ReturnType<typeof createPopper>
  instantMotion: Accessor<boolean>
  scheduleOpen: (fromFocus?: boolean) => void
  scheduleClose: () => void
  dismiss: () => void
  resetPress: () => void
  keepOpen: () => void
  presentation: { classes?: TooltipT.Classes; styles?: TooltipT.Styles }
}>('Tooltip')

/** Hover-triggered informational overlay anchored to a trigger element. */
export function Tooltip(props: TooltipProps): JSX.Element {
  const merged = mergeProps(
    {
      openDelay: 600,
      closeDelay: 200,
      instantOpenDelay: 300,
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

  function closeImmediately(): void {
    invalidateTimers()
    setShouldUseInstantMotion(true)
    if (open()) {
      requestOpen(false)
    }

    if (open()) {
      setShouldUseInstantMotion(false)
    }
  }

  function requestTooltipOpen(instantMotion: boolean): void {
    clearOpenTimer()
    setShouldUseInstantMotion(instantMotion)
    popper.setOpen(true)
  }

  function scheduleOpen(fromFocus = false): void {
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
    timers.open = setTimeout(() => {
      if (!ownerAlive || version !== timerVersion || merged.disabled) {
        return
      }

      requestTooltipOpen(false)
    }, merged.openDelay)
  }

  function scheduleClose(): void {
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
    timers.close = setTimeout(() => {
      if (!ownerAlive || version !== timerVersion || merged.disabled) {
        return
      }

      setShouldUseInstantMotion(false)
      popper.setOpen(false)
      clearCloseTimer()
    }, merged.closeDelay)
  }

  createEffect(
    on(
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
    ),
  )

  createEffect(
    on(ownerDocument, (currentDocument) => {
      const ownerWindow = currentDocument?.defaultView
      if (!ownerWindow) {
        return
      }
      const onWindowBlur = (): void => {
        ignoreNextFocusAfterWindowBlur = true
        clearOpenTimer()
      }
      ownerWindow.addEventListener('blur', onWindowBlur)
      onCleanup(() => ownerWindow.removeEventListener('blur', onWindowBlur))
    }),
  )

  createEffect(
    on([() => open() && !merged.disabled, ownerDocument], ([isResolvedOpen, currentDocument]) => {
      const id = tooltipId()
      if (activeDocument && (activeDocument !== currentDocument || !isResolvedOpen)) {
        clearActiveTooltip(activeDocument, id)
        startSkipDelay(activeDocument, id, merged.instantOpenDelay)
        skipDelayDocuments.add(activeDocument)
        activeDocument = undefined
      }

      if (isResolvedOpen && currentDocument) {
        if (!activeDocument) {
          setActiveTooltip(currentDocument, {
            id,
            close: closeImmediately,
          })
          activeDocument = currentDocument
        }
      }
    }),
  )

  const behavior: ReturnType<typeof useTooltipContext> = {
    options: merged,
    popper,
    instantMotion: shouldUseInstantMotion,
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
    get presentation() {
      return { classes: merged.classes, styles: merged.styles }
    },
  }
  return <TooltipProvider value={behavior}>{merged.children}</TooltipProvider>
}

function TooltipTrigger<T extends ValidComponent = 'button'>(
  props: TooltipT.TriggerProps<T>,
): JSX.Element {
  const context = useTooltipContext()
  const resolved = createStyles(tooltipRecipe, props, {
    rootSlot: 'trigger',
    inheritedStyles: () => context.presentation,
  })
  const popper = context.popper
  const triggerProps = mergeProps(
    mergePopperElementProps<HTMLElement>(
      {
        onPointerDown: context.dismiss,
        onClick: context.dismiss,
        onFocus: () => context.scheduleOpen(true),
        onBlur: () => {
          context.resetPress()
          context.scheduleClose()
        },
        onPointerEnter: (event) => {
          if (event.pointerType === 'mouse' || !event.pointerType) {
            context.resetPress()
            context.scheduleOpen()
          }
        },
        onPointerLeave: (event) => {
          if (event.pointerType === 'mouse' || !event.pointerType) {
            context.scheduleClose()
          }
        },
      },
      props,
    ),
    resolved.styles.trigger,
    { context: popper, toggleOnClick: false, describeTrigger: true },
  ) as PopperTriggerProps<T> & { context: ReturnType<typeof createPopper> }
  return createComponent(PopperTrigger<T>, triggerProps)
}

function TooltipContent(props: TooltipT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'text',
    'kbds',
    'kbdVariant',
    'children',
    'invert',
    'class',
    'style',
    'classes',
    'styles',
  ])

  const behavior = useTooltipContext()
  const contentEvents: JSX.HTMLAttributes<HTMLDivElement> = {
    onPointerEnter: (event) => {
      if (event.pointerType === 'mouse' || !event.pointerType) {
        behavior.keepOpen()
      }
    },
    onPointerLeave: (event) => {
      if (event.pointerType === 'mouse' || !event.pointerType) {
        behavior.scheduleClose()
      }
    },
  }
  const resolved = createStyles(tooltipRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => behavior.presentation,
  })
  return (
    <PopperContent
      context={behavior.popper}
      align={behavior.options.align}
      placement={behavior.options.placement ?? 'top'}
      forceMount={behavior.options.forceMount}
      overflowPadding={4}
      role="tooltip"
      restoreFocusOnClose={false}
      positionerClass={TOOLTIP_POSITIONER_CLASS}
    >
      {(context) => {
        const contentProps = mergeProps(context.contentProps, contentEvents)
        const explicitText = createMemo(() => local.text)
        const text = createMemo(() => {
          const value = explicitText()
          return value === undefined ? resolveChildren(() => local.children)() : value
        })
        const kbds = createMemo(() => local.kbds)
        const contentDataAttrs = tooltipContentDataAttributes({
          side: () => parseFloatingPlacement(context.currentPlacement()).side,
          align: () => parseFloatingPlacement(context.currentPlacement()).align,
          instantMotion: behavior.instantMotion,
        })
        return (
          <div
            {...mergePopperElementProps(contentProps, rest)}
            data-slot="tooltip-content"
            {...contentDataAttrs}
            {...resolved.styles.content}
          >
            <Show when={typeof text() === 'string'} fallback={text()}>
              <span data-slot="tooltip-text" {...resolved.styles.text}>
                {text()}
              </span>
            </Show>
            <Show when={kbds()?.length ? kbds() : undefined}>
              {(keys) => (
                <KbdGroup
                  data-slot="tooltip-kbds"
                  variant={local.kbdVariant ?? (resolved.variants.invert ? 'invert' : undefined)}
                  size="sm"
                  items={keys()}
                  {...resolved.styles.kbds}
                />
              )}
            </Show>
          </div>
        )
      }}
    </PopperContent>
  )
}

Tooltip.Trigger = TooltipTrigger
Tooltip.Content = TooltipContent
