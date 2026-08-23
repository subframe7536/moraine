# Plan 003: Make route and anchor scrolling deterministic

> **Executor instructions**: Confirm Plan 002 is DONE. This plan owns route/hash scrolling and TOC
> visibility only. Do not combine them again or begin the visual shell refactor.
>
> **Drift check**:
>
> ```bash
> git diff --stat 5173d35..HEAD -- docs/routes/_app.tsx \
>   docs/routes/hooks/use-table-of-contents.ts \
>   docs/routes/components/markdown/on-this-page.tsx
> ```

## Status

- **Priority**: P1
- **Effort**: M (1–2 days)
- **Risk**: HIGH — nested scroll state, router commits, history, and hydration timing interact
- **Depends on**: Plan 002
- **Category**: bug
- **Planned at**: commit `5173d35`, 2026-08-23

## Goal

Give the app shell sole ownership of docs route and anchor scrolling so initial hashes, same-page
anchors, cross-page anchors, and browser history cannot be overwritten by competing effects. Keep
the TOC hook responsible only for observing visible sections and deriving active state.

## Current state

- `_app.tsx` resets the nested `[data-slot="main"]` scroll container to top after a page commit.
- `use-table-of-contents.ts` independently calls `scrollIntoView`, schedules an initial frame, and
  listens for `hashchange`.
- History API navigation may not emit `hashchange`, while a cross-page commit can reset scroll after
  the TOC has found its target.
- A direct production check at the planning commit showed initial and same-page anchors can work;
  regression coverage must target router-driven ordering, late targets, and history transitions.

## Scope

May modify:

- `docs/routes/_app.tsx`
- `docs/routes/hooks/use-table-of-contents.ts`
- `docs/routes/components/markdown/on-this-page.tsx` only where link activation/active state requires it
- `docs/vite.config.ts` only to exclude docs `*.test.tsx` files from file-router route discovery

May create:

- `docs/routes/hooks/use-docs-scroll.ts`
- `docs/routes/hooks/use-docs-scroll.test.tsx`
- `docs/routes/hooks/use-table-of-contents.test.tsx`
- `docs/routes/components/markdown/on-this-page.test.tsx`

Do not redesign the shell, duplicate desktop/mobile TOC state, alter generated heading IDs, modify
component pages, change dependencies, touch `src/**`, or check `todo.md`.

## Post-approval remediation

Plan 008 production verification on 2026-08-23 found a late-layout cross-page anchor failure: search
correctly navigates to `/button#api-props`, but the initial scroll runs while the generated API table
has not reached its final height, is clamped to the prior document maximum, and leaves the target
above the viewport. This remediation may modify only `docs/routes/hooks/use-docs-scroll.ts` and its
focused test to retry a bounded, named number of animation frames until the found hash target is at
or below the shared sticky-header offset, while preserving cancellation and no retry for malformed or
unknown hashes. Production timing evidence showed the generated API layout can settle after the
immediate RAF window, so the hook may additionally use a named, finite, cancelable delayed retry
budget with its focused test; it must not create an observer or indefinite polling loop. Add a
regression test covering a target whose position shifts after the first scroll, then rerun Step 4 and
the Plan 008 cross-page search, direct, history, and unknown-hash browser checks before restoring
Plan 003 to DONE.

## Steps

### Step 1: Specify the scroll state machine in tests

Use fake animation frames and `MemoryRouter`-style reactive locations. Tests must cover:

- pathname change without hash resets the nested main container to top;
- same-page and cross-page hashes reach the target after routing/page commit completes;
- a target mounted on a later frame is found within a named finite retry budget;
- Back/Forward-like reactive location changes re-run synchronization;
- unknown or malformed hashes do not throw, loop, or leave stale work scheduled;
- newer navigation and unmount cancel pending frames;
- TOC visibility updates never call `scrollIntoView` or write scroll position.

### Step 2: Introduce the sole scroll owner

Create `use-docs-scroll.ts` with accessors/callbacks for location, routing state, committed page, and
scroll root. It must not reach into router globals itself.

Required behavior:

1. `_app.tsx` calls router hooks once during setup and passes reactive values to the hook.
2. Wait until routing is complete and committed content is present.
3. Reset to top only for a new pathname without a usable hash.
4. Decode hashes defensively; retry missing targets for a small named number of animation frames.
5. Cancel superseded work and clean up on owner disposal.
6. Temporarily force instant scroll only for route-top resets. Hash navigation uses the shell's
   smooth behavior, with reduced motion selecting auto behavior.
7. Use the shared sticky-header/anchor offset contract from Plan 001.

### Step 3: Reduce the TOC hook to observation

Remove its initial anchor frame, `hashchange` listener, and all scroll calls. Observe generated
headings against the actual nested main scroll root, derive visible/active IDs, react to the router
hash accessor for deterministic `aria-current`, and disconnect the observer on cleanup.

TOC links remain real `href="#id"` anchors. Intercept only ordinary unmodified activation when
needed to prevent native scrolling and the central hook from racing; preserve modified clicks,
copy-link, open-in-new-tab, and no-JavaScript fallback semantics.

### Step 4: Verify in tests and a production preview

Ensure file-router ignores docs `*.test.tsx` files before the production build. This is required
because tests under `docs/routes/hooks/` otherwise become generated routes and the build requires
them to export `createRoute`. Keep the change limited to the existing file-router ignore configuration;
do not change route generation, MDX, or SSG behavior.

```bash
bun run test docs/routes/hooks/use-docs-scroll.test.tsx \
  docs/routes/hooks/use-table-of-contents.test.tsx \
  docs/routes/components/markdown/on-this-page.test.tsx
bun run typecheck
! rg -n "hashchange|scrollIntoView" docs/routes/hooks/use-table-of-contents.ts
bun run docs:build
git diff --check
```

Then start `bun run docs:preview` and verify direct, same-page, cross-page, Back, and Forward anchor
navigation on `/button` plus one second component route. Capture error-level console output.

## Done criteria

- [ ] One hook in the app shell owns every route/hash scroll write.
- [ ] Initial, same-page, cross-page, history, late-target, malformed, unknown, cancellation, and
      cleanup cases are covered.
- [ ] The TOC hook observes state but never scrolls.
- [ ] Real anchor semantics and reduced motion are preserved.
- [ ] Docs test files are excluded from file-router route discovery, so hook tests never become SSG routes.
- [ ] Focused tests, typecheck, production build/preview check, and diff check pass.
- [ ] Plan 003 is DONE and `todo.md` remains unchanged.

## STOP conditions

Stop if correct behavior requires a public `src/**` change, a router fork, infinite observation, two
independent TOC state owners, or a browser-only branch whose server/client initial DOM differs. Stop
after two reasonable failed corrections to a focused regression and report the evidence.
