import type { JSX } from 'solid-js'
import { createMemo, For, Show, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
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
    'separator',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createStyles(kbdGroupRecipe, local)

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
      <kbd data-slot="kbd-group" {...rest} {...resolved.styles.root}>
        <For each={normalizedItems()}>
          {(entry, index) => (
            <>
              <Kbd
                {...toItemProps(entry.item)}
                size={resolved.variants.size}
                variant={resolved.variants.variant}
                {...resolved.styles.item}
                slotName="kbd-group-item"
              />
              <Show when={index() < normalizedItems().length - 1}>
                <Show
                  when={typeof local.separator === 'function' && local.separator}
                  fallback={(local.separator as string | number) ?? '+'}
                  keyed
                >
                  {(SeparatorRender) => <SeparatorRender index={index()} />}
                </Show>
              </Show>
            </>
          )}
        </For>
      </kbd>
    </Show>
  )
}
