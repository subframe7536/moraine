import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn } from '../../shared/utils.ts'
import { IconButtonInner } from '../icon/icon-button-inner.tsx'
import type { IconButtonInnerProps } from '../icon/icon-button-inner.tsx'
import { Icon } from '../icon/index.ts'
import type { IconT } from '../icon/index.ts'

import type { BadgeVariantProps } from './badge.class.ts'
import { badgeVariants } from './badge.class.ts'

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
    /** Accessible title shown by the browser for the badge root. */
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
  export type Props = BaseProps<'span', Base, Variant, Classes, Styles>
}

/**
 * Props for the Badge component.
 */
export interface BadgeProps extends BadgeT.Props {}
/** Compact label component with leading/trailing icon slots and variant styles. */
export function Badge(props: BadgeProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'leading',
    'trailing',
    'onTrailingClick',
    'children',
    'title',
  ])
  const size = () => local.size ?? 'md'
  const variant = () => local.variant ?? 'default'

  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)
  const trailingAction = createMemo(() => local.onTrailingClick)
  const title = createMemo(() => local.title)
  const resolvedChildren = resolveChildren(() => local.children)
  const hasChildren = createMemo(() => {
    const value = resolvedChildren()
    return value === 0 || Boolean(value)
  })
  const trailingLabel = createMemo(() => {
    const titleText = title()?.trim()
    if (titleText) {
      return `Remove ${titleText}`
    }

    const value = resolvedChildren()
    const childText =
      typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
    return childText ? `Remove ${childText}` : 'Remove badge'
  })
  const iconClass = createMemo(() => cn('size-3', size() === 'xs' ? 'me-0' : undefined))
  const iconPadding = createMemo(() => (size() === 'xs' || size() === 'sm' ? '1.5' : '2'))

  return (
    <span
      data-slot="root"
      data-size={size()}
      data-variant={variant()}
      title={title()}
      {...rest}
      style={{ ...local.styles?.root, ...local.style }}
      class={badgeVariants(
        {
          size: size(),
          variant: variant(),
        },
        leading() && `ps-${iconPadding()}`,
        trailing() && `pe-${iconPadding()}`,
        local.classes?.root,
        local.class,
      )}
    >
      <Show when={leading()}>
        {(leading) => (
          <Icon
            name={leading()}
            slotName="leading"
            style={local.styles?.leading}
            class={cn(iconClass(), local.classes?.leading)}
          />
        )}
      </Show>

      <Show when={hasChildren()}>
        <span
          data-slot="label"
          style={local.styles?.label}
          class={cn('min-w-0 truncate', local.classes?.label)}
        >
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={trailing()}>
        {(trailing) => (
          <Show
            when={trailingAction()}
            fallback={
              <Icon
                name={trailing()}
                slotName="trailing"
                style={local.styles?.trailing}
                class={cn(iconClass(), local.classes?.trailing)}
              />
            }
          >
            <IconButtonInner
              name={trailing()}
              size={size()}
              data-slot="trailing"
              aria-label={trailingLabel()}
              style={local.styles?.trailing}
              class={local.classes?.trailing}
              onClick={trailingAction()}
            />
          </Show>
        )}
      </Show>
    </span>
  )
}
