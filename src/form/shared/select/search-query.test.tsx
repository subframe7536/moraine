import { createRoot, createSignal } from 'solid-js'
import { expect, test, vi } from 'vitest'

import { useSearchQuery } from './search-query'

test('keeps uncontrolled query text and applies the current length limit', () => {
  createRoot((dispose) => {
    const [maxLength, setMaxLength] = createSignal(3)
    const onValueChange = vi.fn()
    const search = useSearchQuery({
      defaultValue: 'a',
      get maxLength() {
        return maxLength()
      },
      onValueChange,
    })

    expect(search.value()).toBe('a')
    expect(search.setValue('abcd')).toBe('abc')
    expect(search.value()).toBe('abc')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('abc')
    search.setValue('abc')
    expect(onValueChange).toHaveBeenCalledTimes(1)
    setMaxLength(5)
    expect(search.setValue('abcde')).toBe('abcde')
    expect(search.value()).toBe('abcde')
    dispose()
  })
})

test('follows a controlled value and reports changes without storing them locally', () => {
  createRoot((dispose) => {
    const [controlled, setControlled] = createSignal<string | undefined>('first')
    const onValueChange = vi.fn()
    const search = useSearchQuery({
      get value() {
        return controlled()
      },
      defaultValue: 'fallback',
      onValueChange,
    })

    expect(search.setValue('second')).toBe('second')
    expect(search.value()).toBe('first')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('second')
    setControlled('second')
    expect(search.value()).toBe('second')
    setControlled(undefined)
    expect(search.value()).toBe('fallback')
    dispose()
  })
})
