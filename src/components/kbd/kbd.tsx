import type { JSX } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'

import { defaultKbdMessages } from './kbd.messages'
import { kbdRecipe } from './kbd.recipe'
import { KBD_KEY_ALIASES } from './kbd.types'
import type { KbdProps } from './kbd.types'

/**
 * Keycap that displays one keyboard key as shortcut notation in a `kbd` element. Known aliases
 * such as `meta`, `ctrl`, `shift`, and `escape` resolve to symbols unless `symbol={false}`, and
 * `aria-label` overrides the spoken name. Use `KbdGroup` to combine several keys into one
 * shortcut. It only displays the key; it does not register a keyboard handler.
 *
 * @example
 * ```tsx
 * import { Kbd } from 'moraine'
 *
 * <p>
 *   Press <Kbd value="meta" /> <Kbd value="K" aria-label="K" /> to search, or{' '}
 *   <Kbd value="escape" symbol={false} /> to cancel.
 * </p>
 * ```
 */
export function Kbd(props: KbdProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'value',
    'symbol',
    'slotName',
    'size',
    'variant',
    'class',
    'style',
    'classes',
    'styles',
    'aria-label',
    'translations',
  ])
  const {
    slots: { root: rootSlot },
  } = useRecipe(kbdRecipe, local)
  const messages = useMessages('kbd', defaultKbdMessages, () => local.translations)

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
    return local['aria-label'] ?? (key ? messages()[key] : undefined)
  }

  return (
    <Show when={text()}>
      <kbd data-slot={local.slotName || 'kbd'} aria-label={label()} {...rootSlot} {...rest}>
        {text()}
      </kbd>
    </Show>
  )
}
