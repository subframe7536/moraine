# Plan 007: Document and validate the completed style system

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving on. This plan is the final
> acceptance gate and the only plan that may check the two style-system TODO boxes. If
> a STOP condition occurs, stop and report; do not mark the TODO complete. Update this
> plan's row in `plans/README.md` when finished unless a reviewer owns the index.
>
> **Drift check (run first)**:
> `git diff --stat 620037aad7b5..HEAD -- todo.md src docs/pages docs/build src/unocss src/tailwind test/types style-parity-matrix.md`.
> Plans 001–006 are expected to change source, tests, type fixtures, and the matrix. All
> six status rows must be `DONE`; any `TODO`, `IN PROGRESS`, or `BLOCKED` dependency is
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: Plans 001–006
- **Category**: docs
- **Planned at**: commit `620037aad7b5`, 2026-08-13

## Why this matters

Class assertions and jsdom cannot prove that an SSR-rendered component remains visible
after hydration, that popup motion looks coherent, or that the new state callback
contract is understandable to consumers. This plan publishes the contract, regenerates
API data, runs the full production toolchain, and records real-browser evidence at
mobile, tablet, and desktop widths. The TODO is complete only when the matrix has no
gaps and those production checks pass.

## Current state

- `docs/pages/styling.mdx` documents static top-level and slot overrides but has no
  stateful `classes`/`styles` examples or callback-state rules.
- Component MDX pages already provide representative examples across every domain.
  Do not redesign the docs site in this task; the next TODO owns the production-level
  docs-site overhaul.
- `docs/build/plugin.ts` regenerates colocated `api.json` files after the built
  declaration output is newer than the index. `bun run docs:build` therefore exercises
  both the public declaration surface and API extraction.
- `bun run docs:preview` runs a blocking Vite preview after building. Start it in an
  interactive/background session and keep its reported URL for browser validation;
  terminate it after the checks.
- Baseline at plan creation was `bun run typecheck` green and `bun run test` at 78 files
  / 1562 tests. The final count will be larger; success is exit 0 with all discovered
  tests passing, not the old exact number.
- `style-parity-matrix.md` is the final visual evidence ledger. Its production
  visual-validation log must be completed, not deleted.

## Commands you will need

| Purpose                        | Command                | Expected on success                                  |
| ------------------------------ | ---------------------- | ---------------------------------------------------- |
| Format/lint/types/public types | `bun run qa`           | exit 0; note it formats/fixes files                  |
| Full unit suite                | `bun run test`         | all discovered files/tests pass                      |
| Build                          | `bun run build`        | exit 0; `dist` is generated, never edited manually   |
| Docs SSG                       | `bun run docs:build`   | exit 0; API JSON and production client build succeed |
| Production preview             | `bun run docs:preview` | reports a local HTTP URL and remains running         |
| Diff integrity                 | `git diff --check`     | exit 0                                               |

## Suggested executor toolkit

- Use `solid-js-1.x-best-practices-and-api` and `build-ssr-safe-component` when a final
  regression requires a source correction.
- Use `browser:control-in-app-browser` for the production preview checks. Follow that
  skill's setup and use its documented browser APIs; do not substitute an ad-hoc
  standalone Playwright installation.

## Scope

**In scope:**

- `docs/pages/styling.mdx`
- One stateful example per behavior category, colocated with an existing page:
  - `docs/pages/general/badge/stateful-styles.tsx` — leaf/resolved variants;
  - `docs/pages/navigation/tabs/stateful-styles.tsx` — repeated selected item;
  - `docs/pages/overlay/popover/stateful-styles.tsx` — open/runtime-side overlay.
- The three matching MDX pages, only to register those examples.
- Generated `docs/pages/**/api.json` and `docs/pages/_api-index.json` produced by the
  existing generator; never hand-edit them.
- `style-parity-matrix.md` production-validation log and final dispositions.
- `todo.md` — check only the parent style audit and nested stateful override items after
  all gates pass.
- `plans/README.md` — update only Plan 007's status.
- A narrowly scoped source/test/type correction if a final gate reveals a regression;
  update the owning matrix row and rerun its domain plan's focused commands first.

**Out of scope:**

- Redesigning docs navigation, search, landing page, typography, layout, or
  introduction. That is the next unchecked TODO.
- New components, variants, APIs, dependencies, screenshot-testing frameworks, or
  changes to Zaidan.
- Hand-editing `dist`, generated API JSON, or build output.
- Checking any V1 item or the docs-site TODO.

## Git workflow

- Branch: `codex/007-style-system-acceptance`.
- Commit documentation/generated API data together, then final acceptance/TODO status.
- Use messages such as `docs: document stateful style overrides` and
  `chore: complete Shadcn style parity sweep`.
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Prove every implementation plan and matrix row is complete

