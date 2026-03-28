import { describe, expect, test } from 'vitest'

import {
  parsePageKeyFromPathname,
  resolvePageKeyFromLocation,
  resolvePageKeyFromPathname,
  toPagePath,
} from './routing'

describe('docs routing', () => {
  test('parses page key from pathname', () => {
    expect(parsePageKeyFromPathname('/textarea')).toBe('textarea')
    expect(parsePageKeyFromPathname('/textarea/')).toBe('textarea')
    expect(parsePageKeyFromPathname('/')).toBeNull()
    expect(parsePageKeyFromPathname('/form/textarea')).toBeNull()
  })

  test('resolves fallback page key for invalid pathname', () => {
    expect(resolvePageKeyFromPathname('/textarea', ['input', 'textarea'])).toBe('textarea')
    expect(resolvePageKeyFromPathname('/unknown', ['input', 'textarea'])).toBe('input')
    expect(resolvePageKeyFromPathname('/form/textarea', ['input', 'textarea'])).toBe('input')
  })

  test('ignores hash by using pathname only', () => {
    expect(
      resolvePageKeyFromLocation({ pathname: '/textarea', hash: '#sizes' }, ['input', 'textarea']),
    ).toBe('textarea')
  })

  test('builds page pathname', () => {
    expect(toPagePath('textarea')).toBe('/textarea')
  })
})
