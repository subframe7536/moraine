import { describe, expect, test, vi } from 'vitest'

import { buildDocsCommandItems } from './docs-command-palette'

describe('buildDocsCommandItems', () => {
  test('maps page descriptions and search tags into command items', () => {
    const onNavigate = vi.fn()
    const groups = buildDocsCommandItems(
      [
        {
          key: 'button',
          label: 'Button',
          description: 'Triggers an action.',
          order: 10,
          tags: ['submit', 'loading'],
          path: '/button',
          group: 'general',
        },
      ],
      onNavigate,
    )
    const item = groups[0]?.items?.[0]

    expect(item).toMatchObject({
      value: 'button',
      label: 'Button',
      description: 'Triggers an action.',
      keywords: ['submit', 'loading'],
    })
    item?.onSelect?.()
    expect(onNavigate).toHaveBeenCalledWith('button')
  })
})
