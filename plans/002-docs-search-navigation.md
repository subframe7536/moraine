# Plan 002: Add semantic navigation and section search

> **Executor instructions**: Confirm Plan 001 is DONE. Work test-first and complete only semantic
> destinations plus search metadata. Do not start scroll, TOC, shell, or visual example work.
>
> **Drift check**:
>
> ```bash
> git diff --stat 5173d35..HEAD -- \
>   docs/vite.config.ts docs/build/routes.ts docs/build/routes.test.ts \
>   docs/build/markdown/page.ts docs/build/markdown/page.test.ts \
>   docs/routes/docs-route.ts docs/routes/components/layout/sidebar.tsx \
>   docs/routes/components/layout/docs-command-palette.tsx
> ```

## Status

- **Priority**: P1
- **Effort**: M (1–2 days)
- **Risk**: MED — serialized route metadata and shared navigation affect every docs route
- **Depends on**: Plan 001
- **Category**: usability
- **Planned at**: commit `5173d35`, 2026-08-23

## Goal

Make sidebar entries real links and make command search return both pages and generated document
sections. All destinations must be serializable, semantic, keyboard-accessible, and reusable by the
route-scroll owner introduced in Plan 003.

## Current state

- `docs/routes/components/layout/sidebar.tsx` renders page navigation as buttons even though each
  `DocsPageEntry` already has a path, so native link behavior is lost.
- `docs/routes/components/layout/docs-command-palette.tsx` creates one search item per page from title,
  description, and tags.
- `docs/build/markdown/page.ts` already receives heading entries from `createDocsHastPlugin`, but
  `DocsRouteInfo` does not expose them to the runtime.
- Heading IDs, including duplicate suffixes, already come from one canonical Markdown slugger. Do not
  parse or slug headings again.

## Scope

May modify:

- `docs/vite.config.ts`
- `docs/build/routes.ts`
- `docs/build/routes.test.ts`
- `docs/build/markdown/page.ts`
- `docs/build/markdown/page.test.ts`
- `docs/routes/docs-route.ts`
- `docs/routes/components/layout/sidebar.tsx`
- `docs/routes/components/layout/docs-command-palette.tsx`

May create:

- `docs/routes/components/layout/sidebar.test.tsx`
- `docs/routes/components/layout/docs-command-palette.test.tsx`

Do not modify router-scroll hooks, TOC rendering, component page content, generated API JSON,
dependencies, public `src/**`, or `todo.md`.

## Post-approval remediation

Plan 008 production verification on 2026-08-23 found that the route-section index excludes the
runtime-generated `api-props` heading, so cross-page command search cannot navigate to
`/button#api-props`. This remediation may modify only the existing Plan 002 route metadata pipeline
and its focused build/layout tests to add that generated, canonical section without parsing or
slugging headings a second time. The existing API renderer may be updated, and one shared
`docs/build/api-doc/reference-sections.ts` helper may be created, only to make its emitted IDs and
the serialized route metadata use the same ordered definition. Preserve MDX heading order and routes
without API references. Record a failing regression test for the `/button#api-props` destination,
then rerun Step 4 plus QA, the SSG build, diff check, and the Plan 008 anchor/history browser check
before restoring Plan 002 to DONE. If the command palette router navigation performs a native hash
scroll before the destination page commits, this remediation may update its existing navigation call
and focused test to suppress that router scroll so Plan 003 remains the sole scroll owner.

## Steps

### Step 1: Carry heading metadata through the existing route pipeline

Write failing build tests first, then:

1. Define a serializable section item `{ id: string; label: string; level: number }` in docs route
   metadata.
2. Let `createDocsRouteInfo` accept sections as an optional final argument and omit the field when
   empty, preserving callers that only scan frontmatter.
3. Pass `onThisPageEntries` from `docs/build/markdown/page.ts` into route info. Reuse emitted IDs
   exactly, including duplicate-heading suffixes.
4. Add the exact shape to `infoDts` in `docs/vite.config.ts`.
5. Mirror and normalize it in `docs/routes/docs-route.ts`. Drop malformed optional section items but
   retain the otherwise valid page, exposing an empty array when no valid sections remain.

Tests must prove empty sections, malformed optional entries, duplicate IDs, existing route ordering,
grouping, badge, and API metadata all remain correct.

### Step 2: Replace sidebar navigation buttons with links

Use router-aware or native anchors with `href={entry.path}`. Preserve grouping and ordering, set
`aria-current="page"` on the active page, and keep the mobile close callback as a click side effect.
Navigation must continue to work if that callback does not run and must preserve modifier-click,
copy-link, status-bar destination, and open-in-new-tab behavior. Label navigation groups without
adding redundant focus stops.

### Step 3: Build page and section command results

Continue using Moraine `CommandPalette`; add no search dependency. Build two explicit result groups:

- **Pages**: page title, description, tags, and page path.
- **Sections**: page title plus heading label, with `${page.path}#${encodedId}` as the destination and
  the parent page metadata included in search text.

Deduplicate exact destinations, preserve route order followed by document order, and use real links
or one router navigation path. Ordinary selection closes the palette; modified activation keeps
native link behavior. Preserve the existing keyboard shortcut and clean up global listeners.

### Step 4: Verify

```bash
bun run test docs/build/routes.test.ts docs/build/markdown/page.test.ts
bun run test docs/routes/components/layout/sidebar.test.tsx \
  docs/routes/components/layout/docs-command-palette.test.tsx
bun run typecheck
git diff --check
```

Expected: all focused tests and typecheck pass; diff check prints nothing.

## Done criteria

- [ ] Generated heading IDs flow into typed, serializable runtime route data through one pipeline.
- [ ] Sidebar destinations are anchors with correct `href` and `aria-current`.
- [ ] Search returns ordered page and section destinations without a new dependency.
- [ ] Native link semantics, command keyboard behavior, mobile close behavior, and cleanup are tested.
- [ ] Focused tests, typecheck, and diff check pass.
- [ ] Only reviewed files changed; Plan 002 is DONE and `todo.md` is untouched.

## STOP conditions

Stop if sections cannot be serialized through the existing route info, if a second heading parser or
search index is required, if navigation needs a public `SidebarFrame` API change, or if the router
cannot preserve normal anchor semantics without patching/forking a dependency.
