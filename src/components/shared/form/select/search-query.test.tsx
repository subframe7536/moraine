import { createRoot, createSignal, flush } from 'solid-js'
import { expect, vi, it } from 'vitest'

import { useSearchQuery } from './search-query'
it('keeps uncontrolled query text and applies the current length limit', () => {
  createRoot((dispose) => {
    const [maxLength, setMaxLength] = createSignal(3, { ownedWrite: true })
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const search = useSearchQuery({
      defaultValue: 'a',
      get maxLength() {
        return maxLength()
      },
      onValueChange,
    })

    expect(search.value()).toBe('a')
    flush(() => expect(search.setValue('abcd')).toBe('abc'))
    expect(search.value()).toBe('abc')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('abc')
    flush(() => search.setValue('abc'))
    expect(onValueChange).toHaveBeenCalledTimes(1)
    flush(() => setMaxLength(5))
    flush(() => expect(search.setValue('abcde')).toBe('abcde'))
    expect(search.value()).toBe('abcde')
    dispose()
  })
})

it('follows a controlled value and reports changes without storing them locally', () => {
  createRoot((dispose) => {
    const [controlled, setControlled] = createSignal<string | undefined>('first', {
      ownedWrite: true,
    })
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
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
    flush(() => setControlled('second'))
    expect(search.value()).toBe('second')
    flush(() => setControlled(undefined))
    expect(search.value()).toBe('fallback')
    dispose()
  })
})
