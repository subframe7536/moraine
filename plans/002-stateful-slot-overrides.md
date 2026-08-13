# Plan 002: Add typed, reactive stateful slot overrides

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If anything
> in the STOP conditions occurs, stop and report; do not improvise. When done, update
> this plan's status row in `plans/README.md` unless a reviewer told you they maintain
> the index.
>
> **Drift check (run first)**:
> `git diff --stat 620037aad7b5..HEAD -- src/shared/types.ts src/shared/utils.ts src/shared/types.test.ts src/shared/utils.test.ts src/elements/badge src/unocss docs/build/api-doc test/types style-parity-matrix.md`.
> Plan 001 is expected to add only `style-parity-matrix.md`. If any listed source file
> changed, compare the live declarations and transformer behavior with the excerpts
> below; mismatches are a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/001-freeze-vega-style-baseline.md`
- **Category**: migration
- **Planned at**: commit `620037aad7b5`, 2026-08-13

## Why this matters

Every component currently accepts only static slot classes and CSS objects, so callers
cannot style an item from resolved selection, disclosure, validation, or placement
state without duplicating component state outside Moraine. Adding arbitrary functions
directly to `cn` or JSX `style` would fail at runtime and can also shift Solid's SSR
creation order. This plan establishes one typed resolver and proves the contract on
Badge before domain plans migrate the rest of the library.

## Current state

- `src/shared/types.ts:4-6` defines `SlotClassValue = ClassValue` and
  `SlotStyleValue = JSX.CSSProperties`; there is no callback form.
- Component namespaces use a uniform pattern such as
  `BadgeT.Classes = Slot<SlotClassValue>` and `BadgeT.Styles =
Slot<SlotStyleValue>`.
- `src/shared/utils.ts:56-62` exposes `cn` and `cva`, but no slot-value resolver.
- Components pass `classes?.slot` to `cn` and `styles?.slot` directly into JSX. A
  function added only at the type level would therefore leak into class/style output.
- `docs/build/api-doc/extract.ts:1048-1073` reads each namespace's `Slot` declaration
  independently. The new mapped `Classes`/`Styles` aliases must retain those slot docs.
- `src/unocss/shared.ts` scans `class=` and `.class.ts` constants, but it does not scan
  static or callback class literals inside a JSX `classes={{ ... }}` prop. Prefix and
  compile-class transforms would otherwise miss the new documented form.
- `src/elements/badge/badge.test.tsx` and `badge.ssr.fixture.tsx` already cover reactive
  conditional slots and hydration, making Badge the narrowest representative
  integration target.

## Commands you will need

| Purpose           | Command                                                                                 | Expected on success               |
| ----------------- | --------------------------------------------------------------------------------------- | --------------------------------- |
| Shared tests      | `bun run test src/shared/types.test.ts src/shared/utils.test.ts`                        | all pass                          |
| Transformer tests | `bun run test src/unocss/inject-prefix.test.ts src/unocss/inject-compile-class.test.ts` | all pass                          |
| API extractor     | `bun run test docs/build/api-doc/extract.test.ts`                                       | all pass                          |
| Badge             | `bun run test src/elements/badge/badge.test.tsx`                                        | all pass                          |
| Types             | `bun run typecheck`                                                                     | exit 0, no errors                 |
| Public types      | `bun run test:types`                                                                    | build and both type fixtures pass |

## Suggested executor toolkit

- Use `solid-js-1.x-best-practices-and-api` when wiring callback resolution into JSX.
- Apply `build-ssr-safe-component` to Badge: state callbacks are ordinary data
  functions, must be evaluated only in their rendered slot, and must not create a
  component boundary.

## Scope

**In scope:**

- `src/shared/types.ts`
- `src/shared/types.test.ts`
- `src/shared/utils.ts`
- `src/shared/utils.test.ts`
- `src/elements/badge/badge.tsx`
- `src/elements/badge/badge.test.tsx`
- `src/elements/badge/badge.ssr.fixture.tsx` only if the fixture needs reactive state
  input; preserve its node tree.
- `src/unocss/shared.ts`
- `src/unocss/inject-prefix.test.ts`
- `src/unocss/inject-compile-class.test.ts`
- `docs/build/api-doc/extract.test.ts`
- `docs/build/api-doc/extract.ts` only if the new regression proves a real extraction
  failure; do not pre-emptively rewrite it.
- `test/types/default/index.tsx`
- `test/types/autocomplete/index.tsx`
- `style-parity-matrix.md` — update only the stateful-override foundation entry.
- `plans/README.md` — update only Plan 002's status.

**Out of scope:**

- Styling changes to Badge; Plan 003 owns its Vega alignment.
- Migrating any component other than Badge to callbacks.
- Making top-level `class`, `style`, Modal low-level class/style fields, or arbitrary
  native props stateful.
- Changing component DOM, behavior, render-prop semantics, or state machines.
- Runtime parsing of dynamic class strings, new dependencies, or a safelist system.
- Public docs and generated API JSON; Plan 007 publishes the contract after every
  component has migrated.

## Git workflow

- Branch: `codex/002-stateful-slot-overrides`.
- Prefer two commits: `feat: add stateful slot override foundation`, then
  `test: cover stateful slot transforms and hydration`.
- Do not push or open a pull request unless instructed.

## Target contract

Implement shared, non-root-exported types with this semantic shape; names may follow
the exact codebase style, but do not weaken the constraints:

```ts
type StatefulSlotValue<TValue, TState> = TValue | ((state: Readonly<TState>) => TValue | undefined)

