import type { BaseSelectT } from '../base-select.types.ts'

import type { SelectEntry, SelectGroup, SelectView, SelectRow } from './types.ts'

export function isGroup<T extends BaseSelectT.Item>(
  entry: SelectEntry<T>,
): entry is SelectGroup<T> {
  return 'type' in entry && entry.type === 'group'
}

/** Normalize source data once; the same rows serve normal and virtual rendering. */
export function createSource<T extends BaseSelectT.Item>(
  entries: readonly SelectEntry<T>[],
  created: readonly T[] = [],
) {
  const view: SelectView<T> = { items: [], rows: [] }
  const byValue = new Map<T['value'], T>()
  function append(item: T) {
    if (byValue.has(item.value)) {
      throw new Error(`[Moraine Select] Duplicate item value: ${String(item.value)}.`)
    }
    byValue.set(item.value, item)
    view.items.push(item)
    view.rows.push({ type: 'item', key: item.value, item })
  }
  entries.forEach((entry, index) => {
    if (isGroup(entry)) {
      const items = entry.items
      if (items.length) {
        view.rows.push({
          type: 'label',
          key: `group-${index}`,
          label: entry.label,
          values: items.map((item) => item.value),
        })
        items.forEach(append)
      }
    } else {
      append(entry)
    }
  })
  const additions = created.filter((item) => !byValue.has(item.value))
  for (const item of additions) {
    byValue.set(item.value, item)
  }
  if (additions.length) {
    view.items.unshift(...additions)
    view.rows.unshift(
      ...additions.map((item): SelectRow<T> => ({ type: 'item', key: item.value, item })),
    )
  }
  return { ...view, byValue }
}

export function filterView<T extends BaseSelectT.Item>(
  source: SelectView<T>,
  matches: (item: T) => boolean,
): SelectView<T> {
  const items = source.items.filter(matches)
  const values = new Set(items.map((item) => item.value))
  return {
    items,
    rows: source.rows.flatMap<SelectRow<T>>((row) => {
      if (row.type === 'item') {
        return values.has(row.item.value) ? [row] : []
      }
      const visible = row.values.filter((value) => values.has(value))
      return visible.length ? [{ ...row, values: visible }] : []
    }),
  }
}

export function labelString<T extends BaseSelectT.Item>(
  item: T,
  resolve?: (item: T) => string,
): string {
  if (resolve) {
    return resolve(item)
  }
  const label = item.label
  return typeof label === 'string' ? label : String(item.value)
}

/** JavaScript Map/Set equality for raw selection values. */
export function sameValue(
  a: BaseSelectT.Value | undefined,
  b: BaseSelectT.Value | undefined,
): boolean {
  return a === b || Object.is(a, b)
}
