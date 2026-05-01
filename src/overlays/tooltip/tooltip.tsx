import * as KobalteTooltip from '@kobalte/core/tooltip'
import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import { Kbd } from '../../elements/kbd'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'
import { createCurrentPlacement } from '../shared-overlay-menu/create-current-placement'
import type { OverlayMenuPlacement, OverlayMenuSide } from '../shared-overlay-menu/utils'

import { tooltipContentVariants } from './tooltip.class'
import type { TooltipVariantProps } from './tooltip.class'

type TooltipPlacementChangeHandler = (placement: string) => void

type TooltipRootProps = JSX.HTMLAttributes<HTMLDivElement> & {
  id?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  triggerOnFocusOnly?: boolean
  openDelay?: number
  closeDelay?: number
  skipDelayDuration?: number
  ignoreSafeArea?: boolean
  forceMount?: boolean
  placement?: OverlayMenuPlacement
  gutter?: number
  onCurrentPlacementChange?: TooltipPlacementChangeHandler
}

const TooltipRootWithPlacement = KobalteTooltip.Root as unknown as (
  props: KobalteTooltip.TooltipRootProps & {
    onCurrentPlacementChange?: TooltipPlacementChangeHandler
  },
) => JSX.Element
// Kobalte's Tooltip root forwards unknown popper props to Popper.Root, but the
// public root type omits this callback. Keep the bridge local until the full
// primitive layer replaces the upstream root typing entirely.

export namespace TooltipT {
  export type Slot = 'content' | 'trigger' | 'text' | 'kbds' | 'kbd'
  export type Variant = TooltipVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = TooltipRootProps

  export interface Item {}

  /**
   * Base props for the Tooltip component.
   */
  export interface Base {
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
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
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
  const [local, rest] = splitProps(merged, [
    'side',
    'invert',
    'text',
    'kbds',
    'classes',
    'styles',
    'children',
    'placement',
    'onCurrentPlacementChange',
  ])
  const placement = createCurrentPlacement({
    fallbackPlacement: () => (local.placement ?? local.side ?? 'top') as OverlayMenuPlacement,
    onChange: local.onCurrentPlacementChange,
  })

  function Content(): JSX.Element {
    return (
      <KobalteTooltip.Content
        data-slot="content"
        style={local.styles?.content}
        class={tooltipContentVariants(
          { side: placement.resolvedSide() as OverlayMenuSide, invert: local.invert },
          local.classes?.content,
        )}
      >
        <Show when={typeof local.text === 'string'} fallback={local.text}>
          <span
            data-slot="text"
            style={local.styles?.text}
            class={cn('leading-4 text-pretty', local.classes?.text)}
          >
            {local.text}
          </span>
        </Show>

        <Kbd
          variant={local.invert ? 'invert' : undefined}
          size="sm"
          value={local.kbds}
          classes={{
            root: [local.text && 'ms-1', local.classes?.kbds],
            item: local.classes?.kbd,
          }}
        />
      </KobalteTooltip.Content>
    )
  }

  return (
    <TooltipRootWithPlacement
      overflowPadding={4}
      placement={local.placement}
      onCurrentPlacementChange={placement.onCurrentPlacementChange}
      {...rest}
    >
      <KobalteTooltip.Trigger
        as="span"
        tabIndex={-1}
        data-slot="trigger"
        style={local.styles?.trigger}
        class={cn('outline-none', local.classes?.trigger)}
      >
        {local.children}
      </KobalteTooltip.Trigger>

      <KobalteTooltip.Portal>
        <Content />
      </KobalteTooltip.Portal>
    </TooltipRootWithPlacement>
  )
}
