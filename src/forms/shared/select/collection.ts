import { DEV } from 'solid-js'

import type { BaseSelectT } from '../../base-select/base-select.types.ts'

import type { SelectEntry, SelectGroup, SelectView, SelectRow } from './types.ts'

export function isGroup<T extends BaseSelectT.Item>(
  entry: SelectEntry<T>,
): entry is SelectGroup<T> {
  return (
    'type' in entry &&
    entry.type === 'group' &&
    !('value' in entry) &&
    'items' in entry &&
    Array.isArray(entry.items)
  )
}

const warnedDuplicateValues = new Map<string, Set<BaseSelectT.Value>>()

export function diagnoseDuplicateValue(
  owner: 'BaseSelect' | 'Select',
  value: BaseSelectT.Value,
): void {
  if (!DEV) {
    return
  }
  let warned = warnedDuplicateValues.get(owner)
  if (!warned) {
    warned = new Set()
    warnedDuplicateValues.set(owner, warned)
  }
  if (warned.has(value)) {
    return
  }
  warned.add(value)
  console.error(
    owner === 'Select'
      ? `[Moraine Select] Item values must be unique. Ignoring duplicate value ${JSON.stringify(value)}; the first occurrence wins.`
      : `[Moraine BaseSelect] Item values must be unique. Duplicate value ${JSON.stringify(value)} is invalid consumer input.`,
  )
}

export function diagnoseDuplicateItems(items: readonly BaseSelectT.Item[]): void {
  if (!DEV) {
    return
  }
  const values = new Set<BaseSelectT.Value>()
  for (const item of items) {
    if (values.has(item.value)) {
      diagnoseDuplicateValue('BaseSelect', item.value)
    } else {
      values.add(item.value)
    }
  }
}

export function itemRowKey(value: BaseSelectT.Value): string {
  return `item:${typeof value}:${encodeURIComponent(String(value))}`
}

/** Normalize source data once; the same rows serve normal and virtual rendering. */
export function createSource<T extends BaseSelectT.Item>(
  entries: readonly SelectEntry<T>[],
  created: readonly T[] = [],
) {
  const view: SelectView<T> = { items: [], rows: [] }
  const byValue = new Map<T['value'], T>()
  function accept(item: T): boolean {
    if (byValue.has(item.value)) {
      diagnoseDuplicateValue('Select', item.value)
      return false
    }
    byValue.set(item.value, item)
    return true
  }
  function append(item: T) {
    if (accept(item)) {
      view.items.push(item)
      view.rows.push({ type: 'item', key: itemRowKey(item.value), item })
    }
  }
  entries.forEach((entry, index) => {
    if (isGroup(entry)) {
      const items = entry.items.filter(accept)
      if (items.length > 0) {
        view.items.push(...items)
        view.rows.push({
          type: 'label',
          key: `group:${index}`,
          label: entry.label,
          values: items.map((item) => item.value),
        })
        view.rows.push(
          ...items.map((item): SelectRow<T> => ({
            type: 'item',
            key: itemRowKey(item.value),
            item,
          })),
        )
      }
    } else {
      append(entry)
    }
  })
  const additions: T[] = []
  for (const item of created) {
    if (accept(item)) {
      additions.push(item)
    }
  }
  if (additions.length) {
    view.items.unshift(...additions)
    view.rows.unshift(
      ...additions.map((item): SelectRow<T> => ({
        type: 'item',
        key: itemRowKey(item.value),
        item,
      })),
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

export function normalizeSelection<T extends BaseSelectT.Value>(
  values: readonly T[],
  multiple: boolean,
): T[] {
  if (!multiple) {
    return values.slice(0, 1)
  }
  const normalized: T[] = []
  for (const value of values) {
    if (!normalized.some((candidate) => sameValue(candidate, value))) {
      normalized.push(value)
    }
  }
  return normalized
}

export function selectionEqual<T extends BaseSelectT.Value>(
  left: readonly T[],
  right: readonly T[],
): boolean {
  return (
    left.length === right.length && left.every((value, index) => sameValue(value, right[index]))
  )
}
