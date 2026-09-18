import { createContext, useContext } from 'solid-js'

/**
 * Creates a typed context provider with optional fallback.
 *
 * Without `defaultValue`, the context is required and the hook throws when
 * no provider is present. With `defaultValue`, the context is optional and
 * the hook returns that fallback when no provider is present.
 *
 * @param name - Context name used in error messages.
 * @param defaultValue - Optional fallback value for optional contexts.
 * @returns A tuple containing the Provider and its context hook.
 *
 * @example
 * ```tsx
 * // Required context - throws if used outside provider
 * const [CheckboxProvider, useCheckboxContext] = createContextProvider<CheckboxContextValue>('Checkbox')
 *
 * // Optional context - returns defaultValue if outside provider
 * const [ConfigProvider, useConfigProvider] = createContextProvider<ConfigProviderContextValue>(
 *   'ConfigProvider',
 *   defaultConfig
 * )
 * ```
 */
export function createContextProvider<CtxValue>(
  name: string,
  defaultValue?: CtxValue,
): [(props: { value: CtxValue; children: any }) => any, () => CtxValue] {
  const context = createContext<CtxValue>()

  function useContextHook(): CtxValue {
    const ctx = useContext(context)

    // If defaultValue was provided, this is an optional context
    if (defaultValue !== undefined) {
      return ctx ?? defaultValue
    }

    // No defaultValue provided - this is a required context
    if (!ctx) {
      throw new Error(`use${name}Context must be used within <${name}Provider />`)
    }

    return ctx
  }

  return [context.Provider, useContextHook]
}
