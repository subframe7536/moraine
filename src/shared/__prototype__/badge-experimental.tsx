// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIMENTAL — Badge component using BaseProps<Base, Variant, Slot, TElement>.
// Uses splitProps + rest forwarding instead of mergeProps.
// ═══════════════════════════════════════════════════════════════════════════════

import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'

import type { BadgeVariantProps } from '../../elements/badge/badge.class'
import { badgeVariants } from '../../elements/badge/badge.class'
import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import { IconButtonInner } from '../../elements/icon/icon-button-inner'
import type { IconButtonInnerProps } from '../../elements/icon/icon-button-inner'
import { cn } from '../utils'

import type { BaseProps, SlotClassValue, SlotStyleValue } from './type'

export namespace BadgeExperimentalT {
  export interface TrailingButtonProps extends Omit<
    IconButtonInnerProps,
    'children' | 'iconProps' | 'iconSlotName' | 'name' | 'onClick' | 'size' | 'slotName' | 'type'
  > {}

  export interface Slot<T = unknown> {
    root?: T
    leading?: T
    label?: T
    trailing?: T
  }
  export type Variant = BadgeVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** Business props — component-owned fields, never spread to DOM. */
  export interface Base {
    'aria-hidden'?: boolean
    slotName?: string
    title?: string
    leading?: IconT.Name
    trailing?: IconT.Name
    onTrailingClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>
    children?: JSX.Element
  }

  export type Props = BaseProps<'span', Base, Variant, Slot>
}

export type BadgeExperimentalProps = BadgeExperimentalT.Props

/**
 * Experimental Badge — uses splitProps + rest forwarding.
 * HTML attributes (id, data-*, aria-*, events, ref) pass through `rest`
 * and land on the root `<span>`.
 */
export function BadgeExperimental(props: BadgeExperimentalProps): JSX.Element {
  // Split known business/slot keys from rest (HTML attrs land in rest)
  const [local, rest] = splitProps(props, [
    'aria-hidden',
    'slotName',
    'title',
    'leading',
    'trailing',
    'onTrailingClick',
    'children',
    // Slot styling
    'class',
    'style',
    'classes',
    'styles',
    // Variant
    'variant',
    'size',
  ])

  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)
  const resolvedChildren = resolveChildren(() => local.children as JSX.Element)

  return (
    <span
      data-slot={local.slotName ?? 'root'}
      data-size={local.size ?? 'md'}
      data-variant={local.variant ?? 'default'}
      aria-hidden={local['aria-hidden']}
      title={local.title}
      style={{ ...local.styles?.root, ...local.style }}
      class={badgeVariants(
        {
          size: local.size ?? 'md',
          variant: local.variant ?? 'default',
        },
        local.classes?.root,
        local.class,
      )}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      {...rest}
    >
      <Show when={leading()}>
        {(leading) => (
          <Icon
            name={leading()}
            slotName="leading"
            style={local.styles?.leading}
            class={cn('me-.5', local.classes?.leading)}
          />
        )}
      </Show>

      <Show when={resolvedChildren()}>
        {(body) => (
          <span
            data-slot="label"
            style={local.styles?.label}
            class={cn('min-w-0 truncate', local.classes?.label)}
          >
            {body()}
          </span>
        )}
      </Show>

      <Show when={trailing()}>
        {(trailing) => (
          <Show
            when={local.onTrailingClick}
            fallback={
              <Icon
                name={trailing()}
                slotName="trailing"
                style={local.styles?.trailing}
                class={cn('ms-.5', local.classes?.trailing)}
              />
            }
          >
            <IconButtonInner
              name={trailing()}
              size={local.size ?? 'md'}
              data-slot="trailing"
              style={local.styles?.trailing}
              class={cn('ms-.5', local.classes?.trailing)}
              onClick={local.onTrailingClick}
            />
          </Show>
        )}
      </Show>
    </span>
  )
}
