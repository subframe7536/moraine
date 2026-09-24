import type { JSX } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'

import { createStyles } from '../../provider'

import { kbdRecipe } from './kbd.recipe'
import { KBD_KEY_ALIASES } from './kbd.types'
import type { KbdProps } from './kbd.types'

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
    'classes',
    'styles',
  ])
  const resolved = createStyles(kbdRecipe, local)

  const alias = createMemo(() =>
    local.symbol === false
      ? undefined
      : KBD_KEY_ALIASES[local.value.toLowerCase() as keyof typeof KBD_KEY_ALIASES],
  )
  const text = createMemo(() => alias()?.text ?? local.value)

  return (
    <Show when={text()}>
      <kbd
        data-slot={local.slotName ?? 'kbd'}
        aria-label={local.label ?? alias()?.label}
        {...rest}
        {...resolved.styles.root}
      >
        {text()}
      </kbd>
    </Show>
  )
}
