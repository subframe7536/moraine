import type { JSX, ValidComponent } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createComponent,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
  useContext,
} from 'solid-js'

import { KbdGroup } from '../../elements/kbd/index.ts'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useId } from '../../shared/utils.ts'
import { Popper, resolveOverlayMenuSide } from '../base/index.ts'
import { mergePopperContentProps } from '../base/popper.tsx'
import type { PopperContentContext } from '../base/popper.tsx'

import type { TooltipProps, TooltipT } from './tooltip.types.ts'

export type { TooltipProps, TooltipT } from './tooltip.types.ts'

const TooltipMotionContext = createContext<() => boolean>(() => false)

interface TooltipTimers {
  close?: ReturnType<typeof setTimeout>
  open?: ReturnType<typeof setTimeout>
}

interface ActiveTooltip {
  close: () => void
  id: string
  skipsOpenDelay: boolean
}

interface TooltipSkipDelay {
  id: string
  timer: ReturnType<typeof setTimeout>
}

let activeTooltip: ActiveTooltip | undefined
let skipDelay: TooltipSkipDelay | undefined

function clearSkipDelay(id?: string): void {
  if (id && skipDelay?.id !== id) {
    return
  }

  clearTimeout(skipDelay?.timer)
  skipDelay = undefined
}

function startSkipDelay(id: string, duration: number): void {
  clearSkipDelay()

  if (duration <= 0) {
    return
  }

  skipDelay = {
    id,
    timer: setTimeout(() => {
      clearSkipDelay(id)
    }, duration),
  }
}

function setActiveTooltip(tooltip: ActiveTooltip): void {
  if (activeTooltip?.id !== tooltip.id) {
    activeTooltip?.close()
  }

  activeTooltip = tooltip
  clearSkipDelay()
}

function clearActiveTooltip(id: string): void {
  if (activeTooltip?.id === id) {
    activeTooltip = undefined
  }
}

function shouldOpenImmediately(): boolean {
  return Boolean(activeTooltip?.skipsOpenDelay || skipDelay)
}

