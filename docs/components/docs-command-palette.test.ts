import { describe, expect, test } from 'vitest'

import { buildDocsCommandItems } from './docs-command-palette'

describe('buildDocsCommandItems', () => {
  test('maps page descriptions and search tags into command items', () => {
    const groups = buildDocsCommandItems([
      {
        key: 'button',
        label: 'Button',
        description: 'Triggers an action.',
        order: 10,
        tags: ['submit', 'loading'],
        path: '/button',
        group: 'general',
      },
    ])
    const item = groups[0]?.items?.[0]

    expect(item).toMatchObject({
      value: 'button',
      label: 'Button',
      description: 'Triggers an action.',
      keywords: ['submit', 'loading'],
    })
    expect(item?.onSelect).toBeUndefined()
  })
})
