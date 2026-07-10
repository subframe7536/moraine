import type { JSX } from 'solid-js'
import { Show } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

import type { KbdVariantProps } from './kbd.class'
import { kbdItemVariants } from './kbd.class'

export namespace KbdT {
  export interface Slot<T = unknown> {
    /** Individual key token. */
    item?: T
  }
  export type Variant = KbdVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {
    /** Visible text for the key. */
    text?: JSX.Element

    /** Accessible label for assistive technology. */
    label?: string

    /** Fallback text value used when text is not provided. */
    value?: string
  }
  export type ItemInput = string | Item

  /** Base props for the Kbd component. */
  export interface Base extends Item {
    /** Prefix for data-slot attributes. */
    slotPrefix?: string
  }

  /** Props for the Kbd component. */
  export interface Props extends BaseProps<Base, Variant, Slot> {}
}

/** Props for the Kbd component. */
export interface KbdProps extends KbdT.Props {}

/** Keyboard keycap component with configurable size, variant, and accessible label. */
export function Kbd(props: KbdProps): JSX.Element {
  const content = () => props.text ?? props.value

  return (
    <Show when={content()}>
      <kbd
        data-slot={props.slotPrefix ? `${props.slotPrefix}-kbd` : 'kbd'}
        aria-label={props.label}
        class={kbdItemVariants(
          {
            size: props.size,
            variant: props.variant,
          },
          props.classes?.item,
          props.class,
        )}
        style={{ ...props.styles?.item, ...props.style }}
      >
        {content()}
      </kbd>
    </Show>
  )
}
