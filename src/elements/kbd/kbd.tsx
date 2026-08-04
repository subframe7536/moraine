import type { JSX } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type { KbdVariantProps } from './kbd.class.ts'
import { kbdRootVariants } from './kbd.class.ts'

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
  export type Props = BaseProps<'kbd', Base, Variant, Slot>
}

/** Props for the Kbd component. */
export interface KbdProps extends KbdT.Props {}

/** Keyboard keycap component with configurable size, variant, and accessible label. */
export function Kbd(props: KbdProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'value',
    'label',
    'symbol',
    'slotName',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const alias = createMemo(() =>
    local.symbol === false
      ? undefined
      : KBD_KEY_ALIASES[local.value.toLowerCase() as KbdT.BuiltinKbds],
  )
  const text = createMemo(() => alias()?.text ?? local.value)

  return (
    <Show when={text()}>
      <kbd
        data-slot={local.slotName ?? 'root'}
        aria-label={local.label ?? alias()?.label}
        {...rest}
        class={kbdRootVariants(
          {
            size: local.size,
            variant: local.variant,
          },
          local.classes?.root,
          local.class,
        )}
        style={{ ...local.styles?.root, ...local.style }}
      >
        {text()}
      </kbd>
    </Show>
  )
}
