# Solid 2 migration — dev-server / browser warning cleanup state

Goal: no warnings from `pnpm run dev` (terminal) or the browser console on any docs page, fixing
root causes per `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md` (no
`untrack`-to-silence), with `pnpm run qa` and tests passing.

Last updated: 2026-11-24.

## How to verify

- Browser: headless Edge over CDP. Scanner script (outside the repo):
  `%TEMP%/moraine-console/scan.mjs` — `node scan.mjs [route...]` (no args = `/` plus every
  `docs/pages/**/*.mdx` route). Env: `SETTLE=ms` (wait after load), `FULLSTACK=1` (print stacks).
  Start the dev server first (`pnpm run dev`, http://localhost:5173).
- Terminal: request every route with `Invoke-WebRequest` and grep the dev-server log for `^\[[A-Z_]+\]`.
- Library: `pnpm run qa`, `pnpm vitest run src`.

## Current state

### Browser console (headless Edge, all 92 routes)

Last full scan: 91 routes clean. Remaining:

- `/components/file-upload` — `STRICT_READ_UNTRACKED` from
  `src/components/form/form-field-binding.ts` `setValue` (Formisch `field.onInput` reads its own
  state). Fixed after the scan by running the Formisch command untracked inside `setValue`
  (imperative command into a third-party store, not a dependency); needs re-verification.

### Dev-server terminal

- `SERVER_WRITE` — sources found and fixed: `SidebarPanel` panel-id registration, `Field`
  control registration, `NavigationMenuTrigger` option registration (client-only now),
  `Dialog`/`BaseDialog` overlay-scroll cleanup moved into the effect cleanup, `Tabs` trigger
  cleanup writing when no trigger ref was assigned (server). Needs a full re-run to confirm zero.
- `UNSCOPED_HOLE_ALLOCATED_IDS` on `/components/tree` (playground) — **open**, see below.
- `SSR_BOUNDARY_WATERFALL` on every page with `<Preview>` blocks — **open**, see below.

### Tests / QA

- Last full `pnpm vitest run src`: 188 files / 3103 tests passing (before the latest round of
  edits: tabs cleanup guard, dialog overlay cleanup, nav-menu trigger, form-field-binding,
  preview `moduleUrl`, table-virtualizer aria refactor). Re-run required.
- `pnpm run qa` last passed before the latest round; re-run required.

## Unfinished targets

1. **`UNSCOPED_HOLE_ALLOCATED_IDS` — tree playground.** `createComponent(tree.Tree, …)` returns
   a function on the server: Solid's server context `provider` returns a lazy `createMemo`
   accessor, and `TreeRoot` returns `<TreeProvider>` directly, so `tree.Tree` (the bound arrow
   component in `createTree`, `src/components/tree/tree.tsx`) yields that accessor into the
   unscoped hole in `TreeExample`. Next step: confirm why other Provider-rooted components
   (e.g. `Sidebar`) do not trigger it, then make the bound `tree.Tree` / `TreeRoot` return a
   value (e.g. wrap the provider in an element or fragment) rather than the provider accessor.
2. **`SSR_BOUNDARY_WATERFALL`.** Each MDX `<Preview>` is a `lazy()` loaded only when the SSR
   pass reaches it, so N previews ≈ N sequential waits in the route `<Loading>`. A static
   `moduleUrl` is now passed to `lazy()` (`docs/build/markdown/previews.ts` adds a `moduleUrl`
   attribute; `mdx-components.tsx` forwards it) but passes did not drop. Next step: start all
   preview imports together (e.g. call `.preload()` for every preview when the page module
   loads, or have the page emit one `Promise.all` of its preview imports), then re-measure.
3. Re-run the full browser scan and terminal sweep after the edits above.
4. Re-run `pnpm run qa` and `pnpm vitest run src`; fix any regressions.
5. Review the diff (`moraine-review` / `clean-overreach`) before committing; commit as
   Conventional Commits split by area.

## Changes made so far (summary)

Library (`src/`):

- `callRef(ref, el)` → `callRef(() => ref, el)`: the ref prop is resolved untracked at assignment,
  matching Solid's own `ref`; all call sites updated.
- Effect callbacks no longer read reactive values: reads moved into the compute in
  `BaseDialog`, `BaseSelectContent`, `BaseSelect` context, `floating.ts` (direction, elements),
  `popper.tsx`, `menu-layer`, `menu-root`, `slider` hook, `bold-slider`, `number-input-state`,
  `create-pin-input`, `checkbox`, `tooltip`, `navigation-menu-context`, `resizable`,
  `create-splitter-handle`, `command-palette`, `interaction.ts`, `table-virtualizer`
  (`syncAria`/`measureSections` take values), `tags-field` (remove-button registration).
- `FLUSH_IN_EFFECT_CALLBACK`: `useFloatingPosition` publishes `positioned` directly inside
  effects and settles only from frames/timers; avatar status; virtualizer `controller` publishes
  in-flush and drops the separate layout effect.
- `EFFECT_WRITES_OWN_SOURCE`: `useButtonInteraction` republishes component-root elements from an
  effect instead of feeding the ref back into the spread; command-palette `activeKey` is now a
  writable derived signal.
- `transition-presence`: `present` is a writable derived signal (open ⇒ present).
- Hydration: `resolvePropsChildren` pin effect is `transparent`; `DataTable` dev-only effect is
  client-only; `Field` registration client-only; data-table `createTable` construction untracked.
- `Breadcrumb` / `MultiSelect` / `List` render props pass getters instead of eager reads;
  `VirtualRows` renders in a tracked expression; tree parts read the item context lazily;
  `create-sortable` seeds the dnd entity once from untracked initial values.

Docs (`docs/`):

- Landing `component-radar.tsx`: Tabs/Stepper item `content` as render functions.
- MDX `<Preview>`: generated `?preview` module default-exports a component rendering the new
  `routes/components/markdown/preview-block.tsx` (`DocsPreview`), so `lazy()` maps `$$moduleUrl`
  (fixed `LAZY_ASSET_UNMAPPED`); `moduleUrl` attribute added.
- `on-this-page.tsx`, `docs-playground.tsx`, `color-token-table.tsx`, `code-tabs.tsx`,
  `docs-page-header.tsx`, `data-table/server-data.tsx` (`loadingValue`), tree playground split
  into a `TreeExample` component, render-prop examples return tracked JSX.

## Notes

- Scratch debug files were removed (`zz-debug.*`, `docs/App.tsx` warn hook, temporary vitest
  setup). Nothing under `node_modules` was modified.
- The dev server occasionally crashes with `EBUSY` from `@subf/unocss` reading a file being
  written on Windows; restart it if the scan suddenly fails.
