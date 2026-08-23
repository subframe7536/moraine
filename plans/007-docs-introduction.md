# Plan 007: Rebuild the introduction page

> **Executor instructions**: Confirm Plans 001, 004, and 005 are DONE. This plan owns only the root
> introduction route and introduction-only components. Use the SSR-safe component skill for the live
> specimen and any new JSX-capable prop.
>
> **Drift check**:
>
> ```bash
> git diff --stat 5173d35..HEAD -- docs/pages/index.mdx \
>   docs/routes/components/markdown/intro-cards.tsx \
>   docs/routes/components/markdown/intro-components.tsx \
>   docs/routes/components/markdown/mdx-components.tsx
> ```

## Status

- **Priority**: P1
- **Effort**: M (1–2 days)
- **Risk**: MED — interactive landing content hydrates on the highest-traffic docs route
- **Depends on**: Plans 001, 004, and 005
- **Category**: feature
- **Planned at**: commit `5173d35`, 2026-08-23

## Goal

Replace the current three-card/catalog introduction with a useful getting-started page that explains
what Moraine is, proves it with real components, gets a user to working code, and routes them to the
right component or reference page.

## Current state

`docs/pages/index.mdx` contains only `IntroCards`, a Quick Start package tab, and `IntroComponents`.
The catalog exists, but the page does not explain the required styling setup, API model,
compatibility, SSR intent, pre-1.0 status, or next resources. `IntroCards` and the four-column catalog
use repetitive equal cards that conflict with the Plan 001 design contract.

## Scope

May modify:

- `docs/pages/index.mdx`
- `docs/routes/components/markdown/intro-components.tsx`
- `docs/routes/components/markdown/mdx-components.tsx` only to register/remove introduction components

May delete:

- `docs/routes/components/markdown/intro-cards.tsx`, but only after all imports/mappings are removed

May create:

- `docs/routes/components/markdown/intro-hero.tsx`
- `docs/routes/components/markdown/intro-quick-start.tsx`
- `docs/routes/components/markdown/intro-components.test.tsx`
- a focused test for the live introduction specimen if its behavior is not covered above

Do not modify component pages, the shared example runtime, shell/theme/scroll infrastructure,
generated data, public `src/**`, dependencies, or `todo.md`.

## Post-approval remediation

Plan 008 production gating on 2026-08-23 found a `no-template-curly-in-string` lint error in the
focused test `docs/routes/components/markdown/intro-components.test.tsx`. This remediation may
modify only that test to preserve the assertion using lint-valid text. Re-run the focused Step 4
test, `bun run qa`, `bun run docs:build`, and `git diff --check` before restoring Plan 007 to DONE.

## Content contract

Use only facts supported by `package.json`, `README.md`, existing docs, and generated API data. Keep
the package version and component/category counts generated. Use “pre-1.0; breaking changes may
occur” and do not choose between conflicting “pre-alpha” and “Beta” wording elsewhere.

## Steps

### Step 1: Replace the page structure

Rewrite `docs/pages/index.mdx` in this order:

1. **Product statement and status** — SolidJS component library, composable APIs, atomic-class
   styling, generated version, pre-1.0 caveat, and direct setup/components destinations.
2. **Real component specimen** — one compact asymmetric composition using existing Moraine form,
   navigation/status, and overlay primitives. It must be usable, not a screenshot or invented app
   dashboard.
3. **Start in three steps** — install `moraine` and `solid-js`, configure one supported styling path,
   then import/use a component. Preserve package-manager tabs and link to `/styling`.
4. **Why the API is different** — composability, slots/class/style overrides, Solid SSR behavior,
   and accessibility foundations in a ruled split layout with real API/code references.
5. **Compatibility and expectations** — peer range and supported styling/SSR facts only; distinguish
   supported UnoCSS from the experimental Tailwind path.
6. **Component directory** — generated categories/counts in a dense list rather than a card wall.
7. **Resources** — styling, TypeScript, utilities, Markdown source, `llms.txt`, GitHub, README/license.

### Step 2: Build the live specimen safely

Use existing components with deterministic initial state, accessible labels, keyboard-complete
interaction, and no external requests. If using the Plan 005 example header, keep it focused on a
single understandable specimen and author-selected primitive props. Do not duplicate page-level
theme/search/navigation controls inside it.

Inventory every JSX slot/render prop, resolve it once, and keep server/client creation order stable.
Do not synchronously reveal client-only overlays during hydration or create separate responsive trees.

### Step 3: Refactor the generated directory

Preserve generated group order, component order, descriptions, paths, category counts, and total
count. Replace the repetitive card grid with a denser responsive directory/list whose links remain
semantic and whose descriptions are available to screen-reader and pointer users. Empty categories
must not render.

### Step 4: Test and verify

Tests cover generated count/category rendering, stable ordering, semantic destinations, no empty
categories, generated version/status text, required setup/resources, and any landing-only interaction.
Add getter-backed single-resolution coverage where the specimen inspects JSX/component props.

```bash
bun run test docs/routes/components/markdown/intro-components.test.tsx
bun run typecheck
! rg -n "IntroCards" docs/pages/index.mdx \
  docs/routes/components/markdown/mdx-components.tsx
bun run docs:build
git diff --check
```

In `bun run docs:preview`, inspect `/` at 320, 375, 414, 768, and 1440 px. Verify semantic section
order, package tabs, keyboard interaction, directory links, theme variants, no page overflow, stable
hydrated nodes with non-zero bounds, and zero uncaught/error-level console output.

## Done criteria

- [ ] The introduction explains product, setup, API model, compatibility/status, directory, and
      resources with verified facts and generated values.
- [ ] A real accessible Moraine specimen replaces generic marketing cards/dashboard chrome.
- [ ] The generated component directory is dense, semantic, ordered, and complete.
- [ ] `IntroCards` is removed only after every reference is gone.
- [ ] SSR single-resolution, tests, typecheck, build, browser matrix, and diff check pass.
- [ ] Plan 007 is DONE and `todo.md` remains unchanged.

## STOP conditions

Stop if copy requires invented metrics, unsupported compatibility/accessibility claims, or choosing a
lifecycle label beyond pre-1.0. Stop if the specimen needs new public components, external data,
duplicated responsive trees, or cannot preserve production hydration order.
