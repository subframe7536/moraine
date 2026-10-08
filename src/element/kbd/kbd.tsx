import type { JSX } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'

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
  const messages = useMessages()

  const aliasKey = createMemo(() => {
    if (local.symbol === false) {
      return undefined
    }
    const key = local.value.toLowerCase() as keyof typeof KBD_KEY_ALIASES
    return key in KBD_KEY_ALIASES ? key : undefined
  })
  const text = createMemo(() => {
    const key = aliasKey()
    return key ? KBD_KEY_ALIASES[key].text : local.value
  })
  const label = () => {
    const key = aliasKey()
    return local.label ?? (key ? messages().kbd[key] : undefined)
  }

  return (
    <Show when={text()}>
      <kbd
        data-slot={local.slotName ?? 'kbd'}
        aria-label={label()}
        {...rest}
        {...resolved.styles.root}
      >
        {text()}
      </kbd>
    </Show>
  )
}
