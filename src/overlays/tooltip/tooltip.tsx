import { usePopperContext } from '@kobalte/core/popper'
import * as KobalteTooltip from '@kobalte/core/tooltip'
import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { Kbd } from '../../elements/kbd'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'
import { resolveOverlayMenuSide } from '../shared-overlay-menu/utils'
import type { OverlayMenuSide } from '../shared-overlay-menu/utils'

import { tooltipContentVariants } from './tooltip.class'
import type { TooltipVariantProps } from './tooltip.class'

export namespace TooltipT {
  export type Slot = 'content' | 'trigger' | 'text' | 'kbds' | 'kbd'
  export type Variant = TooltipVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = KobalteTooltip.TooltipRootProps

  export interface Items {}

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

type TooltipSide = OverlayMenuSide

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
  ])

  function Content(): JSX.Element {
    const popperContext = usePopperContext()
    const resolvedSide = createMemo<TooltipSide>(() => {
      const runtimePlacement = popperContext.currentPlacement()

      if (runtimePlacement) {
        return resolveOverlayMenuSide(runtimePlacement)
      }

      if (local.side) {
        return local.side
      }

      return resolveOverlayMenuSide(rest.placement)
    })

    return (
      <KobalteTooltip.Content
        data-slot="content"
        style={local.styles?.content}
        class={tooltipContentVariants(
          { side: resolvedSide(), invert: local.invert },
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
    <KobalteTooltip.Root overflowPadding={4} placement={local.side} {...rest}>
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
    </KobalteTooltip.Root>
  )
}
