import { describe, expect, it } from 'vitest'

import { hasContent } from './jsx-content'

describe('hasContent', () => {
  it('returns true for numeric zero and valid numbers', () => {
    expect(hasContent(0)).toBe(true)
    expect(hasContent(42)).toBe(true)
    expect(hasContent(-1)).toBe(true)
  })

  it('returns true for non-empty strings and whitespace', () => {
    expect(hasContent('Hello')).toBe(true)
    expect(hasContent(' ')).toBe(true)
    expect(hasContent('0')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(hasContent('')).toBe(false)
  })

  it('returns false for falsy values and booleans', () => {
    expect(hasContent(undefined)).toBe(false)
    expect(hasContent(null)).toBe(false)
    expect(hasContent(false)).toBe(false)
    expect(hasContent(true)).toBe(false)
    expect(hasContent(Number.NaN)).toBe(false)
  })

  it('returns false for empty arrays and true for non-empty arrays', () => {
    expect(hasContent([])).toBe(false)
    expect(hasContent([1])).toBe(true)
    expect(hasContent(['text'])).toBe(true)
  })

  it('returns true for objects, JSX elements, and functions', () => {
    expect(hasContent({})).toBe(true)
    expect(hasContent({ type: 'div' })).toBe(true)
    expect(hasContent(() => 'content')).toBe(true)
  })
})
