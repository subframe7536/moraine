import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { defaultKbdMessages } from './kbd.messages'
import type { KbdStyleSlot, KbdStyleVariants } from './kbd.style-types'

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

  export type Variants = KbdStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Key = BuiltinKbd | (string & {})
  export type MessageKey = BuiltinKbd
  export type Messages = ComponentMessages<typeof defaultKbdMessages>
  export type Translations = Partial<Messages>

  /** Base props for the Kbd component. */
  export interface Base {
    /** Localized spoken names for key aliases, keyed by alias such as `meta` or `escape`. Used as the `aria-label` when `value` is an alias and `aria-label` is not set. */
    translations?: Translations
    /**
     * The key to display. A name matching a built-in alias, compared case-insensitively
     * (`meta`, `ctrl`, `shift`, `escape`, `arrowup`, ...), shows its symbol or short label, such as `⌘` for
     * `meta` or `Esc` for `escape`, unless `symbol` is `false`. Any other string renders as written, such as `K` or `F5`.
     * Nothing renders for an empty string.
     */
    value: Key
    /**
     * Whether to resolve known key aliases to symbols.
     * @default true
     */
    symbol?: boolean
  }

  /** Props for the Kbd component. */
  export type Props = BaseProps<'kbd', Base, Variants, Classes, Styles>
}

/** Props for the Kbd component. */
export type KbdProps = KbdT.Props
