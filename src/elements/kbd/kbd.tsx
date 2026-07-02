import type { JSX } from 'solid-js'
import { For, Match, Show, Switch } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn } from '../../shared/utils'

import type { KbdVariantProps } from './kbd.class'
import { kbdItemVariants } from './kbd.class'

export namespace KbdT {
  export interface Slot<T = unknown> {
    /**
     * Keyboard shortcut container that groups one or more key tokens.
     * @deprecated Use top-level `class` and `style` props for the component root.
     */

    root?: T

    /** Individual key token inside the shortcut sequence. */
    item?: T
  }
  export type Variant = KbdVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Extend = never

  export interface Item {}
  /**
   * Base props for the Kbd component.
   */
  export interface Base {
    /**
     * Slot between kbds
     */
    between?: JSX.Element

    /**
     * Prefix for data-slot attributes.
     */
    slotPrefix?: string

    /**
     * Array of keys to display.
     */
    value?: string[]
  }

  /**
   * Props for the Kbd component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Classes, Styles> {}
}

/**
 * Props for the Kbd component.
 */
export interface KbdProps extends KbdT.Props {}

/** Keyboard shortcut display component with configurable size and variant. */
export function Kbd(props: KbdProps): JSX.Element {
  const Inner = (innerProps: { val: string; append?: boolean }) => (
    <>
      <kbd
        data-slot={props.slotPrefix ? `${props.slotPrefix}-kbd` : 'kbd'}
        class={kbdItemVariants(
          {
            size: props.size,
            variant: props.variant,
          },
          props.classes?.item,
        )}
        style={props.styles?.item}
      >
        {innerProps.val}
      </kbd>
      <Show when={innerProps.append}>{props.between}</Show>
    </>
  )
  return (
    <Show when={props.value}>
      <Switch>
        <Match when={props.value!.length === 1}>{<Inner val={props.value![0]!} />}</Match>
        <Match when={props.value!.length > 1}>
          <span
            data-slot={props.slotPrefix ? `${props.slotPrefix}-kbds` : 'kbds'}
            class={cn('inline-flex gap-1 items-center', props.classes?.root, props.class)}
            style={{ ...props.styles?.root, ...props.style }}
          >
            <For each={props.value}>
              {(value, idx) => <Inner val={value} append={idx() < props.value!.length - 1} />}
            </For>
          </span>
        </Match>
      </Switch>
    </Show>
  )
}
