import * as KobalteTooltip from '@kobalte/core/tooltip'
import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import { Kbd } from '../../elements/kbd'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'

import { tooltipContentVariants } from './tooltip.class'
import type { TooltipVariantProps } from './tooltip.class'

export namespace TooltipT {
  export type Slot = 'content' | 'trigger' | 'text' | 'kbds' | 'kbd'
  export type Variant = TooltipVariantProps
  export interface Items {}
  export type Extend = KobalteTooltip.TooltipRootProps
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

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
  ) as TooltipProps
  const [behaviorProps, contentProps, restProps] = splitProps(
    merged,
    ['side', 'invert'],
    ['text', 'kbds', 'classes', 'styles', 'children'],
  )

  const isDisabled = () => Boolean(restProps.disabled)

  return (
    <KobalteTooltip.Root
      disabled={isDisabled()}
      overflowPadding={4}
      placement={behaviorProps.side as any}
      {...restProps}
    >
      <KobalteTooltip.Trigger
        as="span"
        tabIndex={-1}
        data-slot="trigger"
        style={contentProps.styles?.trigger}
        class={cn('outline-none', contentProps.classes?.trigger)}
      >
        {contentProps.children}
      </KobalteTooltip.Trigger>

      <KobalteTooltip.Portal>
        <KobalteTooltip.Content
          data-slot="content"
          style={contentProps.styles?.content}
          class={tooltipContentVariants(
            { side: behaviorProps.side, invert: behaviorProps.invert },
            contentProps.classes?.content,
          )}
        >
          <Show when={typeof contentProps.text === 'string'} fallback={contentProps.text}>
            <span
              data-slot="text"
              style={contentProps.styles?.text}
              class={cn('leading-4 text-pretty', contentProps.classes?.text)}
            >
              {contentProps.text}
            </span>
          </Show>

          <Kbd
            variant={behaviorProps.invert ? 'invert' : undefined}
            size="sm"
            value={contentProps.kbds}
            classes={{
              root: [contentProps.text && 'ms-1', contentProps.classes?.kbds],
              item: contentProps.classes?.kbd,
            }}
          />
        </KobalteTooltip.Content>
      </KobalteTooltip.Portal>
    </KobalteTooltip.Root>
  )
}
