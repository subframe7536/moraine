import type { JSX } from 'solid-js'
import { createMemo, For, Show, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { Kbd } from '../kbd/kbd'
import type { KbdT } from '../kbd/kbd.types'

import { kbdGroupRecipe } from './kbd-group.recipe'
import type { KbdGroupProps, KbdGroupT } from './kbd-group.types'

interface NormalizedKbdItem {
  item: KbdGroupT.Item
  key: string
}

function toItemProps(item: KbdGroupT.Item): KbdT.Base {
  return typeof item === 'string' ? { value: item } : item
}

/** Data-driven renderer for one simultaneous keyboard shortcut. */
export function KbdGroup(props: KbdGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'separatorRender',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const {
    slots: { root: rootSlot, item: itemSlot },
    variants,
  } = useRecipe(kbdGroupRecipe, local)

  const normalizedItems = createMemo<NormalizedKbdItem[]>((previous = []) => {
    const rawItems = local.items ?? []
    const occurrences = new Map<KbdGroupT.Item, number>()
    const prevMap = new Map<string, NormalizedKbdItem>()
    for (const p of previous) {
      prevMap.set(p.key, p)
    }

    return rawItems.map((rawItem) => {
      const occurrence = occurrences.get(rawItem) ?? 0
      occurrences.set(rawItem, occurrence + 1)
      const rawKey =
        typeof rawItem === 'string'
          ? rawItem
          : (rawItem.value ?? rawItem.label ?? JSON.stringify(rawItem))
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
                slotName="kbd-group-item"
              />
              <Show when={index() < normalizedItems().length - 1}>
                <Show
                  when={typeof local.separatorRender === 'function' && local.separatorRender}
                  fallback={(local.separatorRender as JSX.Element) ?? '+'}
                  keyed
                >
                  {(Separator) => <Separator index={index()} />}
                </Show>
              </Show>
            </>
          )}
        </For>
      </kbd>
    </Show>
  )
}
