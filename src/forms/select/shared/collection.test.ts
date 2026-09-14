import { describe, expect, test } from 'vitest'

import { createSource, filterView, labelString } from './collection.ts'

describe('canonical select collection', () => {
  test('preserves raw items and flattens one-level groups', () => {
    const item = { value: 1, label: 'One', metadata: { name: 'custom' } }
    const collection = createSource([{ type: 'group', label: 'Numbers', items: [item] }])
    expect(collection.items).toEqual([item])
    expect(collection.byValue.get(1)).toBe(item)
  })
  test('rejects duplicate values across groups', () => {
    expect(() =>
      createSource([
        { value: 1, label: 'One' },
        { type: 'group', label: 'Numbers', items: [{ value: 1, label: 'Uno' }] },
      ]),
    ).toThrow('Duplicate item value: 1')
  })
  test('keeps string and number identities distinct', () => {
    expect(
      createSource([
        { value: 1, label: 'One' },
        { value: '1', label: 'String' },
      ]).items,
    ).toHaveLength(2)
    expect(() =>
      createSource([
        { value: -0, label: 'Negative' },
        { value: 0, label: 'Zero' },
      ]),
    ).toThrow('Duplicate')
  })
  test('empty groups contain no selectable items', () => {
    expect(createSource([{ type: 'group', label: 'Empty', items: [] }]).items).toEqual([])
  })
  test('resolves machine text independently of the visual label', () => {
    const item = { value: 42, label: undefined }
    expect(labelString(item)).toBe('42')
    expect(labelString({ ...item, label: 'Answer' })).toBe('Answer')
    expect(labelString(item, () => 'custom')).toBe('custom')
  })
})

test('shares filtered rows without changing canonical lookup', () => {
  const first = { value: 1, label: 'One', extra: 'raw' }
  const second = { value: 2, label: 'Two', extra: 'raw' }
  const source = createSource([{ type: 'group', label: 'Numbers', items: [first, second] }])
  const view = filterView(source, (item) => item.value === 2)
  expect(view.items).toEqual([second])
  expect(view.rows).toEqual([
    { type: 'label', key: 'group-0', label: 'Numbers', values: [2] },
    { type: 'item', key: 2, item: second },
  ])
  expect(source.byValue.get(1)).toBe(first)
})
