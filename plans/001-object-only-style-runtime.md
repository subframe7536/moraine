# Plan 001: Add the object-only style runtime

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 7a0c7768..HEAD -- src/shared src/index.ts src/utils.ts package.json`
> If an in-scope file changed since this plan was written, compare the current
> code with the excerpts below; stop if the intended public/runtime contract
> has already changed.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `7a0c7768`, 2026-09-03

## Why this matters

Moraine currently delegates both class joining and variants to `cls-variant`.
That leaves conflicting Tailwind utilities in the DOM and models a multi-slot
component as several disconnected single-element resolvers. This plan adds the
new runtime required by the PRD: a configured conflict-resolving `cn`, the
incompatible object-only `recipe`, object-style CSS-variable resolution, and
explicit source constants replacing hidden UnoCSS shortcuts. It establishes
unit and type coverage before component renderers are migrated in later plans.

## Current state

- `src/shared/utils.ts:1-4,49-62` imports `cls-variant`, exposes mutable
  `extendCN`, and exports `cva`; it is the only current public class runtime.
- `src/shared/types.ts:1-6` imports `ClassValue` from `cls-variant` and makes
  it the public `SlotClassValue` type.
- `src/index.ts:7` publicly exports `cn`, `cva`, and `extendCN`; `src/utils.ts`
  exports only `useId` from this module.
- `src/shared/cva-common.class.ts:1-55` stores reusable class maps and still
  contains a parenthesized UnoCSS group in `REQUIRED_MARK_VARIANT`.
- `src/unocss/theme.ts:540-585` currently implements `effect-*`, semantic
  animation, `z-*`, and other component shortcuts. These must not remain as a
  hidden compatibility surface once `src/` uses standard classes.
- `PRD.md:44-90` limits `cn` to runtime class normalization/conflict handling;
  it must not claim to generate CSS, scan classes, load a plugin/preset, or
  validate tokens. `PRD.md:95-353` specifies the `recipe(options)` overloads.
- `PRD.md:722-908` specifies `formatCssVars` and `defineStyleVars`, including
  nullish filtering, array compound matching, object-only styles, and no cache.

Relevant existing conventions:

```ts
// src/shared/utils.ts
export function cn(...classes: ClassValueArray): string | undefined {
  return __fn(cls(...classes)) || undefined
}
```

Shared code uses `.ts` relative imports with explicit extensions; public
component types live under namespaces. Tests use Vitest and reside beside the
module (`src/shared/utils.test.ts` is the nearest structure example).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Targeted runtime tests | `nub run test src/shared/utils.test.ts src/shared/style/recipe.test.ts src/shared/style/css-vars.test.ts` | exit 0, all selected tests pass |
| Typecheck | `nub run typecheck` | exit 0 with no TypeScript errors |
| Type fixtures | `nub run test:types` | exit 0 |
| Final quality gate | `nub run qa` | exit 0 |

## Scope

**In scope**:

- `package.json` and the lockfile entry for replacing `cls-variant` with the
  `cn` package required by the PRD.
- `src/shared/utils.ts`, `src/shared/types.ts`, `src/shared/utils.test.ts`.
- Create `src/shared/style/recipe.ts`, `recipe.test.ts`, `css-vars.ts`,
  `css-vars.test.ts`, and `presets.ts`.
- `src/shared/cva-common.class.ts`, `src/index.ts`, `src/utils.ts`.
- The two existing type fixture entry points under `src/shared/type-test/`.

**Out of scope**:

- Component `.tsx` and `.class.ts` migration (plans 003 and 004).
- `MoraineProvider` (plan 002).
- Removal of `cls-variant`, `cva`, `extendCN`, UnoCSS transformers, CSS bundle
  exports, and Tailwind v3 support (plan 005). Do not remove the internal
  legacy bridge while old component callers exist.
- Documentation edits and consumer fixtures (plan 005).

## Git workflow

- Branch: `codex/001-object-only-style-runtime`.
- Use small logical commits; recent commits use conventional messages such as
  `refactor(modal)!: move content renderer to children`.
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Add the configured `cn` runtime without changing old callers

Add the PRD-selected `cn` dependency using the repository's `nub` workflow.
In `src/shared/utils.ts`, import `createCn` from `cn/config`, define the
Moraine extension groups exactly for `z-base` through `z-floating`,
`opacity-64`, and `ring-3`, and export this function as `cn`. Preserve
`useId` unchanged. Make the new class-value type originate in the new runtime
and update `SlotClassValue` in `src/shared/types.ts` accordingly.

Until plans 003 and 004 eliminate all callers, retain the existing
`cls-variant` imports and `cva` implementation as an explicitly temporary,
**internal migration bridge**. Do not add a new public alias, overload, or
documentation for it. Keep `extendCN` only as long as its legacy `cva` bridge
requires it; no newly written code may call it.

Add focused tests proving: clsx-compatible arrays/objects/nullish values work;
conflicting utilities use last-wins; modifier chains remain isolated; custom
Moraine z-index/opacity/ring classes conflict correctly; arbitrary and unknown
tokens are preserved. Test the actual `cn`, not CSS output.

**Verify**: `nub run test src/shared/utils.test.ts` → exit 0 and the new
conflict tests pass.

### Step 2: Implement the incompatible `recipe(options)` API

Create `src/shared/style/recipe.ts` using the exact object-only shapes from
`PRD.md:95-353`:

- atomic mode uses `{ base, variants, compoundVariants, defaultVariants }`;
- multi-slot mode uses `{ slots, base, variants, compoundVariants,
  defaultVariants }` and returns per-slot functions plus pre-resolved
  `classes`;
- compound entries are `{ variants: ..., class: ... }`, and matchers accept a
  scalar or readonly array;
- booleans must select the string keys `true`/`false`; `undefined`/`null` must
  not select a variant value;
- every final class result goes through the new `cn`, including extra classes.

Export `ClassValue`, `VariantProps`, `VariantSchema`, selection/matcher types,
and recipe function types that component namespaces can consume. Avoid any
`Map`, LRU, memoized variant-result table, referential-identity promise, or
complexity claim. The runtime must directly recompute from its arguments.

Add `recipe.test.ts` covering atomic and multi-slot recipes; defaults; boolean
variants; nullish selections; extra-class ordering; cross-slot compound rules;
array matchers; and `cn` conflict resolution. Include a test that invokes the
same selection twice and compares values rather than object identity.

**Verify**: `nub run test src/shared/style/recipe.test.ts` → exit 0 with all
listed behavior covered.

### Step 3: Implement object-only CSS-variable helpers

Create `src/shared/style/css-vars.ts` following `PRD.md:722-908`. `formatCssVars`
must prefix keys with `--` or `--<prefix>-`, preserve already-prefixed keys,
and omit only `null`/`undefined`. `defineStyleVars` must merge base variables,
selected variant variables, matching scalar/array compound variables, then
extra `JSX.CSSProperties` objects from left to right. It accepts style objects
only and does not cache resolver results.

Add tests for prefixing, already-prefixed keys, nullish filtering, default and
explicit variants, array compounds, and property-level precedence across extra
objects. Add negative type assertions to both type-test fixtures showing string
root/slot style values and string `defineStyleVars` extras are rejected.

**Verify**: `nub run test src/shared/style/css-vars.test.ts && nub run test:types`
→ both commands exit 0.

### Step 4: Replace source shortcuts with explicit preset constants

Create `src/shared/style/presets.ts`. Port every named shortcut currently
returned by `presetMoraine` that is used by library source: focus, disabled,
invalid, loading, surface/layout, placeholder/input/accordion, all semantic
enter/exit and side offsets, and semantic z-index values. Use flat standard
Tailwind syntax only; for example replace `hover:(text-foreground bg-muted)`
with separate `hover:text-foreground hover:bg-muted` tokens. Preserve the
existing target-specific offsets/directions when translating semantic motion.

Convert the parenthesized `REQUIRED_MARK_VARIANT` in
`src/shared/cva-common.class.ts` to a flat standard string. Do not yet change
component import sites; plans 003/004 will consume the constants and then
remove shortcuts from `presetMoraine`.

Export `cn`, `recipe`, `defineStyleVars`, `formatCssVars`, and their public
types from both `src/index.ts` and `src/utils.ts`. During this staged plan,
do not remove the legacy exports required by live component code; plan 005 is
their coordinated removal.

**Verify**: `nub run typecheck` → exit 0. `rg -n "after:\(" src/shared/cva-common.class.ts`
→ no output.

## Test plan

- Extend `src/shared/utils.test.ts` with class normalization/conflict-boundary
  cases, including custom Moraine groups and unsupported tokens.
- Add deterministic unit tests in `src/shared/style/recipe.test.ts` and
  `src/shared/style/css-vars.test.ts`; do not snapshot cache identity or claim
  O(1) resolution.
- Add compile-time negative cases to `src/shared/type-test/default/index.tsx`
  and `autocomplete/index.tsx` using `// @ts-expect-error` for string styles.

