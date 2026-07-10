import type { JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

import type { KbdVariantProps } from './kbd.class'
import { kbdRootVariants } from './kbd.class'

interface KbdKeyAlias {
  label: string
  text: string
}

const KBD_KEY_ALIASES = {
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
} as const satisfies Record<string, KbdKeyAlias>

export namespace KbdT {
  export interface Slot<T = unknown> {
    /** Keyboard keycap element. */
    root?: T
  }
  export type Variant = KbdVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type BuiltinKbds = keyof typeof KBD_KEY_ALIASES
  export type Key = BuiltinKbds | (string & {})

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
  export interface Props extends BaseProps<Base, Variant, Slot> {}
}

/** Props for the Kbd component. */
export interface KbdProps extends KbdT.Props {}

/** Keyboard keycap component with configurable size, variant, and accessible label. */
export function Kbd(props: KbdProps): JSX.Element {
  const alias = createMemo(() =>
    props.symbol === false
      ? undefined
      : KBD_KEY_ALIASES[props.value.toLowerCase() as KbdT.BuiltinKbds],
  )
  const text = createMemo(() => alias()?.text ?? props.value)

  return (
    <Show when={text()}>
      <kbd
        data-slot={props.slotName ?? 'root'}
        aria-label={props.label ?? alias()?.label}
        class={kbdRootVariants(
          {
            size: props.size,
            variant: props.variant,
          },
          props.classes?.root,
          props.class,
        )}
        style={{ ...props.styles?.root, ...props.style }}
      >
        {text()}
      </kbd>
    </Show>
  )
}
