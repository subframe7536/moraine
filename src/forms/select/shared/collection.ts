import type { BaseSelectT } from '../base-select.types.ts'

export function isGroup<T extends BaseSelectT.Item>(
  entry: BaseSelectT.Entry<T>,
): entry is BaseSelectT.Group<T> {
  return 'type' in entry && entry.type === 'group'
}

export function flattenItems<T extends BaseSelectT.Item>(
  entries: readonly BaseSelectT.Entry<T>[],
): T[] {
  return entries.flatMap((entry) => (isGroup(entry) ? entry.items : [entry]))
}

export function itemKey(value: BaseSelectT.Value): string {
  return `${typeof value}:${Object.is(value, -0) ? '-0' : String(value)}`
}

export function createCollection<T extends BaseSelectT.Item>(entries: BaseSelectT.Entry<T>[]) {
  const items = flattenItems(entries)
  const byValue = new Map<string, T>()
  for (const item of items) {
    const key = itemKey(item.value)
    if (byValue.has(key)) {
      throw new Error(
        `[Moraine BaseSelect] Duplicate item value: ${key}. Every flattened leaf value must be unique.`,
      )
    }
    byValue.set(key, item)
  }
  return { entries, items, byValue }
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
