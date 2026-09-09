import type { JSX } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider/index.ts'

import { KBD_KEY_ALIASES } from './kbd.types.ts'
import type { KbdProps, KbdT } from './kbd.types.ts'

/** Keyboard keycap component with configurable size, variant, and accessible label. */
export function Kbd(props: KbdProps): JSX.Element {
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
  const resolved = createComponentStyles('kbd', local)

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
        {...resolved.root}
      >
        {text()}
      </kbd>
    </Show>
  )
}
