import type { JSX } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { KbdGroup } from '../../elements/kbd/index.ts'
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { cn, useId } from '../../shared/utils.ts'
import { Popper, resolveOverlayMenuSide } from '../base/index.ts'
import type { OverlayMenuSide, PopperContentContext, PopperProps } from '../base/index.ts'
import type { OverlayTriggerProps } from '../base/trigger.ts'

import { tooltipContentVariants } from './tooltip.class.ts'
import type { TooltipVariantProps } from './tooltip.class.ts'

export namespace TooltipT {
  export interface Slot<T = unknown> {
    /** Element that opens the tooltip. */
    trigger?: T

    /** Tooltip bubble positioned next to its trigger. */
    content?: T

    /** Primary text region inside the tooltip bubble. */
    text?: T

    /** Container for shortcut hints displayed beside tooltip text. */
    kbds?: T

    /** Individual keyboard key hint inside the tooltip. */
    kbd?: T
  }

  export interface Variant extends TooltipVariantProps {
    /**
     * Visual side styles applied after the positioned placement is resolved.
     * @default 'top'
     */
    side?: TooltipVariantProps['side']

    /**
     * Whether to use the inverted foreground-on-background color treatment.
     * @default false
     */
    invert?: TooltipVariantProps['invert']
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  /**
   * Base props for the Tooltip component.
   */
  export interface Base extends Pick<
    PopperProps,
    'id' | 'open' | 'defaultOpen' | 'onOpenChange' | 'disabled' | 'placement' | 'forceMount'
  > {
    /**
     * Preferred content placement relative to the trigger.
     * @default 'top'
     */
    placement?: PopperProps['placement']

    /**
     * Delay in milliseconds before opening on hover or focus.
     * @default 600
     */
    openDelay?: number

    /**
     * Delay in milliseconds before closing after leaving trigger or content.
     * @default 200
     */
    closeDelay?: number

    /**
     * Delay in milliseconds to skip the open delay for the next trigger after closing.
     * @default 300
     */
    instantOpenDelay?: number

    /**
     * Primary text content or element to display.
     */
    text?: JSX.Element

    /**
     * Keyboard shortcuts to display next to the text.
     */
    kbds?: string[]

    /** Render the tooltip trigger as a single HTMLElement root. */
    children?: (props: OverlayTriggerProps) => JSX.Element
  }

  /**
   * Props for the Tooltip component.
   */
  export type TriggerProps = OverlayTriggerProps
  export type Props = BaseProps<'span', Base, Variant, Classes, Styles>
}

/**
 * Props for the Tooltip component.
 */
export interface TooltipProps extends TooltipT.Props {}

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
  const [local, rest] = splitProps(props, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'disabled',
    'placement',
    'forceMount',
    'openDelay',
    'closeDelay',
    'instantOpenDelay',
    'side',
    'invert',
    'text',
    'kbds',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const moraine = useMoraineConfig()
  const providerTooltip = () => moraine().tooltip

  const merged = mergeProps(
    {
      placement: 'top' as const,
      openDelay: 600,
      closeDelay: 200,
      instantOpenDelay: 300,
    },
    () => providerTooltip()?.variants,
    local,
  )

  const resolved = resolveComponentStyle({
    get provider() {
      return providerTooltip()
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  const triggerProps = mergeProps(rest as Partial<OverlayTriggerProps>, {
    get class() {
      return resolved.slotClass('trigger')
    },
    get style() {
      return resolved.slotStyle('trigger')
    },
  }) as Partial<OverlayTriggerProps>
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

  function Content(context: PopperContentContext): JSX.Element {
    const text = createMemo(() => merged.text)
    const resolvedSide = createMemo<OverlayMenuSide>(() => {
      const runtimePlacement = context.currentPlacement()

      if (runtimePlacement) {
        return resolveOverlayMenuSide(runtimePlacement)
      }

      if (merged.side) {
        return merged.side
      }

      return resolveOverlayMenuSide(merged.placement)
    })

    return (
      <div
        data-slot="content"
        style={resolved.slotStyle('content')}
        class={tooltipContentVariants(
          { side: resolvedSide(), invert: merged.invert },
          shouldUseInstantMotion()
            ? 'data-expanded:animate-none data-closed:animate-none'
            : undefined,
          resolved.slotClass('content'),
        )}
        {...context.contentProps}
      >
        <Show when={typeof text() === 'string'} fallback={text()}>
          <span
            data-slot="text"
            style={resolved.slotStyle('text')}
            class={cn('leading-4 text-pretty', resolved.slotClass('text'))}
          >
            {text()}
          </span>
        </Show>

        <Show when={merged.kbds?.length ? merged.kbds : undefined}>
          {(value) => (
            <KbdGroup
              variant={merged.invert ? 'invert' : undefined}
              size="sm"
              items={value()}
              style={resolved.slotStyle('kbds')}
              class={cn(
                text() && 'rounded-sm relative z-floating isolate',
                resolved.slotClass('kbds'),
              )}
              classes={{ item: resolved.slotClass('kbd') }}
              styles={{ item: resolved.slotStyle('kbd') }}
            />
          )}
        </Show>
      </div>
    )
  }

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
      <Popper.Trigger
        children={merged.children}
        describeTrigger
        toggleOnClick={false}
        triggerProps={triggerProps}
      />
      <Popper.Content
        positionerClass={
          shouldUseInstantMotion() ? 'data-positioned:transition-transform' : undefined
        }
        contentRender={Content}
      />
    </Popper>
  )
}
