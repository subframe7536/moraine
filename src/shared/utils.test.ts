import { createRenderEffect, createRoot, createSignal, flush } from 'solid-js'
import { describe, expect, it } from 'vitest'

import { cn } from '../theme/cn'

import { callRef, createId } from './utils'
describe('callRef', () => {
  it('ignores element-valued refs', () => {
    const element = document.createElement('div')

    expect(() => callRef(() => element, element)).not.toThrow()
  })

  it('calls callback refs', () => {
    let received: HTMLDivElement | undefined
    const element = document.createElement('div')

    callRef(
      () => (value: HTMLDivElement) => {
        received = value
      },
      element,
    )

    expect(received).toBe(element)
  })

  it('untracks reactive reads inside callback refs', () => {
    const [count, setCount] = createSignal(0, { ownedWrite: true })
    let runs = 0
    const element = document.createElement('div')

    createRoot((dispose) => {
      createRenderEffect(
        () => undefined,
        () => {
          runs++
          callRef(
            () => (_el: HTMLDivElement) => {
              count()
            },
            element,
          )
        },
      )

      expect(runs).toBe(1)
      flush(() => setCount(1))
      expect(runs).toBe(1)
      dispose()
    })
  })
})

function resolveId(deterministicId?: () => string | null | undefined, prefix?: string): string {
  return createRoot((dispose) => {
    const id = createId(deterministicId, prefix)
    const value = id()
    dispose()
    return value
  })
}

describe('createId', () => {
  it('returns deterministic id when provided', () => {
    expect(resolveId(() => 'custom-id', 'dialog')).toBe('custom-id')
  })

  it('generates id with provided prefix when deterministic id is missing', () => {
    const generatedId = resolveId(() => undefined, 'dialog')
    expect(generatedId.startsWith('dialog-')).toBe(true)
  })

  it('uses moraine prefix by default', () => {
    const generatedId = resolveId()
    expect(generatedId.startsWith('mo-')).toBe(true)
  })

  it('keeps fallback id stable when deterministic id is cleared after being set', () => {
    createRoot((dispose) => {
      const [customId, setCustomId] = createSignal<string | undefined>(undefined, {
        ownedWrite: true,
      })
      const id = createId(customId, 'field')
      const initialFallback = id()
      expect(initialFallback.startsWith('field-')).toBe(true)

      flush(() => setCustomId('custom-name'))
      expect(id()).toBe('custom-name')

      flush(() => setCustomId(undefined))
      expect(id()).toBe(initialFallback)
      dispose()
    })
  })
})

describe('cn', () => {
  it('handles clsx-compatible arrays, objects, and nullish values', () => {
    expect(cn('a', ['b', ['c']], { d: true, e: false }, undefined, null)).toBe('a b c d')
    expect(cn(undefined, null)).toBeUndefined()
    expect(cn('')).toBeUndefined()
  })

  it('conflicting utilities use last-wins', () => {
    expect(cn('px-3', 'px-5')).toBe('px-5')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('border', 'border-2')).toBe('border-2')
  })

  it('modifier chains remain isolated', () => {
    expect(cn('hover:px-3', 'px-5')).toBe('hover:px-3 px-5')
    expect(cn('hover:px-3', 'hover:px-5')).toBe('hover:px-5')
    expect(cn('focus:text-red-500', 'hover:text-red-500')).toBe(
      'focus:text-red-500 hover:text-red-500',
    )
  })

  it('custom Moraine z-index classes conflict correctly', () => {
    expect(cn('z-base', 'z-raised')).toBe('z-raised')
    expect(cn('z-10', 'z-floating')).toBe('z-floating')
    expect(cn('z-overlay', 'z-20')).toBe('z-20')
  })

  it('custom Moraine animation utility classes conflict correctly', () => {
    expect(cn('enter-opacity-0', 'enter-opacity-100')).toBe('enter-opacity-100')
    expect(cn('exit-opacity-0', 'exit-opacity-95')).toBe('exit-opacity-95')
    expect(cn('enter-scale-95', 'enter-scale-100')).toBe('enter-scale-100')
    expect(cn('exit-scale-95', 'exit-scale-100')).toBe('exit-scale-100')
    expect(cn('enter-translate-x-1', 'enter-translate-x-2')).toBe('enter-translate-x-2')
    expect(cn('enter-translate-x-1', '-enter-translate-x-2')).toBe('-enter-translate-x-2')
    expect(cn('exit-translate-x-1', '-exit-translate-x-1')).toBe('-exit-translate-x-1')
    expect(cn('enter-translate-y-1', 'enter-translate-y-2')).toBe('enter-translate-y-2')
    expect(cn('enter-translate-y-1', '-enter-translate-y-1')).toBe('-enter-translate-y-1')
    expect(cn('exit-translate-y-1', '-exit-translate-y-2')).toBe('-exit-translate-y-2')
    expect(cn('enter-rotate-45', 'enter-rotate-90')).toBe('enter-rotate-90')
    expect(cn('enter-rotate-45', '-enter-rotate-45')).toBe('-enter-rotate-45')
    expect(cn('exit-rotate-45', '-exit-rotate-90')).toBe('-exit-rotate-90')
  })

  it('preserves arbitrary and unknown tokens', () => {
    expect(cn('custom-unknown-class', 'another-class')).toBe('custom-unknown-class another-class')
    expect(cn('[--var-a:10px]', '[--var-b:20px]')).toBe('[--var-a:10px] [--var-b:20px]')
    expect(cn('[--var-a:10px]', '[--var-a:20px]')).toBe('[--var-a:20px]')
  })
})
