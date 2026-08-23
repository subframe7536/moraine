# Plan 004: Refactor the shared docs shell and theme

> **Executor instructions**: Confirm Plans 001 and 003 are DONE. Apply the SSR-safe component skill
> to every new JSX-capable API. This plan stabilizes shared layout before example and landing work.
>
> **Drift check**:
>
> ```bash
> git diff --stat 5173d35..HEAD -- docs/index.html docs/routes/_app.tsx \
>   docs/routes/components/markdown/markdown.tsx \
>   docs/routes/components/markdown/on-this-page.tsx \
>   docs/routes/components/markdown/docs-code-block.tsx \
>   docs/routes/components/markdown/docs-page-navigation.tsx docs/routes/hooks/use-theme.ts
> ```

## Status

- **Priority**: P1
- **Effort**: M (2 days)
- **Risk**: HIGH — the shared shell and theme hydrate on every prerendered route
- **Depends on**: Plans 001 and 003
- **Category**: maintainability
- **Planned at**: commit `5173d35`, 2026-08-23

## Goal

Turn the current collection of shared Markdown and layout surfaces into one semantic, responsive
documentation shell, then persist light/dark choice without a wrong-theme first frame. Preserve the
router, SSG, MDX provider, page commit model, and Moraine component APIs.

## Scope

May modify:

- `docs/index.html`
- `docs/routes/_app.tsx`
- `docs/routes/components/markdown/markdown.tsx`
- `docs/routes/components/markdown/on-this-page.tsx`
- `docs/routes/components/markdown/docs-code-block.tsx`
- `docs/routes/components/markdown/docs-page-navigation.tsx`
- `docs/routes/hooks/use-theme.ts`

May create:

- `docs/routes/hooks/use-theme.test.ts`
- additional focused tests for a modified shared component, after adding the exact path to scope

Do not modify `docs-demo-block.tsx` (Plan 005 owns it), introduction components/pages (Plan 007),
component pages (Plan 006), public `src/**`, dependencies, generated files, or `todo.md`.

## Post-approval remediation

Plan 008 production gating on 2026-08-23 found `bun run qa` failures in two focused test doubles
owned by this plan: `docs/routes/hooks/use-table-of-contents.test.tsx`. This remediation may modify
only that file to remove lint-invalid `this` patterns without changing test behavior. Re-run the
focused Step 4 suite, `bun run qa`, `bun run docs:build`, and `git diff --check` before restoring
Plan 004 to DONE.

## Steps

### Step 1: Refactor shell semantics and responsive ownership

Preserve `SidebarFrame`, `MDXProvider`, Suspense, committed-page/loading behavior, metadata, search,
and the scroll hook from Plan 003. The final shared tree must provide:

- a keyboard-visible skip link targeting one stable main-content ID;
- one semantic site navigation, one content main, and labeled page/TOC navigation;
- brand/version, search, GitHub, theme, current page title, and mobile navigation without duplicated
  controls;
- active route state from router location rather than a parallel UI selection;
- a readable desktop article with persistent rail and sticky contextual TOC;
- a compact inline TOC below the desktop breakpoint using the same state owner;
- stable DOM creation order across breakpoints, preferring CSS visibility/layout over duplicated
  responsive component trees;
- focus visibility, long URL/code/table containment, and no hidden focusable elements.

Any prop containing JSX, a component, or a render function must be classified and resolved once.
Add getter-backed tests when a value is inspected and rendered or can flow through multiple branches.

### Step 2: Align shared Markdown surfaces

Use the Plan 001 contract to update:

- article measure, page header/action hierarchy, heading rhythm, API reference spacing, and footer
  navigation in `markdown.tsx`;
- rail/inline TOC presentation, nesting, real hash hrefs, active state, and empty behavior;
- code copy/expand controls, internal horizontal scrolling, measurement stability, and reduced motion;
- previous/next semantic anchors with stronger hierarchy but no oversized generic cards.

Do not create a new color runtime or add fake browser/code chrome.

### Step 3: Persist theme safely

Define one storage key in `use-theme.ts` and mirror the literal in a tiny pre-module script in
`docs/index.html`, with a comment explaining why the duplication is required before bundle startup.

- Accept only `light` or `dark`; otherwise use `prefers-color-scheme`.
- Set both the root class and `color-scheme` before first paint.
- Tolerate blocked storage/media APIs.
- Initialize the Solid hook to a server-safe value, reconcile with the bootstrapped DOM on mount,
  persist explicit changes, and keep `startViewTransition` optional.
- Never read browser globals during SSR or render a client-only alternate shell.

Tests cover stored, missing, invalid, and throwing storage; system fallback; DOM application;
persistence; and absence of View Transitions.

### Step 4: Verify

```bash
bun run test docs/routes/components/markdown/on-this-page.test.tsx \
  docs/routes/hooks/use-table-of-contents.test.tsx docs/routes/hooks/use-theme.test.ts
bun run typecheck
bun run docs:build
git diff --check
```

In `bun run docs:preview`, inspect `/button`, `/dialog`, and `/form-field` at 320, 768, and 1440 px.
There must be no hydration/error console output, missing critical nodes, page-level overflow, hidden
focus targets, or theme flash. Validate skip link, mobile menu, search, TOC, copy/expand, theme, and
previous/next keyboard behavior.

## Done criteria

- [ ] Shared docs routes use one semantic, responsive shell and one TOC state owner.
- [ ] Markdown, TOC, code, and previous/next surfaces follow `docs/DESIGN.md`.
- [ ] JSX-capable values are classified, single-resolved, and covered where applicable.
- [ ] Theme preference applies before paint, persists, and remains SSR-safe under failure cases.
- [ ] Focused tests, typecheck, build, production browser check, and diff check pass.
- [ ] Plan 004 is DONE and `todo.md` remains unchanged.

## STOP conditions

Stop if the design needs a public library change, duplicated independently stateful responsive trees,
a second token runtime, a dependency, or server/client initial branches that differ. Any production
hydration warning, `template is not a function`, or missing/non-sized critical SSR node blocks DONE.
