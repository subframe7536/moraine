import type { Accessor } from 'solid-js'
import { createMemo, getOwner, runWithOwner } from 'solid-js'

/** Creates a memo on first access while preserving the owner where it was declared. */
export function createLazyMemo<T>(value: () => T): Accessor<T> {
  const owner = getOwner()
  let memo: Accessor<T> | undefined

  const createOwnedMemo = (): Accessor<T> => {
    const ownedMemo = createMemo(value)
    return ownedMemo
  }

  return () => {
    memo ??= owner ? runWithOwner(owner, createOwnedMemo) : createOwnedMemo()

    return memo!()
  }
}
