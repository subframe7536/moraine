import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, mergeProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn } from '../../shared/utils'
import { Icon } from '../icon'
import type { IconT } from '../icon'
import { IconButtonInner } from '../icon/icon-button-inner'
import type { IconButtonInnerProps } from '../icon/icon-button-inner'

import type { BadgeVariantProps } from './badge.class'
import { badgeVariants } from './badge.class'

export namespace BadgeT {
  export interface TrailingButtonProps extends Omit<
    IconButtonInnerProps,
    'children' | 'iconProps' | 'iconSlotName' | 'name' | 'onClick' | 'size' | 'slotName' | 'type'
  > {}

  export interface Slot<T = unknown> {
    /**
     * Inline badge container that carries the variant, size, and interactive state.
     */
    root?: T

    /** Optional icon displayed before the badge label. */
    leading?: T

    /** Badge text or children content between the optional visuals. */
    label?: T

    /** Optional trailing icon or dismiss button displayed after the label. */
    trailing?: T
  }
  export type Variant = BadgeVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}
  /**
   * Base props for the Badge component.
   */
  export interface Base {
    /**
     * Hides the badge from the accessibility tree when it is purely decorative.
     */
    'aria-hidden'?: boolean

    /**
     * Data slot for styling.
     * @default 'root'
     */
    slotName?: string

    /**
     * Accessible title for the badge.
     */
    title?: string

    /**
     * Leading icon name.
     */
    leading?: IconT.Name

    /**
     * Trailing icon name.
     */
    trailing?: IconT.Name

    /**
     * Callback when the trailing icon/button is clicked.
     */
    onTrailingClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>

    /**
     * Children of the badge.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Badge component.
   */
  export interface Props extends BaseProps<Base, Variant, Slot> {}
}

/**
 * Props for the Badge component.
 */
export interface BadgeProps extends BadgeT.Props {}
/** Compact label component with leading/trailing icon slots and variant styles. */
export function Badge(props: BadgeProps): JSX.Element {
  const merged = mergeProps(
    {
      slotName: 'root',
      size: 'md' as const,
      variant: 'default' as const,
    },
    props,
  )

  const leading = createMemo(() => merged.leading)
  const trailing = createMemo(() => merged.trailing)
  const resolvedChildren = resolveChildren(() => merged.children)

  return (
    <span
      data-slot={merged.slotName}
      data-size={merged.size}
      data-variant={merged.variant}
      aria-hidden={merged['aria-hidden']}
      title={merged.title}
      style={{ ...merged.styles?.root, ...merged.style }}
      class={badgeVariants(
        {
          size: merged.size,
          variant: merged.variant,
        },
        merged.classes?.root,
        merged.class,
      )}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <Show when={leading()}>
        {(leading) => (
          <Icon
            name={leading()}
            slotName="leading"
            style={merged.styles?.leading}
            class={cn('me-.5', merged.classes?.leading)}
          />
        )}
      </Show>

      <Show when={resolvedChildren()}>
        {(body) => (
          <span
            data-slot="label"
            style={merged.styles?.label}
            class={cn('min-w-0 truncate', merged.classes?.label)}
          >
            {body()}
          </span>
        )}
      </Show>

      <Show when={trailing()}>
        {(trailing) => (
          <Show
            when={merged.onTrailingClick}
            fallback={
              <Icon
                name={trailing()}
                slotName="trailing"
                style={merged.styles?.trailing}
                class={cn('ms-.5', merged.classes?.trailing)}
              />
            }
          >
            <IconButtonInner
              name={trailing()}
              size={merged.size}
              data-slot="trailing"
              style={merged.styles?.trailing}
              class={cn('ms-.5', merged.classes?.trailing)}
              onClick={merged.onTrailingClick}
            />
          </Show>
        )}
      </Show>
    </span>
  )
}
