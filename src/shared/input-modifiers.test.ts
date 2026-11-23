import { describe, expect, test } from 'vitest'

import { applyInputModifiers } from './input-modifiers'
describe('applyInputModifiers', () => {
  test('trims value when trim is true', () => {
    expect(applyInputModifiers('  hello  ', { trim: true })).toBe('hello')
    expect(applyInputModifiers('  hello  ', {})).toBe('  hello  ')
  })

  test('maps empty strings to null when empty mode is set', () => {
    expect(applyInputModifiers('', { empty: 'null' })).toBe(null)
    expect(applyInputModifiers('   ', { empty: 'null' })).toBe(null)
    expect(applyInputModifiers('', {})).toBe('')
    expect(applyInputModifiers('   ', {})).toBe('   ')
  })

  test('handles number modifier contract for numbers, whitespace, empty, and invalid input', () => {
    expect(applyInputModifiers('42', { number: true })).toBe(42)
    expect(applyInputModifiers('  42  ', { number: true })).toBe(42)
    expect(applyInputModifiers('0', { number: true })).toBe(0)
    expect(applyInputModifiers('-3.14', { number: true })).toBe(-3.14)

    // Empty and whitespace return null, never "" or 0
    expect(applyInputModifiers('', { number: true })).toBe(null)
    expect(applyInputModifiers('   ', { number: true })).toBe(null)
    expect(applyInputModifiers('', { number: true, empty: 'preserve' })).toBe(null)

    // Non-numeric text returns null, never NaN
    expect(applyInputModifiers('abc', { number: true })).toBe(null)
    expect(applyInputModifiers('12px', { number: true })).toBe(null)
  })
})