export type SlotClassValue<TState = never> = [TState] extends [never]
  ? ClassValue
  : StatefulSlotValue<ClassValue, TState>

export type SlotStyleValue<TState = never> = [TState] extends [never]
  ? JSX.CSSProperties
  : StatefulSlotValue<JSX.CSSProperties, TState>

export type StatefulSlotClasses<TSlot, TState extends { [K in keyof TSlot]-?: unknown }> = {
  [K in keyof TSlot]?: SlotClassValue<TState[K]>
}

export type StatefulSlotStyles<TSlot, TState extends { [K in keyof TSlot]-?: unknown }> = {
  [K in keyof TSlot]?: SlotStyleValue<TState[K]>
}
```

The default `never` form intentionally keeps components that have not migrated static.
Each migrated component adds a namespace `State` map with exactly one required entry
per slot, then declares `Classes = StatefulSlotClasses<Slot, State>` and the matching
Styles alias. Do not use `unknown`, a component-wide optional state bag, or one union
for every slot; callback inference must know which fields exist for that specific key.

Add one generic runtime helper in `src/shared/utils.ts`:

```ts
resolveSlotValue(value, state)
```

It returns a static value unchanged or invokes a callback with the current state. It
must preserve `undefined`, must not mutate/freeze the state object, and must not call
functions nested inside a `ClassValue` array. A single top-level function is the only
callback form accepted, so `typeof value === 'function'` is unambiguous.

Resolution precedence is fixed:

1. built-in class or internal computed style;
2. resolved `classes.<slot>` or `styles.<slot>`;
3. top-level static `class`/`style` for the root or trigger, where that precedence
   already exists.

## Steps

### Step 1: Add shared mapped types and resolver tests first

Add compile-time examples to `src/shared/types.test.ts` for a two-slot fake component:

- static classes and styles remain assignable;
- `root` and `item` callback parameters infer different readonly fields;
- returning `undefined` is valid;
- a field that belongs only to `item` fails on the `root` callback using
  `@ts-expect-error`;
- a missing state-map key fails the `StatefulSlotClasses` constraint.

Add runtime tests to `src/shared/utils.test.ts` proving static values are returned by
identity, callbacks receive the exact state, `undefined` is preserved, and an array in
a static `ClassValue` is not treated as a callback.

Implement the types and the generic `resolveSlotValue` only after the tests fail for
the expected missing symbols.

**Verify**:

```sh
bun run test src/shared/types.test.ts src/shared/utils.test.ts
bun run typecheck
```

Expected: all shared tests pass and TypeScript exits 0.

### Step 2: Prove API-doc extraction survives the mapped aliases

Extend the existing synthetic declaration fixture in
`docs/build/api-doc/extract.test.ts` with a namespace containing `Slot`, a slot-keyed
`State`, `StatefulSlotClasses`, and `StatefulSlotStyles`. Assert that:

- the component still exposes `classes` and `styles` with its namespace aliases;
- slot names and JSDoc still come from the namespace `Slot` declaration;
- the state map does not appear as a fake runtime slot or item.

Change `extract.ts` only if this regression fails. Keep extraction based on `Slot`; do
not teach it to execute or flatten callback types into runtime documentation.

**Verify**: `bun run test docs/build/api-doc/extract.test.ts` -> all tests pass.

### Step 3: Teach UnoCSS transforms to see `classes` prop literals

Extend the existing span parser in `src/unocss/shared.ts`, rather than adding a parser
dependency. For a TSX `classes={...}` attribute, collect only class-valued object
properties and callback return expressions. Support:

- static string, conditional, logical, array, and `cn(...)` values;
- concise arrow callbacks;
- block arrow callbacks with explicit `return` statements;
- conditional/array/`cn(...)` class operands inside callback returns.

Do not transform object keys, callback parameter names, state comparison literals such
as `'solid'` or `'md'`, `styles` values, arbitrary object props also named `classes`
outside JSX, template literals with interpolation, or callbacks referenced only by an
identifier. Dynamically constructed utilities remain the consumer's safelist
responsibility.

Add the same fixtures to both prefix and compile-class transformer suites. Each must
prove static and callback return class tokens are transformed while state comparison
strings and callback syntax remain unchanged.

**Verify**:

```sh
bun run test src/unocss/inject-prefix.test.ts src/unocss/inject-compile-class.test.ts
```

Expected: all tests pass, including the new static and arrow/block callback cases.

### Step 4: Migrate Badge as the representative leaf component

Add `BadgeT.State` as a required slot-keyed map. Every slot context must expose the
resolved `size`, resolved `variant`, and whether the badge has an interactive trailing
action. Slot-specific fields may add placement (`leading`/`trailing`) but may not be
optional catch-alls. Use `StatefulSlotClasses` and `StatefulSlotStyles` for the public
aliases.

Create each current state snapshot inside an accessor or directly in the rendered JSX
expression. Resolve overrides at the current class/style call sites. Do not evaluate a
leading/trailing callback before its `<Show>` branch exists, do not cache the callback
result outside reactivity, and do not call it as a component.

Add Badge tests for:

- existing static overrides;
- exact root/leading/label/trailing state values;
- reactive class and style updates when size, variant, or trailing interactivity
  changes;
- no callback invocation for an absent conditional slot;
- unchanged merge precedence for top-level `class`/`style`;
- SSR render and hydration preserving the same root and slot nodes with a stateful
  override.

Do not change any built-in Badge utility in this plan.

**Verify**: `bun run test src/elements/badge/badge.test.tsx` -> all Badge tests pass,
including hydration.

### Step 5: Lock public inference in both type modes

Add type fixtures showing:

- `Badge classes={{ root: state => ... }}` infers resolved Badge state;
- a style callback returns a CSS property object;
- static values continue to compile;
- top-level `class` and `style` reject callbacks in the strict autocomplete mode;
- a field from another slot is rejected with `@ts-expect-error`.

Do not export the shared helper types from `src/index.ts`; consumers reach the state
shape through `BadgeT.Classes`, `BadgeT.Styles`, and inference.

**Verify**: `bun run test:types` -> build plus default and autocomplete fixtures pass.

### Step 6: Run the foundation regression gate

Update the stateful foundation row in `style-parity-matrix.md`, then run all focused
suites and inspect the diff.

**Verify**:

```sh
bun run test src/shared/types.test.ts src/shared/utils.test.ts src/unocss/inject-prefix.test.ts src/unocss/inject-compile-class.test.ts docs/build/api-doc/extract.test.ts src/elements/badge/badge.test.tsx
bun run typecheck
git diff --check
```

Expected: all commands exit 0 and no built-in Badge classes changed.

## Test plan

- Shared type/runtime tests define the contract before integration.
- Transformer tests cover both static `classes` values and state callback returns,
  including false-positive literals.
- API extraction retains namespace slot docs.
- Badge proves leaf, conditional-slot, reactive, and hydration behavior.
- Type fixtures prove exact per-slot inference and keep root props static.

## Done criteria

- [ ] One generic resolver handles both class and style values.
- [ ] Every migrated callback parameter is readonly and slot-specific.
- [ ] Static overrides remain source-compatible.
- [ ] Hidden slots do not invoke callbacks.
- [ ] UnoCSS prefix/compile transforms support inline state callback returns without
      modifying comparison literals.
- [ ] Badge SSR/hydration node order remains stable.
- [ ] No built-in visual class, DOM shape, behavior, dependency, or generated JSON
      changed.
- [ ] Focused tests, `bun run typecheck`, `bun run test:types`, and
      `git diff --check` pass.
- [ ] Plan 002 is marked `DONE` in `plans/README.md`.

## STOP conditions

Stop and report if:

- Plan 001 is incomplete or the matrix changes the fixed stateful contract.
- Exact per-slot inference requires making `Slot` JSDoc disappear from generated API
  docs.
- A callback can be confused with an existing valid static ClassValue/CSS value.
- Badge state resolution requires reading JSX props again, eagerly instantiating a
  conditional slot, or changing hydration keys.
- Supporting `classes` callback transforms requires a new parser dependency or broad
  rewriting of arbitrary object literals. Narrow the supported inline syntax and
  report instead.
- Any focused verification fails twice after a reasonable correction.

## Maintenance notes

Every later component must reuse these mapped types and `resolveSlotValue`; local
helpers create divergent precedence and reactive behavior. When a new slot is added,
the required `State` map key should make TypeScript fail until the callback context is
defined. Reviewers should scrutinize callback placement: evaluating it outside the
rendered slot is both a reactivity bug and an SSR risk.
