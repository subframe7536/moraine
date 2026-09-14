import { describe, expect, test, vi } from 'vitest'

import { createSource, filterView, isGroup, labelString } from './collection.ts'

describe('canonical select collection', () => {
  test('preserves raw items and flattens one-level groups', () => {
    const item = { value: 1, label: 'One', metadata: { name: 'custom' } }
    const collection = createSource([{ type: 'group', label: 'Numbers', items: [item] }])
    expect(collection.items).toEqual([item])
    expect(collection.byValue.get(1)).toBe(item)
  })

  test('canonicalizes duplicate values sequentially with the first occurrence winning', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const first = { value: 'flat-duplicate', label: 'First' }
    const sameGroupFirst = { value: 'same-group-duplicate', label: 'Same group first' }
    const acrossGroupsFirst = { value: 'across-groups-duplicate', label: 'Across groups first' }
    const source = createSource(
      [
        first,
        { value: 'flat-duplicate', label: 'Flat duplicate' },
        {
          type: 'group',
          label: 'First group',
          items: [
            sameGroupFirst,
            { value: 'same-group-duplicate', label: 'Same group duplicate' },
            acrossGroupsFirst,
          ],
        },
        {
          type: 'group',
          label: 'Rejected group',
          items: [
            { value: 'flat-duplicate', label: 'Cross-source duplicate' },
            { value: 'across-groups-duplicate', label: 'Across groups duplicate' },
          ],
        },
      ],
      [
        { value: 'flat-duplicate', label: 'Created canonical collision' },
        { value: 'created-duplicate', label: 'Created first' },
        { value: 'created-duplicate', label: 'Created duplicate' },
      ],
    )

    expect(source.byValue.get('flat-duplicate')).toBe(first)
    expect(source.byValue.get('same-group-duplicate')).toBe(sameGroupFirst)
    expect(source.byValue.get('across-groups-duplicate')).toBe(acrossGroupsFirst)
    expect(source.byValue.get('created-duplicate')?.label).toBe('Created first')
    expect(source.items.map((item) => item.label)).toEqual([
      'Created first',
      'First',
      'Same group first',
      'Across groups first',
    ])
    expect(source.rows.filter((row) => row.type === 'label').map((row) => row.label)).toEqual([
      'First group',
    ])
    expect(source.rows.filter((row) => row.type === 'item')).toHaveLength(4)
    expect(error).toHaveBeenCalledTimes(4)
    error.mockRestore()
  })

  test('keeps string and number identities distinct while treating zero signs alike', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(
      createSource([
        { value: 1, label: 'One' },
        { value: '1', label: 'String' },
      ]).items,
    ).toHaveLength(2)
    expect(
      createSource([
        { value: -0, label: 'Negative' },
        { value: 0, label: 'Zero' },
      ]).items.map((item) => item.label),
    ).toEqual(['Negative'])
    expect(error).toHaveBeenCalledOnce()
    error.mockRestore()
  })

  test('uses collision-safe string keys for grouped and item rows', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const source = createSource([
      {
        type: 'group',
        label: 'Collisions',
        items: [
          { value: 'group-0', label: 'Dash group' },
          { value: 'group:0', label: 'Colon group' },
          { value: 'item:string:x', label: 'Item namespace' },
          { value: '1', label: 'String one' },
          { value: 1, label: 'Number one' },
          { value: -0, label: 'Negative zero' },
        ],
      },
      { value: 0, label: 'Duplicate zero' },
    ])
    const keys = source.rows.map((row) => row.key)
    expect(keys.every((key) => typeof key === 'string')).toBe(true)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toContain('group:0')
    expect(keys).toContain('item:string:group%3A0')
    expect(keys).toContain('item:string:1')
    expect(keys).toContain('item:number:1')
    error.mockRestore()
  })

  test('treats a valued business item with type group as a leaf', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const leaf = { type: 'group' as const, value: 'business', label: 'Business item', rank: 1 }
    const group = { type: 'group' as const, label: 'Real group', items: [leaf] }
    expect(isGroup(leaf)).toBe(false)
    expect(isGroup(group)).toBe(true)
    expect(createSource([leaf, group]).items).toEqual([leaf])
    error.mockRestore()
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
    { type: 'label', key: 'group:0', label: 'Numbers', values: [2] },
    { type: 'item', key: 'item:number:2', item: second },
  ])
  expect(source.byValue.get(1)).toBe(first)
})
