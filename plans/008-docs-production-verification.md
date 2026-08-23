# Plan 008: Verify and close the production docs refactor

> **Executor instructions**: Start only when Plans 002–007 are DONE. This plan does not add product
> features; it documents the completed architecture, runs the full production matrix, fixes only
> regressions within the owning prior plan's scope, and closes the docs TODO after every gate passes.

## Status

- **Priority**: P1
- **Effort**: S (half to one day)
- **Risk**: LOW — verification and documentation, with strict rollback to owning plans on failures
- **Depends on**: Plans 002–007
- **Category**: maintainability
- **Planned at**: commit `5173d35`, 2026-08-23

## Goal

Prove the complete docs refactor works as one production SSG product across navigation, search,
scrolling, shell, theme, configurable examples, expanded content, and the introduction. Document how
the pieces are maintained, then mark only the completed docs TODO items.

## Scope

May modify:

- `docs/README.md`
- `todo.md` — only the docs parent and its anchor-scroll child
- `plans/README.md` — Plan 008 status only

If verification finds a regression, reopen the owning plan and fix only files already reviewed by that
plan; record the additional diff in that plan before editing. Do not silently grow Plan 008 scope.

Do not modify unrelated TODOs, public `src/**`, package manifests/lockfiles, generated API/routes,
deployment configuration, `dist/**`, or `docs/dist/**`.

## Steps

### Step 1: Document the completed architecture

Update `docs/README.md` in English with:

- `docs/DESIGN.md` as the visual/interaction contract;
- headings flowing from the MDX build into section search;
- semantic sidebar/search destinations and route ordering;
- the app shell as sole route/hash scroll owner and the TOC as visibility-only;
- shared shell, responsive inline/rail TOC, and persisted pre-paint theme behavior;
- example module/source flow, author-selected Input/Switch/Select control schema, the deliberate
  primitive-only boundary, and `docs/EXAMPLES.md` coverage ledger;
- landing generated values and component directory flow;
- exact focused, full, SSG, and production-browser verification commands.

### Step 2: Run repository gates in order

```bash
bun run test
bun run qa
bun run docs:build
git diff --check
```

Every command must exit 0. Do not accept development-only success or manually edit generated output.

### Step 3: Run the production browser matrix

Start `bun run docs:preview` and capture uncaught exceptions plus error-level console messages.

At 320, 375, 414, 768, and 1440 px, visit `/`, `/button`, `/input`, `/switch`, `/select`, `/dialog`,
`/form-field`, and `/modal`. Verify:

- no exception, hydration warning, `template is not a function`, missing critical SSR node, or
  zero-sized hydrated specimen;
- no horizontal document overflow; code/tables scroll internally;
- skip link, mobile menu, sidebar links, search trigger/shortcut/results, theme, inline/rail TOC,
  heading permalinks, code copy/expand, and previous/next links work by keyboard;
- Input/Switch/Select example headers wrap cleanly, popups are not clipped, controls update previews
  immediately, Reset restores defaults, and source remains usable;
- introduction specimen and directory work without hover dependence;
- theme survives reload without a visible wrong-theme frame;
- reduced motion removes spatial motion and smooth scrolling where required.

Run the anchor/history matrix on `/button` and one second route:

1. Direct `/button#variants` lands below the sticky header.
2. Same-page `#sizes` updates URL, scroll position, and `aria-current`.
3. Search navigation from another page to `/button#api-props` lands on the section without top reset.
4. Back and Forward restore the corresponding section/top state.
5. Unknown and malformed hashes neither throw nor retry indefinitely.

### Step 4: Audit the final diff and close TODOs

Check:

```bash
git status --short
git diff --stat
find docs/pages -name 'index.mdx' -print0 | xargs -0 rg -o '<Example path="[^"]+"' | wc -l
rg -n "docs/ should become|fix broken auto scroll|production barrel" todo.md
```

Confirm only reviewed source/docs/tests/plans are changed, the example count is above the Plan 006
baseline, and generated/ignored output is not staged. Then and only then:

- mark `docs/ should become a production level docs site...` complete;
- mark its `fix broken auto scroll to anchor` child complete;
- leave `production barrel import optimize` and every V1 item unchanged;
- mark Plan 008 DONE in `plans/README.md`.

## Done criteria

- [ ] Plans 002–007 are DONE with their focused gates recorded.
- [ ] `docs/README.md` explains the final metadata, navigation, scroll, shell/theme, example, and
      landing architecture.
- [ ] Full tests, QA, production build, and diff check exit 0.
- [ ] Every required route/viewport passes console, hydration, layout, keyboard, theme, examples,
      reduced-motion, anchor, and history checks.
- [ ] The final diff contains no dependency, lockfile, generated, public-library, unrelated TODO, or
      deployment changes.
- [ ] Only the docs parent and anchor child are `[x]`; unrelated TODOs remain unchanged.
- [ ] `plans/README.md` marks all eight plans DONE.

## STOP conditions

Stop and reopen the owning plan if any focused/full test, QA, SSG build, production route, viewport,
hydration node, console, keyboard, popup, theme, anchor/history, or overflow check fails. Do not mark
TODOs complete while a gate is failing, and do not broaden fixes into public components or unrelated
work without maintainer approval.
