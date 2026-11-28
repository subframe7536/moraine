import type { Accessor } from 'solid-js'
import { createMemo, getNextChildId, getOwner, runWithOwner } from 'solid-js'
/** Creates a memo on first access while preserving the owner where it was declared. */
export function createLazyMemo<T>(
  value: () => T,
  options?: {
    equals?: false | ((prev: T, next: T) => boolean)
    owner?: ReturnType<typeof getOwner>
  },
): Accessor<T> {
  const owner = options?.owner !== undefined ? options.owner : getOwner()
  const equals = options?.equals
  // The memo is created at first read, whose timing differs between SSR (eager
  // attribute serialization) and hydration (deferred spread effects). Reserve
  // the hydration child id at call time under the ambient owner — the component
  // owner at declaration, the computing memo inside a compute — so the id slot
  // is deterministic on both sides regardless of when the memo is first read.
  const idOwner = getOwner() ?? owner
  const id = idOwner?.id !== undefined ? getNextChildId(idOwner) : undefined
  const createMemoForValue = (
    equals === undefined ? () => createMemo(value, { id }) : () => createMemo(value, { equals, id })
  ) as () => Accessor<T>
  let memo: Accessor<T> | undefined

  return () => {
    memo ??= owner ? runWithOwner(owner, createMemoForValue) : createMemoForValue()
    return memo()
  }
}
