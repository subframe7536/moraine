import { createRoot } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { callRef, cn, useId } from './utils.ts'

describe('callRef', () => {
  test('ignores element-valued refs', () => {
    const element = document.createElement('div')

    expect(() => callRef(element, element)).not.toThrow()
  })

  test('calls callback refs', () => {
    let received: HTMLDivElement | undefined
    const element = document.createElement('div')

    callRef((value: HTMLDivElement) => {
      received = value
    }, element)

    expect(received).toBe(element)
  })
})

function resolveId(deterministicId?: () => string | null | undefined, prefix?: string): string {
  return createRoot((dispose) => {
    const id = useId(deterministicId, prefix)
    const value = id()
    dispose()
    return value
  })
}

describe('useId', () => {
  test('returns deterministic id when provided', () => {
    expect(resolveId(() => 'custom-id', 'dialog')).toBe('custom-id')
  })

  test('generates id with provided prefix when deterministic id is missing', () => {
    const generatedId = resolveId(() => undefined, 'dialog')
    expect(generatedId.startsWith('dialog-')).toBe(true)
  })

  test('uses moraine prefix by default', () => {
    const generatedId = resolveId()
    expect(generatedId.startsWith('mo-')).toBe(true)
  })
})

describe('cn', () => {
  test('handles clsx-compatible arrays, objects, and nullish values', () => {
    expect(cn('a', ['b', ['c']], { d: true, e: false }, undefined, null)).toBe('a b c d')
    expect(cn(undefined, null)).toBeUndefined()
    expect(cn('')).toBeUndefined()
  })

  test('conflicting utilities use last-wins', () => {
    expect(cn('px-3', 'px-5')).toBe('px-5')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('border', 'border-2')).toBe('border-2')
  })

  test('modifier chains remain isolated', () => {
    expect(cn('hover:px-3', 'px-5')).toBe('hover:px-3 px-5')
    expect(cn('hover:px-3', 'hover:px-5')).toBe('hover:px-5')
    expect(cn('focus:text-red-500', 'hover:text-red-500')).toBe(
      'focus:text-red-500 hover:text-red-500',
    )
  })

  test('custom Moraine z-index and opacity classes conflict correctly', () => {
    // custom z conflict
    expect(cn('z-base', 'z-raised')).toBe('z-raised')
    expect(cn('z-10', 'z-floating')).toBe('z-floating')
    expect(cn('z-overlay', 'z-20')).toBe('z-20')
    // custom opacity conflict
    expect(cn('opacity-64', 'opacity-100')).toBe('opacity-100')
    expect(cn('opacity-50', 'opacity-64')).toBe('opacity-64')
  })

  test('preserves arbitrary and unknown tokens', () => {
    expect(cn('custom-unknown-class', 'another-class')).toBe('custom-unknown-class another-class')
    expect(cn('[--var-a:10px]', '[--var-b:20px]')).toBe('[--var-a:10px] [--var-b:20px]')
    expect(cn('[--var-a:10px]', '[--var-a:20px]')).toBe('[--var-a:20px]')
  })
})
