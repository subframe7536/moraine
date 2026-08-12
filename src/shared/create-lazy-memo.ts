import type { Accessor } from 'solid-js'
import { createMemo, getOwner, runWithOwner } from 'solid-js'

/** Creates a memo on first access while preserving the owner where it was declared. */
export function createLazyMemo<T>(value: () => T): Accessor<T> {
  const owner = getOwner()
  const createMemoForValue = createMemo.bind(null, value) as () => Accessor<T>
  let memo: Accessor<T> | undefined

  return () => {
    memo ??= owner ? runWithOwner(owner, createMemoForValue) : createMemoForValue()
    return memo!()
  }
}
