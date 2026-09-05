import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { Icon } from '../icon/index.ts'
import type { IconT } from '../icon/index.ts'

import type { BadgeVariantProps } from './badge.class.ts'
import { badgeRecipe } from './badge.class.ts'

export namespace BadgeT {
  export interface Slot<T = unknown> {
    /**
     * Inline badge container that carries the variant, size, and interactive state.
     */
    root?: T

    /** Optional icon displayed before the badge label. */
    leading?: T

    /** Badge text or children content between the optional visuals. */
    label?: T

    /** Optional trailing icon displayed after the label. */
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
  const config = useMoraineConfig()
  const provider = () => config().badge

  const [local, rest] = splitProps(props, [
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'leading',
    'trailing',
    'children',
  ])
  const size = () => local.size ?? provider()?.variants?.size ?? 'md'
  const variant = () => local.variant ?? provider()?.variants?.variant ?? 'default'

  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)
  const resolvedChildren = resolveChildren(() => local.children)
  const hasChildren = createMemo(() => {
    const value = resolvedChildren()
    return value === 0 || Boolean(value)
  })

  const slots = createMemo(() => badgeRecipe({ size: size(), variant: variant() }))

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  return (
    <span
      data-slot="root"
      data-size={size()}
      data-variant={variant()}
      {...rest}
      {...resolved.rootClassAndStyle()}
    >
      <Show when={leading()}>
        {(leading) => (
          <Icon name={leading()} slotName="leading" {...resolved.slotClassAndStyle('leading')} />
        )}
      </Show>

      <Show when={hasChildren()}>
        <span data-slot="label" {...resolved.slotClassAndStyle('label')}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={trailing()}>
        <Icon name={trailing()} slotName="trailing" {...resolved.slotClassAndStyle('trailing')} />
      </Show>
    </span>
  )
}
