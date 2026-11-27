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
  const context =
    defaultValue !== undefined
      ? createContext<T>(defaultValue, { name })
      : createContext<T>(undefined, { name })

  const useContextHook =
    defaultValue !== undefined
      ? () => useContext(context)
      : () => {
          try {
            return useContext(context)
          } catch (error) {
            if (error instanceof Error) {
              throw new TypeError(`use${name}Context must be used within <${name}Provider />`, {
                cause: error,
              })
            }
            throw error
          }
        }

  return [context, useContextHook] as const
}
