import { describe, expect, test } from 'vitest'

import { createCollection, flattenItems, itemKey, labelString } from './collection.ts'

describe('canonical select collection', () => {
  test('preserves raw items and flattens one-level groups', () => {
    const item = { value: 1, label: 'One', metadata: { name: 'custom' } }
    const collection = createCollection([{ type: 'group', label: 'Numbers', items: [item] }])
    expect(collection.items).toEqual([item])
    expect(collection.byValue.get(itemKey(1))).toBe(item)
  })
  test('rejects duplicate values across groups', () => {
    expect(() =>
      createCollection([
        { value: 1, label: 'One' },
        { type: 'group', label: 'Numbers', items: [{ value: 1, label: 'Uno' }] },
      ]),
    ).toThrow('Duplicate item value: number:1')
  })
  test('keeps string and number identities distinct', () => {
    expect(
      createCollection([
        { value: 1, label: 'One' },
        { value: '1', label: 'String' },
      ]).items,
    ).toHaveLength(2)
    expect(itemKey(-0)).not.toBe(itemKey(0))
  })
  test('empty groups contain no selectable items', () => {
    expect(flattenItems([{ type: 'group', label: 'Empty', items: [] }])).toEqual([])
  })
  test('resolves machine text independently of the visual label', () => {
    const item = { value: 42, label: undefined }
    expect(labelString(item)).toBe('42')
    expect(labelString({ ...item, label: 'Answer' })).toBe('Answer')
    expect(labelString(item, () => 'custom')).toBe('custom')
  })
})
