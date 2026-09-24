import { DEV } from 'solid-js'

import type { BaseSelectT, BaseSelectValue } from '../../base-select/base-select.types.ts'

import type {
  SelectEntry,
  SelectGroup,
  SelectView,
  SelectRow,
  NormalizedSelectItem,
} from './types.ts'

export function isGroup<T extends string | BaseSelectT.Item>(
  entry: SelectEntry<T>,
): entry is SelectGroup<T> {
  return (
    typeof entry === 'object' &&
    'type' in entry &&
    entry.type === 'group' &&
    !('value' in entry) &&
    'items' in entry &&
    Array.isArray(entry.items)
  )
}

/** Expand string shorthand without copying object items or resolving their JSX labels. */
export function normalizeSelectEntries<T extends string | BaseSelectT.Item>(
  entries: readonly SelectEntry<T>[],
): SelectEntry<NormalizedSelectItem<T>>[] {
  const normalize = (item: T): NormalizedSelectItem<T> =>
    (typeof item === 'string' ? { value: item, label: item } : item) as NormalizedSelectItem<T>
  return entries.map((entry) => {
    if (isGroup(entry)) {
      return {
        type: 'group',
        get label() {
          return entry.label
        },
        items: entry.items.map(normalize),
      }
    }
    return normalize(entry)
  })
}

const warnedDuplicateValues = new Map<string, Set<BaseSelectValue>>()

export function diagnoseDuplicateValue(
  owner: 'BaseSelect' | 'Select',
  value: BaseSelectValue,
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
  const values = new Set<BaseSelectValue>()
  for (const item of items) {
    if (values.has(item.value)) {
      diagnoseDuplicateValue('BaseSelect', item.value)
    } else {
      values.add(item.value)
    }
  }
}

export function itemRowKey(value: BaseSelectValue): string {
  return `item:${typeof value}:${encodeURIComponent(String(value))}`
}

/** Normalize source data once; the same rows serve normal and virtual rendering. */
export function createSource<T extends BaseSelectT.Item>(
  entries: readonly SelectEntry<T>[],
  created: readonly T[] = [],
  previous?: SelectView<T>,
): SelectView<T> & { byValue: Map<T['value'], T> } {
  const view: SelectView<T> = { items: [], rows: [] }
  const byValue = new Map<T['value'], T>()
  const previousRows = new Map<string, SelectRow<T>>()
  if (previous) {
    for (const row of previous.rows) {
      previousRows.set(row.key, row)
    }
  }
  function getRow(key: string, item: T): SelectRow<T> {
    const existing = previousRows.get(key)
    if (existing && existing.type === 'item') {
      existing.item = item
      return existing
    }
    return { type: 'item', key, item }
  }
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
      view.rows.push(getRow(itemRowKey(item.value), item))
    }
  }
  entries.forEach((entry, index) => {
    if (isGroup(entry)) {
      const items = entry.items.filter(accept)
      if (items.length > 0) {
        view.items.push(...items)
        const groupKey = `group:${index}`
        const existing = previousRows.get(groupKey)
        if (existing && existing.type === 'label') {
          existing.label = entry.label
          existing.values = items.map((item) => item.value)
          view.rows.push(existing)
        } else {
          view.rows.push({
            type: 'label',
            key: groupKey,
            label: entry.label,
            values: items.map((item) => item.value),
          })
        }
        view.rows.push(...items.map((item): SelectRow<T> => getRow(itemRowKey(item.value), item)))
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
      ...additions.map((item): SelectRow<T> => getRow(itemRowKey(item.value), item)),
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
    byValue: source.byValue,
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

/** Converts a public scalar selection into BaseSelect's internal selection array. */
export function singleValueToSelection<T extends BaseSelectValue>(
  value: T | null | undefined,
): T[] | undefined {
  if (value === undefined) {
    return undefined
  }
  return value === null ? [] : [value]
}

/** Serializes against the canonical source rather than a filtered navigation view. */
export function serializeSourceValue<T extends BaseSelectT.Item>(
  source: { byValue: ReadonlyMap<T['value'], T> },
  value: T['value'],
): string | undefined {
  return source.byValue.get(value)?.disabled ? undefined : String(value)
}

/** JavaScript Map/Set equality for raw selection values. */
export function sameValue(a: BaseSelectValue | undefined, b: BaseSelectValue | undefined): boolean {
  return a === b || Object.is(a, b)
}

export function normalizeSelection<T extends BaseSelectValue>(
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

export function selectionEqual<T extends BaseSelectValue>(
  left: readonly T[],
  right: readonly T[],
): boolean {
  return (
    left.length === right.length && left.every((value, index) => sameValue(value, right[index]))
  )
}
