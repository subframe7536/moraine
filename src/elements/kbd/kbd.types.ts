import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

export const KBD_KEY_ALIASES = {
  alt: { text: 'Alt', label: 'Alt' },
  arrowdown: { text: '↓', label: 'Arrow Down' },
  arrowleft: { text: '←', label: 'Arrow Left' },
  arrowright: { text: '→', label: 'Arrow Right' },
  arrowup: { text: '↑', label: 'Arrow Up' },
  backspace: { text: '⌫', label: 'Backspace' },
  capslock: { text: '⇪', label: 'Caps Lock' },
  command: { text: '⌘', label: 'Command' },
  control: { text: '⌃', label: 'Control' },
  ctrl: { text: 'Ctrl', label: 'Control' },
  delete: { text: '⌦', label: 'Delete' },
  end: { text: '↘', label: 'End' },
  enter: { text: '↵', label: 'Enter' },
  escape: { text: 'Esc', label: 'Escape' },
  home: { text: '↖', label: 'Home' },
  meta: { text: '⌘', label: 'Meta' },
  option: { text: '⌥', label: 'Option' },
  pagedown: { text: '⇟', label: 'Page Down' },
  pageup: { text: '⇞', label: 'Page Up' },
  shift: { text: '⇧', label: 'Shift' },
  tab: { text: '⇥', label: 'Tab' },
  win: { text: '⊞', label: 'Windows' },
} as const

export namespace KbdT {
  export interface Slot<T = unknown> {
    root?: T
  }

  export interface Variant {
    size?: 'sm' | 'md' | 'lg'
    variant?: 'default' | 'outline' | 'invert'
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type BuiltinKbds = keyof typeof KBD_KEY_ALIASES
  export type Key = BuiltinKbds | (string & {})

  export interface Item {}

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
  export type Props = BaseProps<'kbd', Base, Variant, never, never>
}

/** Props for the Kbd component. */
export interface KbdProps extends KbdT.Props {}
