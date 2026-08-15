# Plan 007: Document and validate the completed style system

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving on. This plan is the final
> acceptance gate and the only plan that may check the style-system TODO item. If
> a STOP condition occurs, stop and report; do not mark the TODO complete. Update this
> plan's row in `plans/README.md` when finished unless a reviewer owns the index.
>
> **Drift check (run first)**:
> `git diff --stat 620037aad7b5..HEAD -- todo.md src docs/pages docs/build src/unocss src/tailwind style-parity-matrix.md`.
> Plans 001 and 003–006 are expected to change source, tests, and the matrix. All five
> dependency status rows must be `DONE`; any `TODO`, `IN PROGRESS`, or `BLOCKED`
> dependency is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: Plans 001 and 003–006
- **Category**: docs
- **Planned at**: commit `620037aad7b5`, 2026-08-13

## Why this matters

Class assertions and jsdom cannot prove that an SSR-rendered component remains visible
after hydration or that popup motion looks coherent. This plan regenerates API data,
runs the full production toolchain, and records real-browser evidence at mobile,
tablet, and desktop widths. The TODO is complete only when the matrix has no gaps and
those production checks pass.

## Current state

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

- Generated `docs/pages/**/api.json` and `docs/pages/_api-index.json` produced by the
  existing generator; never hand-edit them.
- `style-parity-matrix.md` production-validation log and final dispositions.
- `todo.md` — check only the parent style-audit item after all gates pass.
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
- Commit generated API data together, then final acceptance/TODO status.
- Use a message such as `chore: complete Shadcn style parity sweep`.
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Prove every implementation plan and matrix row is complete

Read each plan's Done criteria and status. Run a script that fails unless Plans 001 and
003–006 are `DONE`. Then scan the matrix for pending dispositions, missing tests, or
incomplete production log entries. At this stage only the production visual-validation
log may still say `pending`. Also inspect every Implementation plan cell for the static
composition rule: fixed branches name a direct final slot owner, relationship selectors
are limited to arbitrary children or runtime state, and no selector-only slot, group
name, presentational `data-*` attribute, or visual-only DOM node has been introduced.
The scan must explicitly reject the withdrawn proposals: ButtonGroup `data-slot`
renaming, Progress `status` splitting, Tooltip arrow, FormField `role="alert"`, and
Pagination `data-current` to `data-active`.

**Verify**:

```sh
bun -e "const text=await Bun.file('plans/README.md').text(); for (const id of ['001','003','004','005','006']) { const row=text.split('\n').find(line=>line.includes('['+id+']')); if (!row?.endsWith('| DONE |')) throw new Error('Plan '+id+' is not DONE'); }"
bun -e "const text=await Bun.file('style-parity-matrix.md').text(); const rows=text.split('\n').filter(line=>/^\| (elements|forms|navigation|overlays) \|/.test(line)); const foundations=rows.filter(line=>line.split(' | ')[1].includes('(foundation')); if(rows.length!==45 || foundations.length!==4) throw new Error('Expected 41 public + 4 foundation rows, got '+(rows.length-foundations.length)+' public + '+foundations.length+' foundation');"
rg -n 'ready-for-implementation|unclassified|audit-pending|Disposition.*pending' style-parity-matrix.md
bun -e "const text=await Bun.file('style-parity-matrix.md').text(); const rows=text.split('\n').filter(line=>/^\| (elements|forms|navigation|overlays) \|/.test(line)); const plans=rows.map(line=>line.match(/\| (Plan 00[3-6] — .*?) \|$/)?.[1] ?? '').join('\n').replaceAll(String.fromCharCode(96),''); const stale=['data-[size=sm] spacing','emit data-size (+','add data-size/group naming','rename group root data-slot to button-group','split status into label+value slots','add field-composition gap hooks','role=alert on error','group focus/invalid hooks','add data-unchecked + data-size','data-current→data-active','add arrow slot']; const hit=stale.filter(value=>plans.includes(value)); if (hit.length) throw new Error('Withdrawn implementation proposal: '+hit.join(', '));"
```

Expected: the script exits 0; `rg` exits 1 with no output.

### Step 2: Run formatting, full tests, public types, and production build

Run `qa` first because it mutates formatting/lint fixes, inspect its diff, then run the
full unit and docs build gates. `docs:build` may regenerate API JSON; accept only
generator output. Confirm generated API docs still list every component slot and the
namespace Classes/Styles aliases.

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

### Step 3: Start the production preview and establish browser instrumentation

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

### Step 4: Validate representative routes at three viewport widths

