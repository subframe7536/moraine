# Plan 005: Add configurable example headers

> **Executor instructions**: Confirm Plans 001 and 004 are DONE. Use the SSR-safe component skill.
> Implement only the reusable example-control runtime and one representative Button fixture; Plan 006
> rolls it out across all component pages.
>
> **Drift check**:
>
> ```bash
> git diff --stat 5173d35..HEAD -- docs/build/markdown/examples.ts \
>   docs/routes/components/markdown/mdx-components.tsx \
>   docs/routes/components/markdown/docs-demo-block.tsx \
>   docs/pages/'(general)'/button/index.mdx docs/pages/'(general)'/button/*.tsx
> ```

## Status

- **Priority**: P1
- **Effort**: M (1–2 days)
- **Risk**: MED — shared example rendering is client-deferred and used on every component route
- **Depends on**: Plans 001 and 004
- **Category**: feature
- **Planned at**: commit `5173d35`, 2026-08-23

## Goal

Let an author expose a small set of common primitive props in an example header. Readers can change
text/number values with Moraine `Input`, booleans with Moraine `Switch`, and finite choices with
Moraine `Select`; the preview updates immediately without turning the docs into a generic schema
editor.

## Prior-art decision record

Local Nuxt UI evidence:

- `nuxt-ui/docs/app/components/content/ComponentCode.vue:170-196,416-464` derives an author-selected
  option list, uses a select for finite items and an input for free values, then spreads current values
  into the preview.
- `nuxt-ui/docs/app/components/content/ComponentExample.vue:151-250` supports explicit options on
  authored examples and passes them into the resolved component.

Port these behaviors: author-selected controls, labeled compact header, immediate controlled preview,
and responsive layout. Intentionally diverge in two ways:

- Use `Switch` for boolean props because the requested Moraine interaction is clearer than a
  true/false dropdown.
- Keep the source panel as the authored TSX example instead of rewriting syntax-highlighted HTML at
  runtime. A configurable example must visibly accept and apply its props, so source and preview stay
  truthful without shipping a client-side code generator/highlighter.

## Current state

- `DocsDemoBlock` accepts only `component?: Component` and `source?: string`, defers component rendering
  until the post-hydration microtask, and has no header.
- `DOCS_MDX_COMPONENTS.Example` loads the virtual descriptor, strips component functions during SSR,
  then refetches client-side because functions cannot be serialized.
- The example transformer requires exactly one component export. Control metadata should therefore
  live on the `<Example>` invocation, not as a second export in the TSX module.
- At the planning baseline, 42 component pages contain 186 `<Example>` references.

## Control contract

Add a docs-only discriminated union equivalent to:

```ts
type DocsExampleControl =
  | {
      kind: 'input'
      prop: string
      label: string
      defaultValue: string | number
      inputType?: 'text' | 'number'
    }
  | {
      kind: 'switch'
      prop: string
      label: string
      defaultValue: boolean
    }
  | {
      kind: 'select'
      prop: string
      label: string
      defaultValue: string | number
      options: readonly { label: string; value: string | number }[]
    }
```

Rules:

- Values are serializable primitives only. No JSX, callbacks, objects, arrays, dates, files, or
  arbitrary JSON editors.
- An example exposes 2–5 controls chosen for that scenario; it never mirrors the full API table.
- `prop` names are unique and non-empty; labels and select options are non-empty; defaults must match
  the control kind and one select option.
- The configuration is static for the lifetime of one demo instance. Normalize and snapshot it once.
- MDX marks the one primary configurable example with a boolean `playground` attribute and passes
  `controls={[...]}`. Other examples remain unchanged.

## Scope

May modify:

- `docs/routes/components/markdown/mdx-components.tsx`
- `docs/routes/components/markdown/docs-demo-block.tsx`
- `docs/pages/(general)/button/index.mdx`
- one existing or new Button example TSX file used as the representative fixture

May create:

- `docs/routes/components/markdown/docs-example-controls.tsx`
- `docs/routes/components/markdown/docs-example-controls.test.tsx`
- `docs/routes/components/markdown/docs-demo-block.test.tsx`

Modify `docs/build/markdown/examples.ts` and its tests only if preserving the `playground` and
`controls` attributes requires it; the current plugin should already append `load` without removing
other attributes. Do not modify the virtual module/source transformer unless a failing test proves
the descriptor boundary cannot carry component props.

Do not roll controls out beyond Button, add dependencies, touch generated API files, public `src/**`,
or update `todo.md`.

