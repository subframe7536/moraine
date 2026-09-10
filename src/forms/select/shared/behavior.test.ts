import { describe, expect, test } from 'vitest'

import {
  getSelectedValueKey,
  flattenOptions,
  normalizeOptions,
  resolveSelectedOptions,
} from './behavior'

describe('selected option resolution', () => {
  test('consumes duplicate values in selected order and keeps signed zero distinct', () => {
    const options = flattenOptions(
      normalizeOptions([
        { label: 'Negative zero', value: -0 },
        { label: 'Positive zero', value: 0 },
        { label: 'Second positive zero', value: 0 },
        { label: 'Unknown', value: Number.NaN },
      ]),
    )
    const resolution = resolveSelectedOptions(options, [-0, 0, 0, Number.NaN, 'missing'])

    expect(new Set(options.map((option) => option.id)).size).toBe(options.length)
    expect(resolution.options.map((option) => option.label)).toEqual([
      'Negative zero',
      'Positive zero',
      'Second positive zero',
      'Unknown',
    ])
    expect(resolution.entries.at(-1)).toEqual({ type: 'unmatched', value: 'missing' })
    expect(Object.is(resolution.options[0]?.value, -0)).toBe(true)
    expect(Object.is(resolution.options[1]?.value, 0)).toBe(true)
    expect(getSelectedValueKey(-0)).not.toBe(getSelectedValueKey(0))
  })
})
