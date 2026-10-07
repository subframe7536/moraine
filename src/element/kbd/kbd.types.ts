import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { KbdStyleSlot, KbdStyleVariant } from './kbd.style-types'

export const KBD_KEY_ALIASES = {
  alt: { text: 'Alt' },
  arrowdown: { text: '↓' },
  arrowleft: { text: '←' },
  arrowright: { text: '→' },
  arrowup: { text: '↑' },
  backspace: { text: '⌫' },
  capslock: { text: '⇪' },
  command: { text: '⌘' },
  control: { text: '⌃' },
  ctrl: { text: 'Ctrl' },
  delete: { text: '⌦' },
  end: { text: '↘' },
  enter: { text: '↵' },
  escape: { text: 'Esc' },
  home: { text: '↖' },
  meta: { text: '⌘' },
  option: { text: '⌥' },
  pagedown: { text: '⇟' },
  pageup: { text: '⇞' },
  shift: { text: '⇧' },
  tab: { text: '⇥' },
  win: { text: '⊞' },
} as const

type BuiltinKbd = keyof typeof KBD_KEY_ALIASES

export namespace KbdT {
  export type Kind = 'single'

  export type Slot<T = unknown> = KbdStyleSlot<T>

  export type Variant = KbdStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Key = BuiltinKbd | (string & {})

  /** Base props for the Kbd component. */
  export interface Base {
    /** Value displayed by the keycap or resolved through the static key aliases. */
    value: Key
    /**
     * Whether to resolve known key aliases to symbols.
     * @default true
     */
    symbol?: boolean
    /** Accessible label for assistive technology. */
    label?: string
    /** Data slot used by the rendered keycap. */
    slotName?: string
  }

  /** Props for the Kbd component. */
  export type Props = BaseProps<'kbd', Base, Variant, Classes, Styles>
}

/** Props for the Kbd component. */
export type KbdProps = KbdT.Props
