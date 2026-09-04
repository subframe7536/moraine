import type { JSX } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps } from '../../shared/types.ts'

import type { KbdVariantProps } from './kbd.class.ts'
import { kbdRecipe } from './kbd.class.ts'

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
  export interface Slot<_T = unknown> {}
  export type Variant = KbdVariantProps
  export type Classes = never
  export type Styles = never
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
  export type Props = BaseProps<'kbd', Base, Variant, Classes, Styles>
}

/** Props for the Kbd component. */
export interface KbdProps extends KbdT.Props {}

/** Keyboard keycap component with configurable size, variant, and accessible label. */
export function Kbd(props: KbdProps): JSX.Element {
  const config = useMoraineConfig()
  const provider = () => config().kbd

  const [local, rest] = splitProps(props, [
    'value',
    'label',
    'symbol',
    'slotName',
    'size',
    'variant',
    'class',
    'style',
  ])

  const size = () =>
    (local.size ?? provider()?.variants?.size ?? 'md') as NonNullable<KbdVariantProps['size']>
  const variant = () =>
    (local.variant ?? provider()?.variants?.variant ?? 'default') as NonNullable<
      KbdVariantProps['variant']
    >

  const alias = createMemo(() =>
    local.symbol === false
      ? undefined
      : KBD_KEY_ALIASES[local.value.toLowerCase() as KbdT.BuiltinKbds],
  )
  const text = createMemo(() => alias()?.text ?? local.value)

  const slots = createMemo(() => kbdRecipe({ size: size(), variant: variant() }))

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
        style: local.style,
      }
    },
  })

  return (
    <Show when={text()}>
      <kbd
        data-slot={local.slotName ?? 'root'}
        aria-label={local.label ?? alias()?.label}
        {...rest}
        class={resolved.rootClass()}
        style={resolved.rootStyle()}
      >
        {text()}
      </kbd>
    </Show>
  )
}
