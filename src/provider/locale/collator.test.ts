import { createRoot } from 'solid-js'
import { describe, expect, test } from 'vitest'

import {
  collatorEndsWith,
  collatorEquals,
  collatorIncludes,
  collatorStartsWith,
  createSearchCollator,
} from './collator'

describe('search collator', () => {
  test('matches case, accents, and fullwidth letters', () => {
    const collator = createSearchCollator('en-US')
    expect(collatorIncludes(collator, 'Apple', 'ap')).toBe(true)
    expect(collatorStartsWith(collator, 'Ａlpha', 'a')).toBe(true)
    expect(collatorEndsWith(collator, 'Café', 'fe')).toBe(true)
    expect(collatorEquals(collator, 'Apple', 'Banana')).toBe(false)
  })

  test('uses the locale for default filtering', () => {
    const turkish = createSearchCollator('tr')
    expect(collatorIncludes(turkish, 'Işık', 'ış')).toBe(true)
    expect(collatorStartsWith(turkish, 'Işık', 'ış')).toBe(true)
  })
})

describe('search collator in a reactive root', () => {
  test('can be created during setup', () => {
    createRoot((dispose) => {
      const collator = createSearchCollator('de-DE')
      expect(collatorIncludes(collator, 'Straße', 'str')).toBe(true)
      dispose()
    })
  })
})
