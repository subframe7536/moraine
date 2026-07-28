import type { JSX } from 'solid-js'
import { Show, createMemo, createSignal, mergeProps, onCleanup, splitProps } from 'solid-js'

import { KbdGroup } from '../../elements/kbd'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn, useId } from '../../shared/utils'
import { Popper, resolveOverlayMenuSide } from '../base'
import type { OverlayMenuSide, PopperContentContext, PopperProps } from '../base'

import { tooltipContentVariants } from './tooltip.class'
import type { TooltipVariantProps } from './tooltip.class'

export namespace TooltipT {
  export interface Slot<T = unknown> {
    /** Tooltip bubble positioned next to its trigger. */
    content?: T

    /** Element that receives hover or focus interactions for the tooltip. */
    trigger?: T

    /** Primary text region inside the tooltip bubble. */
    text?: T

    /** Container for shortcut hints displayed beside tooltip text. */
    kbds?: T

    /** Individual keyboard key hint inside the tooltip. */
    kbd?: T
  }
  export type Variant = TooltipVariantProps
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

    /**
     * The reference element that triggers the tooltip.
     */
    children: JSX.Element
  }

  /**
   * Props for the Tooltip component.
   */
  export type Props = BaseProps<'span', Base, Variant, Slot>
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
  return Boolean(activeTooltip || skipDelay)
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
  const merged = mergeProps(
    {
      placement: 'top' as const,
      openDelay: 600,
      closeDelay: 200,
      instantOpenDelay: 300,
    },
    local,
  )
  const text = createMemo(() => merged.text)

  const tooltipId = useId(() => merged.id, 'tooltip')
  const timers: TooltipTimers = {}
  const [shouldUseInstantMotion, setShouldUseInstantMotion] = createSignal(false)

  onCleanup(() => {
    clearTimeout(timers.open)
    clearTimeout(timers.close)
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

  function closeImmediately(close: () => void): void {
    clearOpenTimer()
    clearCloseTimer()
    setShouldUseInstantMotion(true)
    close()
    clearActiveTooltip(tooltipId())
  }

  function openTooltip(open: () => void, close: () => void, instantMotion: boolean): void {
    clearOpenTimer()
    setShouldUseInstantMotion(instantMotion)
    setActiveTooltip({
      id: tooltipId(),
      close: () => {
        closeImmediately(close)
      },
    })
    open()
  }

  function scheduleOpen(open: () => void, close: () => void): void {
    if (merged.disabled) {
      return
    }

    clearCloseTimer()

    if (shouldOpenImmediately()) {
      openTooltip(open, close, true)
      return
    }

    clearOpenTimer()

    if (merged.openDelay <= 0) {
      openTooltip(open, close, false)
      return
    }

    setShouldUseInstantMotion(false)
    timers.open = setTimeout(() => {
      openTooltip(open, close, false)
    }, merged.openDelay)
  }

  function scheduleClose(close: () => void, isOpen: boolean): void {
    clearOpenTimer()

    if (!isOpen) {
      setShouldUseInstantMotion(false)
      return
    }

    startSkipDelay(tooltipId(), merged.instantOpenDelay)
    clearCloseTimer()

    if (merged.closeDelay <= 0) {
      setShouldUseInstantMotion(false)
      close()
      clearActiveTooltip(tooltipId())
      return
    }

    timers.close = setTimeout(() => {
      setShouldUseInstantMotion(false)
      close()
      clearActiveTooltip(tooltipId())
      clearCloseTimer()
    }, merged.closeDelay)
  }

  function Content(context: PopperContentContext): JSX.Element {
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
        style={merged.styles?.content}
        class={tooltipContentVariants(
          { side: resolvedSide(), invert: merged.invert },
          shouldUseInstantMotion()
            ? 'data-expanded:animate-none data-closed:animate-none'
            : undefined,
          merged.classes?.content,
        )}
        {...context.contentProps}
      >
        <Show when={typeof text() === 'string'} fallback={text()}>
          <span
            data-slot="text"
            style={merged.styles?.text}
            class={cn('leading-4 text-pretty', merged.classes?.text)}
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
              class={cn(text() && 'ms-1', merged.classes?.kbds)}
              classes={{ item: merged.classes?.kbd }}
            />
          )}
        </Show>
      </div>
    )
  }

  return (
    <Popper
      id={tooltipId()}
      open={merged.open}
      defaultOpen={merged.defaultOpen}
      onOpenChange={(open) => {
        if (!open) {
          clearActiveTooltip(tooltipId())
        }

        merged.onOpenChange?.(open)
      }}
      disabled={merged.disabled}
      placement={merged.placement ?? 'top'}
      forceMount={merged.forceMount}
      overflowPadding={4}
      role="tooltip"
      toggleOnClick={false}
      restoreFocusOnClose={false}
      describeTrigger
      trigger={merged.children}
      triggerProps={rest}
      triggerStyle={{ ...merged.styles?.trigger, ...merged.style }}
      triggerClass={cn(merged.classes?.trigger, merged.class)}
      positionerClass={
        shouldUseInstantMotion()
          ? 'data-positioned:transition-transform data-positioned:duration-150 data-positioned:ease-out'
          : undefined
      }
      transitionMode={shouldUseInstantMotion() ? 'none' : 'both'}
      onTriggerFocus={(props) => {
        scheduleOpen(props.open, props.close)
      }}
      onTriggerBlur={(props) => {
        scheduleClose(props.close, props.isOpen)
      }}
      onTriggerPointerEnter={(props) => {
        scheduleOpen(props.open, props.close)
      }}
      onTriggerPointerLeave={(props) => {
        scheduleClose(props.close, props.isOpen)
      }}
      onContentPointerEnter={() => {
        clearCloseTimer()
        clearSkipDelay(tooltipId())
      }}
      onContentPointerLeave={(props) => {
        scheduleClose(props.close, props.isOpen)
      }}
      content={Content}
    />
  )
}