Read each plan's Done criteria and status. Run a script that fails unless Plans 001–006
are `DONE`. Then scan the matrix for pending dispositions, missing tests, or incomplete
production log entries. At this stage only the production visual-validation log may
still say `pending`.

**Verify**:

```sh
bun -e "const text=await Bun.file('plans/README.md').text(); for (const id of ['001','002','003','004','005','006']) { const row=text.split('\n').find(line=>line.includes('['+id+']')); if (!row?.endsWith('| DONE |')) throw new Error('Plan '+id+' is not DONE'); }"
rg -n 'ready-for-implementation|unclassified|audit-pending|Disposition.*pending' style-parity-matrix.md
```

Expected: the script exits 0; `rg` exits 1 with no output.

### Step 2: Document the stateful override contract

Extend `docs/pages/styling.mdx` in English. Keep the existing root/slot distinction and
add:

- static values remain valid;
- each slot value can be `(state) => classValue` or `(state) => CSSProperties`;
- callback state is readonly, component/slot-specific, contains resolved defaults,
  and stays generic for source items;
- top-level `class`/`style` and low-level Modal composition props remain static;
- callbacks run only for rendered slot instances and must return deterministic styling
  for SSR/hydration;
- class literals must be statically discoverable; dynamically constructed utility
  names require the consumer's normal UnoCSS/Tailwind safelist.

Add the three examples listed in Scope. Each must use a live signal or component state
to visibly update both a class and a style callback, show the inferred state without an
explicit annotation, and avoid dynamic string construction. Tabs must distinguish the
selected repeated item. Popover must style from the actual resolved runtime side/open
state exposed by its public slot context. Register each with `<Example>` on its existing
MDX page.

Do not add a catch-all API table by hand; generated component API docs remain the
source of truth.

**Verify**:

```sh
rg -n 'state =>|readonly|top-level|safelist|SSR|hydration' docs/pages/styling.mdx
bun run typecheck
```

Expected: all required concepts are present and TypeScript exits 0.

### Step 3: Run formatting, full tests, public types, and production build

Run `qa` first because it mutates formatting/lint fixes, inspect its diff, then run the
full unit and docs build gates. `docs:build` may regenerate API JSON; accept only
generator output. Confirm generated API docs still list every component slot and show
the namespace Classes/Styles aliases without treating State map keys as slots.

**Verify**:

```sh
bun run qa
bun run test
bun run docs:build
git diff --check
```

Expected: every command exits 0. No dependency/lockfile or handwritten build output is
introduced. If `qa` changed unrelated files, restore only its unrelated formatting
edits with a targeted patch; never use a destructive repository reset.

### Step 4: Start the production preview and establish browser instrumentation

Start `bun run docs:preview` in a persistent command session and capture the local URL
reported by Vite. Keep it running. Invoke the `browser:control-in-app-browser` skill,
select the browser for that exact local URL as its instructions require, read the
browser's complete documentation once, then use only the documented browser interface.

Before navigation, install listeners for uncaught page errors and error-level console
messages if the browser documentation exposes them. Record the exact preview URL and
browser used in the matrix production log.

**Verify**: navigate to the preview root and confirm the page title/primary content is
present and neither error listener has captured an entry.

Expected: the production preview, not the Vite dev server, renders successfully.

### Step 5: Validate representative routes at three viewport widths

Use widths 390x844 (mobile), 768x1024 (tablet), and 1440x900 (desktop). At each width,
reload the production page rather than only resizing an already hydrated tree. Check
these routes or their generated route equivalents:

- `/` — global shell and theme tokens;
- `/button`, `/input`, `/form-field` — control scale, focus, invalid, and composition;
- `/accordion`, `/tabs`, `/progress` — spacing and state/layout motion;
- `/select`, `/command-palette` — collection popup/item scale;
- `/dialog`, `/popover`, `/sheet`, `/tooltip`, `/dropdown-menu`, `/context-menu` —
  surface, placement, menu, and enter/exit motion;
- `/sidebar-frame` — desktop layout plus mobile Sheet composition;
- the Badge, Tabs, and Popover stateful examples from Step 2.

For each category, interact with the control to exercise hover/focus/active or
selected/checked/expanded/drag/open/close state as applicable. Toggle the docs light
and dark themes once at each width. Respect `prefers-reduced-motion` if the browser
interface can emulate it and verify content remains visible with motion reduced.

This is not a subjective screenshot approval. For one representative in each category
(Button, Input, Accordion, Tabs, Select option, Dialog panel, menu item, Sheet panel),
read computed layout/style and assert the matrix's default anchor: dimensions/padding,
font size, radius, border/ring/shadow, and transition/animation duration. Record the
observed values in the matrix log.

**Verify**: the matrix log contains all three viewport labels, light/dark, the listed
route categories, and a pass/fail result for every computed-style anchor.

