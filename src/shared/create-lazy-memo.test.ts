import { createRoot, createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'

import { createLazyMemo } from './create-lazy-memo.ts'

describe('createLazyMemo', () => {
  it('defers evaluation and caches the memo result', () => {
    createRoot((dispose) => {
      let evaluations = 0
      const memo = createLazyMemo(() => {
        evaluations += 1
        return 'content'
      })

      expect(evaluations).toBe(0)
      expect(memo()).toBe('content')
      expect(memo()).toBe('content')
      expect(evaluations).toBe(1)

      dispose()
    })
  })

  it('keeps the memo attached to the owner where it was declared', () => {
    createRoot((disposeOwner) => {
      const [value, setValue] = createSignal(0)
      const memo = createLazyMemo(value)

      createRoot((disposeReader) => {
        expect(memo()).toBe(0)
        disposeReader()
      })

      setValue(1)
      expect(memo()).toBe(1)

      disposeOwner()
    })
  })
})
