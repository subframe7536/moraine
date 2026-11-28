import type { JSX } from '@solidjs/web'
import { createMemo, For, Show, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { Kbd } from '../kbd/kbd'
import type { KbdT } from '../kbd/kbd.types'

import { kbdGroupRecipe } from './kbd-group.recipe'
import type { KbdGroupProps, KbdGroupT } from './kbd-group.types'
interface NormalizedKbdItem {
  item: KbdGroupT.Item
  key: string
}

function toItemProps(item: KbdGroupT.Item): KbdT.Props {
  return typeof item === 'string'
    ? { value: item }
    : { value: item.value, symbol: item.symbol, 'aria-label': item.ariaLabel }
}

/**
 * Data-driven display of keys pressed together as one shortcut, rendering a `Kbd` per item with
 * a separator between them. Items are key strings or objects such as
 * `{ value: 'meta', ariaLabel: 'Command' }`. It renders notation only, so the
 * application owns the shortcut listener; use `Kbd` for a single keycap.
 *
 * @example
 * ```tsx
 * import { KbdGroup } from 'moraine'
 *
 * <>
 *   <KbdGroup items={['meta', 'K']} />
 *   <KbdGroup items={['Ctrl', 'Shift', 'K']} separator="/" />
 * </>
 * ```
 */
export function KbdGroup(props: KbdGroupProps): JSX.Element {
  const rest = omit(
    props,
    'items',
    'separator',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
  )
  const {
    slots: { root: rootSlot, item: itemSlot },
    variants,
  } = useRecipe(kbdGroupRecipe, props)

  const normalizedItems = createMemo<Array<NormalizedKbdItem>>((previous = []) => {
    const rawItems = props.items ?? []
    const occurrences = new Map<KbdGroupT.Item, number>()
    const prevMap = new Map<string, NormalizedKbdItem>()
    for (const p of previous) {
      prevMap.set(p.key, p)
    }

    return rawItems.map((rawItem) => {
      const occurrence = occurrences.get(rawItem) ?? 0
      occurrences.set(rawItem, occurrence + 1)
      const rawKey = typeof rawItem === 'string' ? rawItem : rawItem.value
      const key = `${rawKey}-${occurrence}`
      const existing = prevMap.get(key)
      if (existing && existing.item === rawItem) {
        return existing
      }
      return { item: rawItem, key }
    })
  })

  return (
    <Show when={normalizedItems().length > 0}>
      <kbd data-slot="kbd-group" {...rootSlot} {...rest}>
        <For each={normalizedItems()}>
          {(entry, index) => (
            <>
              <Kbd
                {...toItemProps(entry.item)}
                size={variants.size}
                variant={variants.variant}
                {...itemSlot}
                data-slot="kbd-group-item"
              />
              <Show when={index() < normalizedItems().length - 1}>
                {(_show) => {
                  const separator = createMemo(() => props.separator)
                  return (
                    <Show
                      when={typeof separator() === 'function' && separator()}
                      fallback={(separator() as JSX.Element) ?? '+'}
                      keyed
                    >
                      {(Separator) => <Separator index={index()} />}
                    </Show>
                  )
                }}
              </Show>
            </>
          )}
        </For>
      </kbd>
    </Show>
  )
}
