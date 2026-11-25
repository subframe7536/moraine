/**
 * Test-only `@solidjs/testing-library` wrapper, aliased in `vitest.config.ts`:
 * re-exports the library and wraps `fireEvent` to flush Solid 2's microtask
 * update queue after dispatch, so assertions see settled DOM.
 * `#tl` aliases the real package entry — importing `@solidjs/testing-library`
 * here would resolve back to this file.
 */
import { flush } from 'solid-js'

import { fireEvent as domFireEvent } from '#tl'

// oxlint-disable-next-line import/export -- #tl is a Vitest alias to @solidjs/testing-library
export * from '#tl'

export const fireEvent = new Proxy(domFireEvent, {
  apply(target, thisArg, args: Array<unknown>) {
    const result: unknown = Reflect.apply(target, thisArg, args)
    flush()
    return result
  },
  get(target, prop, receiver) {
    const value: unknown = Reflect.get(target, prop, receiver)
    if (typeof value !== 'function') {
      return value
    }
    return (...args: Array<unknown>) => {
      const result: unknown = (value as (...args: Array<unknown>) => unknown).apply(target, args)
      flush()
      return result
    }
  },
})
