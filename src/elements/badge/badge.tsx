import type { JSX, ParentProps } from 'solid-js'
import { Show, createMemo, mergeProps } from 'solid-js'

import type { SlotClasses } from '../../shared/slot-class'
import { cn } from '../../shared/utils'
import { Icon, IconButton } from '../icon'
import type { IconButtonProps, IconName } from '../icon'

import type { BadgeVariantProps } from './badge.class'
import { badgeIconVariants, badgeVariants } from './badge.class'

type BadgeSlots = 'base' | 'leading' | 'label' | 'trailing'

export type BadgeClasses = SlotClasses<BadgeSlots>

export interface BadgeTrailingButtonProps extends Omit<
  IconButtonProps,
  'children' | 'name' | 'onClick' | 'size' | 'loading' | 'loadingIcon' | 'type'
> {}

export interface BadgeBaseProps extends BadgeVariantProps {
  'data-slot'?: string
  title?: string
  leading?: IconName
  trailing?: IconName
  onTrailingClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>
  classes?: BadgeClasses
}

export type BadgeProps = ParentProps<BadgeBaseProps>
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
            class={badgeIconVariants(merged.size, merged.classes?.leading, true)}
          />
        )}
      </Show>

      <Show when={hasLabel()}>
        <span data-slot="label" class={cn('min-w-0 truncate', merged.classes?.label)}>
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
                class={badgeIconVariants(merged.size, merged.classes?.trailing, false)}
              />
            }
          >
            <IconButton
              name={trailing()}
              size={merged.size}
              data-slot="trailing"
              class={badgeIconVariants(merged.size, merged.classes?.trailing, false)}
              onClick={merged.onTrailingClick}
            />
          </Show>
        )}
      </Show>
    </span>
  )
}