Expected: every entry is `pass`; any visual or computed-style mismatch is fixed in the
owning domain and its focused/full gates rerun before continuing.

### Step 6: Validate SSR hydration nodes, overlay cleanup, and state callbacks

On a hard reload at each width:

- capture the critical SSR element before interactions for Button label, FormField
  label/control, Accordion trigger/content when initially open, Tabs selected trigger/
  panel, and the page shell;
- after hydration, assert each element remains under the intended parent, has non-zero
  bounds, and retains a visible icon/background/border where applicable;
- exercise the three stateful examples and assert callback-driven class/style updates
  occur without replacing unrelated DOM nodes;
- open and close Dialog, Popover, Sheet, Tooltip, DropdownMenu, and ContextMenu; after
  exit motion, assert their portal content/backdrop is removed unless the example uses
  forceMount;
- confirm no uncaught exception, error-level console entry, hydration warning, or
  `template is not a function` appears.

If a browser API cannot expose pre-hydration DOM timing directly, use `view-source` or
the production HTML response to record the SSR node/data-slot, then compare it with the
hydrated DOM. Do not claim proof from a clean console alone.

**Verify**: append one matrix log row per critical node and overlay lifecycle with
`present-before`, `present-after`, `visible-after`, and `console-errors=0` fields.

Expected: every row passes at all widths.

### Step 7: Complete the matrix, final repository gate, and TODO

Terminate the preview session. Mark the production log complete with date, URL,
viewport/theme coverage, console result, and critical-node result. Re-run all
repository gates after any browser-found correction.

Only then change these lines in `todo.md`:

```md
- [x] inspect all components' class compare to shadcn/ui one-by-one, to get a better understanding of the spacing, sizing, and transition design system, and then apply it to our components
  - [x] classes and styles should become stateful
```

Do not reword the TODO in this plan.

**Verify**:

```sh
bun run qa
bun run test
bun run docs:build
git diff --check
git status --short
rg -n '^- \[x\] inspect all components|^  - \[x\] classes and styles should become stateful' todo.md
rg -n 'pending|ready-for-implementation|unclassified|audit-pending' style-parity-matrix.md
```

Expected: QA, tests, docs build, and diff check pass; only intentional source/docs/
generated-plan/matrix/TODO changes are present; both TODO lines match; final matrix
`rg` exits 1 with no output.

## Test plan

- Full unit/type/build/SSG coverage runs after formatter/linter mutation.
- Three docs examples compile and demonstrate leaf, repeated-item, and overlay runtime
  state.
- Production browser coverage spans three widths, both themes, reduced motion where
  supported, every component domain, computed-style anchors, SSR node retention, and
  overlay cleanup.
- Browser-found regressions return to their owning domain's focused tests before the
  full final gate is rerun.

## Done criteria

- [ ] Plans 001–006 are `DONE` and every matrix row is final.
- [ ] Styling docs precisely describe static/stateful/root/SSR/scanning contracts.
- [ ] Three stateful examples compile and work in production preview.
- [ ] `bun run qa`, `bun run test`, and `bun run docs:build` pass.
- [ ] Generated API docs retain slots and do not expose State keys as fake slots.
- [ ] Production browser checks pass at mobile/tablet/desktop, light/dark, and reduced
      motion where supported.
- [ ] No console/hydration error exists; critical SSR nodes remain nested and visible.
- [ ] Overlay portals clean up after exit motion.
- [ ] `git diff --check` passes and no dependency/lockfile/manual-dist change exists.
- [ ] Both style-system TODO boxes are checked and no later TODO is modified.
- [ ] Plan 007 is marked `DONE` in `plans/README.md`.

## STOP conditions

Stop and report if:

- Any dependency plan is not `DONE` or any matrix row remains unclassified.
- A docs example cannot be written from the public inferred API and appears to require
  exporting shared/private helper types.
- `qa`, full tests, public types, docs SSG, or API generation fails twice after a
  reasonable scoped correction.
- Browser setup is unavailable; production visual/hydration proof is mandatory and
  cannot be replaced with jsdom or a clean build.
- A production route has a console/hydration error, a missing/zero-size critical node,
  a failed computed-style anchor, or overlay content that does not clean up.
- Fixing a final regression requires a new API, dependency, component, behavior change,
  or docs-site redesign.
- The working tree contains unexplained dependency, lockfile, configuration, or manual
  `dist` changes.

## Maintenance notes

The matrix and `docs/pages/styling.mdx` are the contract for future components. New
components should choose scale values from the matrix, implement a slot-keyed readonly
State map, test static/reactive/lazy/SSR behavior, and add a production docs example
before release. Re-run the same production routes whenever shared state types, class
transforms, animation tokens, Modal, Popper, OverlayMenu, or BaseSelect changes.
