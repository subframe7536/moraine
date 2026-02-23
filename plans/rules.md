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
13. Internal styling classes must only live in JSX `class` props or in `cva()`. Do not wrap class computation with `createMemo`, and do not keep internal `*Classes` string exports in `*.class.ts`.
14. `cva()` already supports class appending via rest params, so do not wrap variant calls with `cn()`.
    - Forbidden: `cn(fooVariants({ size: 'md' }), local.classes?.root)`
    - Preferred: `fooVariants({ size: 'md' }, local.classes?.root)`
    - Forbidden (conditional): `cn(cond && fooVariants({ size: 'md' }), extra)`
    - Preferred (conditional): `cond ? fooVariants({ size: 'md' }, extra) : extra`
15. `classes` props are end-user override APIs and should keep the same semantics. This rule only targets internal component implementation style composition.
16. Do not use empty-string placeholders in `cva` variant options.
    - Forbidden: `variants: { size: { sm: '', md: '' } }`
    - Preferred: move the condition to JSX class composition, or split into non-empty helper `cva`.
17. Do not use `cva('', {...})`.
    - For slots with no real variants, inline classes directly in JSX `class`.
    - If a helper `cva` is still needed, its base class must be non-empty.
18. Do not call variant generators with an explicit `undefined` first argument.
    - Forbidden: `fooVariants(undefined, local.classes?.root)`
    - Preferred: for no-variant slots use JSX `class`; for real variants pass an object.
19. For major component refactors, follow `plans/generic-component-refactor-rule.md` as the mandatory planning and implementation guide.

**Every component should pass `bun run qa` and `bun run test`**
