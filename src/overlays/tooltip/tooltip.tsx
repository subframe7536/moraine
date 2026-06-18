import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, onCleanup } from 'solid-js'

import { Kbd } from '../../elements/kbd'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn } from '../../shared/utils'
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
  export type Extend = Pick<
    PopperProps,
    'id' | 'open' | 'defaultOpen' | 'onOpenChange' | 'disabled' | 'placement' | 'forceMount'
  >

  export interface Item {}

  /**
   * Base props for the Tooltip component.
   */
  export interface Base {
    /**
     * Delay before opening on hover or focus.
     * @default 0
     */
    openDelay?: number

    /**
     * Delay before closing after leaving trigger or content.
     * @default 0
     */
    closeDelay?: number

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
  export interface Props extends BaseProps<Base, Variant, Extend, Classes, Styles> {}
}

/**
 * Props for the Tooltip component.
 */
export interface TooltipProps extends TooltipT.Props {}

/** Hover-triggered informational overlay anchored to a trigger element. */
export function Tooltip(props: TooltipProps): JSX.Element {
  const merged = mergeProps(
    {
      placement: 'top' as const,
      openDelay: 0,
      closeDelay: 0,
      invert: false,
    },
    props,
  )

  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
  })

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
          merged.classes?.content,
        )}
        {...context.contentProps}
      >
        <Show when={typeof merged.text === 'string'} fallback={merged.text}>
          <span
            data-slot="text"
            style={merged.styles?.text}
            class={cn('leading-4 text-pretty', merged.classes?.text)}
          >
            {merged.text}
          </span>
        </Show>

        <Kbd
          variant={merged.invert ? 'invert' : undefined}
          size="sm"
          value={merged.kbds}
          classes={{
            root: [merged.text && 'ms-1', merged.classes?.kbds],
            item: merged.classes?.kbd,
          }}
        />
      </div>
    )
  }

  function scheduleOpen(open: () => void): void {
    if (merged.disabled) {
      return
    }

    clearTimeout(closeTimer)
    closeTimer = undefined
    clearTimeout(openTimer)
    openTimer = setTimeout(() => {
      open()
      openTimer = undefined
    }, merged.openDelay)
  }

  function scheduleClose(close: () => void): void {
    clearTimeout(openTimer)
    openTimer = undefined
    clearTimeout(closeTimer)
    closeTimer = setTimeout(() => {
      close()
      closeTimer = undefined
    }, merged.closeDelay)
  }

  return (
    <Popper
      id={merged.id}
      open={merged.open}
      defaultOpen={merged.defaultOpen}
      onOpenChange={merged.onOpenChange}
      disabled={merged.disabled}
      placement={merged.placement ?? 'top'}
      forceMount={merged.forceMount}
      overflowPadding={4}
      role="tooltip"
      toggleOnClick={false}
      describeTrigger
      trigger={merged.children}
      triggerStyle={merged.styles?.trigger}
      triggerClass={cn(merged.classes?.trigger)}
      onTriggerFocus={({ open }) => {
        scheduleOpen(open)
      }}
      onTriggerBlur={({ close }) => {
        scheduleClose(close)
      }}
      onTriggerPointerEnter={({ open }) => {
        scheduleOpen(open)
      }}
      onTriggerPointerLeave={({ close }) => {
        scheduleClose(close)
      }}
      onContentPointerEnter={() => {
        clearTimeout(closeTimer)
        closeTimer = undefined
      }}
      onContentPointerLeave={({ close }) => {
        scheduleClose(close)
      }}
      content={Content}
    />
  )
}
