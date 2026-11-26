import type { FlowComponent } from 'solid-js'
import { createContext, useContext } from 'solid-js'
/**
 * Creates a typed context provider and hook.
 *
 * When `defaultValue` is omitted, the context is required and throws outside a provider.
 * When `defaultValue` is provided, the hook returns that fallback outside a provider.
 */
export function createContextProvider<T>(
  name: string,
  defaultValue?: T,
): readonly [FlowComponent<{ value: T }>, () => T] {
  // `useContext` throws its own error when the context has no default; `null`
  // marks "no provider" so the hook's custom message wins.
  const context = createContext<T | null>(defaultValue === undefined ? null : defaultValue, {
    name,
  })

  const useContextHook =
    defaultValue !== undefined
      ? () => useContext(context) ?? defaultValue
      : () => {
          const ctx = useContext(context)
          if (ctx === null) {
            throw new Error(`use${name}Context must be used within <${name}Provider />`)
          }
          return ctx
        }

  return [context, useContextHook] as const
}
