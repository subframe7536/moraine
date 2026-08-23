# Plan 006: Expand common-prop examples across component docs

> **Executor instructions**: Confirm Plan 005 is DONE. This is a systematic content pass over all 42
> component pages, not a redesign of component APIs. Use generated API JSON as the inventory, never as
> an edit target.
>
> **Drift check**:
>
> ```bash
> git diff --stat 5173d35..HEAD -- docs/pages docs/build/examples
> find docs/pages -name 'index.mdx' | wc -l
> find docs/pages -name '*.tsx' | wc -l
> ```

## Status

- **Priority**: P1
- **Effort**: L (3–5 days)
- **Risk**: MED — high file count, but changes are isolated to docs examples and coverage tests
- **Depends on**: Plan 005
- **Category**: test-coverage
- **Planned at**: commit `5173d35`, 2026-08-23

## Goal

Increase practical examples across every component page, making common props discoverable through one
configurable playground plus focused standalone scenarios. Optimize for questions users actually ask:
appearance, content, controlled state, disabled/loading/error behavior, and composition.

## Baseline and target

At the planning commit:

- 42 component `index.mdx` pages contain 186 `<Example>` references; the 43rd `index.mdx` is the root
  introduction and belongs to Plan 007.
- Modal has one example and Toast has two; every other component page has at least three.
- Existing pages often cover variants and sizes well, but there is no site-wide rule ensuring a basic
  configurable example or common state/behavior coverage.

The target is qualitative with two enforceable floors:

- every component page has exactly one primary `<Example playground ...>` with 2–5 primitive controls;
- every component page has at least three examples, and the repository-wide example count is greater
  than the recorded 186 baseline.

Do not add filler to chase a larger number. Add a scenario only when it explains a common public prop
or a real composition that the playground cannot represent.

## Coverage standard

Audit each component against its generated `api.json` and cover applicable groups:

1. **Basic/common use** — representative content/items and the expected default interaction.
2. **Appearance** — common `variant`, `size`, `orientation`, placement, or side props.
3. **State** — controlled value/open/checked/selection plus the primary callback when stateful.
4. **Operational states** — disabled, loading, invalid/error, empty, clearable, read-only, or required
   where public and meaningful.
5. **Composition** — slots, render props, grouping, icons, polymorphism, or form integration where
   they materially change usage.
6. **Scale/edge behavior** — overflow, virtualization, long content, multiple values, keyboard flow,
   or async data only for components that own those behaviors.

Primitive text/number, boolean, and finite enum props belong in the playground. JSX, item objects,
callbacks, async flows, render props, files, and multi-step state belong in dedicated TSX examples.
Do not demonstrate inherited native attributes one by one or create examples solely for `class`,
`classes`, `style`, or `styles`; the styling guide owns those APIs.

## Scope

May modify:

- every component `docs/pages/**/index.mdx` except the root `docs/pages/index.mdx`
- existing component example `docs/pages/**/*.tsx`

May create:

- new component example `docs/pages/**/*.tsx`
- `docs/EXAMPLES.md`
- `docs/build/examples/coverage.test.ts`

May minimally reuse parsing/path helpers from `docs/build/markdown/examples.ts` in the coverage test,
but do not change example runtime behavior established by Plan 005.

Do not modify:

- `docs/pages/index.mdx` or introduction components (Plan 007)
- generated `api.json`, `_api-index.json`, routes, `dist/**`, or `docs/dist/**`
- public `src/**`, package manifests/lockfiles, or `todo.md`
- component behavior to make a documentation example pass

## Steps

### Step 1: Create the coverage ledger and regression test

Create `docs/EXAMPLES.md` with the coverage standard above and a 42-row table containing:

- component/page;
- playground control props;
- dedicated common-state/behavior scenarios;
- intentional omissions with a short reason.

Write `coverage.test.ts` to derive component pages from the existing generated API index/page tree and
assert:

- every component page has an Examples section;
- every component page has exactly one `playground` marker and a non-empty controls expression;
- every referenced example path resolves through the existing safe path resolver;
- every component page has at least three unique example paths;
- total unique `<Example>` references exceed 186;
- root introduction and generated JSON are excluded.

Keep the test structural. The human-readable ledger owns semantic judgments that cannot be inferred
reliably from TSX.

### Step 2: Audit in bounded category batches

Work in this order and run the coverage test after every batch:

1. **General** — Button through Separator.
2. **Form** — Checkbox through Textarea.
3. **Navigation** — Breadcrumb through Tabs.
4. **Overlay** — ContextMenu through Tooltip.

For each page:

1. Compare API props with current headings/examples and update the ledger before editing examples.
2. Select or add a first “Playground” example accepting 2–5 typed primitive props. Configure its
   Input/Switch/Select header using the Plan 005 contract.
3. Add only missing common scenarios from the coverage standard. Modal must reach at least three;
   Toast must reach at least three.
4. Keep example names/headings concrete (`Controlled value`, `Disabled items`, `Long content`) and
   descriptions one or two sentences explaining the prop mechanism and consequence.
5. Use real Moraine imports, accessible names, deterministic data, and no network dependency,
   time-sensitive output, placeholder dashboard chrome, or emoji icons.

### Step 3: Review example implementation quality

Across all changed TSX examples:

- never destructure reactive props;
- use `<For>`, `<Show>`, and `<Switch>/<Match>` rather than `.map()` or ternaries in dynamic JSX;
- use source extensions for relative/`@src` imports;
- preserve SSR/client initial state and single-resolve JSX/render props;
- keep controlled examples truly controlled, with matching state callbacks;
- keep form controls labeled and icon-only controls accessible;
- avoid duplicating existing examples under new filenames.

Search for accidental drift and inspect the ledger against the final page set.

### Step 4: Verify all batches and representative production routes

```bash
bun run test docs/build/examples/coverage.test.ts docs/build/examples/source.test.ts \
  docs/build/plugin.test.ts
bun run typecheck
bun run test
bun run docs:build
git diff --check
```

In `bun run docs:preview`, inspect at least one route per group plus the control components themselves:
`/button`, `/input`, `/switch`, `/select`, `/tabs`, `/dialog`, `/modal`, and `/toast`. At 320 and
1440 px verify every playground header, Input/Switch/Select keyboard operation, popup placement,
immediate preview updates, source display, no page overflow, and zero hydration/error console output.

## Done criteria

- [ ] All 42 component pages have exactly one configurable common-prop playground.
- [ ] All pages have at least three meaningful examples and the total exceeds 186.
- [ ] `docs/EXAMPLES.md` records coverage and justified omissions for every component.
- [ ] Common appearance, state, operational, composition, and scale behaviors are covered where
      applicable; complex props remain dedicated examples.
- [ ] No generated API file or public component implementation changed.
- [ ] Structural coverage, existing example build tests, full tests, typecheck, build, browser matrix,
      and diff check pass.
- [ ] Plan 006 is DONE and `todo.md` remains unchanged.

## STOP conditions

Stop if a documented common prop does not exist in generated API data, an example exposes a real
component bug that needs `src/**` changes, the playground needs complex/non-serializable values, or
coverage requires inventing behavior. Record the component and evidence instead of changing the
library or weakening the example.