/** Hover-triggered informational overlay anchored to a trigger element. */
export function Tooltip(props: TooltipProps): JSX.Element {
  const merged = mergeProps(
    {
      placement: 'top' as const,
      openDelay: 600,
      closeDelay: 200,
      instantOpenDelay: 300,
    },
    props,
  )

  const tooltipId = useId(() => merged.id, 'tooltip')
  const [open, setOpen] = useControllableValue<boolean>({
    value: () => merged.open,
    defaultValue: () => merged.defaultOpen ?? false,
  })
  const timers: TooltipTimers = {}
  const [shouldUseInstantMotion, setShouldUseInstantMotion] = createSignal(false)
  let ownerAlive = true
  let timerVersion = 0
  let wasResolvedOpen = false
  let wasOpenedByInteraction = false
  let disabledInitialized = false
  let wasDisabled = false

  onCleanup(() => {
    ownerAlive = false
    invalidateTimers()
    clearActiveTooltip(tooltipId())
    clearSkipDelay(tooltipId())
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
    requestOpen(false)

    if (open()) {
      setShouldUseInstantMotion(false)
    }
  }

  function requestTooltipOpen(openTooltip: () => void, instantMotion: boolean): void {
    clearOpenTimer()
    setShouldUseInstantMotion(instantMotion)
    openTooltip()
  }

  function scheduleOpen(openTooltip: () => void, isOpen: boolean): void {
    if (merged.disabled) {
      return
    }

    clearCloseTimer()
    clearOpenTimer()

    if (isOpen) {
      return
    }

    wasOpenedByInteraction = true

    if (shouldOpenImmediately()) {
      requestTooltipOpen(openTooltip, true)
      return
    }

    if (merged.openDelay <= 0) {
      requestTooltipOpen(openTooltip, false)
      return
    }

    setShouldUseInstantMotion(false)
    const version = ++timerVersion
    timers.open = setTimeout(() => {
      if (!ownerAlive || version !== timerVersion || merged.disabled) {
        return
      }

      requestTooltipOpen(openTooltip, false)
    }, merged.openDelay)
  }

  function scheduleClose(close: () => void, isOpen: boolean): void {
    clearOpenTimer()

    if (!isOpen) {
      setShouldUseInstantMotion(false)
      return
    }

    clearCloseTimer()

    if (merged.closeDelay <= 0) {
      setShouldUseInstantMotion(false)
      close()
      return
    }

    const version = ++timerVersion
    timers.close = setTimeout(() => {
      if (!ownerAlive || version !== timerVersion || merged.disabled) {
        return
      }

      setShouldUseInstantMotion(false)
      close()
      clearCloseTimer()
    }, merged.closeDelay)
  }

  createEffect(() => {
    const disabled = Boolean(merged.disabled)

    if (disabledInitialized && disabled && !wasDisabled) {
      invalidateTimers()
      setShouldUseInstantMotion(false)

      if (open()) {
        requestOpen(false)
      }
    }

    wasDisabled = disabled
    disabledInitialized = true
  })

  createEffect(() => {
    const isResolvedOpen = Boolean(open()) && !merged.disabled

    if (isResolvedOpen) {
      if (!wasResolvedOpen) {
        setActiveTooltip({
          id: tooltipId(),
          close: closeImmediately,
          skipsOpenDelay: wasOpenedByInteraction,
        })
      }

      wasResolvedOpen = true
      return
    }

    if (wasResolvedOpen) {
      wasResolvedOpen = false
      clearActiveTooltip(tooltipId())
      startSkipDelay(tooltipId(), merged.instantOpenDelay)
    }
  })

  return (
    <Popper
      id={tooltipId()}
      open={open()}
      onOpenChange={requestOpen}
      disabled={merged.disabled}
      placement={merged.placement ?? 'top'}
      forceMount={merged.forceMount}
      overflowPadding={4}
      role="tooltip"
      toggleOnClick={false}
      restoreFocusOnClose={false}
      describeTrigger
      onTriggerFocus={(props) => {
        scheduleOpen(props.open, props.isOpen)
      }}
      onTriggerBlur={(props) => {
        scheduleClose(props.close, props.isOpen)
      }}
      onTriggerPointerEnter={(props, event) => {
        if (event.pointerType === 'mouse' || !event.pointerType) {
          scheduleOpen(props.open, props.isOpen)
        }
      }}
      onTriggerPointerLeave={(props, event) => {
        if (event.pointerType === 'mouse' || !event.pointerType) {
          scheduleClose(props.close, props.isOpen)
        }
      }}
      onContentPointerEnter={(_, event) => {
        if (event.pointerType === 'mouse' || !event.pointerType) {
          clearCloseTimer()
          clearSkipDelay(tooltipId())
        }
      }}
      onContentPointerLeave={(props, event) => {
        if (event.pointerType === 'mouse' || !event.pointerType) {
          scheduleClose(props.close, props.isOpen)
        }
      }}
    >
      <TooltipMotionContext.Provider value={shouldUseInstantMotion}>
        {merged.children}
      </TooltipMotionContext.Provider>
    </Popper>
  )
}

function TooltipTrigger<T extends ValidComponent = 'button'>(
  props: TooltipT.TriggerProps<T>,
): JSX.Element {
  const design = useMoraineDesign()
  const resolved = resolveComponentStyle({
    rootSlot: 'trigger',
    design: {
      get classes() {
        return design().tooltip.recipe()
      },
    },
    get instance() {
      return props
    },
  })
  const triggerProps = mergeProps(props, resolved.rootClassAndStyle()) as TooltipT.TriggerProps<T>
  return createComponent(Popper.Anchor<T>, triggerProps)
}

function TooltipContent(props: TooltipT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'text',
    'kbds',
    'children',
    'side',
    'invert',
    'class',
    'style',
    'classes',
    'styles',
    'ref',
  ])
  const design = useMoraineDesign()
  const instantMotion = useContext(TooltipMotionContext)
  const merged = mergeProps(() => design().tooltip.defaultVariants, local)
  const positioner = resolveComponentStyle({
    design: {
      get classes() {
        return design().tooltip.recipe()
      },
    },
    get instance() {
      return { classes: local.classes, styles: local.styles }
    },
  })
  function Content(context: PopperContentContext): JSX.Element {
    const explicitText = createMemo(() => local.text)
    const text = createMemo(() => {
      const value = explicitText()
      return value === undefined ? resolveChildren(() => local.children)() : value
    })
    const kbds = createMemo(() => local.kbds)
    const resolved = resolveComponentStyle({
      rootSlot: 'content',
      design: {
        get classes() {
          return design().tooltip.recipe({
            side: resolveOverlayMenuSide(context.currentPlacement() || merged.side || 'top'),
            invert: merged.invert,
          })
        },
      },
      get instance() {
        return local
      },
    })
    const surfaceProps = mergeProps(rest, {
      get ref() {
        return local.ref
      },
    }) as JSX.HTMLAttributes<HTMLDivElement>
    const contentProps = mergePopperContentProps(context.contentProps, surfaceProps)
    return (
      <div
        {...contentProps}
        data-slot="content"
        data-instant-motion={instantMotion() ? '' : undefined}
        {...resolved.rootClassAndStyle()}
      >
        <Show when={typeof text() === 'string'} fallback={text()}>
          <span data-slot="text" {...resolved.slotClassAndStyle('text')}>
            {text()}
          </span>
        </Show>
        <Show when={kbds()?.length ? kbds() : undefined}>
          {(keys) => (
            <KbdGroup
              variant={merged.invert ? 'invert' : undefined}
              size="sm"
              items={keys()}
              {...resolved.slotClassAndStyle('kbds')}
              classes={{ item: resolved.slotClass('kbd') }}
              styles={{ item: resolved.slotStyle('kbd') }}
            />
          )}
        </Show>
      </div>
    )
  }
  return (
    <Popper.Content
      contentRender={Content}
      positionerClass={positioner.slotClass('positioner')}
      positionerStyle={positioner.slotStyle('positioner')}
    />
  )
}

Tooltip.Trigger = TooltipTrigger
Tooltip.Content = TooltipContent
