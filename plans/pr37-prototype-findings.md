# PR #37 prototype findings — round one, 2026-09-12

This is the round-one record at `eb8e482`. [Round two](pr37-prototype-round2-findings.md) supersedes its untested-coverage statements for the tested Select, Form, Tabs and Stepper paths. Results below retain their original revision and scope.

## Decision and provenance

Proceed with the tested composition direction: one `as` host-selection API, content in children, native Input/Textarea, presentation-only InputGroup, explicit Tabs parts and client Dialog composition. Server-open Dialog remains blocked by inherited Portal behavior. This bounded result does not complete any numbered production plan.

- Starting PR head: `2e0f0cc972e476c18c22faae6303fc154832e8df`, branch `refactor-components`.
- Base main: `7d9633ca405c2bcf256481298486c7daee3e1456`.
- Local experiment commit: `eb8e48244e77edb70d7fc7760cfd4754568158bc`, branch `prototype/pr37-composition`.
- The experiment implementation is not included in this planning PR. Its local report, runtime/type/hydration fixtures and browser artifacts are under `plans/prototype/pr37` and `src/prototype/pr37` on that experiment branch; those paths do not exist on this branch.
- Toolchain: nub 0.8.3, Solid 1.9.15, TypeScript 7.0.2, Vitest 4.1.11. Browser: Chromium 152.0.7977.0 via Playwright.

## Observed results

| Check actually run                                                       | Result                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Baseline `nub run typecheck`                                             | Exit 0                                                  |
| Baseline `nub run test:types`, `nub run docs:build` in pristine worktree | Both exit 0                                             |
| Baseline `nub run test`                                                  | 1933 passed, 4 failed, 1937 total                       |
| Prototype `nub run test`                                                 | 1951 passed, same 4 failed, 1955 total                  |
| Focused prototype + existing Button + consumer exports                   | 117 passed across 7 files, including 18 prototype tests |
| Prototype source and emitted-declaration contracts                       | Pass, including 15 negative type cases                  |
| Prototype `nub run qa`, `git diff --check`                               | Both exit 0; unrelated plan formatting discarded        |
| Prototype browser runner                                                 | 8 checks passed, zero page errors                       |

Two full-suite failures were environment failures: consumer tests spawn `nubx`, absent from PATH. After providing the `nubx`/`nub exec` equivalent, all three consumer-export tests passed on both pristine baseline and prototype. The whole suite was not rerun after that repair; do not claim a new full-suite count or all-green result.

The other two failures remain pre-existing: FormField's Select and MultiSelect required/shared-labelling cases at `src/forms/form/form-field.test.tsx:543` find zero native required targets. The experiment did not modify those families. Carry these failures into plan 001 and retain the affected plans' gates.

The browser checks covered real theme CSS, native/group editing targets, custom Button form behavior, Tabs keyboard/indicator resize, RTL/reorder/removal, Dialog keyboard and conditional labels/focus, emptyTheme interaction, and settled geometry after restoring the theme. One passing prototype SSR test records the missing Dialog surface as an inherited limitation; it is not a passing server-open rendering test.

## Plan changes supported by the evidence

| Plans                                                     | Finding and required action                                                                                                                                                                                                                              |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [001](001-baseline.md), [002](002-browser-regressions.md) | Reuse historical results with exact HEAD/toolchain provenance. Complete inventory/bundle measurements and a permanent browser gate; real CSS and settled geometry are necessary.                                                                         |
| [003](003-host-render.md)                                 | Generic props extraction initially lost nested Button variant checking. Preserve a concrete default-host contract and negative nested tests in emitted declarations; shared merger extraction still needs implementation.                                |
| [007](007-button.md)                                      | Custom Button swallowed type and could submit unintentionally. Port the minimal type/disabled forwarding fix with real-form regressions and link/disabled guards.                                                                                        |
| [008](008-input.md)                                       | Native controls and group presentation work with existing text/form hooks. Add the actual InputGroup theme schema/default entry, remove temporary assertions, and complete the slot/consumer migration.                                                  |
| [010](010-tabs.md)                                        | Paired mounted panel shells support tested SSR IDs. Keep controlled selection separate from mounted navigation; define independently conditional pairs and remaining metadata diagnostics. Verify indicator layering, hit behavior and coordinate space. |
| [005](005-overlay-lifecycle.md), [011](011-dialog.md)     | Client composition works using one Modal owner. Resolve the inherited server-open Portal gap before SSR acceptance; finish native Close styling and surface/lifecycle enforcement.                                                                       |

The prototype needed no JSX scanning, host renderer callbacks, Tabs.Items, Provider rewrite or second value/open authority. Private compatibility assertions and copied experimental controls are not production architecture.

## Reproduction and remaining coverage

On the local experiment branch, the focused command was `nub exec vitest --run src/prototype/pr37 src/elements/button test/consumer-fixtures/exports.test.ts`. Emitted declarations were checked with `nub src/prototype/pr37/check-declarations.mjs`; browser checks used `nub src/prototype/pr37/browser.mjs`. The latter starts/stops Vite and accepts `PROTOTYPE_CHROMIUM` for an installed browser. The fixture generates CSS from the docs UnoCSS config and source recipes. Browser binaries/tooling were installed outside the repository after the standard download timed out; no browser dependency was added to this PR.

These commands require the experiment branch; they are not newly available production scripts. Port the relevant fixtures into the numbered plans' scoped tests before using them as permanent gates.

Not established: consumer bundle changes; production API documentation/migrations; arbitrary generic third-party hosts; the full Form validation/autoresize matrix; independently absent Tabs counterparts and all reactive identity/metadata diagnostics; server-open Dialog and its hydration; nested/other-document/reopen lifecycle coverage; Select filtering, unmounted labels or virtualization; Shadow DOM, multiple package copies, Firefox/WebKit or assistive technology. Plans 012/013 and all DEFERRED families receive no implied completion or feasibility guarantee.