## Post-approval remediation

Plan 008 production gating on 2026-08-23 found `bun run qa` failures in
`docs/routes/components/markdown/docs-demo-block.test.tsx`, which this plan owns. This remediation
may modify only that test to eliminate lint-invalid class method patterns without changing its
assertions. Treat reactive warnings in `docs-example-controls.tsx` as an audit item, but do not
change behavior unless `bun run qa` reports an error. Re-run the focused Step 5 suite, `bun run qa`,
`bun run docs:build`, and `git diff --check` before restoring Plan 005 to DONE.

## Steps

### Step 1: Add normalization and state tests

Implement a pure `normalizeDocsExampleControls(unknown)` that returns a readonly validated list and
drops malformed entries deterministically. Reject duplicate prop names, empty option lists, duplicate
option values, mismatched defaults, unsupported input types, and more than five controls with a clear
development diagnostic.

Unit tests cover every valid kind, malformed entries, duplicates, default validation, ordering, and
the five-control ceiling.

### Step 2: Build the accessible header with Moraine controls

`DocsExampleControls` receives the normalized immutable definitions plus current values and one change
callback. Render controls in author order:

- `Input` uses `value`/`onValueChange`; number mode converts only valid numeric text and permits a
  transient empty UI value without passing `NaN` to the preview.
- `Switch` uses `checked`/`onChange` and retains a visible label.
- `Select` uses `value`, `items`, and `onChange`; it is non-searchable for this small fixed list.

Use accessible visible labels, unique IDs, compact sizes, and a wrapping header that remains usable at
320 px. Add a Reset action only when a value differs from its default; it needs a text/accessible name
and restores every prop atomically. Do not use emoji or native substitutes for the requested controls.

### Step 3: Pass reactive primitive props into the preview

Extend `DocsDemoBlock` and the MDX mapping with `playground` and `controls`:

1. Read and normalize the static control config once per demo instance.
2. Initialize one Solid store from defaults in the same deterministic order on server and client.
3. Keep the existing client-deferred component branch; do not reveal it synchronously in `onMount`.
4. Render the resolved component once through `Dynamic` and spread the reactive store into it.
5. Show the header only for a valid non-empty config; malformed/absent config leaves legacy examples
   visually and behaviorally unchanged.
6. Preserve the authored highlighted source panel and its copy/expand behavior.

Do not destructure reactive props. Cache any inspected JSX/component value once, preserve component
boundaries, and add getter-backed read-count tests.

### Step 4: Prove the contract on Button

Add or adapt a Button playground that accepts typed primitive props and applies them directly. Expose
representative controls such as label (`Input`), variant/size (`Select`), and disabled/loading
(`Switch`), keeping the total at five or fewer. The example source must demonstrate how these props
reach `<Button>` rather than hiding them in docs infrastructure.

Tests must interact through each control type and assert immediate preview changes, Reset behavior,
keyboard labels, invalid-config fallback, post-microtask mounting, and single evaluation of component
and control getters.

### Step 5: Verify production hydration

```bash
bun run test docs/routes/components/markdown/docs-example-controls.test.tsx \
  docs/routes/components/markdown/docs-demo-block.test.tsx \
  docs/build/examples/source.test.ts
bun run typecheck
bun run docs:build
git diff --check
```

Run `bun run docs:preview`, reload `/button` at 320, 768, and 1440 px, and capture uncaught/error-level
console output. Verify header labels, Input/Switch/Select keyboard use, Select popup placement, instant
preview updates, Reset, source copy/expand, and that the hydrated preview remains present and sized.

## Done criteria

- [ ] The docs expose a small, validated input/switch/select control contract with no complex values.
- [ ] Controls are Moraine components, visibly labeled, responsive, keyboard-usable, and resettable.
- [ ] Preview props update immediately; legacy examples without config remain unchanged.
- [ ] Authored source stays truthful and no runtime code generator/highlighter or dependency was added.
- [ ] SSR/client creation order and getter single-resolution are tested and production-verified.
- [ ] The Button page proves all three control kinds.
- [ ] Focused tests, typecheck, build, preview checks, and diff check pass.
- [ ] Plan 005 is DONE and `todo.md` remains unchanged.

## STOP conditions

Stop if controls require importing/evaluating example component modules during SSR, arbitrary object or
function editing, a client-side syntax highlighter, a public library change, or a server/client initial
tree difference. Any hydration error, `template is not a function`, lost preview node, Select popup
clipping, or repeated JSX/component getter evaluation blocks completion.
