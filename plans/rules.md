## Solid Reactivity Rules For Ports

These rules apply to all future component ports:

1. Treat `useId` as an accessor built with `createMemo`; always read IDs with `id()`.
2. Do NOT use `createEffect` to mirror reactive values into signals.
3. Use Solid `children` API (`children(() => ...)`) for child normalization and slot rendering:
   https://docs.solidjs.com/reference/component-apis/children
4. Use `mergeProps` to define default props when default key count is 3 or more.
5. Only handle `camelCase` event listener (like `onClick`)
6. For new shared/component contexts
7. Use `createContextProvider` (from `src/shared/create-context-provider.ts`) to define `Provider + hook` pairs instead of ad-hoc `createContext` boilerplate.
8. Use getter-based context values for reactive context fields (for example: `get name() { return local.name }`) instead of accessor.
9. Set default value to `null` if the context is optional, and check if it is null before using it or use `ctx?.key`
10. Use `icon-*` aliases (for example `icon-loading`, `icon-check`) for all component default icons.
11. Do not hardcode provider-specific classes like `i-lucide-*` as component defaults.
12. Keep raw `i-*` classes only in theme preset icon mapping and in tests/examples that explicitly verify direct icon-class support.

**Every component should pass `bun run qa` and `bun run test`**
