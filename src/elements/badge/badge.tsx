import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'
import { Icon, IconButton } from '../icon'
import type { IconButtonProps, IconT } from '../icon'

import type { BadgeVariantProps } from './badge.class'
import { badgeVariants } from './badge.class'

export namespace BadgeT {
  export type Slot = 'root' | 'leading' | 'label' | 'trailing'
  export type Variant = BadgeVariantProps
  export interface Items {}
  export type Extend = never
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>

  /**
   * Base props for the Badge component.
   */
  export interface Base {
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
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}

  export interface TrailingButtonProps extends Omit<
    IconButtonProps,
    'children' | 'name' | 'onClick' | 'size' | 'loading' | 'loadingIcon' | 'type'
  > {}
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

  const hasLabel = createMemo(() => merged.children !== undefined && merged.children !== null)

  return (
    <span
      data-slot={merged.slotName}
      data-size={merged.size}
      data-variant={merged.variant}
      title={merged.title}
      style={merged.styles?.root}
      class={badgeVariants(
        {
          size: merged.size,
          variant: merged.variant,
        },
        merged.classes?.root,
      )}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <Show when={merged.leading}>
        {(leading) => (
          <Icon
            name={leading()}
            slotName="leading"
            style={merged.styles?.leading}
            class={cn('me-.5', merged.classes?.leading)}
          />
        )}
      </Show>

      <Show when={hasLabel()}>
        <span
          data-slot="label"
          style={merged.styles?.label}
          class={cn('min-w-0 truncate', merged.classes?.label)}
        >
          {merged.children}
        </span>
      </Show>

      <Show when={merged.trailing}>
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
            <IconButton
              name={trailing()}
              size={merged.size}
              data-slot="trailing"
              styles={{ root: merged.styles?.trailing }}
              classes={{ root: cn('ms-.5', merged.classes?.trailing) }}
              onClick={merged.onTrailingClick}
            />
          </Show>
        )}
      </Show>
    </span>
  )
}
