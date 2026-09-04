import { createContext, useContext } from 'solid-js'

/**
 * Creates a typed context provider with optional fallback.
 *
 * When defaultValue is NOT provided: context is required (throws if missing)
 * When defaultValue IS provided: context is optional (returns defaultValue if missing)
 *
 * @param name - The name of the context (used in error messages)
 * @param defaultValue - Optional default value for optional contexts
 * @returns A tuple of [Provider, useContextHook]
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
