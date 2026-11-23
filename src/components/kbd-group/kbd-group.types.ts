import type { Component } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { KbdT } from '../kbd/kbd.types'

import type { KbdGroupStyleSlot, KbdGroupStyleVariants } from './kbd-group.style-types'
export namespace KbdGroupT {
  export type Kind = 'single'

  export type Slot<T = unknown> = KbdGroupStyleSlot<T>

  export type Variants = KbdGroupStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** One key of the shortcut: a key string, or an object that customizes that key. */
  export type Item =
    | KbdT.Key
    | {
        /** The key to display, resolved like `Kbd` `value`. */
        value: KbdT.Key
        /** Accessible label for this keycap. Overrides the spoken name of a key alias. */
        ariaLabel?: string
        /**
         * Whether to resolve a known key alias to its symbol and spoken name, like `Kbd` `symbol`.
         * @default true
         */
        symbol?: boolean
      }

  export interface SeparatorRenderProps {
    /** Separator index between key[index] and key[index + 1]. */
    index: number
  }

  export interface Base {
    /**
     * Keys displayed in order as one simultaneous shortcut. Each item is a key string, resolved
     * like `Kbd` `value`, or an object with `value` and optional `ariaLabel` and `symbol` to
     * customize one key. The group `size` and `variant` apply to every key. The group renders
     * nothing when empty.
     * @example
     * ```tsx
     * import { KbdGroup } from 'moraine'
     *
     * <KbdGroup items={['meta', { value: 'K', ariaLabel: 'letter K' }]} />
     * ```
     */
    items: Item[]

    /**
     * Plain text between keys (not an icon name), or a component rendered between each pair of
     * keys, for example to show an icon. The component receives the `index` of the key it follows.
     * @default '+'
     * @example
     * ```tsx
     * import { Icon, KbdGroup } from 'moraine'
     *
     * <KbdGroup
     *   items={['ctrl', 'shift', 'P']}
     *   separator={() => <Icon name="i-lucide:plus" class="text-xs" />}
     * />
     * ```
     */
    separator?: string | Component<SeparatorRenderProps>
  }

  /** Props for the KbdGroup component. */
  export type Props = BaseProps<'kbd', Base, Variants, Classes, Styles>
}

/** Props for the KbdGroup component. */
export type KbdGroupProps = KbdGroupT.Props