Use widths 390x844 (mobile), 768x1024 (tablet), and 1440x900 (desktop). At each width,
reload the production page rather than only resizing an already hydrated tree. Check
these routes or their generated route equivalents:

- `/` — global shell and theme tokens;
- `/button`, `/input`, `/form-field` — control scale, focus, invalid, and composition;
- `/accordion`, `/tabs`, `/progress` — spacing and state/layout motion;
- `/select`, `/command-palette` — collection popup/item scale;
- `/dialog`, `/popover`, `/sheet`, `/tooltip`, `/dropdown-menu`, `/context-menu` —
  surface, placement, menu, and enter/exit motion;
- `/sidebar-frame` — desktop layout plus mobile Sheet composition.

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

### Step 5: Validate SSR hydration nodes and overlay cleanup

On a hard reload at each width:

- capture the critical SSR element before interactions for Button label, FormField
  label/control, Accordion trigger/content when initially open, Tabs selected trigger/
  panel, and the page shell;
- after hydration, assert each element remains under the intended parent, has non-zero
  bounds, and retains a visible icon/background/border where applicable;
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

### Step 6: Complete the matrix, final repository gate, and TODO

Terminate the preview session. Mark the production log complete with date, URL,
viewport/theme coverage, console result, and critical-node result. Re-run all
repository gates after any browser-found correction.

Only then change this line in `todo.md`:

```md
- [x] inspect all components' class compare to shadcn/ui one-by-one, to get a better understanding of the spacing, sizing, and transition design system, and then apply it to our components
```

Do not reword the TODO in this plan.

**Verify**:

```sh
bun run qa
bun run test
bun run docs:build
git diff --check
git status --short
rg -n '^- \[x\] inspect all components' todo.md
rg -n 'pending|ready-for-implementation|unclassified|audit-pending' style-parity-matrix.md
```

Expected: QA, tests, docs build, and diff check pass; only intentional source/docs/
generated-plan/matrix/TODO changes are present; the parent TODO line matches; final
matrix `rg` exits 1 with no output.

## Test plan

- Full unit/type/build/SSG coverage runs after formatter/linter mutation.
- Production browser coverage spans three widths, both themes, reduced motion where
  supported, every component domain, computed-style anchors, SSR node retention, and
  overlay cleanup.
- Browser-found regressions return to their owning domain's focused tests before the
  full final gate is rerun.
- The final matrix review checks all 41 public-component rows plus four foundation rows,
  preserves their dispositions, and confirms direct slot ownership without adding
  selector-only slots, group names, presentational attributes, or DOM nodes.

## Done criteria

- [ ] Plans 001 and 003–006 are `DONE` and every matrix row is final.
- [ ] The Implementation plan scan rejects the withdrawn structural proposals and
      records direct final-owner classes for fixed slots.
- [ ] `bun run qa`, `bun run test`, and `bun run docs:build` pass.
- [ ] Generated API docs retain every component slot and Classes/Styles alias.
- [ ] Production browser checks pass at mobile/tablet/desktop, light/dark, and reduced
      motion where supported.
- [ ] No console/hydration error exists; critical SSR nodes remain nested and visible.
- [ ] Overlay portals clean up after exit motion.
- [ ] `git diff --check` passes and no dependency/lockfile/manual-dist change exists.
- [ ] The parent style-system TODO is checked and no later TODO is modified.
- [ ] Plan 007 is marked `DONE` in `plans/README.md`.

## STOP conditions

Stop and report if:

- Any dependency plan is not `DONE` or any matrix row remains unclassified.
- `qa`, full tests, public types, docs SSG, or API generation fails twice after a
  reasonable scoped correction.
- Browser setup is unavailable; production visual/hydration proof is mandatory and
  cannot be replaced with jsdom or a clean build.
- A production route has a console/hydration error, a missing/zero-size critical node,
  a failed computed-style anchor, or overlay content that does not clean up.
- Fixing a final regression requires a new API, dependency, component, behavior change,
  or docs-site redesign.
- A final review finds a slot, group name, presentational `data-*` attribute, visual-only
  DOM node, or ARIA change added only to reproduce a Zaidan selector; retain Moraine's
  structure, record the visual divergence, and stop.
- The working tree contains unexplained dependency, lockfile, configuration, or manual
  `dist` changes.

## Maintenance notes

The matrix is the visual contract for future components. New components should choose
scale values from it, test static overrides and SSR behavior, and add production docs
coverage before release. Re-run the same production routes whenever class transforms,
animation tokens, Modal, Popper, OverlayMenu, or BaseSelect changes.
