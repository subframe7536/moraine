import { createContext, useContext } from 'solid-js'

/** Creates a required context hook, or an optional one when a fallback is supplied. */
export function createContextProvider<CtxValue>(name: string, defaultValue?: CtxValue) {
  const context = createContext<CtxValue>()

  function useContextHook(): CtxValue {
    const ctx = useContext(context)

    if (defaultValue !== undefined) {
      return ctx ?? defaultValue
    }

    if (!ctx) {
      throw new Error(`use${name}Context must be used within <${name}Provider />`)
    }

    return ctx
  }

  return [context.Provider, useContextHook, context] as const
}
