import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps } from 'solid-js'

import type { SlotClasses, SlotStyles } from '../../shared/slot'
import { cn } from '../../shared/utils'
import { Icon, IconButton } from '../icon'
import type { IconButtonProps, IconName } from '../icon'

import type { BadgeVariantProps } from './badge.class'
import { badgeIconVariants, badgeVariants } from './badge.class'

type BadgeSlots = 'base' | 'leading' | 'label' | 'trailing'

export type BadgeClasses = SlotClasses<BadgeSlots>

export type BadgeStyles = SlotStyles<BadgeSlots>

export interface BadgeTrailingButtonProps extends Omit<
  IconButtonProps,
  'children' | 'name' | 'onClick' | 'size' | 'loading' | 'loadingIcon' | 'type'
> {}

/**
 * Base props for the Badge component.
 */
export interface BadgeBaseProps {
  /**
   * Data slot for styling.
   * @default 'badge'
   */
  'data-slot'?: string

  /**
   * Accessible title for the badge.
   */
  title?: string

  /**
   * Leading icon name.
   */
  leading?: IconName

  /**
   * Trailing icon name.
   */
  trailing?: IconName

  /**
   * Callback when the trailing icon/button is clicked.
   */
  onTrailingClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>

  /**
   * Slot-based class overrides.
   */
  classes?: BadgeClasses

  /**
   * Slot-based style overrides.
   */
  styles?: BadgeStyles

  /**
   * Children of the badge.
   */
  children?: JSX.Element
}

/**
 * Props for the Badge component.
 */
export type BadgeProps = BadgeBaseProps & BadgeVariantProps
export function Badge(props: BadgeProps): JSX.Element {
  const merged = mergeProps(
    {
      'data-slot': 'badge',
      size: 'md' as const,
      variant: 'default' as const,
    },
    props,
  )

  const hasLabel = createMemo(() => merged.children !== undefined && merged.children !== null)

  return (
    <span
      data-slot={merged['data-slot']}
      data-size={merged.size}
      data-variant={merged.variant}
      title={merged.title}
      style={merged.styles?.base}
      class={badgeVariants(
        {
          size: merged.size,
          variant: merged.variant,
        },
        merged.classes?.base,
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
            data-slot="leading"
            style={merged.styles?.leading}
            class={badgeIconVariants(merged.size, merged.classes?.leading, true)}
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
                data-slot="trailing"
                style={merged.styles?.trailing}
                class={badgeIconVariants(merged.size, merged.classes?.trailing, false)}
              />
            }
          >
            <IconButton
              name={trailing()}
              size={merged.size}
              data-slot="trailing"
              style={merged.styles?.trailing}
              class={badgeIconVariants(merged.size, merged.classes?.trailing, false)}
              onClick={merged.onTrailingClick}
            />
          </Show>
        )}
      </Show>
    </span>
  )
}
