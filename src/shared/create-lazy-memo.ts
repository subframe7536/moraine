import type { Accessor } from 'solid-js'
import { createMemo, getOwner, runWithOwner } from 'solid-js'

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
  // An explicit `equals: undefined` would replace Solid's default equality check, so omit it.
  const createMemoForValue = (
    equals === undefined
      ? createMemo.bind(null, value)
      : // oxlint-disable-next-line subf/solid-reactivity -- Lazy memo factory; equals options require an explicit createMemo call.
        () => createMemo(value, undefined, { equals })
  ) as () => Accessor<T>
  let memo: Accessor<T> | undefined

  return () => {
    memo ??= owner ? runWithOwner(owner, createMemoForValue) : createMemoForValue()
    return memo!()
  }
}