## Done criteria

- [ ] `nub run test src/shared/utils.test.ts src/shared/style/recipe.test.ts src/shared/style/css-vars.test.ts` exits 0.
- [ ] `nub run typecheck` and `nub run test:types` exit 0.
- [ ] `recipe` has only object-form overloads; `rg -n "recipe\(['\"]" src` has no output.
- [ ] `rg -n "Map<|LRU|O\(1\)" src/shared/style/recipe.ts src/shared/style/css-vars.ts` has no output.
- [ ] New source constants use no parenthesized variant groups: `rg -n "\w+:\(" src/shared/style/presets.ts src/shared/cva-common.class.ts` has no output.
- [ ] No file outside the scope list is modified, except the package-manager lockfile required by dependency resolution.
- [ ] `plans/README.md` marks plan 001 DONE.

## STOP conditions

- `cn/config` does not expose `createCn` with the extension schema documented
  in the PRD, or the installed package has a materially incompatible API.
- A type-safe recipe API cannot express an existing `VariantProps` consumer
  without changing component code; leave the bridge in place and report the
  exact type error for the component-migration plans.
- Adding the dependency changes unrelated lockfile packages.
- A required preset expands to syntax Tailwind v4 cannot parse.

## Maintenance notes

Plans 003/004 must use `recipe` and `presets.ts` exclusively for new styling.
Reviewers should reject any newly introduced shortcut token, string style, or
cache. The temporary legacy bridge is not a compatibility promise: plan 005
must delete it after a repository-wide caller audit.
